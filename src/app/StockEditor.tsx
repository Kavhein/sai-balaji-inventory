"use client";

import { useState } from "react";
import { Edit3, Check, X } from "lucide-react";
import { updateMedicineStock } from "./actions";
import { useToast } from "@/components/ui/toast";

export default function EditStockButton({ id, initialStock }: { id: number, initialStock: number }) {
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [quantity, setQuantity] = useState(initialStock);
    const [loading, setLoading] = useState(false);

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
                <Edit3 className="h-3 w-3" />
                Update Stock
            </button>
        );
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateMedicineStock(id, quantity);
            showToast("Stock updated successfully!", "success");
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            showToast("Failed to update stock", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
            <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                autoFocus
            />
            <button
                onClick={handleSave}
                disabled={loading}
                className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
                <Check className="h-3.5 w-3.5" />
            </button>
            <button
                onClick={() => { setIsEditing(false); setQuantity(initialStock); }}
                className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
