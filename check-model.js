const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking EyePrescription model...");
        // Just try to access the model to see if it exists
        const fields = Object.keys(prisma.eyePrescription || {});
        console.log("Prisma client thinks eyePrescription has these keys (if object):", fields);

        // Check runtime model
        const runtimeFields = prisma._runtimeDataModel?.models?.EyePrescription?.fields?.map(f => f.name) || [];
        console.log("Runtime Model Fields for EyePrescription:", runtimeFields);

        if (runtimeFields.includes('total_amount')) {
            console.log("✅ total_amount field IS FOUND in Prisma client.");
        } else {
            console.log("❌ total_amount field IS MISSING from Prisma client.");
        }
    } catch (e) {
        console.error("Error during check:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
