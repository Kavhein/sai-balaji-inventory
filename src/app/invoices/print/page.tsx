export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { numberToWords } from "@/lib/utils";
import InvoiceActions from "@/components/invoice-actions";
import { Invoice } from "@/lib/types";

export default async function PrintInvoicePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    const params = await searchParams;
    const id = params.id ? parseInt(params.id) : null;

    if (!id) {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Invalid Invoice ID provided.
            </div>
        );
    }

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            patient: true,
            items: {
                include: {
                    medicine: true
                }
            }
        }
    }) as unknown as Invoice;

    if (!invoice) {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Invoice not found.
            </div>
        );
    }

    // Helper to format date
    const formatDate = (date: Date) => {
        try {
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).replace(/ /g, '/');
        } catch (e) {
            return date.toDateString();
        }
    };

    // Helper to format currency
    const formatCurrency = (amount: number) => amount.toFixed(2);

    return (
        <div className="bg-white text-black font-sans p-8 max-w-[210mm] mx-auto min-h-screen text-[10px] leading-tight">
            {/* Header / Branding */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-4">
                    {/* Logo Placeholder */}
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-12 flex items-center justify-center mb-1">
                            <img src="/eye-logo-final.svg" alt="Sai Balaji Eye Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="font-bold text-lg text-blue-900 uppercase">Sai Balaji</h1>
                        <h2 className="text-xs tracking-widest text-slate-500 uppercase">Diabetic & Eye Clinic</h2>
                    </div>
                </div>

                <div className="text-right">
                    <h1 className="font-bold text-lg uppercase text-slate-800">SAI BALAJI DIABETIC & EYE CARE</h1>
                    <p>No. 22/49, Melpatti Ponnappa Mudali Street,</p>
                    <p>Vyasarpadi, Chennai - 600 039</p>
                    <p>Contact: +91 7708537537 / +91 90255 24109</p>
                </div>
            </div>

            <div className="text-center font-bold text-base uppercase mb-4 tracking-wider underline">Bill</div>

            {/* Patient & Invoice Info Grid */}
            <div className="border border-slate-400 grid grid-cols-2 mb-2">
                {/* Left Col */}
                <div>
                    <div className="grid grid-cols-[80px_1fr] border-b border-slate-300">
                        <div className="p-1 border-r border-slate-300 font-semibold">Bill No.</div>
                        <div className="p-1">{invoice.invoice_no}</div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] border-b border-slate-300">
                        <div className="p-1 border-r border-slate-300 font-semibold">Patient Name</div>
                        <div className="p-1 font-bold flex justify-between items-center">
                            <span>{invoice.patient_name}</span>
                            {invoice.age && <span className="text-[9px] font-normal mr-2">Age: {invoice.age}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] min-h-[40px]">
                        <div className="p-1 border-r border-slate-300 font-semibold">Address</div>
                        <div className="p-1">{invoice.address || "N/A"}</div>
                    </div>
                </div>
                {/* Right Col */}
                <div className="border-l border-slate-400">
                    <div className="grid grid-cols-[80px_1fr] border-b border-slate-300">
                        <div className="p-1 border-r border-slate-300 font-semibold">Bill Date</div>
                        <div className="p-1">
                            {formatDate(invoice.createdAt)} {invoice.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                        </div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] border-b border-slate-300">
                        <div className="p-1 border-r border-slate-300 font-semibold">Mobile No</div>
                        <div className="p-1">{invoice.mobile_no}</div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] min-h-[40px]">
                        <div className="p-1 border-r border-slate-300 font-semibold">Doctor Name</div>
                        <div className="p-1 font-bold">{invoice.doctor_name}</div>
                    </div>
                </div>
            </div>

            {/* Diagnosis/Reason Row */}
            {invoice.reason && (
                <div className="border border-slate-400 mb-4 grid grid-cols-[80px_1fr]">
                    <div className="p-1 border-r border-slate-300 font-semibold bg-slate-50">Diagnosis</div>
                    <div className="p-1 font-medium">{invoice.reason}</div>
                </div>
            )}

            {/* Items Table */}
            <table className="w-full border border-slate-400 mb-2">
                <thead className="bg-slate-200">
                    <tr className="border-b border-slate-400">
                        <th className="border-r border-slate-400 p-1 w-8">Sr.No</th>
                        <th className="border-r border-slate-400 p-1 text-left w-40">Item Name</th>
                        <th className="border-r border-slate-400 p-1 w-12 text-center">Qty</th>
                        <th className="border-r border-slate-400 p-1 w-12 text-right">Price</th>
                        <th className="p-1 w-16 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item, index: number) => (
                        <tr key={item.id} className="border-b border-slate-300">
                            <td className="border-r border-slate-300 p-1 text-center">{index + 1}</td>
                            <td className="border-r border-slate-300 p-1 font-semibold">{item.medicine?.name}</td>
                            <td className="border-r border-slate-300 p-1 text-center">{item.quantity}</td>
                            <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="p-1 text-right font-bold">{formatCurrency(item.total_price)}</td>
                        </tr>
                    ))}
                    {/* Empty Rows Filler */}
                    {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="border-b border-slate-200 h-6">
                            <td className="border-r border-slate-300"></td>
                            <td className="border-r border-slate-300"></td>
                            <td className="border-r border-slate-300"></td>
                            <td className="border-r border-slate-300"></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary */}
            <div className="flex border border-slate-400">
                <div className="flex-1 p-3 flex flex-col justify-center">
                    <div className="font-bold italic">
                        Amount in words: Rupees {numberToWords(invoice.total_amount)}
                    </div>
                </div>
                <div className="w-48 border-l border-slate-400">
                    <div className="flex justify-between p-2 bg-slate-100 font-bold text-sm">
                        <span>Total Amount</span>
                        <span>₹{formatCurrency(invoice.total_amount)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-12">
                <div className="text-center">
                    <p className="font-bold">For SAI BALAJI EYE & DIABETIC CLINIC</p>
                    <p className="mt-8 border-t border-black px-4 pt-1 font-semibold">Authorized Signatory</p>
                </div>
            </div>

            {/* Action Buttons - hidden when printing */}
            <InvoiceActions />

        </div>
    );
}
