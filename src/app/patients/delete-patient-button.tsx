"use client";

import { Trash2 } from "lucide-react";
import { deletePatient } from "../actions";
import { useState } from "react";

export default function DeletePatientButton({ id, isAdmin }: { id: number; isAdmin?: boolean }) {
    if (!isAdmin) return null;
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        const answer = window.prompt("Are you sure you want to delete this patient? This will ALSO PERMANENTLY DELETE all their previous invoices, prescriptions, and associated records.\n\nEnter password to confirm:");

        if (answer === null) return;

        if (answer !== "RENU30") {
            alert("Wrong password!");
            return;
        }

        setLoading(true);
        try {
            await deletePatient(id);
        } catch (err) {
            alert("Failed to delete patient");
            console.error(err);
        } finally {
            setLoading(false);
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
