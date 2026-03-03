export const dynamic = "force-dynamic";

import { getActivityLogs } from "../actions";
import { ClipboardList, User, Shield, Info, Clock, AlertCircle } from "lucide-react";
import { ActivityLog } from "@/lib/types";

export default async function LogsPage() {
    const logs = await getActivityLogs();

    const getIcon = (action: string) => {
        if (action.includes("MEDICINE")) return <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ClipboardList className="h-4 w-4" /></div>;
        if (action.includes("INVOICE")) return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Info className="h-4 w-4" /></div>;
        if (action.includes("STOCK")) return <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><AlertCircle className="h-4 w-4" /></div>;
        return <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Info className="h-4 w-4" /></div>;
    };

    const getActionLabel = (action: string) => {
        return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    System Activity Logs
                    <Shield className="h-6 w-6 text-blue-600" />
                </h1>
                <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-tighter">Security & Action Traceability for Sai Balaji</p>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Recent Activities</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <Clock className="h-3 w-3" />
                        Live Feed
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClipboardList className="h-8 w-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-medium italic">No logs found. Activities will appear here once you start using the system.</p>
                        </div>
                    ) : (
                        logs.map((log: ActivityLog) => (
                            <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-4 group">
                                {getIcon(log.action)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                                            {getActionLabel(log.action)}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-300">
                                            {new Date(log.createdAt).toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'Asia/Kolkata'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">{log.details}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`h-1 w-1 rounded-full ${log.userRole === 'admin' ? 'bg-blue-500' : 'bg-orange-400'}`}></div>
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                                            Performed By: <span className={log.userRole === 'admin' ? 'text-blue-600' : 'text-orange-500'}>{log.userRole === 'admin' ? 'Doctor' : 'Sister'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 border-dashed">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest text-center">
                    End of secure log history • Records are permanent
                </p>
            </div>
        </div>
    );
}
