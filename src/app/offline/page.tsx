
'use client';

import { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
    useEffect(() => {
        // Écouter le retour de connexion pour rediriger automatiquement
        const handleOnline = () => {
            window.location.href = '/dashboard';
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
                {/* Icône animée */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
                        <WifiOff className="w-10 h-10 text-orange-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">
                    Vous êtes hors ligne
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                    My Cook Flex ne peut pas se connecter. Vérifiez votre connexion internet. 
                    L'application reprendra automatiquement dès la reconnexion.
                </p>

                {/* Indicateur "attente connexion" */}
                <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs mb-8">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    En attente de connexion...
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-all active:scale-95"
                >
                    <RefreshCw className="w-4 h-4" />
                    Réessayer manuellement
                </button>
            </div>
        </div>
    );
}
