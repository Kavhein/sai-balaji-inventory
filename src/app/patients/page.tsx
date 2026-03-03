export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { User, Search } from "lucide-react";
import { getMedicines, getDailyStats } from "../actions";
import NewPatientForm from "./new-patient-form";
import DeletePatientButton from "./delete-patient-button";
import SMSReportButton from "@/components/sms-report-button";
import Link from "next/link";
import { Patient, Medicine, Invoice } from "@/lib/types";

async function getPatientList(query?: string): Promise<Patient[]> {

    const where: any = query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { mobile_no: { contains: query } }
        ]
    } : {};

    return await prisma.patient.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
            history: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    items: {
                        include: {
                            medicine: true
                        }
                    }
                }
            }
        }
    });
}

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const params = await searchParams;
    const query = params?.q || "";
    let patients: Patient[] = [];
    let medicines: Medicine[] = [];
    const { daily, dailyPatientCount } = await getDailyStats();

    try {
        patients = await getPatientList(query);
        medicines = await getMedicines(); // Fetch medicines for the form
    } catch (e) {
        console.error("Failed to fetch data", e);
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <User className="h-8 w-8 text-blue-600" />
                        Patient Database
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage medical history & billing</p>
                </div>
                <SMSReportButton dailyAmount={daily} patientCount={dailyPatientCount} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Add Patient & Purchase Form */}
                <NewPatientForm medicines={medicines} />

                {/* Patient List */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Search */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <form className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                name="q"
                                defaultValue={query}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search by name or mobile number..."
                            />
                        </form>
                    </div>

                    <div className="space-y-4">
                        {patients.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
                                No patients found. Add one to see their history.
                            </div>
                        ) : (
                            patients.map((patient: Patient) => (
                                <div key={patient.id} className="glass-card rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100/50 bg-slate-50/30 flex justify-between items-start">
                                        <div>
                                            <Link href={`/patients/${patient.id}`} className="group/name">
                                                <h3 className="font-bold text-slate-900 group-hover/name:text-blue-600 transition-colors flex items-center gap-1.5">
                                                    {patient.name}
                                                    <span className="opacity-0 group-hover/name:opacity-100 transition-opacity text-[10px] font-bold text-blue-400 uppercase tracking-widest transition-transform group-hover/name:translate-x-1">Profile ↗</span>
                                                </h3>
                                            </Link>
                                            <p className="text-sm text-slate-500 font-medium">{patient.mobile_no}</p>
                                            {patient.address && (
                                                <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">{patient.address}</p>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="text-[10px] bg-blue-100/50 text-blue-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-200">
                                                {patient.history?.length || 0} Visits
                                            </span>
                                            <DeletePatientButton id={patient.id} />
                                        </div>
                                    </div>

                                    {/* Recent Purchase History */}
                                    <div className="p-4 bg-white/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Purchases</p>
                                        {patient.history && patient.history.length > 0 ? (
                                            <div className="space-y-3">
                                                {patient.history?.map((invoice: Invoice) => (
                                                    <div key={invoice.id} className="border-l-2 border-slate-200 pl-3 hover:border-blue-400 transition-colors">
                                                        <div className="flex justify-between text-[11px] mb-1">
                                                            <span className="text-slate-600 font-bold">
                                                                {new Date(invoice.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                                            </span>
                                                            <span className="text-slate-900 font-extrabold">₹{invoice.total_amount.toFixed(2)}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {invoice.items.slice(0, 3).map((item) => (
                                                                <div key={item.id} className="flex justify-between text-[10px] text-slate-500">
                                                                    <span>{item.medicine?.name} <span className="text-slate-300 font-medium">x{item.quantity}</span></span>
                                                                    <span>₹{item.total_price.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                            {invoice.items.length > 3 && (
                                                                <p className="text-[9px] text-slate-400 font-medium">+{invoice.items.length - 3} more items...</p>
                                                            )}
                                                        </div>
                                                        <Link
                                                            href={`/patients/${patient.id}`}
                                                            className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-tighter"
                                                        >
                                                            📋 View History
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No purchase history yet.</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
