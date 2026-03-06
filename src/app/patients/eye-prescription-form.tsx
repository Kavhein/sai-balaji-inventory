"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addEyePrescription, searchPatient } from "../actions";
import { Save, Search, Eye, Clipboard } from "lucide-react";

export default function EyePrescriptionForm() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [patientName, setPatientName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [address, setAddress] = useState("");
    const [age, setAge] = useState("");
    const [doctorName, setDoctorName] = useState("Dr. Renuka Duraisamy");
    const [customDate, setCustomDate] = useState("");
    const [isFound, setIsFound] = useState(false);
    const [patientId, setPatientId] = useState<number | null>(null);

    // Eye Prescription State
    const [pres, setPres] = useState({
        re_dv_sph: "", re_dv_cyl: "", re_dv_axis: "", re_dv_va: "",
        re_nv_sph: "", re_nv_cyl: "", re_nv_axis: "", re_nv_va: "",
        le_dv_sph: "", le_dv_cyl: "", le_dv_axis: "", le_dv_va: "",
        le_nv_sph: "", le_nv_cyl: "", le_nv_axis: "", le_nv_va: "",
        lens_type: "", pd: "", notes: "", total_amount: ""
    });

    const handleMobileLookup = async (mobile: string) => {
        if (mobile.length >= 3) {
            const patient = await searchPatient(mobile);
            if (patient) {
                setPatientName(patient.name);
                setAddress(patient.address || "");
                setPatientId(patient.id);
                setIsFound(true);
            } else {
                setPatientId(null);
                setIsFound(false);
            }
        }
    };

    const handlePresChange = (field: string, value: string) => {
        setPres(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const totalAmount = parseFloat(pres.total_amount || "0");
        console.log("📝 Submitting Eye Rx...", { patientId, patientName, mobileNo, totalAmount });

        try {
            const result = await addEyePrescription({
                patient_id: patientId,
                patient_name: patientName,
                mobile_no: mobileNo,
                address,
                age,
                doctor_name: doctorName,
                customDate: customDate || null,
                ...pres,
                total_amount: totalAmount.toString() // Ensure it's passed as a clean string
            });
            console.log("📡 Action Result:", result);

            if (result.success) {
                // Clear form state
                setPatientName(""); setMobileNo(""); setAddress(""); setAge(""); setCustomDate(""); setIsFound(false); setPatientId(null);
                setPres({
                    re_dv_sph: "", re_dv_cyl: "", re_dv_axis: "", re_dv_va: "",
                    re_nv_sph: "", re_nv_cyl: "", re_nv_axis: "", re_nv_va: "",
                    le_dv_sph: "", le_dv_cyl: "", le_dv_axis: "", le_dv_va: "",
                    le_nv_sph: "", le_nv_cyl: "", le_nv_axis: "", le_nv_va: "",
                    lens_type: "", pd: "", notes: "", total_amount: ""
                });

                alert("Eye Checkup & Prescription Recorded Successfully!");

                // Redirect to the print view (the "demo") just like invoices
                router.push(`/prescriptions/print?id=${result.id}`);
            } else {
                alert("Error: " + result.error);
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" /> Standalone Eye Checkup
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile No</label>
                    <div className="relative">
                        <input
                            value={mobileNo}
                            onChange={e => {
                                setMobileNo(e.target.value);
                                if (e.target.value.length >= 3) handleMobileLookup(e.target.value);
                            }}
                            required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Required"
                        />
                        {isFound && <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />}
                    </div>
                </div>

                {!isFound ? (
                    <>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Patient Name</label>
                                <input value={patientName} onChange={e => setPatientName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Required" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                                <input value={age} onChange={e => setAge(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none text-center" placeholder="Yrs" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                            <textarea
                                value={address} onChange={e => setAddress(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none h-16 focus:ring-1 focus:ring-blue-400" placeholder="Optional"
                            />
                        </div>
                    </>
                ) : (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-sm font-bold text-blue-800 flex items-center gap-2">✓ {patientName}</p>
                        <p className="text-xs text-blue-600 truncate">{address || "No address stored"}</p>
                        <button type="button" onClick={() => { setIsFound(false); setPatientId(null); setPatientName(""); setMobileNo(""); setAddress(""); setCustomDate(""); }} className="text-[10px] text-blue-700 underline mt-1">Clear search gold records.</button>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Date (Optional)</label>
                    <input
                        type="date"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Doctor</label>
                    <select value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="Dr. Renuka Duraisamy">Dr. Renuka Duraisamy</option>
                        <option value="Dr. Aditya Narayan">Dr. Aditya Narayan</option>
                    </select>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Save className="h-3 w-3" /> Eye Measurements
                    </label>
                    <div className="overflow-x-auto rounded-xl border border-slate-300">
                        <table className="w-full text-[10px] text-center bg-white border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-900 font-black uppercase tracking-widest border-b border-slate-300">
                                    <th className="p-2 border-r border-slate-300 w-12">Vision</th>
                                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-slate-100/50">Right Eye (RE)</th>
                                    <th colSpan={4} className="p-2 bg-slate-100/50">Left Eye (LE)</th>
                                </tr>
                                <tr className="bg-white text-slate-800 font-bold border-b border-slate-300">
                                    <th className="p-1 border-r border-slate-300">Type</th>
                                    <th className="p-1 border-r border-slate-200">SPH</th>
                                    <th className="p-1 border-r border-slate-200">CYL</th>
                                    <th className="p-1 border-r border-slate-200">AXIS</th>
                                    <th className="p-1 border-r border-slate-300">VA</th>
                                    <th className="p-1 border-r border-slate-200">SPH</th>
                                    <th className="p-1 border-r border-slate-200">CYL</th>
                                    <th className="p-1 border-r border-slate-200">AXIS</th>
                                    <th className="p-1">VA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 text-slate-900 font-medium">
                                <tr className="hover:bg-blue-50/10 transition-colors">
                                    <td className="p-2 font-black bg-slate-50 border-r border-slate-300 text-slate-900">DV</td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_dv_sph} onChange={e => handlePresChange('re_dv_sph', e.target.value)} placeholder="+" /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_dv_cyl} onChange={e => handlePresChange('re_dv_cyl', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_dv_axis} onChange={e => handlePresChange('re_dv_axis', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-300"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_dv_va} onChange={e => handlePresChange('re_dv_va', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_dv_sph} onChange={e => handlePresChange('le_dv_sph', e.target.value)} placeholder="+" /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_dv_cyl} onChange={e => handlePresChange('le_dv_cyl', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_dv_axis} onChange={e => handlePresChange('le_dv_axis', e.target.value)} /></td>
                                    <td className="p-1"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_dv_va} onChange={e => handlePresChange('le_dv_va', e.target.value)} /></td>
                                </tr>
                                <tr className="hover:bg-blue-50/10 transition-colors">
                                    <td className="p-2 font-black bg-slate-50 border-r border-slate-300 text-slate-900">NV</td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_nv_sph} onChange={e => handlePresChange('re_nv_sph', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_nv_cyl} onChange={e => handlePresChange('re_nv_cyl', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_nv_axis} onChange={e => handlePresChange('re_nv_axis', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-300"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.re_nv_va} onChange={e => handlePresChange('re_nv_va', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_nv_sph} onChange={e => handlePresChange('le_nv_sph', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_nv_cyl} onChange={e => handlePresChange('le_nv_cyl', e.target.value)} /></td>
                                    <td className="p-1 border-r border-slate-200"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_nv_axis} onChange={e => handlePresChange('le_nv_axis', e.target.value)} /></td>
                                    <td className="p-1"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-900" value={pres.le_nv_va} onChange={e => handlePresChange('le_nv_va', e.target.value)} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                            <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Lens Type</label>
                            <input className="w-full bg-slate-50 border border-blue-100 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-400" placeholder="e.g. Progressive" value={pres.lens_type} onChange={e => handlePresChange('lens_type', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">PD (Pupillary Dist)</label>
                            <input className="w-full bg-slate-50 border border-blue-100 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-400" placeholder="e.g. 64" value={pres.pd} onChange={e => handlePresChange('pd', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Additional Notes</label>
                            <textarea className="w-full bg-slate-50 border border-blue-100 rounded-lg px-3 py-2 text-xs outline-none h-12 focus:ring-1 focus:ring-blue-400" placeholder="Tint, coating, etc." value={pres.notes} onChange={e => handlePresChange('notes', e.target.value)} />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1">Total Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-emerald-50 border border-emerald-200 rounded-lg pl-7 pr-3 py-3 text-sm font-black text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner"
                                    placeholder="Required"
                                    value={pres.total_amount}
                                    onChange={e => handlePresChange('total_amount', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                >
                    {loading ? "Saving..." : <><Save className="h-5 w-5" /> SAVE PRESCRIPTION</>}
                </button>
            </form>
        </div>
    );
}
