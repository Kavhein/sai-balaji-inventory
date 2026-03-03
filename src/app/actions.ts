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

export async function getPatientDetails(id: number): Promise<Patient | null> {
    return await (prisma.patient.findUnique({
        where: { id },
        include: {
            history: {
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            medicine: true
                        }
                    }
                }
            }
        }
    }) as unknown as Promise<Patient | null>);
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

    const sales = await prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: { createdAt: { gte: startOfDayUTC } }
    });
    const count = await prisma.invoice.count({
        where: { createdAt: { gte: startOfDayUTC } }
    });

    return { daily: sales._sum.total_amount || 0, dailyPatientCount: count };
}

export async function getFinancialReports(timeframe: 'weekly' | 'monthly' | 'yearly' = 'weekly'): Promise<ReportData> {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Start of Today (IST)
    const startOfIstToday = new Date(istNow);
    startOfIstToday.setUTCHours(0, 0, 0, 0);
    const startOfDayUTC = new Date(startOfIstToday.getTime() - istOffset);

    // Start of 7 days ago (IST)
    const startOfWeekIST = new Date(startOfIstToday);
    startOfWeekIST.setUTCDate(startOfIstToday.getUTCDate() - 6);
    const startOfWeekUTC = new Date(startOfWeekIST.getTime() - istOffset);

    // Start of Month (IST)
    const startOfMonthIST = new Date(startOfIstToday);
    startOfMonthIST.setUTCDate(1);
    const startOfMonthUTC = new Date(startOfMonthIST.getTime() - istOffset);

    const { daily, dailyPatientCount } = await getDailyStats();

    const ws = await prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: { createdAt: { gte: startOfWeekUTC } }
    });

    const ms = await prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: { createdAt: { gte: startOfMonthUTC } }
    });

    // 1. Revenue Trend
    const revenueTrend: RevenueTrend[] = [];

    if (timeframe === 'weekly') {
        for (let i = 6; i >= 0; i--) {
            const targetDayIST = new Date(startOfIstToday);
            targetDayIST.setUTCDate(startOfIstToday.getUTCDate() - i);
            const dayStartUTC = new Date(targetDayIST.getTime() - istOffset);
            const dayEndUTC = new Date(dayStartUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

            const sum = await prisma.invoice.aggregate({
                _sum: { total_amount: true },
                where: { createdAt: { gte: dayStartUTC, lte: dayEndUTC } }
            });

            revenueTrend.push({
                label: targetDayIST.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
                amount: sum._sum.total_amount || 0
            });
        }
    } else if (timeframe === 'monthly') {
        for (let i = 29; i >= 0; i--) {
            const targetDayIST = new Date(startOfIstToday);
            targetDayIST.setUTCDate(startOfIstToday.getUTCDate() - i);
            const dayStartUTC = new Date(targetDayIST.getTime() - istOffset);
            const dayEndUTC = new Date(dayStartUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

            const sum = await prisma.invoice.aggregate({
                _sum: { total_amount: true },
                where: { createdAt: { gte: dayStartUTC, lte: dayEndUTC } }
            });

            revenueTrend.push({
                label: targetDayIST.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
                amount: sum._sum.total_amount || 0
            });
        }
    } else if (timeframe === 'yearly') {
        for (let i = 11; i >= 0; i--) {
            const targetMonthIST = new Date(startOfMonthIST);
            targetMonthIST.setUTCMonth(startOfMonthIST.getUTCMonth() - i);

            const monthStartUTC = new Date(targetMonthIST.getTime() - istOffset);
            const monthEndUTC = new Date(new Date(targetMonthIST).setUTCMonth(targetMonthIST.getUTCMonth() + 1) - 1 - istOffset);

            const sum = await prisma.invoice.aggregate({
                _sum: { total_amount: true },
                where: { createdAt: { gte: monthStartUTC, lte: monthEndUTC } }
            });

            revenueTrend.push({
                label: targetMonthIST.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' }),
                amount: sum._sum.total_amount || 0
            });
        }
    }

    // 2. Top Sold Medicines (Last 7 Days)
    const invoiceItems = await prisma.invoiceItem.findMany({
        include: { medicine: true },
        where: {
            invoice: { createdAt: { gte: startOfWeekUTC } }
        }
    });

    const medicineStats: Record<number, { name: string, category: string, quantity: number, revenue: number }> = {};
    invoiceItems.forEach((item) => {
        const id = item.medicine_id;
        if (!item.medicine) return;
        if (!medicineStats[id]) {
            medicineStats[id] = {
                name: item.medicine.name,
                category: item.medicine.category,
                quantity: 0,
                revenue: 0
            };
        }
        medicineStats[id].quantity += item.quantity;
        medicineStats[id].revenue += item.total_price;
    });

    const topMedicines = Object.values(medicineStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    // 3. Comparisons and Forecast
    const totalWeekly = ws._sum.total_amount || 0;
    const prevWeekStartUTC = new Date(startOfWeekUTC.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWs = await prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: { createdAt: { gte: prevWeekStartUTC, lt: startOfWeekUTC } }
    });
    const prevWeekly = prevWs._sum.total_amount || 0;

    // Real calculation: If no data last week, growth is 100% of this week.
    // If we have data, we calculate the percentage diff.
    const weeklyGrowth = prevWeekly === 0 ? (totalWeekly > 0 ? 100 : 0) : Math.round(((totalWeekly - prevWeekly) / prevWeekly) * 100);

    const monthlyTotal = ms._sum.total_amount || 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = istNow.getUTCDate();
    const monthlyForecast = Math.round((monthlyTotal / currentDayOfMonth) * daysInMonth);

    // 4. Automated Insights
    const insights: Insight[] = [];
    const avgWeekly = totalWeekly / 7;

    if (daily > 0 && daily > avgWeekly * 1.2 && totalWeekly > daily) {
        insights.push({
            type: "POSITIVE",
            text: `Revenue today (₹${daily.toLocaleString()}) is trending ${Math.round((daily / avgWeekly - 1) * 100)}% above your daily average.`,
            tip: "Check your highest movement stock and ensure you refill before the morning shift."
        });
    }

    const lowStock = await prisma.medicine.findMany({
        where: { stock_quantity: { lte: 20 }, is_available: true },
        take: 3
    });

    if (lowStock.length > 0) {
        insights.push({
            type: "STOCK",
            text: `${lowStock.length} items are running below 20 units.`,
            tip: `Refill ${lowStock.map((m) => m.name).join(', ')} soon to avoid out-of-stock errors during billing.`
        });
    }

    if (topMedicines.length > 0) {
        insights.push({
            type: "STRATEGY",
            text: `${topMedicines[0].name} is your #1 mover this week.`,
            tip: "This is a key product. Ensure you maintain at least 1 week's worth of buffer stock."
        });
    }

    const recentInvoices = await (prisma.invoice.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { medicine: true } } }
    }) as unknown as Promise<Invoice[]>);

    return {
        daily,
        weekly: totalWeekly,
        monthly: monthlyTotal,
        monthlyForecast,
        weeklyGrowth,
        weeklyTrend: revenueTrend,
        topMedicines,
        insights,
        recentInvoices,
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





