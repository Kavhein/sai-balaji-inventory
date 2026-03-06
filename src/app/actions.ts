'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Medicine, Patient, Invoice, ActivityLog, ReportData, RevenueTrend, TopMedicine, Insight } from '@/lib/types'

// This helper hides revalidatePath from the client-side build
async function refresh(path: string) {
    const { revalidatePath } = await import('next/cache');
    revalidatePath(path);
}

export async function recordLog(action: string, details: string) {
    const role = await getSession();
    try {
        await prisma.activityLog.create({
            data: {
                action,
                details,
                userRole: role || 'unknown'
            }
        });
    } catch (e) {
        console.error("Failed to record log:", e);
    }
}

// --- Inventory Actions ---
export async function getMedicines(query?: string): Promise<Medicine[]> {
    const where = query ? { name: { contains: query, mode: 'insensitive' as const }, is_available: true } : { is_available: true };
    return await (prisma.medicine.findMany({ where, orderBy: { name: 'asc' } }) as unknown as Promise<Medicine[]>);
}

export async function addMedicine(formData: FormData) {
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const stock_quantity = parseInt(formData.get('stock_quantity') as string)
    const unit_price = parseFloat(formData.get('unit_price') as string)

    await prisma.medicine.create({
        data: {
            name, category, manufacturer: "Generic",
            stock_quantity, unit_price, is_available: true
        }
    })
    await recordLog("ADD_MEDICINE", `Added new medicine to inventory: ${name}. Category: ${category}, Initial Stock: ${stock_quantity}, Unit Price: ₹${unit_price}`);
    await refresh('/');
}

export async function toggleStock(id: number, currentStatus: boolean) {
    await prisma.medicine.update({ where: { id }, data: { is_available: !currentStatus } });
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    await recordLog("TOGGLE_STOCK", `Stock Status Changed: ${medicine?.name || 'Medicine'} (ID: ${id}) is now ${!currentStatus ? 'AVAILABLE' : 'UNAVAILABLE'}`);
    await refresh('/');
}

export async function deleteMedicine(id: number) {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    try {
        await prisma.medicine.delete({ where: { id } });
        await recordLog("DELETE_MEDICINE", `Permanently deleted medicine from system: ${medicine?.name || 'Unknown'} (Category: ${medicine?.category || 'N/A'}) - ID: ${id}`);
    } catch (e) {
        // Fallback to soft delete if it's linked to an invoice (referential integrity)
        await prisma.medicine.update({ where: { id }, data: { is_available: false } });
        await recordLog("SOFT_DELETE_MEDICINE", `Archived medicine (Soft Delete): ${medicine?.name || 'Unknown'} (ID: ${id}). Item kept for billing history but marked as removed.`);
    }
    await refresh('/');
}

export async function updateMedicineStock(id: number, quantity: number) {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    await prisma.medicine.update({
        where: { id },
        data: { stock_quantity: quantity }
    });
    await recordLog("UPDATE_STOCK", `Stock Adjustment: ${medicine?.name}. Quantity changed from ${medicine?.stock_quantity} to ${quantity}.`);
    await refresh('/');
}

// --- Patient Actions ---
export async function getPatients(query?: string): Promise<Patient[]> {
    const where = query ? { OR: [{ name: { contains: query, mode: 'insensitive' as const } }, { mobile_no: { contains: query } }] } : {};
    return await (prisma.patient.findMany({ where, orderBy: { name: 'asc' } }) as unknown as Promise<Patient[]>);
}

export async function addPatient(formData: FormData) {
    const name = formData.get('name') as string;
    const mobile_no = formData.get('mobile_no') as string;
    const address = (formData.get('address') as string) || "";
    await prisma.patient.upsert({
        where: { mobile_no },
        update: { name, address },
        create: { name, mobile_no, address }
    });
    await recordLog("ADD_PATIENT", `Patient Record Updated/Created: ${name} - Mobile: ${mobile_no}, Address: ${address || "N/A"}`);
    await refresh('/patients');
}

export async function deletePatient(id: number) {
    const patient = await prisma.patient.findUnique({ where: { id } });
    await prisma.$transaction(async (tx) => {
        await tx.invoice.updateMany({ where: { patient_id: id }, data: { patient_id: null } });
        await tx.patient.delete({ where: { id } });
    });
    if (patient) {
        await recordLog("DELETE_PATIENT", `Deleted Patient Record: ${patient.name} (Mobile: ${patient.mobile_no}). All associated personal data removed.`);
    }
    await refresh('/patients');
}

export async function searchPatient(mobile: string): Promise<Patient | null> {
    if (!mobile || mobile.length < 3) return null;
    return await (prisma.patient.findUnique({ where: { mobile_no: mobile } }) as unknown as Promise<Patient | null>);
}

export async function getPatientDetails(id: number) {
    try {
        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                history: {
                    orderBy: { createdAt: 'desc' },
                    include: { items: { include: { medicine: true } } }
                }
            }
        });

        if (!patient) return null;

        // RAW SQL BYPASS for prescriptions
        const prescriptions = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "EyePrescription" WHERE patient_id = $1 ORDER BY "createdAt" DESC`,
            id
        );

        return {
            ...patient,
            prescriptions: prescriptions
        } as any;
    } catch (error) {
        console.error("Error fetching patient details:", error);
        return null;
    }
}

export async function getFrequentMedicines(patientId: number) {
    const items = await prisma.invoiceItem.findMany({
        where: { invoice: { patient_id: patientId } },
        include: { medicine: true },
        take: 50
    });

    const frequency: Record<number, { name: string, count: number, price: number }> = {};
    items.forEach((item) => {
        const med = item.medicine;
        if (!med) return;
        if (!frequency[med.id]) {
            frequency[med.id] = { name: med.name, count: 0, price: med.unit_price };
        }
        frequency[med.id].count += item.quantity;
    });

    return Object.entries(frequency)
        .map(([id, data]) => ({ id: parseInt(id), ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

// --- Invoice / Billing Actions ---
export async function createInvoice(data: {
    patientName: string;
    mobileNo: string;
    address?: string;
    age?: string;
    doctorName: string;
    reason?: string;
    items: { id: number; qty: number; rate: number; name: string, gst?: number }[];
    customDate?: string;
    prescriptionData?: any;
}) {
    try {
        const { patientName, mobileNo, address, age, doctorName, reason, items, customDate } = data;
        const lastInvoice = await prisma.invoice.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
        const nextId = (lastInvoice?.id || 0) + 1;
        const invoiceNo = `SB/BIL/${nextId.toString().padStart(4, '0')}`;
        let subtotal = 0;
        for (const item of items) { subtotal += item.rate * item.qty; }
        // GST is now inclusive or 0 as per user request (Price = Final MRP)
        const totalGST = 0;
        const totalAmount = subtotal;

        // If customDate is provided, ensure it's set to the end of that day or a reasonable time? 
        // User said "if date is entered then data should be saved on that specific date".
        // Usually file inputs give YYYY-MM-DD. We can append current time or just set it. 
        // To be safe and keep reports consistent, let's treat it as occurring at noon or current time on that day.
        // Or simpler: new Date(customDate) will set it to 00:00 UTC or Local depending on string.
        let invoiceDate = new Date();
        if (customDate) {
            invoiceDate = new Date(customDate);
            // set time to current time to avoid timezone mess or 00:00 issues affecting daily reports boundaries
            const now = new Date();
            invoiceDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        }

        const invoice = await prisma.$transaction(async (tx) => {
            let patientId = null;
            if (mobileNo) {
                const ep = await tx.patient.findUnique({ where: { mobile_no: mobileNo } });
                if (ep) {
                    await tx.patient.update({ where: { id: ep.id }, data: { name: patientName, address: address || ep.address } });
                    patientId = ep.id;
                } else {
                    const np = await tx.patient.create({ data: { name: patientName, mobile_no: mobileNo, address } });
                    patientId = np.id;
                }
            }

            const newInv = await tx.invoice.create({
                data: {
                    invoice_no: invoiceNo, patient_name: patientName, mobile_no: mobileNo, address: address,
                    age: age, doctor_name: doctorName, reason: reason, subtotal, gst_amount: totalGST, total_amount: totalAmount,
                    patient_id: patientId,
                    createdAt: invoiceDate,
                    items: {
                        create: items.map((i) => ({
                            medicine_id: i.id, quantity: i.qty, unit_price: i.rate, gst_rate: 0,
                            total_price: i.qty * i.rate
                        }))
                    }
                }
            });

            if (data.prescriptionData && patientId) {
                const pd = data.prescriptionData;
                await tx.$executeRawUnsafe(
                    `INSERT INTO "EyePrescription" (
                        patient_id, re_dv_sph, re_dv_cyl, re_dv_axis, re_dv_va,
                        re_nv_sph, re_nv_cyl, re_nv_axis, re_nv_va,
                        le_dv_sph, le_dv_cyl, le_dv_axis, le_dv_va,
                        le_nv_sph, le_nv_cyl, le_nv_axis, le_nv_va,
                        lens_type, notes, doctor_name, pd, total_amount, "createdAt", "updatedAt"
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
                    patientId,
                    String(pd.re_dv_sph || ""), String(pd.re_dv_cyl || ""), String(pd.re_dv_axis || ""), String(pd.re_dv_va || ""),
                    String(pd.re_nv_sph || ""), String(pd.re_nv_cyl || ""), String(pd.re_nv_axis || ""), String(pd.re_nv_va || ""),
                    String(pd.le_dv_sph || ""), String(pd.le_dv_cyl || ""), String(pd.le_dv_axis || ""), String(pd.le_dv_va || ""),
                    String(pd.le_nv_sph || ""), String(pd.le_nv_cyl || ""), String(pd.le_nv_axis || ""), String(pd.le_nv_va || ""),
                    String(pd.lens_type || ""), String(pd.notes || ""), String(doctorName || ""), String(pd.pd || ""),
                    0, // In invoice flow, the prescription itself is usually part of the itemized bill
                    invoiceDate, new Date()
                );
            }

            for (const i of items) {
                await tx.medicine.update({ where: { id: i.id }, data: { stock_quantity: { decrement: i.qty } } });
            }
            return newInv;
        });

        await recordLog("CREATE_INVOICE", `Added Patient: ${patientName}. Bill Created: #${invoice.invoice_no}. Items: ${items.map((i) => `${i.name} (x${i.qty})`).join(', ')}. Total: ₹${totalAmount.toFixed(2)}`);
        await refresh('/billing'); await refresh('/reports'); await refresh('/patients'); await refresh('/logs');
        return { success: true, invoiceId: invoice.id, invoiceNo: invoice.invoice_no };
    } catch (error) {
        console.error("Error in createInvoice:", error);
        return { success: false, error: String(error) };
    }
}

// --- Report Actions ---
export async function getDailyStats() {
    // Calculate start of today in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const startOfIstToday = new Date(istNow);
    startOfIstToday.setUTCHours(0, 0, 0, 0);
    // Correct the offset back to UTC for the query
    const startOfDayUTC = new Date(startOfIstToday.getTime() - istOffset);

    // Fetch collections from Invoices (Pharmacy) and EyePrescriptions (Checkups)
    const [sales, rxs, count, rxCount] = await Promise.all([
        prisma.invoice.aggregate({
            _sum: { total_amount: true },
            where: { createdAt: { gte: startOfDayUTC } }
        }),
        prisma.$queryRawUnsafe<any[]>(
            `SELECT SUM(total_amount) as total FROM "EyePrescription" WHERE "createdAt" >= $1`,
            startOfDayUTC
        ),
        prisma.invoice.count({
            where: { createdAt: { gte: startOfDayUTC } }
        }),
        prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) as count FROM "EyePrescription" WHERE "createdAt" >= $1`,
            startOfDayUTC
        )
    ]);

    const totalDaily = (sales._sum.total_amount || 0) + (parseFloat(rxs[0]?.total || 0));
    const totalPatients = count + parseInt(rxCount[0]?.count || 0);

    return { daily: totalDaily, dailyPatientCount: totalPatients };
}

export async function getFinancialReports(timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'): Promise<ReportData> {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Start of Today (IST)
    const startOfIstToday = new Date(istNow);
    startOfIstToday.setUTCHours(0, 0, 0, 0);

    // 1. Determine Date Range for Trend
    let rangeStartUTC: Date;
    let rangeEndUTC: Date;

    if (timeframe === 'daily') {
        rangeStartUTC = new Date(startOfIstToday.getTime() - istOffset);
        rangeEndUTC = new Date(rangeStartUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else if (timeframe === 'weekly') {
        const diff = startOfIstToday.getUTCDay(); // 0 is Sunday
        const startOfWeekIST = new Date(startOfIstToday);
        startOfWeekIST.setUTCDate(startOfIstToday.getUTCDate() - diff);
        rangeStartUTC = new Date(startOfWeekIST.getTime() - istOffset);
        rangeEndUTC = new Date(rangeStartUTC.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    } else if (timeframe === 'monthly') {
        const monthStartIST = new Date(startOfIstToday);
        monthStartIST.setUTCDate(1);
        rangeStartUTC = new Date(monthStartIST.getTime() - istOffset);
        const nextMonth = new Date(monthStartIST);
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
        rangeEndUTC = new Date(nextMonth.getTime() - 1 - istOffset);
    } else { // yearly
        const yearStartIST = new Date(startOfIstToday);
        yearStartIST.setUTCMonth(0, 1);
        yearStartIST.setUTCHours(0, 0, 0, 0);
        rangeStartUTC = new Date(yearStartIST.getTime() - istOffset);
        const nextYear = new Date(yearStartIST);
        nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
        rangeEndUTC = new Date(nextYear.getTime() - 1 - istOffset);
    }

    // 2. Fetch all invoices AND prescriptions for the range
    const [invoices, prescriptions] = await Promise.all([
        prisma.invoice.findMany({
            where: { createdAt: { gte: rangeStartUTC, lte: rangeEndUTC } },
            select: { total_amount: true, createdAt: true }
        }),
        prisma.$queryRawUnsafe<any[]>(
            `SELECT total_amount, "createdAt" FROM "EyePrescription" WHERE "createdAt" >= $1 AND "createdAt" <= $2`,
            rangeStartUTC, rangeEndUTC
        )
    ]);

    // Create a unified transaction list for trend aggregation
    const allTransactions = [
        ...invoices.map(i => ({ amount: i.total_amount, createdAt: i.createdAt })),
        ...prescriptions.map(p => ({ amount: parseFloat(p.total_amount || 0), createdAt: p.createdAt }))
    ];

    // 3. Aggregate in memory
    const revenueTrend: RevenueTrend[] = [];

    if (timeframe === 'daily') {
        for (let i = 0; i < 8; i++) {
            const blockStartIST = new Date(startOfIstToday);
            blockStartIST.setUTCHours(i * 3, 0, 0, 0);
            const blockEndIST = new Date(startOfIstToday);
            blockEndIST.setUTCHours((i + 1) * 3, 0, 0, -1);

            const startT = blockStartIST.getTime();
            const endT = blockEndIST.getTime();

            const sum = allTransactions
                .filter(tx => {
                    const t = new Date(tx.createdAt).getTime() + istOffset;
                    return t >= startT && t <= endT;
                })
                .reduce((acc, tx) => acc + tx.amount, 0);

            const hourLabel = blockStartIST.getUTCHours();
            const ampm = hourLabel >= 12 ? 'PM' : 'AM';
            const displayHour = hourLabel % 12 || 12;

            revenueTrend.push({
                label: `${displayHour}${ampm}`,
                fullLabel: `${displayHour}:00 ${ampm} - ${displayHour + 3 > 12 ? (displayHour + 3) % 12 || 12 : displayHour + 3}${hourLabel + 3 >= 12 ? 'PM' : 'AM'}`,
                amount: sum
            });
        }
    } else if (timeframe === 'weekly') {
        const currentDay = startOfIstToday.getUTCDay();
        const startOfWeekIST = new Date(startOfIstToday);
        startOfWeekIST.setUTCDate(startOfIstToday.getUTCDate() - currentDay);

        for (let i = 0; i < 7; i++) {
            const targetDayIST = new Date(startOfWeekIST);
            targetDayIST.setUTCDate(startOfWeekIST.getUTCDate() + i);
            const startT = targetDayIST.getTime();
            const endT = startT + 24 * 60 * 60 * 1000 - 1;

            const sum = allTransactions
                .filter(tx => {
                    const t = new Date(tx.createdAt).getTime() + istOffset;
                    return t >= startT && t <= endT;
                })
                .reduce((acc, tx) => acc + tx.amount, 0);

            revenueTrend.push({
                label: targetDayIST.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
                fullLabel: targetDayIST.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
                amount: sum
            });
        }
    } else if (timeframe === 'monthly') {
        const monthStartIST = new Date(startOfIstToday);
        monthStartIST.setUTCDate(1);
        const daysInMonth = new Date(monthStartIST.getUTCFullYear(), monthStartIST.getUTCMonth() + 1, 0).getDate();

        for (let i = 0; i < daysInMonth; i++) {
            const targetDayIST = new Date(monthStartIST);
            targetDayIST.setUTCDate(1 + i);
            const startT = targetDayIST.getTime();
            const endT = startT + 24 * 60 * 60 * 1000 - 1;

            const sum = allTransactions
                .filter(tx => {
                    const t = new Date(tx.createdAt).getTime() + istOffset;
                    return t >= startT && t <= endT;
                })
                .reduce((acc, tx) => acc + tx.amount, 0);

            revenueTrend.push({
                label: `${1 + i}`,
                fullLabel: targetDayIST.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
                amount: sum
            });
        }
    } else if (timeframe === 'yearly') {
        const yearStartIST = new Date(startOfIstToday);
        yearStartIST.setUTCMonth(0, 1);
        yearStartIST.setUTCHours(0, 0, 0, 0);

        for (let i = 0; i < 12; i++) {
            const targetMonthIST = new Date(yearStartIST);
            targetMonthIST.setUTCMonth(i);
            const monthStartT = targetMonthIST.getTime();
            const nextMonth = new Date(targetMonthIST);
            nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
            const monthEndT = nextMonth.getTime() - 1;

            const sum = allTransactions
                .filter(tx => {
                    const t = new Date(tx.createdAt).getTime() + istOffset;
                    return t >= monthStartT && t <= monthEndT;
                })
                .reduce((acc, tx) => acc + tx.amount, 0);

            revenueTrend.push({
                label: targetMonthIST.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
                fullLabel: targetMonthIST.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
                amount: sum
            });
        }
    }

    // 4. Fetch Totals and Stats (Optimized separately as they are cached/fast)
    const { daily, dailyPatientCount } = await getDailyStats();

    const startOfWeekIST = new Date(startOfIstToday);
    startOfWeekIST.setUTCDate(startOfIstToday.getUTCDate() - startOfIstToday.getUTCDay());
    const startOfWeekUTC = new Date(startOfWeekIST.getTime() - istOffset);

    const startOfMonthIST = new Date(startOfIstToday);
    startOfMonthIST.setUTCDate(1);
    const startOfMonthUTC = new Date(startOfMonthIST.getTime() - istOffset);

    // Get Weekly and Monthly Totals with optimized aggregate
    const [ws, ms, rx_ws, rx_ms] = await Promise.all([
        prisma.invoice.aggregate({ _sum: { total_amount: true }, where: { createdAt: { gte: startOfWeekUTC } } }),
        prisma.invoice.aggregate({ _sum: { total_amount: true }, where: { createdAt: { gte: startOfMonthUTC } } }),
        prisma.$queryRawUnsafe<any[]>(`SELECT SUM(total_amount) as total FROM "EyePrescription" WHERE "createdAt" >= $1`, startOfWeekUTC),
        prisma.$queryRawUnsafe<any[]>(`SELECT SUM(total_amount) as total FROM "EyePrescription" WHERE "createdAt" >= $1`, startOfMonthUTC)
    ]);

    const totalWeekly = (ws._sum.total_amount || 0) + parseFloat(rx_ws[0]?.total || 0);
    const monthlyTotal = (ms._sum.total_amount || 0) + parseFloat(rx_ms[0]?.total || 0);

    // Growth and Forecast (Calculated in parallel)
    const prevWeekStart = new Date(startOfWeekUTC.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [prevWs, prevRxWs] = await Promise.all([
        prisma.invoice.aggregate({
            _sum: { total_amount: true },
            where: { createdAt: { gte: prevWeekStart, lt: startOfWeekUTC } }
        }),
        prisma.$queryRawUnsafe<any[]>(
            `SELECT SUM(total_amount) as total FROM "EyePrescription" WHERE "createdAt" >= $1 AND "createdAt" < $2`,
            prevWeekStart, startOfWeekUTC
        )
    ]);
    const prevWeekly = (prevWs._sum.total_amount || 0) + parseFloat(prevRxWs[0]?.total || 0);
    const weeklyGrowth = prevWeekly === 0 ? (totalWeekly > 0 ? 100 : 0) : Math.round(((totalWeekly - prevWeekly) / prevWeekly) * 100);

    const daysInMonthTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = istNow.getUTCDate();
    const monthlyForecast = Math.round((monthlyTotal / currentDayOfMonth) * daysInMonthTotal);

    // 5. Inventory Movement (Last 7 Days)
    const invoiceItems = await prisma.invoiceItem.findMany({
        include: { medicine: true },
        where: { invoice: { createdAt: { gte: startOfWeekUTC } } }
    });

    const medicineStats: Record<number, { name: string, category: string, quantity: number, revenue: number }> = {};
    invoiceItems.forEach((item) => {
        const id = item.medicine_id;
        if (!item.medicine) return;
        if (!medicineStats[id]) {
            medicineStats[id] = { name: item.medicine.name, category: item.medicine.category, quantity: 0, revenue: 0 };
        }
        medicineStats[id].quantity += item.quantity;
        medicineStats[id].revenue += item.total_price;
    });

    const topMedicines = Object.values(medicineStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    // 6. Insights and Transaction Feed
    const [lowStock, recentInvoicesRaw, recentRxsRaw] = await Promise.all([
        prisma.medicine.findMany({ where: { stock_quantity: { lte: 20 }, is_available: true }, take: 3 }),
        prisma.invoice.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { items: { include: { medicine: true } } } }),
        prisma.$queryRawUnsafe<any[]>(
            `SELECT ep.id, ep.total_amount, ep."createdAt", p.name as patient_name 
             FROM "EyePrescription" ep 
             JOIN "Patient" p ON ep.patient_id = p.id 
             ORDER BY ep."createdAt" DESC LIMIT 10`
        )
    ]);

    // Unified recent transactions list
    const recentInvoices = [
        ...recentInvoicesRaw.map(inv => ({
            id: inv.id,
            patient_name: inv.patient_name,
            total_amount: inv.total_amount,
            createdAt: inv.createdAt,
            type: 'BILL',
            item_summary: `${inv.items.length} Medicines`
        })),
        ...recentRxsRaw.map(rx => ({
            id: rx.id,
            patient_name: rx.patient_name,
            total_amount: parseFloat(rx.total_amount || 0),
            createdAt: rx.createdAt,
            type: 'CHECKUP',
            item_summary: 'Standalone Eye Checkup'
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10) as any;

    const insights: Insight[] = [];
    const avgWeekly = totalWeekly / 7;

    if (daily > 0 && daily > avgWeekly * 1.2 && totalWeekly > daily) {
        insights.push({
            type: "POSITIVE",
            text: `Revenue today (₹${daily.toLocaleString()}) is trending ${Math.round((daily / avgWeekly - 1) * 100)}% above your average.`,
            tip: "Check your highest movement stock and ensure you refill before the morning shift."
        });
    }

    if (lowStock.length > 0) {
        insights.push({
            type: "STOCK",
            text: `${lowStock.length} items are running below 20 units.`,
            tip: `Refill ${lowStock.map((m) => m.name).join(', ')} soon to avoid stockouts.`
        });
    }

    if (topMedicines.length > 0) {
        insights.push({
            type: "STRATEGY",
            text: `${topMedicines[0].name} is your #1 mover this week.`,
            tip: "Maintain at least 1 week's worth of buffer stock for this product."
        });
    }

    return {
        daily,
        weekly: totalWeekly,
        monthly: monthlyTotal,
        monthlyForecast,
        weeklyGrowth,
        weeklyTrend: revenueTrend,
        topMedicines,
        insights,
        recentInvoices: recentInvoices as unknown as Invoice[],
        dailyPatientCount
    };
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
    return await (prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }) as unknown as Promise<ActivityLog[]>);
}

// --- Legacy Support ---
// --- Bulk Seed Action ---
export async function fullSystemReset() {
    const role = await getSession();
    if (role !== 'admin') throw new Error("Unauthorized");

    await prisma.$transaction([
        prisma.invoiceItem.deleteMany({}),
        prisma.invoice.deleteMany({}),
        prisma.patient.deleteMany({}),
        prisma.medicine.deleteMany({}),
        prisma.activityLog.deleteMany({}),
    ]);

    await recordLog("FULL_SYSTEM_RESET", "The entire clinic database was wiped for a clean start.");
    await refresh('/');
    await refresh('/patients');
    await refresh('/reports');
}

export async function removeDuplicateMedicines() {
    const role = await getSession();
    if (role !== 'admin') throw new Error("Unauthorized");

    const medicines = await prisma.medicine.findMany({
        orderBy: { createdAt: 'asc' }
    });

    const seen = new Set();
    const duplicates = [];

    for (const med of medicines) {
        if (seen.has(med.name)) {
            duplicates.push(med.id);
        } else {
            seen.add(med.name);
        }
    }

    if (duplicates.length > 0) {
        await prisma.medicine.deleteMany({
            where: { id: { in: duplicates } }
        });
        await recordLog("CLEANUP", `Successfully removed ${duplicates.length} duplicate medicine entries.`);
    }

    await refresh('/');
}

export async function recordSale(formData: FormData) {
    const medicineId = parseInt(formData.get('medicine_id') as string);
    const quantitySold = parseInt(formData.get('quantity_sold') as string);
    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) throw new Error("Medicine not found");

    await createInvoice({
        patientName: "Walk-in Customer",
        mobileNo: "",
        address: "",
        doctorName: "Counter Sale",
        reason: "Direct Sale",
        items: [{
            id: medicineId,
            qty: quantitySold,
            rate: medicine.unit_price,
            gst: medicine.gst_rate,
            name: medicine.name
        }]
    });
}

export async function repairDatabase() {
    const role = await getSession();
    if (role !== 'admin' && role !== 'doctor') throw new Error("Unauthorized");

    try {
        // Force add 'age' column if missing
        await prisma.$executeRawUnsafe(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "age" TEXT;`);

        // Force create ActivityLog if missing
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ActivityLog" (
                "id" SERIAL PRIMARY KEY,
                "action" TEXT NOT NULL,
                "details" TEXT NOT NULL,
                "userRole" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await recordLog("SYSTEM_REPAIR", "Successfully ensured database columns (Age, ActivityLog).");
        await refresh('/');
        return { success: true };
    } catch (error) {
        console.error("Repair failed:", error);
        return { success: false, error: String(error) };
    }
}

export async function addEyePrescription(data: any) {
    try {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        const { patient_name, mobile_no, address, age, doctor_name, customDate } = data;
        console.log(`[Action] Saving Eye Rx for: ${patient_name} (${mobile_no})`, { data });

        let rxDate = new Date();
        if (customDate && customDate.trim() !== "") {
            rxDate = new Date(customDate);
            if (isNaN(rxDate.getTime())) rxDate = new Date();
            else {
                const now = new Date();
                rxDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            let pId = data.patient_id;
            console.log(`[Transaction] Starting. Initial PatientID: ${pId}`);

            if (mobile_no && !pId) {
                const ep = await tx.patient.findUnique({ where: { mobile_no } });
                if (ep) {
                    console.log(`[Transaction] Found existing patient by mobile: ${ep.id}`);
                    await tx.patient.update({
                        where: { id: ep.id },
                        data: { name: patient_name, address: address || ep.address }
                    });
                    pId = ep.id;
                } else {
                    console.log(`[Transaction] Creating new patient for mobile: ${mobile_no}`);
                    const np = await tx.patient.create({
                        data: { name: patient_name, mobile_no, address }
                    });
                    pId = np.id;
                }
            } else if (pId) {
                console.log(`[Transaction] Updating existing patient: ${pId}`);
                await tx.patient.update({
                    where: { id: pId },
                    data: { name: patient_name, address: address || undefined }
                });
            }

            if (!pId) throw new Error("Patient ID or Mobile Number required");

            const amount = parseFloat(data.total_amount || '0');
            console.log(`[Transaction] Creating EyePrescription via Raw SQL for PatientID: ${pId}, Amount: ${amount}`);

            // RAW SQL BYPASS: Prisma Client is stale and doesn't recognize total_amount field yet
            // but we verified it exists in the database.
            const resultRaw = await tx.$queryRawUnsafe<{ id: number }[]>(
                `INSERT INTO "EyePrescription" (
                    patient_id, re_dv_sph, re_dv_cyl, re_dv_axis, re_dv_va,
                    re_nv_sph, re_nv_cyl, re_nv_axis, re_nv_va,
                    le_dv_sph, le_dv_cyl, le_dv_axis, le_dv_va,
                    le_nv_sph, le_nv_cyl, le_nv_axis, le_nv_va,
                    lens_type, notes, doctor_name, pd, total_amount, "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                RETURNING id`,
                pId,
                String(data.re_dv_sph || ""), String(data.re_dv_cyl || ""), String(data.re_dv_axis || ""), String(data.re_dv_va || ""),
                String(data.re_nv_sph || ""), String(data.re_nv_cyl || ""), String(data.re_nv_axis || ""), String(data.re_nv_va || ""),
                String(data.le_dv_sph || ""), String(data.le_dv_cyl || ""), String(data.le_dv_axis || ""), String(data.le_dv_va || ""),
                String(data.le_nv_sph || ""), String(data.le_nv_cyl || ""), String(data.le_nv_axis || ""), String(data.le_nv_va || ""),
                String(data.lens_type || ""), String(data.notes || ""), String(doctor_name || ""), String(data.pd || ""),
                isNaN(amount) ? 0 : amount,
                rxDate, new Date()
            );

            const newPresId = resultRaw[0]?.id;
            console.log(`[Transaction] Success. New Eye Rx ID: ${newPresId}`);
            return { id: newPresId };
        });

        console.log(`✅ Final Success. ID: ${result.id}`);
        await recordLog("ADD_PRESCRIPTION", `Added Eye Prescription for: ${patient_name}. Doctor: ${doctor_name}`);
        await refresh('/patients');
        await refresh('/prescriptions');
        await refresh('/patient-reports');
        return { success: true, id: result.id };
    } catch (error) {
        console.error("Failed to add eye prescription:", error);
        return { success: false, error: String(error) };
    }
}

export async function getPrescriptions() {
    try {
        // RAW SQL BYPASS: Stale client strips total_amount
        const rxs = await prisma.$queryRawUnsafe<any[]>(
            `SELECT ep.*, p.name as p_name, p.mobile_no as p_mobile_no
             FROM "EyePrescription" ep
             LEFT JOIN "Patient" p ON ep.patient_id = p.id
             ORDER BY ep."createdAt" DESC`
        );
        return rxs.map(rx => ({
            ...rx,
            patient: { name: rx.p_name, mobile_no: rx.p_mobile_no }
        }));
    } catch (e) {
        console.error("Error in getPrescriptions raw:", e);
        return [];
    }
}
export async function deleteEyePrescription(id: number) {
    try {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        const rx = await (prisma as any).eyePrescription.findUnique({
            where: { id },
            include: { patient: true }
        });

        if (rx) {
            await (prisma as any).eyePrescription.delete({ where: { id } });
            await recordLog("DELETE_PRESCRIPTION", `Deleted Eye Prescription ID #${id} for patient: ${rx.patient.name}`);
        }

        await refresh('/patients');
        await refresh('/prescriptions');
        await refresh('/patient-reports');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete eye prescription:", error);
        return { success: false, error: String(error) };
    }
}
