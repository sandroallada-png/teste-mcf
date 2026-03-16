'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

// ─── Event bus léger pour signaler que l'app est prête ───────────────────────
type ReadyListener = () => void;
const listeners = new Set<ReadyListener>();

/**
 * Appeler cette fonction depuis AuthProvider dès que l'état d'auth est résolu.
 * Le splash screen s'effacera alors en douceur.
 */
export function signalAppReady() {
    listeners.forEach((fn) => fn());
    listeners.clear();
}

// ─── Le composant Splash ──────────────────────────────────────────────────────
export function NativeSplashScreen() {
    const [visible, setVisible] = useState(true);
    const [fading, setFading] = useState(false);

    const dismiss = useCallback(() => {
        // Fade-out en 0.5s, puis masquer définitivement
        setFading(true);
        setTimeout(() => setVisible(false), 500);
    }, []);

    useEffect(() => {
        // S'enregistrer pour recevoir le signal "app prête"
        listeners.add(dismiss);

        // Garde-fou : si l'app met trop longtemps (8s), on cache quand même
        const fallback = setTimeout(dismiss, 8000);

        return () => {
            listeners.delete(dismiss);
            clearTimeout(fallback);
        };
    }, [dismiss]);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0a0a0a]"
            style={{
                transition: 'opacity 0.5s ease-out',
                opacity: fading ? 0 : 1,
                pointerEvents: fading ? 'none' : 'all',
            }}
        >
            {/* Fond avec radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,124,64,0.15)_0%,_transparent_70%)]" />

            {/* Contenu central */}
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
                            src="/new-logo/logo-favicon.png"
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
                                top: `${(50 + 45 * Math.sin((i * Math.PI * 2) / 6)).toFixed(1)}%`,
                                left: `${(50 + 45 * Math.cos((i * Math.PI * 2) / 6)).toFixed(1)}%`,
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

                {/* Indicateur de chargement infini (tant que l'app n'est pas prête) */}
                <div
                    className="flex items-center gap-2"
                    style={{ animation: 'fade-up 0.8s ease-out 0.6s both' }}
                >
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-amber-500/60"
                            style={{
                                animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
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
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
