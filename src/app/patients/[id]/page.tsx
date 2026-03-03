import { getPatientDetails } from "@/app/actions";
import { notFound } from "next/navigation";
import {
    Calendar,
    User,
    Phone,
    MapPin,
    ArrowLeft,
    Receipt,
    Clock,
    Stethoscope,
    ChevronRight,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Patient, Invoice } from "@/lib/types";

export default async function PatientDossierPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const patient = await getPatientDetails(parseInt(id));

    if (!patient) return notFound();

    const history = patient.history || [];
    const totalSpent = history.reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0);
    const lastVisit = history[0]?.createdAt;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Link
                    href="/patients"
                    className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Patient Medical Dossier</h1>
                    <p className="text-sm text-slate-500">Comprehensive history for {patient.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Patient Profile Card */}
                <div className="space-y-6">
                    <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <User className="h-24 w-24" />
                        </div>

                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                            <div className="h-20 w-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                <User className="h-10 w-10" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Patient ID: #SB-P{patient.id}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                </div>
                                <span className="text-slate-600">{patient.mobile_no}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                </div>
                                <span className="text-slate-600 leading-relaxed">{patient.address || "No address on file"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Visits</p>
                                <p className="text-lg font-bold text-slate-900">{history.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p>
                                <p className="text-lg font-bold text-blue-600">₹{totalSpent.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-emerald-800 font-medium">Last Visit</p>
                            <p className="text-sm font-bold text-emerald-900">
                                {lastVisit ? new Date(lastVisit).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : 'Never'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Clinical Timeline
                        </h3>
                        <div className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                            All Records
                        </div>
                    </div>

                    <div className="timeline-line space-y-8 pl-8">
                        {history.length === 0 ? (
                            <div className="glass-card rounded-2xl p-12 text-center">
                                <div className="h-12 w-12 bg-slate-50 rounded-full mx-auto flex items-center justify-center mb-4">
                                    <Calendar className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-slate-500 text-sm">No transaction history found for this patient.</p>
                            </div>
                        ) : (
                            history.map((invoice: Invoice) => (
                                <div key={invoice.id} className="relative">
                                    {/* Timeline Marker */}
                                    <div className="absolute -left-8 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg shadow-blue-500/30"></div>

                                    <div className="glass-card rounded-2xl p-5 hover:border-blue-200 transition-all group overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">{new Date(invoice.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-blue-500" />
                                                    {invoice.invoice_no}
                                                </h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-extrabold text-slate-900">₹{invoice.total_amount.toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Dr. {invoice.doctor_name}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <Stethoscope className="h-3 w-3" /> Rx Details / Diagnosis
                                            </p>
                                            <p className="text-sm text-slate-700 font-medium mb-3 italic">
                                                &quot;{invoice.reason || 'General Consultation'}&quot;
                                            </p>

                                            <div className="space-y-2">
                                                {invoice.items?.map((item, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 font-medium">{item.medicine?.name} × {item.quantity}</span>
                                                        <span className="text-slate-900 font-bold">₹{item.total_price.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <Link
                                                href={`/invoices/print?id=${invoice.id}`}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/link"
                                            >
                                                View Full Bill
                                                <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
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
