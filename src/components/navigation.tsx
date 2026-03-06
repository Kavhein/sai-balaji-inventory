"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Pill, LogOut, Shield, Eye, UserPlus, ClipboardList } from "lucide-react";
import { logout } from "@/lib/auth";

export function Sidebar({ role, isMobile }: { role?: string | null, isMobile?: boolean }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";
    const isPrintPage = pathname.startsWith("/invoices/print");
    if (isLoginPage || isPrintPage) return null;

    if (isMobile) {
        return (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <Link href="/" className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/" ? "text-blue-700" : "text-gray-400"}`}>
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
                </Link>
                <Link href="/patients" className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/patients" ? "text-blue-700" : "text-gray-400"}`}>
                    <UserPlus className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Add</span>
                </Link>
                <Link href="/patient-reports" className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/patient-reports" ? "text-blue-700" : "text-gray-400"}`}>
                    <ClipboardList className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">History</span>
                </Link>
                <Link href="/prescriptions" className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/prescriptions" ? "text-blue-700" : "text-gray-400"}`}>
                    <Eye className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Rx List</span>
                </Link>
                {role === "admin" && (
                    <>
                        <Link href="/reports" className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/reports" ? "text-blue-700" : "text-gray-400"}`}>
                            <BarChart3 className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Reports</span>
                        </Link>
                        <Link href="/logs" className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/logs" ? "text-blue-700" : "text-gray-400"}`}>
                            <Shield className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Logs</span>
                        </Link>
                    </>
                )}
            </div>
        );
    }

    return (
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2"><Pill className="h-6 w-6" /> Sai Balaji</h1>
                <p className="text-[8px] text-gray-500 mt-1 uppercase font-black tracking-widest opacity-50">Eye & Diabetes Clinic</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                <Link href="/" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                    <LayoutDashboard className="h-5 w-5" /> Inventory
                </Link>
                <Link href="/patients" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/patients" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                    <UserPlus className="h-5 w-5" /> Patients
                </Link>
                <Link href="/patient-reports" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/patient-reports" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                    <ClipboardList className="h-5 w-5" /> Patient Reports
                </Link>
                <Link href="/prescriptions" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/prescriptions" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                    <Eye className="h-5 w-5" /> Prescription Reports
                </Link>
                {role === "admin" && (
                    <>
                        <Link href="/reports" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/reports" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                            <BarChart3 className="h-5 w-5" /> Financial Reports
                        </Link>
                        <Link href="/logs" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/logs" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                            <Shield className="h-5 w-5" /> System Logs
                        </Link>
                    </>
                )}
            </nav>
            <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                <div className="flex-1">
                    <button onClick={() => logout()} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"><LogOut className="h-3 w-3" /> Logout System</button>
                </div>
            </div>
        </aside>
    );
}

export function MobileHeader({ role }: { role?: string | null }) {
    const pathname = usePathname();
    if (pathname === "/login" || pathname.startsWith("/invoices/print")) return null;
    return (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
            <h1 className="text-lg font-bold text-blue-700 flex items-center gap-2"><Pill className="h-5 w-5" /> Sai Balaji</h1>
            <button onClick={() => logout()} className="p-2 text-rose-600"><LogOut className="h-5 w-5" /></button>
        </div>
    );
}
