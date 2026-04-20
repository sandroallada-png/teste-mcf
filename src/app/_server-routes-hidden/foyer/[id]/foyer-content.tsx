'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, ChefHat, Users } from 'lucide-react';

export default function FoyerContent() {
    const params = useParams();
    const id = params?.id;
    const { firestore } = useFirebase();
    const [foyer, setFoyer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id || id === 'placeholder') return;
        const foyerId = Array.isArray(id) ? id[0] : id;
        const foyerRef = doc(firestore, 'foyers', foyerId);
        const unsubscribe = onSnapshot(foyerRef, (snap) => {
            if (snap.exists()) setFoyer({ id: snap.id, ...snap.data() });
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [id, firestore]);

    if (isLoading && id !== 'placeholder') return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );

    if (!foyer && id !== 'placeholder') return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 text-center">
            <Users className="h-16 w-16 text-white/20 mb-4" />
            <h1 className="text-2xl font-black uppercase tracking-widest">Foyer introuvable</h1>
            <p className="text-white/40 text-sm mt-2">Ce foyer n'existe pas ou vous n'avez pas les droits d'accès.</p>
        </div>
    );

    if (id === 'placeholder') return null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Foyer Culinaire</p>
                        <h1 className="text-2xl font-black">{foyer.name || 'Foyer'}</h1>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
                    <p className="text-white/60 text-sm">Bienvenue dans le foyer de {foyer.chefName || 'votre chef'}.</p>
                </div>
            </div>
        </div>
    );
}
