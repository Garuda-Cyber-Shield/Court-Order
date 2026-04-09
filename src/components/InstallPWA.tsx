import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface InstallPWAProps {
    active?: boolean;
}

const InstallPWA: React.FC<InstallPWAProps> = ({ active = false }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        const handleTriggerInstall = () => {
            if (deferredPrompt) {
                handleInstallClick();
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('triggerPwaInstall', handleTriggerInstall);

        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('triggerPwaInstall', handleTriggerInstall);
        };
    }, [deferredPrompt]);

    // Timer logic: show for 3 seconds if active
    useEffect(() => {
        if (active && !isInstalled && deferredPrompt) {
            setShouldShow(true);
            const timer = setTimeout(() => {
                setShouldShow(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShouldShow(false);
        }
    }, [active, isInstalled, deferredPrompt]);


    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isInstalled || !shouldShow) return null;

    return (
        <>
            {/* FAB Install Button - Only visible during the 3s window on login page */}
            <button
                onClick={handleInstallClick}
                className="fixed bottom-6 right-6 z-[9999] bg-blue-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all hover:scale-110 active:scale-95 group focus:outline-none ring-4 ring-blue-600/20 animate-bounce-slow"
                title="Install Garuda Cyber Shield App"
            >
                <Download className="w-6 h-6" />
                <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-wider border border-blue-500/30">
                    Install GCS App
                </span>
                <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20 pointer-events-none"></span>
            </button>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `}</style>
        </>
    );
};



export default InstallPWA;
