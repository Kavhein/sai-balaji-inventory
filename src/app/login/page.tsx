import { login } from "@/lib/auth";
import { Lock, ShieldCheck } from "lucide-react";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; role?: string }> }) {
    const params = await searchParams;
    const error = params?.error === "true";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <ShieldCheck className="text-blue-500 h-10 w-10 opacity-5" />
                </div>

                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6">
                        <Lock className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Private Access</h1>
                    <p className="text-slate-500 text-sm font-medium mt-2">Sai Balaji Clinic Management System</p>
                </div>

                <form action={login} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Role</label>
                        <select
                            name="role"
                            defaultValue={params?.role || "admin"}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="admin">Doctor</option>
                            <option value="sister">Sister</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold text-center border border-rose-100 animate-pulse">
                            Incorrect password for {params?.role || 'user'}.
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-[0.98] tracking-widest uppercase text-xs"
                    >
                        Secure Login
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Authorized Devices Only • encrypted session</p>
                </div>
            </div>
        </div>
    );
}
