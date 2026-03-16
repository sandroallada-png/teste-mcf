
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Lock, MessageCircle } from 'lucide-react';
import { useReadOnly } from '@/contexts/read-only-context';
import Link from 'next/link';

/**
 * Modal globale qui s'affiche automatiquement quand un membre de famille
 * tente d'effectuer une action d'écriture.
 * Doit être rendu une seule fois dans le layout racine.
 */
export function FamilyMemberGuardModal() {
    const { isBlocked, chefName, dismissBlock } = useReadOnly();

    return (
        <Dialog open={isBlocked} onOpenChange={(open) => { if (!open) dismissBlock(); }}>
            <DialogContent className="max-w-sm rounded-2xl border-primary/10 shadow-2xl shadow-primary/10 overflow-hidden p-0">
                {/* Bannière décorative */}
                <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-b border-primary/10 px-6 py-8 text-center space-y-3">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                        <Crown className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-base font-black tracking-tight">Fonctionnalité réservée</h2>
                        <p className="text-xs text-muted-foreground mt-1">au chef de famille</p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <DialogHeader className="text-left space-y-2">
                        <DialogTitle className="sr-only">Action réservée au chef</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2">
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    Seul{chefName ? <span className="font-bold text-foreground"> {chefName}</span> : ' le chef de famille'} peut programmer et modifier les éléments de l'application.
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    En tant que membre invité, vous pouvez consulter les informations et discuter avec l'IA, mais pas effectuer d'actions d'écriture.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-2">
                        <Link href="/my-flex-ai" onClick={dismissBlock} className="w-full">
                            <Button className="w-full h-10 rounded-xl font-bold text-xs gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Discuter avec l'IA
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="w-full h-9 rounded-xl font-semibold text-xs text-muted-foreground"
                            onClick={dismissBlock}
                        >
                            Fermer
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-muted/60">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            Demandez à votre chef de famille d'effectuer ces modifications ou discutez avec le coach IA pour obtenir des conseils.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
