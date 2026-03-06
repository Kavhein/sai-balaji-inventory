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
    TrendingUp,
    Eye,
    Plus
} from "lucide-react";
import Link from "next/link";
import { Patient, Invoice, EyePrescription } from "@/lib/types";

export default async function PatientDossierPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const patient = await getPatientDetails(parseInt(id));

    if (!patient) return notFound();

    const history = patient.history || [];
    const prescriptions = patient.prescriptions || [];
    const latestPrescription = prescriptions[0];
    const totalSpent = history.reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0) + prescriptions.reduce((acc: number, rx: EyePrescription) => acc + (rx.total_amount || 0), 0);
    const lastVisit = [...history, ...prescriptions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;

    // Combine and sort total clinical history
    const unifiedTimeline = [
        ...history.map((h: Invoice) => ({ ...h, type: 'invoice' as const })),
        ...prescriptions.map((p: any) => ({ ...p, type: 'eye_rx' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

                    {latestPrescription ? (
                        <Link
                            href={`/prescriptions/print?id=${latestPrescription.id}`}
                            className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4 hover:shadow-md transition-all group"
                        >
                            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
                                <Eye className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Latest Eye Prescription</p>
                                <p className="text-sm font-black text-blue-900">
                                    {new Date(latestPrescription.createdAt).toLocaleDateString('en-GB')}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <Link
                            href={`/patients/${patient.id}/prescription/new`}
                            className="bg-slate-50 rounded-2xl p-4 border border-slate-200 border-dashed flex items-center gap-4 hover:bg-white transition-all group"
                        >
                            <div className="h-10 w-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                <Plus className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Create Eye Rx</p>
                                <p className="text-sm font-bold text-slate-500 italic">No records found</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                    )}
                </div>

                {/* Right Column: Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Clinical Timeline
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                                {unifiedTimeline.length} Record{unifiedTimeline.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    <div className="timeline-line space-y-8 pl-8">
                        {unifiedTimeline.length === 0 ? (
                            <div className="glass-card rounded-2xl p-12 text-center">
                                <div className="h-12 w-12 bg-slate-50 rounded-full mx-auto flex items-center justify-center mb-4">
                                    <Calendar className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-slate-500 text-sm">No clinical history found for this patient.</p>
                            </div>
                        ) : (
                            unifiedTimeline.map((item: any) => (
                                <div key={item.id + item.type} className="relative">
                                    {/* Timeline Marker */}
                                    <div className={`absolute -left-8 top-1.5 h-4 w-4 rounded-full border-2 border-white shadow-lg ${item.type === 'invoice' ? 'bg-blue-500 shadow-blue-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}></div>

                                    {item.type === 'invoice' ? (
                                        <div className="glass-card rounded-2xl p-5 hover:border-blue-200 transition-all group overflow-hidden">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">
                                                        {new Date(item.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                        <span className="ml-2 text-blue-500 font-black">@ {new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                    </p>
                                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                        <Receipt className="h-4 w-4 text-blue-500" />
                                                        {item.invoice_no}
                                                    </h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-extrabold text-slate-900">₹{item.total_amount.toFixed(2)}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Dr. {item.doctor_name}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <Stethoscope className="h-3 w-3" /> Rx Details / Diagnosis
                                                </p>
                                                <p className="text-sm text-slate-700 font-medium mb-3 italic">
                                                    &quot;{item.reason || 'General Consultation'}&quot;
                                                </p>

                                                <div className="space-y-2">
                                                    {item.items?.map((invItem: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 font-medium">{invItem.medicine?.name} × {invItem.quantity}</span>
                                                            <span className="text-slate-900 font-bold">₹{invItem.total_price.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-end items-center gap-4">
                                                {prescriptions.find((rx: any) =>
                                                    new Date(rx.createdAt).toDateString() === new Date(item.createdAt).toDateString()
                                                ) && (
                                                        <Link
                                                            href={`/prescriptions/print?id=${prescriptions.find((rx: any) =>
                                                                new Date(rx.createdAt).toDateString() === new Date(item.createdAt).toDateString()
                                                            )?.id}`}
                                                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group/rx"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            View Eye Rx
                                                            <ChevronRight className="h-3 w-3 group-hover/rx:translate-x-0.5 transition-transform" />
                                                        </Link>
                                                    )}
                                                <Link
                                                    href={`/invoices/print?id=${item.id}`}
                                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/link"
                                                >
                                                    View Full Bill
                                                    <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="glass-card rounded-2xl p-5 hover:border-emerald-200 transition-all group overflow-hidden border-l-4 border-l-emerald-500">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">
                                                        {new Date(item.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                        <span className="ml-2 text-emerald-600 font-black">@ {new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                    </p>
                                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                        <Eye className="h-4 w-4 text-emerald-500" />
                                                        Standalone Eye Checkup
                                                    </h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-extrabold text-slate-900">₹{(item.total_amount || 0).toFixed(2)}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{item.doctor_name}</p>
                                                </div>
                                            </div>

                                            <div className="bg-emerald-50/30 rounded-xl p-3 border border-emerald-100/50">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-blue-600 uppercase">RE (Right Eye)</p>
                                                        <p className="text-xs font-bold text-slate-700">DV: {item.re_dv_sph || 'Plano'}</p>
                                                        <p className="text-xs font-medium text-slate-500 italic">Lens: {item.lens_type || 'Unspecified'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-emerald-600 uppercase">LE (Left Eye)</p>
                                                        <p className="text-xs font-bold text-slate-700">DV: {item.le_dv_sph || 'Plano'}</p>
                                                        <p className="text-xs font-medium text-slate-500 italic">PD: {item.pd || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-end">
                                                <Link
                                                    href={`/prescriptions/print?id=${item.id}`}
                                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group/rx"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    View Eye Prescription
                                                    <ChevronRight className="h-3 w-3 group-rx:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
