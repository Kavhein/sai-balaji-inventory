"use client";

import { Trash2 } from "lucide-react";
import { deletePatient } from "../actions";
import { useState } from "react";

export default function DeletePatientButton({ id }: { id: number }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this patient? This will NOT delete their previous invoices, but they will be disconnected from this patient profile.")) {
            setLoading(true);
            try {
                await deletePatient(id);
            } catch (err) {
                alert("Failed to delete patient");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete Patient"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
