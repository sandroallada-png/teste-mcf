
'use client';

import { useState, useEffect } from 'react';
import {
    SidebarProvider,
    SidebarInset,
    Sidebar as ShcnSidebar,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import type { Meal } from '@/lib/types';
import { Loader2, FileText } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';

export default function TermsPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    // --- Data fetching for sidebar (sync with main layout) ---
    const allMealsCollectionRef = useMemoFirebase(
        () => (user ? collection(firestore, 'users', user.uid, 'foodLogs') : null),
        [user, firestore]
    );
    const { data: allMeals, isLoading: isLoadingAllMeals } = useCollection<Omit<Meal, 'id'>>(allMealsCollectionRef);

    const goalsCollectionRef = useMemoFirebase(
        () => (user ? collection(firestore, 'users', user.uid, 'goals') : null),
        [user, firestore]
    );
    const singleGoalQuery = useMemoFirebase(
        () => goalsCollectionRef ? query(goalsCollectionRef, limit(1)) : null,
        [goalsCollectionRef]
    )
    const { data: goalsData, isLoading: isLoadingGoals } = useCollection<{ description: string }>(singleGoalQuery);

    const [goals, setGoals] = useState('Perdre du poids, manger plus sainement et réduire ma consommation de sucre.');

    useEffect(() => {
        if (goalsData && goalsData.length > 0 && goalsData[0]) {
            setGoals(goalsData[0].description);
        }
    }, [goalsData]);

    if (isUserLoading || isLoadingAllMeals || isLoadingGoals || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const sidebarProps = {
        goals,
        setGoals: (val: string) => setGoals(val),
        meals: allMeals ?? [],
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <ShcnSidebar collapsible="icon" className="w-64 peer hidden md:block border-r bg-sidebar">
                <Sidebar {...sidebarProps} />
            </ShcnSidebar>
            <SidebarInset className="bg-background flex flex-col h-screen">
                <AppHeader
                    title="Conditions d'utilisation"
                    icon={<FileText className="h-4 w-4" />}
                    user={user}
                    sidebarProps={sidebarProps}
                />

                <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Conditions Générales d’Utilisation</h1>
                        <p className="text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">1. Présentation de la plateforme</h2>
                            <p>
                                MyCookFlex est une plateforme numérique de planification de repas, permettant
                                aux utilisateurs de créer, organiser et personnaliser leurs menus, recettes et
                                habitudes alimentaires via un site web et/ou une application mobile.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">2. Acceptation des conditions</h2>
                            <p>
                                L’utilisation de la plateforme implique l’acceptation pleine et entière des présentes
                                Conditions Générales d’Utilisation.
                            </p>
                            <p className="mt-2 text-red-500 font-medium italic">
                                Si l’utilisateur n’accepte pas ces conditions, il doit cesser immédiatement l’utilisation
                                du service.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">3. Accès au service</h2>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                <li>L’accès est réservé aux utilisateurs disposant d’un compte actif.</li>
                                <li>L’utilisateur est responsable des informations fournies lors de l’inscription.</li>
                                <li>MyCookFlex se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des CGU.</li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">4. Services proposés</h2>
                            <p>MyCookFlex propose notamment :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>La planification personnalisée de repas</li>
                                <li>La gestion de recettes</li>
                                <li>Des recommandations alimentaires</li>
                                <li>Des outils d’organisation (calendrier, listes, rappels)</li>
                            </ul>
                            <p className="mt-4 text-xs font-semibold uppercase opacity-70">MyCookFlex ne remplace pas un avis médical ou nutritionnel professionnel.</p>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">5. Responsabilités de l’utilisateur</h2>
                            <p>L’utilisateur s’engage à :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Utiliser la plateforme de manière légale</li>
                                <li>Ne pas publier de contenu illicite, trompeur ou offensant</li>
                                <li>Ne pas tenter de perturber le fonctionnement du service</li>
                            </ul>
                        </section>

                        <section className="mt-8 border-t pt-8">
                            <h2 className="text-xl font-bold mb-4">6. Responsabilité de MyCookFlex</h2>
                            <p>MyCookFlex ne saurait être tenue responsable :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Des choix alimentaires de l’utilisateur</li>
                                <li>Des dommages indirects liés à l’utilisation du service</li>
                                <li>Des interruptions temporaires pour maintenance</li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">7. Propriété intellectuelle</h2>
                            <p>
                                Tous les contenus (textes, logos, design, fonctionnalités) sont la propriété exclusive
                                de MyCookFlex.
                            </p>
                            <p className="mt-2">Toute reproduction est interdite sans autorisation écrite.</p>
                        </section>

                        <section className="mt-8 pb-10">
                            <h2 className="text-xl font-bold mb-4">8. Droit applicable</h2>
                            <p>
                                Les présentes CGU sont régies par le droit français.
                                Tout litige sera soumis aux tribunaux compétents.
                            </p>
                        </section>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
