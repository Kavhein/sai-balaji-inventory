"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, searchPatient } from "../actions";
import { Plus, Trash2, Save, ShoppingBag, Search } from "lucide-react";
import { Medicine } from "@/lib/types";

interface PatientFormItem {
    tempId: number;
    medicineId: string;
    qty: number | string;
}

export default function NewPatientForm({ medicines }: { medicines: Medicine[] }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [patientName, setPatientName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [address, setAddress] = useState("");
    const [age, setAge] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [doctorName, setDoctorName] = useState("Dr. Renuka Duraisamy");
    const [customDate, setCustomDate] = useState("");

    // Medicine Rows
    const [items, setItems] = useState<PatientFormItem[]>([
        { tempId: Date.now(), medicineId: "", qty: 1 }
    ]);
    const [isFound, setIsFound] = useState(false);


    const handleMobileLookup = async (mobile: string) => {
        if (mobile.length >= 10) {
            const patient = await searchPatient(mobile);
            if (patient) {
                setPatientName(patient.name);
                setAddress(patient.address || "");
                setIsFound(true);
            } else {
                setIsFound(false);
            }
        }
    };

    const addRow = () => {
        setItems([...items, { tempId: Date.now(), medicineId: "", qty: 1 }]);
    };

    const removeRow = (tempId: number) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.tempId !== tempId));
        } else {
            setItems([{ tempId: Date.now(), medicineId: "", qty: 1 }]);
        }
    };

    const updateRow = (tempId: number, field: keyof PatientFormItem, value: string | number) => {
        setItems(items.map(item => item.tempId === tempId ? { ...item, [field]: value } : item));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare items for invoice
            const invoiceItems = items.map(item => {
                const med = medicines.find(m => m.id === parseInt(String(item.medicineId)));
                if (!med) return null;
                return {
                    id: med.id,
                    qty: parseInt(String(item.qty)),
                    rate: med.unit_price,
                    gst: med.gst_rate,
                    name: med.name
                };
            }).filter((item): item is { id: number; qty: number; rate: number; gst: number; name: string } => item !== null);

            if (invoiceItems.length === 0 && items.length > 0 && items[0].medicineId !== "") {
                alert("Invalid items selected");
                setLoading(false);
                return;
            }

            // Calls createInvoice which handles Patient creation AND billing
            const result = await createInvoice({
                patientName,
                mobileNo,
                address,
                age,
                doctorName: doctorName,
                customDate,
                reason: diagnosis || "General Checkup",
                items: invoiceItems
            });

            if (result.success) {
                // Reset
                setPatientName(""); setMobileNo(""); setAddress(""); setAge(""); setDiagnosis(""); setCustomDate("");
                setItems([{ tempId: Date.now(), medicineId: "", qty: 1 }]);

                alert("Patient Checkup/Purchase Recorded!");

                if (invoiceItems.length > 0) {
                    router.push(`/invoices/print?id=${result.invoiceId}`);
                } else {
                    window.location.reload();
                }
            } else {
                alert("Error saving: " + (result.error || "Unknown error"));
            }
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Unknown error";
            alert("Error saving: " + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-600" /> Patient Info & Purchase
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile No</label>
                    <div className="relative">
                        <input
                            value={mobileNo}
                            onChange={e => {
                                setMobileNo(e.target.value);
                                if (e.target.value.length === 10) handleMobileLookup(e.target.value);
                            }}
                            onBlur={() => handleMobileLookup(mobileNo)}
                            required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10" placeholder="Required"
                        />
                        {isFound && <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />}
                    </div>
                </div>
                {!isFound ? (
                    <>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Patient Name</label>
                                <input
                                    value={patientName} onChange={e => setPatientName(e.target.value)}
                                    required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Required"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                                <input
                                    type="number"
                                    value={age} onChange={e => setAge(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center" placeholder="Yrs"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                            <textarea
                                value={address} onChange={e => setAddress(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-16" placeholder="Optional"
                            />
                        </div>
                    </>
                ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                            ✓ {patientName}
                        </p>
                        <p className="text-xs text-emerald-600 truncate">{address || "No address stored"}</p>
                        <button
                            type="button"
                            onClick={() => { setIsFound(false); setPatientName(""); setMobileNo(""); setAddress(""); setCustomDate(""); }}
                            className="text-[10px] text-emerald-700 underline mt-1"
                        >
                            Not this patient? Clear search.
                        </button>
                    </div>
                )}


                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Date (Optional)</label>
                    <input
                        type="date"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Prescribing Doctor</label>
                    <select
                        value={doctorName} onChange={e => setDoctorName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="Dr. Renuka Duraisamy">Dr. Renuka Duraisamy</option>
                        <option value="Dr. Aditya Narayan">Dr. Aditya Narayan</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Diagnosis / Reason</label>
                    <input
                        value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Fever, Checkup..."
                    />
                </div>

                {/* Medicine Slots */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Medicines / Products</label>
                    {items.map((item, idx) => (
                        <div key={item.tempId} className="flex gap-2 items-center">
                            <select
                                value={item.medicineId}
                                onChange={e => updateRow(item.tempId, 'medicineId', e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none w-0 truncate"
                            >
                                <option value="">Select Item...</option>
                                {medicines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} (₹{m.unit_price})</option>
                                ))}
                            </select>
                            <input
                                type="number" min="1"
                                value={item.qty}
                                onChange={e => updateRow(item.tempId, 'qty', e.target.value)}
                                className="w-12 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-center text-sm outline-none shrink-0"
                                placeholder="Qty"
                            />
                            <button type="button" onClick={() => removeRow(item.tempId)} className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addRow} className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:underline">
                        <Plus className="h-3 w-3" /> Add Another Item
                    </button>
                </div>


                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                >
                    {loading ? "Saving..." : <><Save className="h-5 w-5" /> Save Record</>}
                </button>
            </form>
        </div>
    );
}
