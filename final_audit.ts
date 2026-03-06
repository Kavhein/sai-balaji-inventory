import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    let output = "# Patient Data Consistency Audit\n\n";

    // 1. Orphaned Invoices (patient_id is NULL)
    const orphanedInvoices = await prisma.invoice.findMany({
        where: {
            patient_id: null,
            NOT: { patient_name: "Walk-in Customer" }
        }
    });

    output += "## 1. Orphaned Invoices (No linked Patient ID)\n";
    output += "These invoices exist but aren't linked to any patient profile. They were likely orphaned during a patient deletion.\n\n";
    if (orphanedInvoices.length === 0) {
        output += "No orphaned invoices found.\n";
    } else {
        output += "| Invoice # | Patient Name | Date | Total |\n";
        output += "|---|---|---|---|\n";
        orphanedInvoices.forEach(inv => {
            output += `| ${inv.invoice_no} | ${inv.patient_name} | ${inv.createdAt.toISOString()} | ₹${inv.total_amount} |\n`;
        });
    }

    // 2. Orphaned Prescriptions
    const prescriptions = await prisma.$queryRawUnsafe<any[]>(
        `SELECT ep.id, ep.patient_id, p.id as real_patient_id, ep."createdAt", ep.doctor_name
     FROM "EyePrescription" ep 
     LEFT JOIN "Patient" p ON ep.patient_id = p.id`
    );

    const missingPatientPrescriptions = prescriptions.filter(p => p.real_patient_id === null);

    output += "\n## 2. Orphaned Prescriptions (Linked to non-existent Patient)\n";
    if (missingPatientPrescriptions.length === 0) {
        output += "No orphaned prescriptions found.\n";
    } else {
        output += "| Prescription ID | Patient ID ID | Date | Doctor |\n";
        output += "|---|---|---|---|\n";
        missingPatientPrescriptions.forEach(p => {
            output += `| ${p.id} | ${p.patient_id} | ${new Date(p.createdAt).toISOString()} | ${p.doctor_name || 'N/A'} |\n`;
        });
    }

    // 3. Duplicate Patients
    const patients = await prisma.patient.findMany();
    const mobileMap = new Map();
    const duplicates: any[] = [];
    patients.forEach(p => {
        if (mobileMap.has(p.mobile_no)) {
            duplicates.push({ name: p.name, mobile: p.mobile_no, ids: [mobileMap.get(p.mobile_no), p.id] });
        } else {
            mobileMap.set(p.mobile_no, p.id);
        }
    });

    output += "\n## 3. Potential Duplicate Patient Records (Same Mobile)\n";
    if (duplicates.length === 0) {
        output += "No duplicates found.\n";
    } else {
        output += "| Name | Mobile | IDs |\n";
        output += "|---|---|---|\n";
        duplicates.forEach(d => {
            output += `| ${d.name} | ${d.mobile} | ${d.ids.join(', ')} |\n`;
        });
    }

    // 4. Activity Log Analysis
    const logs = await prisma.activityLog.findMany({
        where: { action: 'DELETE_PATIENT' },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    output += "\n## 4. Patient Deletion Logs (Context for orphan creation)\n";
    if (logs.length === 0) {
        output += "No deletion logs found.\n";
    } else {
        output += "| Date | Details | Role |\n";
        output += "|---|---|---|\n";
        logs.forEach(l => {
            output += `| ${l.createdAt.toISOString()} | ${l.details} | ${l.userRole} |\n`;
        });
    }

    fs.writeFileSync('audit_report.md', output);
    console.log("Audit complete. Results saved to audit_report.md");
}

main().catch(console.error).finally(() => prisma.$disconnect());
