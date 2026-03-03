"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto
              animate-toast
              flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl glass-card
              min-w-[300px] max-w-sm
              border-l-4
              ${toast.type === 'success' ? 'border-l-emerald-500' :
                                toast.type === 'error' ? 'border-l-rose-500' : 'border-l-blue-500'}
            `}
                    >
                        <div className={`p-1.5 rounded-lg ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {toast.type === 'success' && <CheckCircle className="h-4 w-4" />}
                            {toast.type === 'error' && <AlertCircle className="h-4 w-4" />}
                            {toast.type === 'info' && <Info className="h-4 w-4" />}
                        </div>

                        <p className="flex-1 text-sm font-bold text-slate-800">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
