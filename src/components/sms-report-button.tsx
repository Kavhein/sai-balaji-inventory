"use client";

import { MessageSquareText } from "lucide-react";

export default function SMSReportButton({ dailyAmount, patientCount }: { dailyAmount: number, patientCount: number }) {
    const sendSMS = () => {
        const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
        const message = `Sai Balaji Clinic Report\n` +
            `Date: ${date}\n` +
            `Patients: ${patientCount}\n` +
            `Revenue: INR ${dailyAmount.toLocaleString('en-IN')}`;

        const encodedMessage = encodeURIComponent(message);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const smsUrl = isIOS ? `sms:?&body=${encodedMessage}` : `sms:?body=${encodedMessage}`;

        window.location.href = smsUrl;
    };

    return (
        <button
            onClick={sendSMS}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-200 group"
        >
            <MessageSquareText className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            Daily SMS Report
        </button>
    );
}
