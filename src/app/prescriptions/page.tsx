export const dynamic = "force-dynamic";
import { getPrescriptions } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import DeletePrescriptionButton from "./delete-prescription-button";

export default async function PrescriptionsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const params = await searchParams;
    const query = (params?.q || "").toLowerCase();
    const allPrescriptions = await getPrescriptions();
    const role = await getSession();
    const isAdmin = role === 'admin' || role === 'doctor';

    // Filter by name or mobile if query exists
    const prescriptions = query
        ? allPrescriptions.filter((rx: any) =>
            rx.patient.name.toLowerCase().includes(query) ||
            rx.patient.mobile_no.includes(query)
        )
        : allPrescriptions;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Eye className="h-8 w-8 text-blue-600" />
                        Prescription Reports
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Database of all clinical eye measurements recorded</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <form className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input name="q" defaultValue={query} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Search by name or mobile..." />
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from(prescriptions.reduce((acc: Map<number, any>, rx: any) => {
                        if (!acc.has(rx.patient_id)) {
                            acc.set(rx.patient_id, {
                                patient: rx.patient,
                                patient_id: rx.patient_id,
                                prescriptions: []
                            });
                        }
                        acc.get(rx.patient_id).prescriptions.push(rx);
                        return acc;
                    }, new Map()).values()).map((group: any) => (
                        <div key={group.patient_id} className="premium-card bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition-all group">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <Link href={`/patients/${group.patient_id}`}>
                                            <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{group.patient.name}</h3>
                                        </Link>
                                        <p className="font-bold text-blue-600 text-xs mt-1">{group.patient.mobile_no || 'Walk-in'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-10 w-10 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-black text-xs border border-blue-100 italic">{group.prescriptions.length}</div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Visits</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {group.prescriptions.map((rx: any) => (
                                        <div key={rx.id} className="relative pl-4 border-l-2 border-slate-100 py-1 font-medium">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                    {new Date(rx.createdAt).toLocaleDateString('en-GB')}
                                                </p>
                                                <p className="text-xs font-black text-slate-900">₹{(rx.total_amount || 0).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/prescriptions/print?id=${rx.id}`}
                                                    className="text-[9px] font-black uppercase text-blue-600 hover:underline tracking-widest flex items-center gap-1"
                                                >
                                                    VIEW BILL ↗
                                                </Link>
                                                <DeletePrescriptionButton id={rx.id} isAdmin={isAdmin} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <Link
                                    href={`/patients/${group.patient_id}`}
                                    className="bg-slate-900 text-white w-full py-3 rounded-2xl font-bold text-center text-xs uppercase tracking-widest hover:bg-slate-800 transition-all block"
                                >
                                    Profile
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {prescriptions.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center animate-in fade-in zoom-in duration-500">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Eye className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">No prescriptions found</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Try a different search or record a new examination from the Patients hub.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
