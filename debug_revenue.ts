
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const inv = await (prisma as any).invoice.findUnique({
        where: { invoice_no: 'SB/BIL/0001' }
    });
    console.log("INV_0001_AMT: " + inv.total_amount);
}

check()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
