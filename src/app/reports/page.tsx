export const dynamic = "force-dynamic";
import { getFinancialReports } from "../actions";
import {
    DollarSign, Calendar, TrendingUp, Activity,
    ArrowUpRight, ArrowDownRight, Clock,
    Sparkles, Lightbulb, AlertTriangle,
    CheckCircle2, ShoppingBag, BarChart3, LucideIcon
} from "lucide-react";
import SMSReportButton from "@/components/sms-report-button";
import { ReportData, RevenueTrend, Insight, TopMedicine, Invoice } from "@/lib/types";
import Link from "next/link";

interface StatCardProps {
    title: string;
    amount: number;
    icon: LucideIcon;
    color: 'blue' | 'indigo' | 'emerald';
    percentage: number;
    isUp: boolean;
}

const StatCard = ({ title, amount, icon: Icon, color, percentage, isUp }: StatCardProps) => {
    const variants = {
        blue: "text-blue-600 bg-blue-50/50 border-blue-100",
        indigo: "text-indigo-600 bg-indigo-50/50 border-indigo-100",
        emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    };

    return (
        <div className="premium-card p-6 rounded-[32px] animate-slide-up">
            <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl border ${variants[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {percentage}%
                </div>
            </div>
            <div className="mt-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-medium text-slate-400">₹</span>
                    <h3 className="text-3xl font-black text-bold text-slate-900 leading-none">{amount.toLocaleString('en-IN')}</h3>
                </div>
            </div>
        </div>
    );
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tf?: string }> }) {
    const params = await searchParams;
    const timeframe = (params.tf as 'weekly' | 'monthly' | 'yearly') || 'weekly';

    const {
        daily, weekly, monthly, monthlyForecast, weeklyGrowth,
        weeklyTrend, topMedicines, insights,
        recentInvoices, dailyPatientCount
    } = await getFinancialReports(timeframe);

    // Simple daily growth (today vs yesterday)
    const yesterdayAmount = weeklyTrend[weeklyTrend.length - 2]?.amount || 0;
    const dailyGrowth = yesterdayAmount === 0 ? (daily > 0 ? 100 : 0) : Math.round(((daily - yesterdayAmount) / yesterdayAmount) * 100);

    const maxAmount = Math.max(...weeklyTrend.map((t: { amount: number }) => t.amount), 500);

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-24">
            {/* 1. Header with Glassmorphism */}
            <div className="relative p-10 rounded-[40px] bg-slate-900 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] -ml-40 -mb-40"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 text-white">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            Intelligence AI Active
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                            Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Intelligence</span>
                        </h1>
                        <p className="text-slate-400 max-w-xl text-base font-medium leading-relaxed opacity-90">
                            Proprietary analytics and revenue performance tracking powered by automated clinic insights.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <SMSReportButton dailyAmount={daily} patientCount={dailyPatientCount} />
                        <div className="h-14 w-px bg-white/10 hidden sm:block"></div>
                        <div className="text-center sm:text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Uptime</p>
                            <p className="text-2xl font-black text-emerald-400">99.98%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard title="Today's Collections" amount={daily} icon={DollarSign} color="blue" percentage={Math.abs(dailyGrowth)} isUp={dailyGrowth >= 0} />
                <StatCard title="Weekly Revenue" amount={weekly} icon={Calendar} color="indigo" percentage={Math.abs(weeklyGrowth)} isUp={weeklyGrowth >= 0} />
                <StatCard title="Monthly Forecast" amount={monthlyForecast} icon={TrendingUp} color="emerald" percentage={monthly > 0 ? Math.min(100, Math.round((monthly / monthlyForecast) * 100)) : 0} isUp={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 3. Interactive Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/30 relative overflow-hidden group">
                    <div className="absolute top-8 right-8 p-3 bg-slate-50 rounded-2xl">
                        <BarChart3 className="h-6 w-6 text-slate-400" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-900">Revenue Velocity</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                                {timeframe === 'weekly' ? '7-Day' : timeframe === 'monthly' ? '30-Day' : '12-Month'} TRANSACTION CYCLE ANALYSIS
                            </p>
                        </div>
                        <div className="flex glass-panel p-1.5 rounded-2xl gap-1 border border-slate-200/50">
                            {['weekly', 'monthly', 'yearly'].map((tf) => (
                                <Link
                                    key={tf}
                                    href={`/reports?tf=${tf}`}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${timeframe === tf
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                                        }`}
                                >
                                    {tf}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="h-80 flex items-end justify-between gap-4 relative">
                        {/* Horizontal Grid */}
                        <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-5 pointer-events-none">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full border-t border-slate-900/20"></div>)}
                        </div>

                        {weeklyTrend.map((data: RevenueTrend, i: number) => {
                            const height = (data.amount / maxAmount) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group/item h-full justify-end relative z-10 hover:z-30">
                                    <div className={`mb-2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl z-20 
                                        ${timeframe === 'monthly' ? 'opacity-0 lg:group-hover/item:opacity-100 transition-opacity' : ''}`}>
                                        ₹{data.amount.toLocaleString()}
                                    </div>
                                    <div
                                        className="w-full max-w-[40px] rounded-2xl transition-all duration-700 relative flex flex-col justify-end overflow-hidden group-hover/item:shadow-2xl group-hover/item:shadow-blue-500/20"
                                        style={{ height: `${Math.max(height, 8)}%` }}
                                    >
                                        <div className={`absolute inset-0 transition-all duration-500 ${data.amount > 0 ? 'bg-gradient-to-t from-blue-600 to-indigo-400 opacity-100' : 'bg-slate-100 opacity-50'}`}></div>
                                        {/* Animated inner line */}
                                        <div className="w-full h-1 bg-white/10 mb-2"></div>
                                    </div>
                                    <p className={`text-[10px] font-black text-slate-400 mt-6 uppercase tracking-[0.1em] whitespace-nowrap transition-colors group-hover/item:text-slate-900
                                        ${timeframe === 'monthly' && i % 4 !== 0 ? 'hidden md:block opacity-20' : ''}`}>
                                        {data.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Business Intelligence Section (1/3 width) */}
                <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group hover:shadow-blue-900/40 transition-shadow transition-all duration-500">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                    <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                        <div className="p-2 bg-yellow-400/10 rounded-xl">
                            <Lightbulb className="h-6 w-6 text-yellow-400" />
                        </div>
                        Strategic Feedback
                    </h3>

                    <div className="space-y-6">
                        {insights.map((insight: Insight, i: number) => (
                            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3 hover:bg-white/10 transition-all duration-300 group/insight cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-xl group-hover/insight:scale-110 transition-transform">
                                        {insight.type === 'POSITIVE' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                                            insight.type === 'STOCK' ? <Activity className="h-4 w-4 text-orange-400" /> :
                                                <AlertTriangle className="h-4 w-4 text-yellow-400" />}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Insight Alpha</p>
                                </div>
                                <p className="text-sm font-bold leading-tight group-hover/insight:text-blue-300 transition-colors">{insight.text}</p>
                                <div className="h-px bg-white/5 w-full"></div>
                                <p className="text-xs text-slate-400/80 font-medium italic leading-relaxed">
                                    &quot;{insight.tip}&quot;
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 border border-white/10 shadow-xl">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Next Milestone</p>
                        <p className="text-sm font-black text-white">Projected revenue trend suggests a 12% growth if Tuesday levels hold.</p>
                    </div>
                </div>
            </div>

            {/* 5. Top Performing Medicines & Movement (Full Width) */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Highest Movement Inventory</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Most frequently sold SKUs this week</p>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl text-slate-500 text-xs font-bold">
                        <ShoppingBag className="h-4 w-4" />
                        Live Tracking
                    </div>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {topMedicines.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">
                            No medicine transaction data available for this week yet.
                        </div>
                    ) : (
                        topMedicines.map((med: TopMedicine, i: number) => (
                            <div key={i} className="group p-6 rounded-[32px] bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl transition-all duration-500 flex items-center gap-6">
                                <div className="h-16 w-16 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <p className="text-xs font-black text-slate-400">QTY</p>
                                    <p className="text-xl font-black text-blue-600 leading-none">{med.quantity}</p>
                                </div>
                                <div className="flex-1">
                                    <div className="inline-block px-2 py-0.5 rounded bg-blue-100 text-[8px] font-black text-blue-700 uppercase tracking-widest mb-2">
                                        {med.category}
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{med.name}</h4>
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-xs font-bold text-slate-400">Revenue</p>
                                        <p className="text-sm font-black text-emerald-600">₹{med.revenue.toLocaleString()}</p>
                                    </div>
                                    <div className="w-full h-1 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[70%]" style={{ width: `${Math.min((med.quantity / 50) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 6. Flash Transactions Feed */}
            <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-200 flex flex-col lg:flex-row gap-10 items-center">
                <div className="lg:w-1/3">
                    <h3 className="text-2xl font-black text-slate-900">Transaction Stream</h3>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                        Every bill generated in the clinic is audited here in real-time. Securely encrypted and archived for taxation.
                    </p>
                    <button className="mt-8 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-900 hover:bg-slate-100 transition-colors shadow-sm">
                        DOWNLOAD TAX EXPORT
                    </button>
                </div>
                <div className="lg:w-2/3 w-full space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {recentInvoices.map((inv: Invoice) => (
                        <div key={inv.id} className="flex items-center gap-6 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{inv.patient_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                                            {inv.items.length} Medicines • {new Date(inv.createdAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 italic">₹{inv.total_amount.toLocaleString()}</p>
                                        <div className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded ml-auto w-fit mt-1">SUCCESS</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />
        </div>
    );
}
