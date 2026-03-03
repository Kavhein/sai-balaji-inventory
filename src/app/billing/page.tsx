"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, getMedicines, getFrequentMedicines, searchPatient } from "../actions";
import { Plus, Trash2, Save, User, Stethoscope, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Medicine } from "@/lib/types";

interface BillingItem {
    id: number;
    tempId: number;
    name: string;
    qty: number;
    rate: number;
    amount: number;
    gst: number;
}

interface FrequentMed {
    id: number;
    name: string;
    count: number;
    price: number;
}

export default function BillingPage() {
    const { showToast } = useToast();
    // Invoice State
    const [patientName, setPatientName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [address, setAddress] = useState("");
    const [doctorName, setDoctorName] = useState("Dr. Renuka Duraisamy");
    const [reason, setReason] = useState("");
    const [items, setItems] = useState<BillingItem[]>([
        { id: 0, tempId: Date.now(), name: "", qty: 1, rate: 0, amount: 0, gst: 5 }
    ]);
    const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
    const [frequentMeds, setFrequentMeds] = useState<FrequentMed[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Fetch Medicines on Load
    useEffect(() => {
        getMedicines().then(data => setAvailableMedicines(data));
    }, []);

    const handlePatientLookup = async (mobile: string) => {
        if (mobile.length >= 10) {
            const p = await searchPatient(mobile);
            if (p) {
                setPatientName(p.name);
                setAddress(p.address || "");
                const freq = await getFrequentMedicines(p.id);
                setFrequentMeds(freq);
                showToast(`Returning Patient: ${p.name}`, "info");
            } else {
                setFrequentMeds([]);
            }
        }
    };

    const addFrequentMed = (med: FrequentMed) => {
        const existingEmptyIdx = items.findIndex(i => i.id === 0 && i.name === "");
        const newItem = {
            id: med.id,
            tempId: Date.now(),
            name: med.name,
            qty: 1,
            rate: med.price,
            amount: med.price,
            gst: 5
        };

        if (existingEmptyIdx !== -1) {
            const newItems = [...items];
            newItems[existingEmptyIdx] = newItem;
            setItems(newItems);
        } else {
            setItems([...items, newItem]);
        }
        showToast(`Added ${med.name}`, "success");
    };

    // Calculations
    const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
    const grandTotal = subtotal;

    const addItem = () => {
        setItems([...items, { id: 0, tempId: Date.now(), name: "", qty: 1, rate: 0, amount: 0, gst: 5 }]);
    };

    const removeItem = (tempId: number) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.tempId !== tempId));
        } else {
            setItems([{ id: 0, tempId: Date.now(), name: "", qty: 1, rate: 0, amount: 0, gst: 5 }]);
        }
    };

    const updateItem = (tempId: number, field: keyof BillingItem, value: string | number) => {
        setItems(items.map(item => {
            if (item.tempId === tempId) {
                const updated = { ...item, [field]: value };
                if (field === 'name') {
                    const match = availableMedicines.find(m => m.name === value);
                    if (match) {
                        updated.id = match.id;
                        updated.rate = match.unit_price;
                        updated.amount = updated.qty * updated.rate;
                    } else {
                        updated.id = 0;
                    }
                }
                if (field === 'qty' || field === 'rate') {
                    updated.amount = (Number(updated.qty) || 0) * (Number(updated.rate) || 0);
                }
                return updated;
            }
            return item;
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        if (!patientName) {
            showToast("Please enter patient name", "error");
            setLoading(false);
            return;
        }
        if (items.some(i => i.id === 0 || i.qty <= 0)) {
            showToast("Invalid medicines or quantity", "error");
            setLoading(false);
            return;
        }

        try {
            const data = {
                patientName, mobileNo, address, doctorName, reason,
                items: items.map(i => ({ id: i.id, qty: i.qty, rate: i.rate, gst: 5, name: i.name }))
            };
            const result = await createInvoice(data);
            if (result.success) {
                showToast(`Invoice saved! #${result.invoiceNo}`, "success");
                router.push(`/invoices/print?id=${result.invoiceId}`);
            }
        } catch (error) {
            showToast("Failed to save invoice", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    Billing Terminal
                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-[10px] text-white rounded-full uppercase tracking-tighter">Live</span>
                </h1>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Invoice Status: <span className="text-blue-600">Drafting</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Patient Details (Glass Card) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 rounded-3xl space-y-6 border border-white/50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-500" /> Patient Information
                            </h3>
                            {frequentMeds.length > 0 && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    <Zap className="h-3 w-3" /> Recurring Patient
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mobile Number</label>
                                <input
                                    value={mobileNo}
                                    onChange={(e) => {
                                        setMobileNo(e.target.value);
                                        handlePatientLookup(e.target.value);
                                    }}
                                    className="w-full bg-white/50 border-2 border-slate-100 focus:border-blue-500/50 rounded-2xl px-4 py-3 text-sm transition-all focus:shadow-lg focus:shadow-blue-500/10 outline-none font-bold"
                                    placeholder="Enter mobile..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                <input
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full bg-white/50 border-2 border-slate-100 focus:border-blue-500/50 rounded-2xl px-4 py-3 text-sm transition-all outline-none font-bold"
                                    placeholder="Patient name..."
                                />
                            </div>
                        </div>

                        {/* Smart Quick-Add Badges */}
                        {frequentMeds.length > 0 && (
                            <div className="pt-4 border-t border-slate-100/50">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                    <Zap className="h-3 w-3" /> Quick Add (Commonly Purchased)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {frequentMeds.map(med => (
                                        <button
                                            key={med.id}
                                            onClick={() => addFrequentMed(med)}
                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl text-xs font-bold transition-all border border-blue-100 flex items-center gap-2 active:scale-95"
                                        >
                                            <Plus className="h-3 w-3" /> {med.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table (Glass Card) */}
                    <div className="glass-card rounded-3xl overflow-hidden border border-white/50">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">Medicine Item</th>
                                    <th className="px-6 py-4 text-center">Qty</th>
                                    <th className="px-6 py-4 text-right">Unit Price</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50/50">
                                {items.map((item, index) => (
                                    <tr key={item.tempId} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300 font-bold">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <input
                                                className="w-full bg-transparent font-bold text-slate-700 outline-none placeholder:font-normal"
                                                placeholder="Type to search medicine..."
                                                value={item.name}
                                                list={`meds-${item.tempId}`}
                                                onChange={(e) => updateItem(item.tempId, 'name', e.target.value)}
                                            />
                                            <datalist id={`meds-${item.tempId}`}>
                                                {availableMedicines.map(med => (
                                                    <option key={med.id} value={med.name}>
                                                        {med.stock_quantity <= 10 ? '⚠️ LOW STOCK' : '✅ AVAILABLE'} — Stock: {med.stock_quantity}
                                                    </option>
                                                ))}
                                            </datalist>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                className="w-16 mx-auto bg-blue-50/50 rounded-lg px-2 py-1 text-center font-black text-blue-600 outline-none"
                                                value={item.qty}
                                                onChange={(e) => updateItem(item.tempId, 'qty', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500">₹{(item.rate || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">₹{(item.amount || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => removeItem(item.tempId)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            onClick={addItem}
                            className="w-full py-4 text-xs font-black text-blue-500 hover:text-blue-700 hover:bg-blue-50/50 transition-all border-t border-slate-50 uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Another Item
                        </button>
                    </div>
                </div>

                {/* Right: Checkout Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-3xl border border-white/50 sticky top-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Payment Summary</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Subtotal</span>
                                <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">GST (0.00%)</span>
                                <span className="text-slate-900 font-bold">₹0.00</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                                    <p className="text-3xl font-black text-blue-700">₹{grandTotal.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                                    <p className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Verify Record
                                    </p>
                                    <p className="text-[10px] text-amber-700 leading-tight">By saving, stock will be deducted and a formal invoice will be generated for {patientName || 'this patient'}.</p>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                                >
                                    {loading ? 'Processing...' : <><Save className="h-5 w-5" /> Generate Invoice</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border border-white/50 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase">Auto-Save Active</p>
                                <p className="text-[10px] text-slate-400 font-medium">Synced with Cloud Database</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
