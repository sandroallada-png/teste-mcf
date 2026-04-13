
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportBugAction } from '@/app/actions';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    errorCode: string;
    errorDetails: string;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorCode: '',
        errorDetails: '',
    };

    public static getDerivedStateFromError(error: Error): State {
        // Générer un code d'erreur aléatoire style AL_XXXX
        const code = `AL_${Math.floor(1000 + Math.random() * 9000)}`;
        return { hasError: true, errorCode: code, errorDetails: error.message };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReport = async () => {
        const { errorCode, errorDetails } = this.state;
        
        await reportBugAction({
            errorCode,
            message: errorDetails,
            path: window.location.pathname,
            stack: 'React Error Boundary Catch',
        });

        alert('Merci ! Le bug a été signalé à l\'administrateur.');
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="p-8 pb-4 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                Nous avons rencontré une erreur
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                                Une erreur inattendue est survenue au chargement de la page.
                            </p>
                            
                            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3 inline-block">
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">Code Erreur</span>
                                <span className="text-lg font-bold text-orange-500 font-mono">{this.state.errorCode}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-4 space-y-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
                                Aidez-nous à améliorer votre outil en nous signalant ce bug. Nos équipes s'en occuperont rapidement.
                            </p>

                            <div className="grid gap-3">
                                <button
                                    onClick={this.handleReport}
                                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-orange-500/25"
                                >
                                    Signaler le bug
                                </button>
                                
                                <button
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-2xl transition-all"
                                >
                                    Retour au tableau de bord
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
