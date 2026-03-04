'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function NativeSplashScreen() {
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        // Afficher seulement sur mobile natif (Capacitor) ou petit écran
        const isNative = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || 
             !!(window as any).Capacitor);
        
        // Afficher le splash UNIQUEMENT au premier chargement
        const hasShown = sessionStorage.getItem('splash-shown');
        if (hasShown) return;

        setVisible(true);
        sessionStorage.setItem('splash-shown', '1');

        // Démarrer le fade-out après 2.2s
        const fadeTimer = setTimeout(() => setFading(true), 2200);
        // Masquer complètement après 2.8s
        const hideTimer = setTimeout(() => setVisible(false), 2800);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0a0a0a]"
            style={{
                transition: 'opacity 0.6s ease-out',
                opacity: fading ? 0 : 1,
                pointerEvents: fading ? 'none' : 'all',
            }}
        >
            {/* Fond avec radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,124,64,0.15)_0%,_transparent_70%)]" />

            {/* Logo avec animation scintillante */}
            <div className="relative flex flex-col items-center gap-8">
                {/* Halo animé derrière le logo */}
                <div className="relative">
                    {/* Anneaux de lueur */}
                    <div
                        className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl"
                        style={{
                            animation: 'pulse-glow 1.5s ease-in-out infinite',
                            transform: 'scale(1.8)',
                        }}
                    />
                    <div
                        className="absolute inset-0 rounded-full bg-amber-400/10 blur-3xl"
                        style={{
                            animation: 'pulse-glow 2s ease-in-out infinite reverse',
                            transform: 'scale(2.5)',
                        }}
                    />

                    {/* Logo principal */}
                    <div
                        style={{ animation: 'splash-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                    >
                        <Image
                            src="/mcf-logo.png"
                            alt="My Cook Flex"
                            width={120}
                            height={120}
                            className="relative z-10 drop-shadow-2xl"
                            priority
                        />
                    </div>

                    {/* Particules scintillantes */}
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-amber-400"
                            style={{
                                top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 6)}%`,
                                left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 6)}%`,
                                animation: `sparkle 1.8s ease-in-out ${i * 0.2}s infinite`,
                                boxShadow: '0 0 6px rgba(245, 158, 11, 0.8)',
                            }}
                        />
                    ))}
                </div>

                {/* Nom de l'app */}
                <div
                    className="text-center"
                    style={{ animation: 'fade-up 0.8s ease-out 0.4s both' }}
                >
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-500/70">
                        My Cook Flex
                    </p>
                </div>

                {/* Barre de chargement */}
                <div
                    className="w-24 h-0.5 bg-white/5 rounded-full overflow-hidden"
                    style={{ animation: 'fade-up 0.8s ease-out 0.6s both' }}
                >
                    <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                        style={{ animation: 'loading-bar 2s ease-out forwards' }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.4; transform: scale(1.8); }
                    50% { opacity: 0.8; transform: scale(2.1); }
                }
                @keyframes splash-in {
                    from { opacity: 0; transform: scale(0.6) rotate(-10deg); }
                    to   { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0; transform: scale(0); }
                    50% { opacity: 1; transform: scale(1); }
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes loading-bar {
                    from { width: 0%; }
                    to   { width: 100%; }
                }
            `}</style>
        </div>
    );
}
