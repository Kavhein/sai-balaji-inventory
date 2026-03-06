import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const i = await prisma.invoice.findMany({ where: { patient_name: 'Jeeva priya' }, select: { invoice_no: true, patient_id: true } });
    console.log(i);
}
main().catch(console.error).finally(() => prisma.$disconnect());
