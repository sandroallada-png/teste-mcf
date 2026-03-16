'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export function OfflineDetector() {
    const [isOnline, setIsOnline] = useState(true);
    const [wasOffline, setWasOffline] = useState(false);
    const [showRestored, setShowRestored] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    
    // Safety check for SSR
    const isNative = typeof window !== 'undefined' ? Capacitor.isNativePlatform() : false;

    useEffect(() => {
        // État initial
        setIsOnline(navigator.onLine);

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            setShowRestored(false);
        };

        const handleOnline = () => {
            setIsOnline(true);
            setIsDismissed(false);
            if (wasOffline) {
                setShowRestored(true);
                // Cacher le message "connexion rétablie" après 3 secondes
                setTimeout(() => {
                    setShowRestored(false);
                    setWasOffline(false);
                }, 3000);
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [wasOffline]);

    // Rien à afficher si tout va bien
    if (isOnline && !showRestored) return null;

    // Bannière "Connexion rétablie"
    if (isOnline && showRestored) {
        return (
            <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 font-black text-sm">
                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                        <Wifi className="h-4 w-4" />
                    </div>
                    <span className="uppercase tracking-widest text-[11px]">Connexion rétablie ✓</span>
                </div>
            </div>
        );
    }

    // Bannière "Hors ligne" persistante
    if (!isOnline && isDismissed) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="bg-orange-500/90 backdrop-blur-md text-white/90 text-[10px] font-black uppercase tracking-widest text-center py-1.5 shadow-md border-b border-orange-400/20">
                    Mode Hors Ligne (Lecture Seule)
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Overlay semi-transparent */}
            <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px] pointer-events-none" />

            {/* Dialog principal */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                <div className="w-full max-w-sm animate-in zoom-in-95 fade-in duration-300">
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] shadow-2xl p-8 text-center space-y-6">
                        {isNative && (
                            <button 
                                onClick={() => setIsDismissed(true)}
                                className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        
                        {/* Glow décoratif */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

                        {/* Icône animée */}
                        <div className="relative mx-auto h-20 w-20 rounded-[1.5rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <WifiOff className="h-10 w-10 text-orange-400 animate-pulse" />
                            {/* Anneaux animés */}
                            <div className="absolute inset-0 rounded-[1.5rem] border border-orange-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                        </div>

                        {/* Texte */}
                        <div className="space-y-2 relative z-10">
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                Vous êtes hors ligne
                            </h2>
                            <p className="text-white/50 text-sm font-medium leading-relaxed">
                                Vérifiez votre connexion Wi-Fi ou données mobiles. L'application reprendra automatiquement.
                            </p>
                        </div>

                        {/* Indicateur de reconnexion */}
                        <div className="relative z-10 space-y-3">
                            <div className="flex items-center justify-center gap-2 text-orange-400/60 text-[10px] font-black uppercase tracking-widest">
                                <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
                                <span>Reconnexion en cours...</span>
                            </div>

                            {/* Barre de progression animée */}
                            <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500/50 to-orange-400 rounded-full animate-pulse"
                                    style={{ width: '60%' }}
                                />
                            </div>
                        </div>

                        {/* Bouton retry */}
                        <button
                            onClick={() => window.location.reload()}
                            className="relative z-10 w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
