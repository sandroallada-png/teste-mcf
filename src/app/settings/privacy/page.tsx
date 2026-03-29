
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
import { Loader2, ShieldCheck, FileText } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';

export default function PrivacyPage() {
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
                    title="Confidentialité"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    user={user}
                    sidebarProps={sidebarProps}
                />

                <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Politique de Confidentialité</h1>
                        <p className="text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">1. Collecte des données personnelles</h2>
                            <p>MyCookFlex collecte uniquement les données nécessaires au fonctionnement du service :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Nom et prénom</li>
                                <li>Adresse e-mail</li>
                                <li>Données de connexion</li>
                                <li>Préférences alimentaires</li>
                                <li>Données d’utilisation de la plateforme</li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">2. Finalités du traitement</h2>
                            <p>Les données sont collectées pour :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Fournir les services MyCookFlex</li>
                                <li>Personnaliser l’expérience utilisateur</li>
                                <li>Améliorer la plateforme</li>
                                <li>Communiquer avec l’utilisateur (notifications, support)</li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">3. Base légale (RGPD)</h2>
                            <p>Le traitement des données repose sur :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Le consentement de l’utilisateur</li>
                                <li>L’exécution du contrat</li>
                                <li>L’intérêt légitime de MyCookFlex</li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">4. Conservation des données</h2>
                            <p>Les données sont conservées :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Tant que le compte est actif</li>
                                <li>Ou pendant la durée légale nécessaire après suppression</li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">5. Partage des données</h2>
                            <p>MyCookFlex ne vend pas les données personnelles. Les données peuvent être partagées uniquement avec :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Des prestataires techniques (hébergement, maintenance)</li>
                                <li>Les autorités légales si requis par la loi</li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">6. Sécurité des données</h2>
                            <p>
                                MyCookFlex met en œuvre des mesures techniques et organisationnelles pour
                                garantir la sécurité et la confidentialité des données.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-xl font-bold mb-4">7. Droits des utilisateurs</h2>
                            <p>Conformément au RGPD, l’utilisateur dispose des droits suivants :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Droit d’accès</li>
                                <li>Droit de rectification</li>
                                <li>Droit de suppression</li>
                                <li>Droit à la portabilité</li>
                                <li>Droit d’opposition</li>
                            </ul>
                            <p className="mt-4">Les demandes peuvent être envoyées à : <strong>support@mycookflex.com</strong></p>
                        </section>

                        <section className="mt-8 pb-10">
                            <h2 className="text-xl font-bold mb-4">8. Cookies</h2>
                            <p>MyCookFlex utilise des cookies pour :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Le bon fonctionnement du service</li>
                                <li>L’analyse statistique</li>
                            </ul>
                            <p className="mt-2">L’utilisateur peut gérer ses préférences via son navigateur.</p>
                        </section>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
