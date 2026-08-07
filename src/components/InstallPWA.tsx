import React, { useEffect, useState } from 'react';
import { Download, X, Share, Plus, MoreVertical, CheckCircle } from 'lucide-react';

interface InstallPWAProps {
    active?: boolean;
}

type BrowserType = 'chrome' | 'safari-ios' | 'firefox' | 'samsung' | 'edge' | 'other';

function detectBrowser(): BrowserType {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(ua);
    if (isIOS && /safari/.test(ua) && !/chrome/.test(ua)) return 'safari-ios';
    if (ua.includes('samsungbrowser')) return 'samsung';
    if (ua.includes('edg/')) return 'edge';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('chrome')) return 'chrome';
    return 'other';
}

function isAlreadyInstalled(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
    );
}

const InstallPWA: React.FC<InstallPWAProps> = ({ active = false }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [browser, setBrowser] = useState<BrowserType>('other');

    useEffect(() => {
        setBrowser(detectBrowser());
        if (isAlreadyInstalled()) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            setShouldShow(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Show the prompt for 5 seconds when active
    useEffect(() => {
        if (!active || isInstalled) { setShouldShow(false); return; }

        // For Chrome/Edge: only show if we have the native prompt
        // For Safari/Firefox/Samsung: always show the manual guide option
        const canShow = deferredPrompt || ['safari-ios', 'firefox', 'samsung', 'other'].includes(browser);
        if (!canShow) return;

        setShouldShow(true);
        const timer = setTimeout(() => {
            setShouldShow(false);
            setShowGuide(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, [active, isInstalled, deferredPrompt, browser]);

    const handleInstallClick = async () => {
        // Chrome / Edge — native prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShouldShow(false);
            }
            return;
        }
        // All other browsers: show manual guide
        setShowGuide(true);
    };

    const dismiss = () => { setShouldShow(false); setShowGuide(false); };

    if (isInstalled || !shouldShow) return null;

    return (
        <>
            {/* Manual install guide modal (Safari / Firefox / Samsung) */}
            {showGuide && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={dismiss}>
                    <div
                        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Download className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white font-bold text-sm">Install GCS App</span>
                            </div>
                            <button onClick={dismiss} className="text-slate-400 hover:text-white p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Safari iOS */}
                        {browser === 'safari-ios' && (
                            <div className="space-y-3 text-sm text-slate-300">
                                <p className="text-slate-400 text-xs">To install on your iPhone / iPad:</p>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <Share className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Tap the <strong className="text-white">Share</strong> button in Safari's toolbar</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <Plus className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Tap <strong className="text-white">Add</strong> to confirm</span>
                                </div>
                            </div>
                        )}

                        {/* Firefox Android */}
                        {browser === 'firefox' && (
                            <div className="space-y-3 text-sm text-slate-300">
                                <p className="text-slate-400 text-xs">To install on Firefox Android:</p>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <MoreVertical className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Tap the <strong className="text-white">Menu (⋮)</strong> button in the top-right</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <Plus className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Tap <strong className="text-white">Install</strong> or <strong className="text-white">Add to Home Screen</strong></span>
                                </div>
                            </div>
                        )}

                        {/* Samsung Browser */}
                        {browser === 'samsung' && (
                            <div className="space-y-3 text-sm text-slate-300">
                                <p className="text-slate-400 text-xs">To install on Samsung Browser:</p>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <MoreVertical className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Tap the <strong className="text-white">Menu</strong> button (three lines)</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <Plus className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Tap <strong className="text-white">Add page to</strong> → <strong className="text-white">Home screen</strong></span>
                                </div>
                            </div>
                        )}

                        {/* Other / Generic */}
                        {(browser === 'other') && (
                            <div className="space-y-3 text-sm text-slate-300">
                                <p className="text-slate-400 text-xs">To install this app:</p>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <MoreVertical className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Open your browser's <strong className="text-white">menu</strong></span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                                    <Plus className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Select <strong className="text-white">Add to Home Screen</strong> or <strong className="text-white">Install App</strong></span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={dismiss}
                            className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* FAB Install Button */}
            {!showGuide && (
                <button
                    onClick={handleInstallClick}
                    className="fixed bottom-6 right-6 z-[9999] bg-blue-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all hover:scale-110 active:scale-95 group focus:outline-none ring-4 ring-blue-600/20"
                    title="Install Garuda Cyber Shield App"
                    aria-label="Install App"
                >
                    <Download className="w-6 h-6" />
                    <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-wider border border-blue-500/30">
                        Install GCS App
                    </span>
                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20 pointer-events-none"></span>
                </button>
            )}

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </>
    );
};

export default InstallPWA;
