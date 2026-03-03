import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Attempting to connect to database...")
        await prisma.$connect()
        console.log("✅ Successfully connected to database!")

        // Try a simple query
        const count = await prisma.medicine.count()
        console.log(`✅ Database query successful. Medicine count: ${count}`)

        process.exit(0)
    } catch (error) {
        console.error("❌ Database connection failed:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
