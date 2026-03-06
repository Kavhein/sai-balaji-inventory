export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ClipboardList, Search } from "lucide-react";
import { getDailyStats } from "../actions";
import { getSession } from "@/lib/auth";
import DeletePatientButton from "../patients/delete-patient-button";
import SMSReportButton from "@/components/sms-report-button";
import Link from "next/link";
import { Patient, Invoice } from "@/lib/types";

async function getPatientList(query?: string): Promise<Patient[]> {
    const where: any = query ? {
        OR: [{ name: { contains: query, mode: 'insensitive' } }, { mobile_no: { contains: query } }]
    } : {};
    return await prisma.patient.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { history: { orderBy: { createdAt: 'desc' }, take: 5, include: { items: { include: { medicine: true } } } } }
    });
}

export default async function PatientReportsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const params = await searchParams;
    const query = params?.q || "";
    const patients = await getPatientList(query);
    const { daily, dailyPatientCount } = await getDailyStats();
    const role = await getSession();
    const isAdmin = role === 'admin' || role === 'doctor';

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <ClipboardList className="h-8 w-8 text-blue-600" />
                        Patient Reports
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Detailed purchase history & visitation records</p>
                </div>
                <SMSReportButton dailyAmount={daily} patientCount={dailyPatientCount} />
            </div>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <form className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input name="q" defaultValue={query} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Search records..." />
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {patients.map((patient: Patient) => (
                        <div key={patient.id} className="premium-card bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <Link href={`/patients/${patient.id}`}><h3 className="font-black text-slate-900 text-lg">{patient.name}</h3></Link>
                                        <p className="font-bold text-blue-600 text-xs mt-1">{patient.mobile_no}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-10 w-10 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-black text-xs border border-blue-100">{patient.history?.length || 0}</div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Visits</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {patient.history && patient.history.length > 0 ? (
                                        patient.history.map((invoice: Invoice) => (
                                            <div key={invoice.id} className="relative pl-4 border-l-2 border-slate-100 py-1 font-medium">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</p>
                                                    <p className="text-xs font-black text-slate-900">₹{invoice.total_amount.toFixed(2)}</p>
                                                </div>
                                                <Link href={`/invoices/print?id=${invoice.id}`} className="text-[9px] font-black uppercase text-blue-600 hover:underline tracking-widest">View Bill ↗</Link>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-slate-400 uppercase font-black italic">No history found</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 flex gap-2">
                                <Link href={`/patients/${patient.id}`} className="bg-slate-900 text-white flex-1 py-3 rounded-2xl font-bold text-center text-xs uppercase tracking-widest">Profile</Link>
                                {isAdmin && (
                                    <div className="bg-rose-50 rounded-2xl">
                                        <DeletePatientButton id={patient.id} isAdmin={isAdmin} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
