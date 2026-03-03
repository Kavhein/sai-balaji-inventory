"use client";

import { Download, Printer } from "lucide-react";

export default function InvoiceActions() {
    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        // Use browser's print dialog with PDF option
        // This is the most reliable cross-browser method
        window.print();
    };

    return (
        <div className="flex gap-3 print:hidden fixed bottom-6 left-6 z-50">
            <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
                <Download className="h-4 w-4" />
                Download PDF
            </button>
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-bold text-sm rounded-lg shadow-lg hover:bg-slate-800 transition-all active:scale-95"
            >
                <Printer className="h-4 w-4" />
                Print
            </button>
        </div>
    );
}
