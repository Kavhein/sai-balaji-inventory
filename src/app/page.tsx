export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Plus, Trash2, Power, Search, Package, AlertCircle, Stethoscope } from "lucide-react";
import { addMedicine, deleteMedicine, toggleStock, getDailyStats } from "./actions";
import { getSession } from "@/lib/auth";
import EditStockButton from "./StockEditor";
import { Medicine } from "@/lib/types";

// Redundant repair button removed after successful DB fix

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;
  const { daily, dailyPatientCount } = await getDailyStats();
  const role = await getSession();

  const medicines = await prisma.medicine.findMany({
    where: {
      is_available: true,
      ...(query ? { name: { contains: query, mode: 'insensitive' as const } } : {})
    },
    orderBy: {
      name: "asc",
    },
  }) as unknown as Medicine[];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>

        <div className="relative p-6 md:p-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-100 uppercase tracking-wider text-[10px] md:text-xs font-bold">
              <Stethoscope className="h-3 w-3 md:h-4 md:w-4" />
              <span>Sai Balaji Clinic</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Inventory Dashboard</h1>
            <p className="text-blue-100 max-w-lg mb-4 text-xs md:text-base opacity-90">
              Real-time stock management. Monitor availability, track prices, and update inventory instantly.
            </p>
            <div className="flex gap-2 items-center">
            </div>
          </div>
          {/* Visual Decorative Element for "Image" feel */}
          <div className="hidden lg:block opacity-90 mix-blend-overlay">
            <Package className="h-32 w-32 text-white/20" />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">

          {/* Search Bar */}
          <div className="bg-white p-2 pl-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <Search className="h-5 w-5 text-slate-400" />
            <form className="flex-1">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search medicines by name..."
                className="w-full py-3 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
              />
            </form>
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-500">
              <span className="font-bold text-slate-900">{medicines.length}</span> Results
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Medicine & Category</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {medicines.map((med: Medicine) => (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-base">{med.name}</div>
                      <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100">
                        {med.category === 'Eye' ? '👁️ Eye Care' : med.category === 'Diabetes' ? '🩸 Diabetes Care' : '🏥 General Care'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <form action={toggleStock.bind(null, med.id, med.is_available)}>
                          <button
                            type="submit"
                            className={`group/btn relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${med.is_available
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
                              : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
                              }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${med.is_available ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                            {med.is_available ? "In Stock" : "Out of Stock"}
                            <span className="text-slate-400 pl-1 border-l border-slate-200 ml-1">
                              {med.stock_quantity} units
                            </span>
                          </button>
                        </form>
                        <EditStockButton id={med.id} initialStock={med.stock_quantity} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        ₹{med.unit_price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <form action={deleteMedicine.bind(null, med.id)}>
                        <button type="submit" className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {medicines.length === 0 && (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-slate-900 font-medium mb-1">No medicines found</h3>
                <p className="text-sm">Try adjusting your search or add a new item.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Add Medicine Form */}
        <div className="w-full xl:w-96 shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Add Medicine</h2>
                <p className="text-xs text-slate-500">New inventory entry</p>
              </div>
            </div>

            <form action={addMedicine} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine Name</label>
                <input name="name" placeholder="e.g. Paracetamol" required className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500/20 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                <select name="category" className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500/20 transition-all">
                  <option value="General">🏥 General Care</option>
                  <option value="Eye">👁️ Eye Care</option>
                  <option value="Diabetes">🩸 Diabetes Care</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Initial Stock</label>
                  <input name="stock_quantity" type="number" placeholder="0" required className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price (₹)</label>
                  <input name="unit_price" type="number" step="0.01" placeholder="0.00" required className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500/20 transition-all" />
                </div>
              </div>

              <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]">
                Add to Inventory
              </button>

              <p className="text-center text-[10px] text-slate-400">
                * Item will be instantly available in the list.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
