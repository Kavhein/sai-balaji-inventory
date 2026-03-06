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

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tf?: string; y?: string; m?: string }> }) {
    const params = await searchParams;
    const timeframe = (params.tf as 'daily' | 'monthly' | 'yearly') || 'daily';
    const yearVal = params.y ? parseInt(params.y) : undefined;
    const monthVal = params.m ? parseInt(params.m) : undefined;

    const data = await getFinancialReports(timeframe, yearVal, monthVal);
    const {
        daily, weekly, monthly, monthlyForecast, weeklyGrowth,
        weeklyTrend, topMedicines, insights,
        recentInvoices, dailyPatientCount
    } = data;

    // Simple daily growth (today vs yesterday)
    const yesterdayAmount = timeframe === 'daily' ? (weeklyTrend[weeklyTrend.length - 2]?.amount || 0) : daily;
    const dailyGrowth = yesterdayAmount === 0 ? (daily > 0 ? 100 : 0) : Math.round(((daily - yesterdayAmount) / yesterdayAmount) * 100);

    const maxAmount = Math.max(...weeklyTrend.map((t: { amount: number }) => t.amount), 500);

    const timeframeLabels = {
        daily: yearVal && monthVal ? `DAILY REVENUE: ${new Date(yearVal, monthVal - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : '24-HOUR PERFORMANCE (TODAY)',
        monthly: yearVal ? `MONTHLY PERFORMANCE: YEAR ${yearVal}` : 'MONTHLY REVENUE TREND',
        yearly: 'FISCAL PERFORMANCE: 10-YEAR HISTORICAL'
    };

    // Helper to get drill-down link
    const getDrillDownLink = (item: RevenueTrend, index: number) => {
        if (timeframe === 'yearly') {
            return `/reports?tf=monthly&y=${item.label}`;
        }
        if (timeframe === 'monthly') {
            const yearStr = yearVal || new Date().getFullYear();
            return `/reports?tf=daily&y=${yearStr}&m=${index + 1}`;
        }
        return null;
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-24">
            {/* 1. Header with Advanced Glassmorphism */}
            <div className="relative p-10 md:p-14 rounded-[48px] bg-slate-900 border border-white/5 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.25em]">
                            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                            Velocity Business Cloud
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-[0.9] text-white">
                            Revenue <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white/70">Intelligence</span>
                        </h1>
                        <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed opacity-80">
                            Enterprise-grade fiscal analytics for Sai Balaji. Interactive drill-down depth enabled for historical audits.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <SMSReportButton dailyAmount={daily} patientCount={dailyPatientCount} />
                        <div className="hidden sm:block w-px h-16 bg-white/10 mx-2"></div>
                        <div className="bg-white/5 border border-white/10 rounded-[32px] px-8 py-5 flex items-center gap-6 backdrop-blur-md">
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">Availability</p>
                                <p className="text-2xl font-black text-emerald-400 tabular-nums">100%</p>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Latency</p>
                                <p className="text-2xl font-black text-blue-400 tabular-nums">4ms</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Enhanced Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard title="Session Collections" amount={daily} icon={DollarSign} color="blue" percentage={Math.abs(dailyGrowth)} isUp={dailyGrowth >= 0} />
                <StatCard title="Growth Capital" amount={monthly} icon={Calendar} color="indigo" percentage={Math.abs(monthlyForecast > 0 ? Math.round((monthly / monthlyForecast) * 100) : 0)} isUp={true} />
                <div className="premium-card p-6 rounded-[32px] bg-gradient-to-br from-emerald-600 to-teal-500 border-none text-white relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-4 rounded-2xl bg-white/20 border border-white/20">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                            Forecast Target
                        </div>
                    </div>
                    <div className="mt-8 relative z-10">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Growth Projection</p>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-medium text-white/70">₹</span>
                            <h3 className="text-4xl font-black tracking-tighter tabular-nums">{monthlyForecast.toLocaleString('en-IN')}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 3. Rebuilt Drill-Down Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.05)] relative group animate-slide-up">
                    {/* Background Detail */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-50/50 to-transparent pointer-events-none rounded-b-[48px]"></div>

                    {/* Chart Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-16 gap-8 relative z-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Velocity</h3>
                                {(yearVal || monthVal) && (
                                    <Link href="/reports?tf=yearly" className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300">
                                        <ArrowUpRight className="rotate-[-135deg] h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em]">
                                <Link href="/reports?tf=yearly" className={`${!yearVal && timeframe === 'yearly' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Historical</Link>
                                {yearVal && (
                                    <>
                                        <span className="text-slate-200">/</span>
                                        <Link href={`/reports?tf=monthly&y=${yearVal}`} className={`${yearVal && timeframe === 'monthly' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>{yearVal}</Link>
                                    </>
                                )}
                                {monthVal && (
                                    <>
                                        <span className="text-slate-200">/</span>
                                        <span className="text-blue-600 underline underline-offset-4 decoration-2">
                                            {new Date(2000, monthVal - 1).toLocaleDateString('en-US', { month: 'long' })}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Logic Toggle */}
                        <div className="flex glass-panel p-1.5 rounded-[24px] gap-1 border border-slate-200/40 shadow-sm overflow-x-auto scroller-hide bg-slate-50/50">
                            {['daily', 'monthly', 'yearly'].map((tf) => (
                                <Link
                                    key={tf}
                                    href={`/reports?tf=${tf}${tf === 'monthly' && yearVal ? `&y=${yearVal}` : ''}${tf === 'daily' && yearVal && monthVal ? `&y=${yearVal}&m=${monthVal}` : ''}`}
                                    className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${timeframe === tf
                                        ? 'bg-slate-900 text-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] scale-105'
                                        : 'text-slate-400 hover:text-slate-800 hover:bg-white transition-colors'
                                        }`}
                                >
                                    {tf}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Chart Core */}
                    <div className="relative overflow-x-auto pt-32 pb-10 no-scrollbar">
                        <div className={`h-[500px] flex items-end relative px-2 ${weeklyTrend.length > 15 ? 'min-w-[1400px] gap-2' : 'w-full gap-5'}`}>
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none pb-12">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="text-[8px] font-black text-slate-300 w-10 text-right tabular-nums">₹{Math.round(maxAmount * (1 - i / 4)).toLocaleString()}</span>
                                        <div className="flex-1 h-px bg-slate-100/50"></div>
                                    </div>
                                ))}
                            </div>

                            {weeklyTrend.map((item, i) => {
                                const height = (item.amount / maxAmount) * 100;
                                const drillLink = getDrillDownLink(item, i);

                                return (
                                    <div key={i} className="flex flex-col items-center group/item h-full justify-end relative z-30 flex-1 min-w-[32px]">
                                        {/* Exact Amount Label (Ultra High Visibility) */}
                                        <div
                                            className={`absolute z-50 pointer-events-none transition-all duration-700 flex justify-center w-full ${item.amount > 0 ? 'opacity-100' : 'opacity-0'}`}
                                            style={{ bottom: `calc(${Math.max(height, 5)}% + 14px)` }}
                                        >
                                            <div className="bg-slate-950 border-2 border-slate-800 px-3 py-1.5 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] flex items-center gap-1.5 backdrop-blur-xl">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                <p className="text-[10px] font-black text-white tabular-nums whitespace-nowrap leading-none tracking-tight">
                                                    ₹{Math.round(item.amount).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bar Link or Div */}
                                        {drillLink ? (
                                            <Link
                                                href={drillLink}
                                                className="w-full h-full flex flex-col justify-end group/bar relative z-20"
                                            >
                                                <div
                                                    className={`w-full max-w-[48px] mx-auto rounded-3xl transition-all duration-700 relative flex flex-col justify-end overflow-hidden shadow-sm group-hover/bar:shadow-2xl group-hover/bar:shadow-blue-500/30 group-hover/bar:-translate-y-2 group-hover/bar:scale-105 active:scale-95`}
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                >
                                                    <div className={`absolute inset-0 transition-colors duration-500 ${item.amount > 0 ? 'bg-gradient-to-t from-blue-700 via-blue-500 to-indigo-400' : 'bg-slate-100'}`}></div>
                                                    <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 blur-[1px]"></div>
                                                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div
                                                className={`w-full max-w-[48px] mx-auto rounded-3xl transition-all duration-1000 relative flex flex-col justify-end overflow-hidden shadow-sm group-hover/item:shadow-xl group-hover/item:-translate-y-1 relative z-20`}
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                            >
                                                <div className={`absolute inset-0 ${item.amount > 0 ? 'bg-gradient-to-t from-blue-700 via-blue-500 to-indigo-400' : 'bg-slate-100'}`}></div>
                                                <div className="absolute top-0 left-0 right-0 h-2 bg-white/10"></div>
                                            </div>
                                        )}

                                        {/* X-Axis Label */}
                                        <div className="h-12 flex items-center pt-4 relative z-10">
                                            <p className={`text-[9px] font-black text-slate-400 transition-colors duration-300 group-hover/item:text-slate-900 uppercase tracking-tighter whitespace-nowrap
                                                ${weeklyTrend.length > 20 && i % 4 !== 0 ? 'hidden md:block opacity-20' : ''}`}>
                                                {item.label}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 4. Strategic Feedback with Draggable Look */}
                <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>

                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                            Insights
                            <div className="p-2 bg-yellow-400/20 rounded-xl border border-yellow-400/20">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                            </div>
                        </h3>
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest">
                            High Priority
                        </div>
                    </div>

                    <div className="space-y-5 flex-1 relative z-10">
                        {insights.map((insight, i) => (
                            <div key={i} className="group/card p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all duration-300 flex flex-col gap-4 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform -translate-x-full group-hover/card:translate-x-0 transition-transform"></div>
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-slate-800 border border-white/10">
                                        {insight.type === 'POSITIVE' ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <Activity className="h-4 w-4 text-blue-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Intelligence node</p>
                                        <h5 className="text-sm font-black group-hover/card:text-blue-300 transition-colors leading-tight">{insight.text}</h5>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 font-medium italic leading-relaxed opacity-60 group-hover/card:opacity-100">
                                    {insight.tip}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-6 rounded-[32px] bg-gradient-to-r from-blue-700 to-indigo-700 relative z-10 shadow-lg glow">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Quantum Prediction</p>
                        <p className="text-sm font-black">Current patterns indicate stable weekly velocity of ₹145k.</p>
                    </div>
                </div>
            </div>

            {/* 5. Inventory Movement (High-End Table Alternative) */}
            <div className="bg-white rounded-[56px] border border-slate-100 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30">
                    <div className="space-y-1">
                        <h3 className="text-4xl font-black text-slate-900 leading-tight">Inventory Movement</h3>
                        <p className="text-slate-500 text-sm font-bold opacity-60">RANKED BY FISCAL VOLUME THIS CYCLE</p>
                    </div>
                    <div className="inline-flex items-center gap-4 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Live Flux</div>
                        <div className="px-6 py-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Audited</div>
                    </div>
                </div>

                <div className="p-12 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 -mt-6">
                    {topMedicines.map((med, i) => (
                        <div key={i} className="premium-card p-10 rounded-[40px] flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 translate-x-4 -translate-y-4">
                                <ShoppingBag className="h-32 w-32 text-slate-900" />
                            </div>
                            <div>
                                <div className="flex justify-between items-start mb-10">
                                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center font-black text-2xl group-hover:rotate-12 transition-transform">
                                        #{i + 1}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Weekly Units</p>
                                        <p className="text-3xl font-black text-slate-900 tabular-nums">{med.quantity}</p>
                                    </div>
                                </div>
                                <p className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-3">{med.category}</p>
                                <h4 className="text-2xl font-black text-slate-900 leading-[1.1] tracking-tight group-hover:text-blue-600 transition-colors uppercase">{med.name}</h4>
                            </div>
                            <div className="mt-12 flex items-center justify-between border-t border-slate-50 pt-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Yield</p>
                                    <p className="text-2xl font-black text-emerald-500 tabular-nums">₹{med.revenue.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-500 group-hover:rotate-45">
                                    <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. Unified Audit Stream */}
            <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-[64px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative bg-slate-50 p-12 md:p-16 rounded-[48px] border border-slate-200 overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-20">
                        <div className="lg:w-1/3">
                            <h3 className="text-5xl font-black text-slate-900 leading-[0.95] tracking-tighter uppercase">Audit <br />Stream</h3>
                            <p className="text-slate-500 text-lg mt-8 leading-relaxed font-medium">
                                Immutable transaction protocol secure audit of all clinical sessions.
                            </p>
                            <div className="mt-12 space-y-4">
                                <button className="w-full py-6 px-10 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl glass-panel border-white/10 group flex items-center justify-between">
                                    GENERATE TAX DUMP
                                    <ArrowUpRight className="h-4 w-4 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol V4.2.1 • Encrypted</p>
                            </div>
                        </div>

                        <div className="lg:w-2/3 space-y-4 max-h-[600px] overflow-y-auto pr-6 no-scrollbar">
                            {(recentInvoices as any[]).map((inv, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-[40px] border border-white hover:border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 flex items-center gap-8 group">
                                    <div className={`h-20 w-20 rounded-[32px] flex items-center justify-center transition-all duration-700 group-hover:rotate-3 group-hover:bg-slate-900 group-hover:text-white ${inv.type === 'CHECKUP' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        <BarChart3 className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="text-xl font-black text-slate-900 truncate uppercase tracking-tight">{inv.patient_name}</h5>
                                            <p className="text-2xl font-black text-slate-900 italic tabular-nums group-hover:scale-110 transition-transform origin-right">₹{inv.total_amount.toLocaleString()}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="px-3 py-1 bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-full">{inv.type}</span>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.item_summary}</span>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(inv.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, amount, icon: Icon, color, percentage, isUp }: any) {
    return (
        <div className="premium-card p-10 rounded-[40px] animate-slide-up bg-white border-slate-100 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-1000">
                <Icon className="h-24 w-24" />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                    <div className={`p-5 rounded-3xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'} border border-transparent`}>
                        <Icon className="h-8 w-8" />
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-black px-4 py-2 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {percentage}%
                    </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-medium text-slate-300">₹</span>
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none tabular-nums">{amount.toLocaleString('en-IN')}</h3>
                </div>
            </div>
        </div>
    );
}
