"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Chrome } from "lucide-react";

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // 1. Capture the install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setReady(true);
        };

        window.addEventListener("beforeinstallprompt", handler as any);

        // 2. Forced visibility after 2 seconds
        const timer = setTimeout(() => {
            const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            setIsMobile(mobile);
            setReady(true);
        }, 2000);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler as any);
            clearTimeout(timer);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // BEST CASE: Browser official install
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setReady(false);
            }
        } else {
            // FALLBACK: Detailed prompt if browser is blocking the auto-install
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

            if (isIOS) {
                alert("IPHONE INSTALL:\n1. Tap 'Share' (square with arrow)\n2. Tap 'Add to Home Screen'");
            } else {
                alert("ANDROID INSTALL:\n1. Tap the 3 dots (⋮) top right\n2. Tap 'Install app' or 'Add to Home screen'");
            }
        }
    };

    if (!isMobile || !ready) return null;

    return (
        <div className="fixed bottom-10 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-[32px] font-black shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all active:scale-95 border-4 border-white animate-bounce"
            >
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-2xl">
                    <Download className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                    <div className="text-xs opacity-80 font-bold uppercase tracking-widest">Clinic App</div>
                    <div className="text-xl leading-tight">Install To Phone</div>
                </div>
            </button>
        </div>
    );
}
