export const dynamic = "force-dynamic";
import { UserPlus, ShoppingBag, Eye } from "lucide-react";
import { getMedicines } from "../actions";
import NewPatientForm from "./new-patient-form";
import EyePrescriptionForm from "./eye-prescription-form";
import { Medicine } from "@/lib/types";

export default async function AddPatientFormPage() {
    let medicines: Medicine[] = [];
    try {
        medicines = await getMedicines();
    } catch (e) {
        console.error("Failed to fetch medicines", e);
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-3">
                    <UserPlus className="h-10 w-10 text-blue-600" />
                    Patient Intake Hub
                </h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
                    Separate portals for Medicine Sales & Eye Examinations
                </p>
            </div>

            {/* Quick Stats / Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-blue-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <h2 className="text-xl font-black mb-2 relative z-10 flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" /> 1. Purchase Portal
                    </h2>
                    <p className="text-blue-100 text-xs leading-relaxed relative z-10 font-medium">
                        Use the emerald form to record patient checkups and medicine bills.
                    </p>
                </div>
                <div className="md:col-span-1 bg-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <h2 className="text-xl font-black mb-2 relative z-10 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-400" /> 2. Eye Clinic Portal
                    </h2>
                    <p className="text-slate-300 text-xs leading-relaxed relative z-10 font-medium">
                        Use the sapphire form to record vision measurements and PD details.
                    </p>
                </div>
                <div className="md:col-span-1 bg-amber-50 border border-amber-200 rounded-3xl p-6">
                    <h3 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                        💡 Smart Search
                    </h3>
                    <p className="text-amber-700 text-[11px] leading-tight font-medium">
                        Entering a <span className="font-black underline">Mobile Number</span> in either form will automatically pull up existing patient data.
                    </p>
                </div>
            </div>

            {/* The Forms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <NewPatientForm medicines={medicines} />
                <EyePrescriptionForm />
            </div>
        </div>
    );
}
