
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface ReadOnlyContextValue {
    /** True si l'utilisateur est un membre de famille (lecture seule) */
    isReadOnly: boolean;
    /** Nom du chef de famille, si disponible */
    chefName: string | null;
    /** True quand le modal de restriction est visible */
    isBlocked: boolean;
    /** Déclenche l'affichage du modal de restriction */
    triggerBlock: () => void;
    /** Ferme le modal de restriction */
    dismissBlock: () => void;
    /** Wrapper de handler : si readOnly, bloque + ouvre modal. Sinon, exécute l'action. */
    guardAction: <T extends any[], R>(fn: (...args: T) => R) => (...args: T) => R;
    /** Profil complet du chef, si applicable */
    chefProfile: UserProfile | null;
    /** Niveau partagé du foyer */
    effectiveLevel: number;
    /** XP partagé du foyer */
    effectiveXp: number;
}

const ReadOnlyContext = createContext<ReadOnlyContextValue>({
    isReadOnly: false,
    chefName: null,
    isBlocked: false,
    triggerBlock: () => { },
    dismissBlock: () => { },
    guardAction: (fn) => fn as any,
    chefProfile: null,
    effectiveLevel: 1,
    effectiveXp: 0,
});

export function ReadOnlyProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { firestore } = useFirebase();

    const userProfileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const chefProfileRef = useMemoFirebase(
        () => (userProfile?.chefId ? doc(firestore, 'users', userProfile.chefId) : null),
        [userProfile, firestore]
    );
    const { data: chefProfile } = useDoc<UserProfile>(chefProfileRef);

    const [isBlocked, setIsBlocked] = useState(false);

    const isReadOnly = !!userProfile?.chefId;
    const chefName = chefProfile?.name || null;

    const triggerBlock = useCallback(() => {
        setIsBlocked(true);
    }, []);

    const dismissBlock = useCallback(() => {
        setIsBlocked(false);
    }, []);

    const guardAction = useCallback(
        <T extends any[], R>(fn: (...args: T) => R) =>
            (...args: T): R => {
                if (isReadOnly) {
                    setIsBlocked(true);
                    return undefined as R;
                }
                return fn(...args);
            },
        [isReadOnly]
    );

    const effectiveLevel = userProfile?.chefId ? (chefProfile?.level ?? 1) : (userProfile?.level ?? 1);
    const effectiveXp = userProfile?.chefId ? (chefProfile?.xp ?? 0) : (userProfile?.xp ?? 0);

    return (
        <ReadOnlyContext.Provider value={{
            isReadOnly,
            chefName,
            isBlocked,
            triggerBlock,
            dismissBlock,
            guardAction,
            chefProfile: chefProfile ?? null,
            effectiveLevel,
            effectiveXp
        }}>
            {children}
        </ReadOnlyContext.Provider>
    );
}

export function useReadOnly() {
    return useContext(ReadOnlyContext);
}
