import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const medicines = [
    // --- EYE (Category 1) ---
    { name: "Eyemos gel", category: "Eye", unit_price: 195 },
    { name: "Xio ultra", category: "Eye", unit_price: 290 },
    { name: "Hylate", category: "Eye", unit_price: 234 },
    { name: "Hylate THS", category: "Eye", unit_price: 374 },
    { name: "HP mos gel", category: "Eye", unit_price: 300 },
    { name: "Specxio", category: "Eye", unit_price: 150 },
    { name: "Specxio LP", category: "Eye", unit_price: 180 },
    { name: "BT lube", category: "Eye", unit_price: 350 },
    { name: "Predlast MF", category: "Eye", unit_price: 225 },
    { name: "Olokit plus", category: "Eye", unit_price: 180 },
    { name: "Specxio eye ointment", category: "Eye", unit_price: 98 },
    { name: "XN eye oint", category: "Eye", unit_price: 90 },

    // --- DIABETES (Category 2) ---
    { name: "Dapa gm2", category: "Diabetes", unit_price: 130 },
    { name: "Janurik MF 15 tab", category: "Diabetes", unit_price: 188 },
    { name: "Daily met 500mg", category: "Diabetes", unit_price: 37 },
    { name: "Pridag M1", category: "Diabetes", unit_price: 80 },
    { name: "Pridag M2", category: "Diabetes", unit_price: 90 },
    { name: "Glimihelp PM1", category: "Diabetes", unit_price: 149 },
    { name: "Glimihelp PM2", category: "Diabetes", unit_price: 200 },
    { name: "Glimicut MV1", category: "Diabetes", unit_price: 132 },
    { name: "Glimicut MV2", category: "Diabetes", unit_price: 144 },
    { name: "Coredapa 10mg", category: "Diabetes", unit_price: 130 },
    { name: "Gli 80", category: "Diabetes", unit_price: 107 },
    { name: "Glimicut2", category: "Diabetes", unit_price: 98 },
    { name: "Tenacid MF", category: "Diabetes", unit_price: 200 },

    // --- GENERAL (Category 3) ---
    { name: "Clobenate GM", category: "General", unit_price: 90 },
    { name: "Muprate", category: "General", unit_price: 116 },
    { name: "Povidone", category: "General", unit_price: 66 },
    { name: "Pilogo", category: "General", unit_price: 118 },
    { name: "Moisturising lotion", category: "General", unit_price: 164 },
    { name: "Telma 40 mg", category: "General", unit_price: 76 },
    { name: "Telma 40/25", category: "General", unit_price: 107 },
    { name: "Telma 40/50", category: "General", unit_price: 122 },
    { name: "Clindipine 10mg", category: "General", unit_price: 113 },
    { name: "Atorva10mg", category: "General", unit_price: 57 },
    { name: "Atorva 20 mg", category: "General", unit_price: 141 },
    { name: "Ultivit", category: "General", unit_price: 210 },
    { name: "Recaution D3", category: "General", unit_price: 300 },
    { name: "Pregader M", category: "General", unit_price: 154 },
    { name: "Gabatron NTP", category: "General", unit_price: 254 },
    { name: "Tryptomer 25mg", category: "General", unit_price: 28 },
    { name: "Dulexetine", category: "General", unit_price: 104 },
    { name: "Tensiwin 0.5 mg", category: "General", unit_price: 30 },
    { name: "Spasmodic", category: "General", unit_price: 29 },
    { name: "Pan 40 mg", category: "General", unit_price: 120 },
    { name: "Razep 20mg", category: "General", unit_price: 94 },
    { name: "Ppzot DSR", category: "General", unit_price: 144 },
    { name: "Letrohope 2.5mg", category: "General", unit_price: 0 }, // Price was '-'
    { name: "Atorvastin F", category: "General", unit_price: 164 },
    { name: "Rosuvaday 10 mg", category: "General", unit_price: 174 },
    { name: "Paracetamol 500mg", category: "General", unit_price: 11 },
    { name: "Cheston cold", category: "General", unit_price: 66 },
    { name: "Monteder L", category: "General", unit_price: 190 },
    { name: "Monterik Fx", category: "General", unit_price: 270 },
    { name: "Cetriz 10mg", category: "General", unit_price: 21 },
    { name: "Eldefez MR", category: "General", unit_price: 90 },
    { name: "Acetab SP", category: "General", unit_price: 165 },
    { name: "Acetab P", category: "General", unit_price: 116 },
    { name: "Mobicam 10mg", category: "General", unit_price: 79 },
    { name: "Offnek", category: "General", unit_price: 66 },
    { name: "Elmox CV", category: "General", unit_price: 205 },
    { name: "Doxy Lb", category: "General", unit_price: 65 },
    { name: "Azithral 500mg", category: "General", unit_price: 78 },
    { name: "Supristone 200mg", category: "General", unit_price: 193 },
    { name: "Polyquin D", category: "General", unit_price: 415 },
    { name: "Sumohot gel ointment", category: "General", unit_price: 161 },
    { name: "Syrup A to Z", category: "General", unit_price: 192 },
    { name: "Syrup feriduo", category: "General", unit_price: 160 },
    { name: "Syrup Enzyme", category: "General", unit_price: 125 },
];

async function main() {
    console.log("Seeding medicines...");
    for (const med of medicines) {
        await prisma.medicine.create({
            data: {
                ...med,
                stock_quantity: 100,
                manufacturer: "Generic",
                batch_no: `BATCH-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // 2 years from now
                hsn_code: "3004",
                gst_rate: 5.0,
                is_available: true
            }
        });
    }
    console.log("Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
