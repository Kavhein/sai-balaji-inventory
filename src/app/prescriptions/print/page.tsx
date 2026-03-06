import { prisma } from "@/lib/prisma";
import { EyePrescription } from "@/lib/types";
import InvoiceActions from "@/components/invoice-actions"; // We can reuse the print buttons
import { numberToWords } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PrintPrescriptionPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    const params = await searchParams;
    const id = params.id ? parseInt(params.id) : null;

    if (!id) {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Invalid Prescription ID provided.
            </div>
        );
    }

    // RAW SQL BYPASS: Stale Prisma client on the server strips out newer fields like total_amount
    // We fetch raw and then manually structure the object.
    const rxQuery = await prisma.$queryRawUnsafe<any[]>(
        `SELECT ep.*, p.name as p_name, p.mobile_no as p_mobile, p.address as p_address
         FROM "EyePrescription" ep
         JOIN "Patient" p ON ep.patient_id = p.id
         WHERE ep.id = $1 LIMIT 1`,
        id
    );

    const rawRx = rxQuery[0];

    if (!rawRx) {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Prescription not found.
            </div>
        );
    }

    // Map raw flat result to the expected structure
    const rx = {
        ...rawRx,
        patient: {
            name: rawRx.p_name,
            mobile_no: rawRx.p_mobile,
            address: rawRx.p_address
        }
    };
    const formatDate = (date: Date) => {
        try {
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).replace(/ /g, '/');
        } catch (e) {
            return date.toDateString();
        }
    };

    return (
        <div className="bg-white text-black font-sans p-8 max-w-[210mm] mx-auto min-h-screen text-[12px] leading-tight">
            {/* Header / Branding */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-4">
                    {/* Logo Placeholder */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-16 flex items-center justify-center mb-1">
                            <img src="/eye-logo-final.svg" alt="Sai Balaji Eye Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-blue-900">SAI BALAJI</h1>
                        <h2 className="text-sm font-bold tracking-widest text-slate-700 uppercase">Diabetic & Eye Clinic</h2>
                        <p className="mt-1 text-slate-600 text-[10px] leading-relaxed">
                            No. 22/49, Melpatti Ponnappa Mudali Street<br />
                            Vyasarpadi, Chennai - 600 039<br />
                            Phone: +91 7708537537 / +91 90255 24109
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-1 text-slate-800">SAI BALAJI DIABETIC & EYE CARE</h3>
                    <p className="text-[10px] font-bold text-slate-500">Date: {formatDate(new Date(rx.createdAt))}</p>
                </div>
            </div>

            {/* Patient Details */}
            <div className="flex justify-between mb-10 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Patient Name</p>
                    <p className="text-lg font-bold text-slate-900 uppercase">{rx.patient.name}</p>
                    <p className="text-slate-600 mt-1">{rx.patient.mobile_no || 'No phone provided'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Doctor</p>
                    <p className="font-bold text-slate-900 uppercase">Dr. {rx.doctor_name?.replace(/^Dr\.\s+/i, '') || 'Renuka Duraisamy'}</p>
                </div>
            </div>

            {/* Title */}
            <div className="mb-6 border-b border-slate-200 pb-2">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em]">Glass Prescription</h3>
            </div>

            {/* The Grid */}
            <div className="overflow-hidden border-2 border-slate-800 rounded-xl mb-10">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="border-b-2 border-r-2 border-slate-800 bg-slate-100 p-3 font-bold text-slate-900 uppercase w-16"></th>
                            <th colSpan={4} className="border-b-2 border-r-2 border-slate-800 bg-slate-100 p-3 font-bold text-slate-900 uppercase tracking-widest">Right Eye (RE)</th>
                            <th colSpan={4} className="border-b-2 border-slate-800 bg-slate-100 p-3 font-bold text-slate-900 uppercase tracking-widest">Left Eye (LE)</th>
                        </tr>
                        <tr className="text-[10px] font-bold text-slate-700 bg-slate-50 uppercase">
                            <th className="border-b-2 border-r-2 border-slate-800 p-2"></th>
                            {/* RE columns */}
                            <th className="border-b-2 border-r border-slate-300 p-2">SPH</th>
                            <th className="border-b-2 border-r border-slate-300 p-2">CYL</th>
                            <th className="border-b-2 border-r border-slate-300 p-2">AXIS</th>
                            <th className="border-b-2 border-r-2 border-slate-800 p-2">V/A</th>
                            {/* LE columns */}
                            <th className="border-b-2 border-r border-slate-300 p-2">SPH</th>
                            <th className="border-b-2 border-r border-slate-300 p-2">CYL</th>
                            <th className="border-b-2 border-r border-slate-300 p-2">AXIS</th>
                            <th className="border-b-2 border-slate-800 p-2">V/A</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {/* DV Row */}
                        <tr>
                            <td className="border-b border-r-2 border-slate-800 p-4 font-bold text-slate-900 bg-slate-50">DV</td>
                            {/* RE DV */}
                            <td className="border-b border-r border-slate-300 p-4 font-medium">{rx.re_dv_sph || '-'}</td>
                            <td className="border-b border-r border-slate-300 p-4 font-medium">{rx.re_dv_cyl || '-'}</td>
                            <td className="border-b border-r border-slate-300 p-4 font-medium">{rx.re_dv_axis || '-'}</td>
                            <td className="border-b border-r-2 border-slate-800 p-4 font-medium">{rx.re_dv_va || '-'}</td>
                            {/* LE DV */}
                            <td className="border-b border-r border-slate-300 p-4 font-medium">{rx.le_dv_sph || '-'}</td>
                            <td className="border-b border-r border-slate-300 p-4 font-medium">{rx.le_dv_cyl || '-'}</td>
                            <td className="border-b border-r border-slate-300 p-4 font-medium">{rx.le_dv_axis || '-'}</td>
                            <td className="border-b border-slate-800 p-4 font-medium">{rx.le_dv_va || '-'}</td>
                        </tr>
                        {/* NV Row */}
                        <tr>
                            <td className="border-r-2 border-slate-800 p-4 font-bold text-slate-900 bg-slate-50">NV</td>
                            {/* RE NV */}
                            <td className="border-r border-slate-300 p-4 font-medium">{rx.re_nv_sph || '-'}</td>
                            <td className="border-r border-slate-300 p-4 font-medium">{rx.re_nv_cyl || '-'}</td>
                            <td className="border-r border-slate-300 p-4 font-medium">{rx.re_nv_axis || '-'}</td>
                            <td className="border-r-2 border-slate-800 p-4 font-medium">{rx.re_nv_va || '-'}</td>
                            {/* LE NV */}
                            <td className="border-r border-slate-300 p-4 font-medium">{rx.le_nv_sph || '-'}</td>
                            <td className="border-r border-slate-300 p-4 font-medium">{rx.le_nv_cyl || '-'}</td>
                            <td className="border-r border-slate-300 p-4 font-medium">{rx.le_nv_axis || '-'}</td>
                            <td className="p-4 font-medium">{rx.le_nv_va || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Additional info & REDESIGNED TOTAL BOX */}
            <div className="space-y-6">
                <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1 w-fit pr-4">Recommended Lens Type</h4>
                    <p className="text-sm font-bold text-slate-800">{rx.lens_type || "-"}</p>
                </div>

                <div className="flex border border-slate-400 mt-8">
                    <div className="flex-1 p-3 flex flex-col justify-center">
                        <div className="font-bold italic text-slate-900 text-[11px]">
                            Amount in words: Rupees {numberToWords(rx.total_amount)}
                        </div>
                    </div>
                    <div className="w-64 border-l border-slate-400">
                        <div className="flex justify-between items-center p-3 bg-slate-50 font-bold text-sm">
                            <span className="text-slate-700 uppercase tracking-tighter">Total Amount</span>
                            <span className="text-lg">₹{(rx.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>


            <div className="flex justify-end mt-24">
                <div className="text-center">
                    <p className="font-bold">For SAI BALAJI EYE & DIABETIC CLINIC</p>
                    <p className="mt-12 border-t border-black px-8 pt-2 font-semibold text-slate-600">Authorized Signature</p>
                </div>
            </div>

            {/* Action Buttons - hidden when printing */}
            <InvoiceActions />

        </div>
    );
}
