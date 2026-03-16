'use client';

import { useAuthContext } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { LifeBuoy, LogOut, ShieldAlert } from 'lucide-react';
import { auth } from '@/firebase/auth';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function DeniedPage() {
    const { userData } = useAuthContext();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const chefName = userData?.removedBy || 'Votre chef de famille';

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <ShieldAlert className="h-10 w-10" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">
                        Accès restreint
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground">{chefName}</span> vous a retiré de sa famille.
                        Vous n'avez plus accès au foyer MyCookFlex.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        asChild
                        className="h-12 rounded-2xl font-black uppercase tracking-widest text-xs"
                    >
                        <a href="https://www.mycookflex.com/support" target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            Besoin d'aide ?
                        </a>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="h-12 rounded-2xl font-bold text-muted-foreground hover:text-foreground transition-colors text-xs uppercase tracking-widest"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Se déconnecter
                    </Button>
                </div>

                <p className="text-[10px] text-muted-foreground/30 uppercase font-black tracking-[0.2em] pt-10">
                    MyCookFlex Security Guard
                </p>
            </div>
        </div>
    );
}
