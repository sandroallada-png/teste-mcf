
'use client';

import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, Sidebar as AppSidebar, SidebarInset } from "@/components/ui/sidebar";
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, query, where, Timestamp } from "firebase/firestore";
import { LayoutDashboard, Loader2, Users, FileText, Ticket, GalleryHorizontal, ShoppingCart, Shield, Utensils, Bell, MessageSquare, Star, Activity, Library, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from 'next/link';
import { UserProfile } from "@/lib/types";

export default function AdminPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    // --- Sidebar Data ---
    const goalsCollectionRef = useMemoFirebase(
        () => (user ? collection(firestore, 'users', user.uid, 'goals') : null),
        [user, firestore]
    );
    const { data: goalsData } = useCollection<{ description: string }>(goalsCollectionRef);

    const effectiveChefId = userProfile?.chefId || user?.uid;
    const allMealsCollectionRef = useMemoFirebase(
        () => (effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'foodLogs') : null),
        [effectiveChefId, firestore]
    );
    const { data: allMeals } = useCollection<any>(allMealsCollectionRef);

    // --- Admin Stats Data ---
    const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users } = useCollection(usersQuery);

    const promosQuery = useMemoFirebase(() => collection(firestore, 'promotions'), [firestore]);
    const { data: promos } = useCollection(promosQuery);

    const publicationsQuery = useMemoFirebase(() => collection(firestore, 'publications'), [firestore]);
    const { data: publications } = useCollection(publicationsQuery);

    const carouselQuery = useMemoFirebase(() => collection(firestore, 'carouselItems'), [firestore]);
    const { data: carouselItems } = useCollection(carouselQuery);

    const dishesQuery = useMemoFirebase(() => collection(firestore, 'dishes'), [firestore]);
    const { data: dishes } = useCollection(dishesQuery);

    const feedbacksQuery = useMemoFirebase(() => collection(firestore, 'feedbacks'), [firestore]);
    const { data: feedbacks } = useCollection(feedbacksQuery);

    const notificationsQuery = useMemoFirebase(() => collection(firestore, 'notifications'), [firestore]);
    const { data: notifications } = useCollection(notificationsQuery);

    const messagesQuery = useMemoFirebase(() => collection(firestore, 'messages'), [firestore]);
    const { data: messages } = useCollection(messagesQuery);

    const atelierQuery = useMemoFirebase(() => collection(firestore, 'atelierBooks'), [firestore]);
    const { data: atelierBooks } = useCollection(atelierQuery);

    useEffect(() => {
        if (!isProfileLoading && userProfile?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [isProfileLoading, userProfile, router]);


    if (isUserLoading || isProfileLoading || !user || userProfile?.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const sidebarProps = {
        goals: goalsData?.[0]?.description || "Manger équilibré",
        setGoals: () => { },
        meals: allMeals ?? [],
    };

    return (
        <div className="h-screen w-full bg-background font-body">
            <SidebarProvider>
                <AppSidebar collapsible="icon" className="w-80 peer hidden md:block" variant="sidebar">
                    <Sidebar {...sidebarProps} />
                </AppSidebar>
                <SidebarInset>
                    <div className="flex h-full flex-1 flex-col">
                        <AppHeader
                            title="Admin Dashboard"
                            icon={<LayoutDashboard className="h-6 w-6" />}
                            user={user}
                            sidebarProps={sidebarProps}
                        />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            Liste des Utilisateurs
                                        </CardTitle>
                                        <CardDescription>
                                            {users?.length || 0} utilisateurs enregistrés dans l'application.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/users">Gérer les utilisateurs</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Ticket className="h-5 w-5 text-primary" />
                                            Gestion des Promotions
                                        </CardTitle>
                                        <CardDescription>
                                            {promos?.length || 0} offres promotionnelles actives ou passées.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/promotions">Gérer les promotions</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Gestion des Publications
                                        </CardTitle>
                                        <CardDescription>
                                            {publications?.filter(p => p.status === 'pending').length || 0} publications en attente de modération.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/publications">Modérer le contenu</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <GalleryHorizontal className="h-5 w-5 text-primary" />
                                            Gestion du Carrousel
                                        </CardTitle>
                                        <CardDescription>
                                            {carouselItems?.length || 0} éléments affichés sur le tableau de bord.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/carousel">Gérer le carrousel</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingCart className="h-5 w-5 text-primary" />
                                            Modération du Market
                                        </CardTitle>
                                        <CardDescription>
                                            Approuver et gérer les produits du marché.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" disabled>
                                            Modérer le Market (Bientôt)
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-primary" />
                                            Contrôle du Forum
                                        </CardTitle>
                                        <CardDescription>
                                            Modérer les sujets et réponses du forum.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" disabled>
                                            Contrôler le Forum (Bientôt)
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Utensils className="h-5 w-5 text-primary" />
                                            Gestion des Repas
                                        </CardTitle>
                                        <CardDescription>
                                            {dishes?.length || 0} plats référencés dans la base.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/dishes">Gérer les repas</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Library className="h-5 w-5 text-primary" />
                                            Atelier du Chef
                                        </CardTitle>
                                        <CardDescription>
                                            {atelierBooks?.length || 0} livres et guides disponibles dans l'Atelier.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/atelier">Gérer l'Atelier</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Bell className="h-5 w-5 text-primary" />
                                            Gestion des Notifications
                                        </CardTitle>
                                        <CardDescription>
                                            {notifications?.length || 0} notifications envoyées aux utilisateurs.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/notifications">Gérer les notifications</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                            Gestion des Messages
                                        </CardTitle>
                                        <CardDescription>
                                            {messages?.length || 0} messages reçus dans le support.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/messages">Gérer les messages</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Star className="h-5 w-5 text-primary" />
                                            Gestion des Feedbacks
                                        </CardTitle>
                                        <CardDescription>
                                            {feedbacks?.filter(f => f.status === 'new').length || 0} nouveaux retours à lire.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/feedbacks">Consulter les feedbacks</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-primary" />
                                            Suivi et Relance
                                        </CardTitle>
                                        <CardDescription>
                                            Surveiller l'activité et relancer les utilisateurs.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/follow-up">Suivre l'activité</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trash2 className="h-5 w-5 text-primary" />
                                            Membres Supprimés
                                        </CardTitle>
                                        <CardDescription>
                                            Suivi des membres retirés de leurs familles par les chefs.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/admin/deleted-members">Voir les bannis</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
