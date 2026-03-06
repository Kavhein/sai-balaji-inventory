"use client";

import { useTransition } from "react";
import { addEyePrescription } from "@/app/actions";
import { useToast } from "@/components/ui/toast";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Save, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function NewEyePrescriptionPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [isPending, startTransition] = useTransition();

    const patientId = parseInt(params.id as string);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const payload = {
            patient_id: patientId,
            re_dv_sph: formData.get("re_dv_sph"),
            re_dv_cyl: formData.get("re_dv_cyl"),
            re_dv_axis: formData.get("re_dv_axis"),
            re_dv_va: formData.get("re_dv_va"),
            re_nv_sph: formData.get("re_nv_sph"),
            re_nv_cyl: formData.get("re_nv_cyl"),
            re_nv_axis: formData.get("re_nv_axis"),
            re_nv_va: formData.get("re_nv_va"),
            le_dv_sph: formData.get("le_dv_sph"),
            le_dv_cyl: formData.get("le_dv_cyl"),
            le_dv_axis: formData.get("le_dv_axis"),
            le_dv_va: formData.get("le_dv_va"),
            le_nv_sph: formData.get("le_nv_sph"),
            le_nv_cyl: formData.get("le_nv_cyl"),
            le_nv_axis: formData.get("le_nv_axis"),
            le_nv_va: formData.get("le_nv_va"),
            pd: formData.get("pd"),
            lens_type: formData.get("lens_type"),
            notes: formData.get("notes"),
            doctor_name: formData.get("doctor_name"),
        };

        startTransition(async () => {
            const res = await addEyePrescription(payload);
            if (res.success) {
                showToast("Eye prescription saved successfully.", "success");
                router.push(`/patients/${patientId}`);
            } else {
                showToast(res.error || "Failed to save.", "error");
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/patients/${patientId}`}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Eye className="h-6 w-6 text-blue-600" />
                            New Eye Prescription
                        </h1>
                        <p className="text-sm text-slate-500">Record optometry details for Patient #{patientId}</p>
                    </div>
                </div>
            </div>

            <div className="premium-card p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/40">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Doctor Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Examining Doctor</label>
                            <input
                                type="text"
                                name="doctor_name"
                                required
                                placeholder="Dr. Name"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lens Type Recommendation</label>
                            <select
                                name="lens_type"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                            >
                                <option value="">Select Lens Type</option>
                                <option value="Single Vision">Single Vision</option>
                                <option value="Bifocal">Bifocal</option>
                                <option value="Progressive">Progressive</option>
                                <option value="Cylindrical">Cylindrical</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-blue-900 rounded-xl overflow-hidden mt-8 mb-8">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-blue-900 bg-white p-3 font-bold text-blue-900 uppercase"></th>
                                    <th colSpan={4} className="border border-blue-900 bg-white p-3 font-bold text-blue-900 uppercase tracking-widest text-sm">RE</th>
                                    <th colSpan={4} className="border border-blue-900 bg-white p-3 font-bold text-blue-900 uppercase tracking-widest text-sm">LE</th>
                                </tr>
                                <tr className="text-xs font-bold text-blue-900 bg-white uppercase">
                                    <th className="border border-blue-900 p-2"></th>
                                    {/* RE columns */}
                                    <th className="border border-blue-900 p-2">SPH</th>
                                    <th className="border border-blue-900 p-2">CYL</th>
                                    <th className="border border-blue-900 p-2">AXIS</th>
                                    <th className="border border-blue-900 p-2">V/A</th>
                                    {/* LE columns */}
                                    <th className="border border-blue-900 p-2">SPH</th>
                                    <th className="border border-blue-900 p-2">CYL</th>
                                    <th className="border border-blue-900 p-2">AXIS</th>
                                    <th className="border border-blue-900 p-2">V/A</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {/* DV Row */}
                                <tr>
                                    <td className="border border-blue-900 p-3 font-bold text-blue-900 text-sm">DV</td>
                                    {/* RE DV */}
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_dv_sph" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_dv_cyl" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_dv_axis" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_dv_va" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    {/* LE DV */}
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_dv_sph" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_dv_cyl" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_dv_axis" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_dv_va" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                </tr>
                                {/* NV Row */}
                                <tr>
                                    <td className="border border-blue-900 p-3 font-bold text-blue-900 text-sm">NV</td>
                                    {/* RE NV */}
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_nv_sph" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_nv_cyl" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_nv_axis" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="re_nv_va" className="w-full h-full p-3 text-center outline-none focus:bg-blue-50 transition-colors font-medium text-blue-900" /></td>
                                    {/* LE NV */}
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_nv_sph" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_nv_cyl" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_nv_axis" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                    <td className="border border-blue-900 p-0"><input type="text" name="le_nv_va" className="w-full h-full p-3 text-center outline-none focus:emerald-50 transition-colors font-medium text-emerald-900" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pupillary Distance (PD)</label>
                            <input
                                type="text"
                                name="pd"
                                placeholder="e.g. 62mm"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Additional Notes</label>
                            <input
                                type="text"
                                name="notes"
                                placeholder="Any special instructions..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" />
                            {isPending ? "Saving..." : "Save Prescription"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
