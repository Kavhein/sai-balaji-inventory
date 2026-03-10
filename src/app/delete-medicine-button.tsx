"use client";

import { Trash2 } from "lucide-react";
import { deleteMedicine } from "./actions";
import { useState } from "react";

export default function DeleteMedicineButton({ id }: { id: number }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();

        const answer = window.prompt("Are you sure you want to delete this medicine? These records are password protected.\n\nEnter password to confirm:");

        // Return if they hit cancel
        if (answer === null) return;

        if (answer !== "RENU30") {
            alert("Wrong password!");
            return;
        }

        setLoading(true);
        try {
            await deleteMedicine(id);
        } catch (err) {
            alert("Failed to delete medicine");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            title="Delete Medicine"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
