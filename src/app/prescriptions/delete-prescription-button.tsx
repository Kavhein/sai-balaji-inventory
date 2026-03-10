"use client";

import { Trash2 } from "lucide-react";
import { deleteEyePrescription } from "../actions";
import { useState } from "react";

export default function DeletePrescriptionButton({ id, isAdmin }: { id: number; isAdmin?: boolean }) {
    if (!isAdmin) return null;
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const answer = window.prompt("Are you sure you want to delete this eye prescription record? These records are password protected.\n\nEnter password to confirm:");

        if (answer === null) return;

        if (answer !== "RENU30") {
            alert("Wrong password!");
            return;
        }

        setLoading(true);
        try {
            const result = await deleteEyePrescription(id);
            if (!result.success) {
                alert("Error: " + result.error);
            }
        } catch (err) {
            alert("Failed to delete prescription");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
            title="Delete Prescription"
        >
            <Trash2 className="h-3 w-3" />
        </button>
    );
}
