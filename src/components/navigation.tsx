"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Pill, LogOut, Shield, Eye, UserPlus, ClipboardList, Menu, X } from "lucide-react";
import { logout } from "@/lib/auth";

function NavLinks({ role, pathname, onNavigate }: { role?: string | null, pathname: string, onNavigate?: () => void }) {
    return (
        <>
            <Link onClick={onNavigate} href="/" className={`flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                <LayoutDashboard className="h-5 w-5" /> Inventory
            </Link>
            <Link onClick={onNavigate} href="/patients" className={`flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/patients" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                <UserPlus className="h-5 w-5" /> Patients
            </Link>
            <Link onClick={onNavigate} href="/patient-reports" className={`flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/patient-reports" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                <ClipboardList className="h-5 w-5" /> Patient Reports
            </Link>
            <Link onClick={onNavigate} href="/prescriptions" className={`flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/prescriptions" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                <Eye className="h-5 w-5" /> Prescription Reports
            </Link>
            {role === "admin" && (
                <>
                    <Link onClick={onNavigate} href="/reports" className={`flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/reports" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                        <BarChart3 className="h-5 w-5" /> Financial Reports
                    </Link>
                    <Link onClick={onNavigate} href="/logs" className={`flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/logs" ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 hover:bg-slate-50"}`}>
                        <Shield className="h-5 w-5" /> System Logs
                    </Link>
                </>
            )}
        </>
    );
}

export function Sidebar({ role }: { role?: string | null }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";
    const isPrintPage = pathname.startsWith("/invoices/print") || pathname.startsWith("/prescriptions/print");
    if (isLoginPage || isPrintPage) return null;

    return (
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 print:hidden">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2"><Pill className="h-6 w-6" /> Sai Balaji</h1>
                <p className="text-[8px] text-gray-500 mt-1 uppercase font-black tracking-widest opacity-50">Eye & Diabetes Clinic</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                <NavLinks role={role} pathname={pathname} />
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
    const [isOpen, setIsOpen] = useState(false);

    if (pathname === "/login" || pathname.startsWith("/invoices/print") || pathname.startsWith("/prescriptions/print")) return null;

    return (
        <>
            <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0 print:hidden">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsOpen(true)} className="p-1 -ml-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors active:scale-95">
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-bold text-blue-700 flex items-center gap-2"><Pill className="h-5 w-5" /> Sai Balaji</h1>
                </div>
                <button onClick={() => logout()} className="p-2 text-rose-600 active:scale-95"><LogOut className="h-5 w-5" /></button>
            </div>

            {/* Mobile Drawer Overlay */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity print:hidden" onClick={() => setIsOpen(false)}>
                    <div
                        className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out"
                        onClick={(e) => e.stopPropagation()} // prevent clicking inside from closing it
                    >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
                            <div>
                                <h1 className="text-lg font-bold text-blue-700 flex items-center gap-2"><Pill className="h-5 w-5" /> Sai Balaji</h1>
                                <p className="text-[8px] text-gray-500 mt-1 uppercase font-black tracking-widest opacity-50">Eye & Diabetes Clinic</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-full active:scale-95 transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Drawer Links */}
                        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                            <NavLinks role={role} pathname={pathname} onNavigate={() => setIsOpen(false)} />
                        </nav>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-gray-100">
                            <button onClick={() => logout()} className="w-full flex justify-center items-center gap-2 px-3 py-3 text-xs font-black uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors active:scale-95">
                                <LogOut className="h-4 w-4" /> Logout System
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
