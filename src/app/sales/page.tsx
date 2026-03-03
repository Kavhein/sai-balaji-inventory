import { prisma } from "@/lib/prisma";
import { recordSale } from "../actions";
import { ShoppingCart, Pill } from "lucide-react";

export default async function SalesPage() {
    const medicines = await prisma.medicine.findMany({
        where: { is_available: true, stock_quantity: { gt: 0 } },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-xl mx-auto space-y-8 mt-4">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Record Sale</h1>
                <p className="text-slate-500">Transactions automatically update global inventory.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
                <form action={recordSale} className="space-y-6">

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-slate-400" />
                            Select Medicine
                        </label>
                        <div className="relative">
                            <select name="medicine_id" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900">
                                <option value="">-- Choose Medicine --</option>
                                {medicines.map((med) => (
                                    <option key={med.id} value={med.id}>
                                        {med.name} (Qty: {med.stock_quantity}) — ₹{med.unit_price}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Quantity Sold</label>
                        <input
                            name="quantity_sold"
                            type="number"
                            min="1"
                            defaultValue="1"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2">
                        <span>Confirm Transaction</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </button>

                    <p className="text-center text-xs text-slate-400 pt-2">
                        Secure transaction • Immediate stock deduction
                    </p>
                </form>
            </div>
        </div>
    );
}
