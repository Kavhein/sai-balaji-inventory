import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import fs from 'fs';

async function main() {
    const deletedLogs = await prisma.activityLog.findMany({
        where: { action: 'DELETE_PATIENT' },
        orderBy: { createdAt: 'desc' }
    });

    const orphanedInvoices = await prisma.invoice.findMany({
        where: {
            patient_id: null,
            patient_name: {
                not: 'Walk-in Customer'
            }
        },
        include: {
            items: { include: { medicine: true } }
        }
    });

    const output = {
        deletedRecords: deletedLogs.map(l => ({ date: l.createdAt.toISOString(), details: l.details, userRole: l.userRole })),
        orphanedInvoices: orphanedInvoices.map(inv => ({
            invoiceNo: inv.invoice_no,
            patientName: inv.patient_name,
            mobileNo: inv.mobile_no,
            totalAmount: inv.total_amount,
            date: inv.createdAt.toISOString(),
            items: inv.items.map(i => `${i.medicine?.name || 'Unknown'} (x${i.quantity})`)
        }))
    };

    fs.writeFileSync('orphaned_results.json', JSON.stringify(output, null, 2));
    console.log('Results written to orphaned_results.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
