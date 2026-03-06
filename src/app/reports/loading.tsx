import { BarChart3, TrendingUp, DollarSign, Calendar, Sparkles } from "lucide-react";

export default function ReportsLoading() {
    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-24 animate-pulse">
            {/* 1. Header Skeleton */}
            <div className="relative p-10 rounded-[40px] bg-slate-900 overflow-hidden shadow-2xl h-[300px] flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="space-y-6 relative z-10">
                    <div className="h-6 w-48 bg-white/10 rounded-full"></div>
                    <div className="h-16 w-3/4 bg-white/20 rounded-2xl"></div>
                    <div className="h-4 w-1/2 bg-white/10 rounded-full"></div>
                </div>
            </div>

            {/* 2. Key Metrics Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-48">
                        <div className="flex justify-between">
                            <div className="h-12 w-12 bg-slate-100 rounded-2xl"></div>
                            <div className="h-6 w-16 bg-slate-50 rounded-full"></div>
                        </div>
                        <div className="mt-8 space-y-3">
                            <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
                            <div className="h-8 w-32 bg-slate-200 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 3. Interactive Chart Skeleton */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-12">
                        <div className="space-y-3">
                            <div className="h-8 w-48 bg-slate-200 rounded-xl"></div>
                            <div className="h-3 w-64 bg-slate-100 rounded-full"></div>
                        </div>
                        <div className="h-12 w-64 bg-slate-100 rounded-2xl"></div>
                    </div>
                    <div className="flex-1 flex items-end justify-between gap-4 mt-8 px-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="flex-1 bg-slate-50 rounded-2xl" style={{ height: `${20 + Math.random() * 60}%` }}></div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-6 px-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="h-2 w-8 bg-slate-100 rounded-full"></div>
                        ))}
                    </div>
                </div>

                {/* 4. Strategic Feedback Skeleton */}
                <div className="bg-slate-900 p-10 rounded-[40px] h-[500px]">
                    <div className="h-8 w-48 bg-white/20 rounded-xl mb-10"></div>
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-6 w-6 bg-white/10 rounded-lg"></div>
                                    <div className="h-3 w-24 bg-white/10 rounded-full mt-1.5"></div>
                                </div>
                                <div className="h-4 w-full bg-white/10 rounded-lg"></div>
                                <div className="h-3 w-3/4 bg-white/5 rounded-lg italic"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
