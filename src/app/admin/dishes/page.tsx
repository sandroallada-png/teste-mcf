
'use client';

import { useState } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc, type WithId } from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { AppHeader } from '@/components/layout/app-header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, Sidebar as AppSidebar, SidebarInset } from '@/components/ui/sidebar';
import { Loader2, Utensils, PlusCircle, Edit, Trash2, CheckCircle, XCircle, Upload, CheckCircle2, AlertCircle, Clock, Flame } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DishForm } from '@/components/admin/dish-form';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Dish, UserContribution, MissingMeal } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BulkDishImporter } from '@/components/admin/bulk-dish-importer';

export default function AdminDishesPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isFormOpen, setFormOpen] = useState(false);
    const [isImportOpen, setImportOpen] = useState(false);
    const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
    const [contributionToUpdate, setContributionToUpdate] = useState<string | null>(null);

    // Data for app dishes
    const dishesCollectionRef = useMemoFirebase(() => collection(firestore, 'dishes'), [firestore]);
    const { data: dishes, isLoading: isLoadingDishes, setData: setDishes } = useCollection<Dish>(dishesCollectionRef);

    // Data for user contributions
    const userContributionsCollectionRef = useMemoFirebase(() => collection(firestore, 'userContributions'), [firestore]);
    const userContributionsQuery = useMemoFirebase(() => userContributionsCollectionRef ? query(userContributionsCollectionRef, orderBy('createdAt', 'desc')) : null, [userContributionsCollectionRef]);
    const { data: userContributions, isLoading: isLoadingContributions } = useCollection<WithId<UserContribution>>(userContributionsQuery);

    // Data for missing meals (searched but not found)
    const missingMealsCollectionRef = useMemoFirebase(() => collection(firestore, 'missingMeals'), [firestore]);
    const missingMealsQuery = useMemoFirebase(() => missingMealsCollectionRef ? query(missingMealsCollectionRef, orderBy('createdAt', 'desc')) : null, [missingMealsCollectionRef]);
    const { data: missingMeals, isLoading: isLoadingMissing } = useCollection<WithId<MissingMeal>>(missingMealsQuery);

    const [missingToUpdate, setMissingToUpdate] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile } = useDoc<any>(userProfileRef);

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

    const handleEdit = (dish: Dish) => {
        setEditingDish(dish);
        setContributionToUpdate(null);
        setMissingToUpdate(null);
        setFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingDish(null);
        setContributionToUpdate(null);
        setMissingToUpdate(null);
        setFormOpen(true);
    };

    const handleAddToDishesFromContribution = (contribution: WithId<UserContribution>) => {
        setEditingDish({
            name: contribution.name,
            type: contribution.type,
            recipe: contribution.recipe,
            imageUrl: contribution.imageUrl,
        });
        setContributionToUpdate(contribution.id);
        setMissingToUpdate(null);
        setFormOpen(true);
    };

    const handleAddToDishesFromMissingMeal = (missing: WithId<MissingMeal>) => {
        setEditingDish({
            name: missing.name,
        });
        setMissingToUpdate(missing.id);
        setContributionToUpdate(null);
        setFormOpen(true);
    };

    const handleFormSubmit = (values: Omit<Dish, 'id'>) => {
        if (editingDish && 'id' in editingDish && editingDish.id) {
            const dishDocRef = doc(firestore, 'dishes', editingDish.id);
            updateDocumentNonBlocking(dishDocRef, values);
            toast({ title: "Plat modifié", description: "Le plat a été mis à jour." });
        } else {
            addDocumentNonBlocking(dishesCollectionRef, {
                ...values,
                isVerified: false
            });
            toast({ title: "Plat ajouté", description: "Le nouveau plat a été ajouté (en attente de vérification)." });
            // Update status if coming from suggestion
            if (contributionToUpdate) {
                handleContributionStatusUpdate(contributionToUpdate, 'approved');
            } else if (missingToUpdate) {
                handleMissingStatusUpdate(missingToUpdate, 'added');
            }
        }
        setFormOpen(false);
        setEditingDish(null);
        setContributionToUpdate(null);
        setMissingToUpdate(null);
    };

    const handleDelete = (dishId: string) => {
        const dishDocRef = doc(firestore, 'dishes', dishId);
        deleteDocumentNonBlocking(dishDocRef);
        toast({ variant: "destructive", title: "Plat supprimé" });
    };

    const handleDeleteContribution = (contributionId: string) => {
        const contributionDocRef = doc(firestore, 'userContributions', contributionId);
        deleteDocumentNonBlocking(contributionDocRef);
        toast({ variant: "destructive", title: "Contribution supprimée" });
    };

    const handleDeleteMissingMeal = (missingId: string) => {
        const missingDocRef = doc(firestore, 'missingMeals', missingId);
        deleteDocumentNonBlocking(missingDocRef);
        toast({ variant: "destructive", title: "Entrée supprimée" });
    };

    const handleContributionStatusUpdate = (contributionId: string, status: 'approved' | 'rejected') => {
        const contributionRef = doc(firestore, 'userContributions', contributionId);
        updateDocumentNonBlocking(contributionRef, { status });
        toast({ title: 'Statut mis à jour', description: `La contribution a été ${status === 'approved' ? 'approuvée' : 'rejetée'}.` });
    };

    const handleToggleVerify = (dishId: string, currentStatus: boolean) => {
        const dishDocRef = doc(firestore, 'dishes', dishId);
        updateDocumentNonBlocking(dishDocRef, { isVerified: !currentStatus });
        toast({
            title: !currentStatus ? "Plat vérifié" : "Plat non vérifié",
            description: `Le statut du plat a été mis à jour.`
        });
    };

    const handleMissingStatusUpdate = (missingId: string, status: 'added' | 'rejected') => {
        const missingRef = doc(firestore, 'missingMeals', missingId);
        updateDocumentNonBlocking(missingRef, { status });
        toast({ title: 'Statut mis à jour', description: `Le repas absent est maintenant marqué comme ${status === 'added' ? 'ajouté' : 'rejeté'}.` });
    };

    if (isUserLoading || isLoadingDishes || isLoadingContributions || isLoadingMissing) {
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
                            title="Gestion des Repas"
                            icon={<Utensils className="h-6 w-6" />}
                            user={user}
                            sidebarProps={sidebarProps}
                        />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6">
                            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                                if (!isOpen) {
                                    setEditingDish(null);
                                    setContributionToUpdate(null);
                                    setMissingToUpdate(null);
                                }
                                setFormOpen(isOpen);
                            }}>
                                <Tabs defaultValue="app_dishes">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="app_dishes">Repas de l'application</TabsTrigger>
                                        <TabsTrigger value="user_dishes">Contributions</TabsTrigger>
                                        <TabsTrigger value="missing_dishes">Repas indisponibles</TabsTrigger>
                                    </TabsList>

                                    {/* Tab for application's official dishes */}
                                    <TabsContent value="app_dishes">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <div>
                                                    <CardTitle>Catalogue MyFlex</CardTitle>
                                                    <CardDescription>Gérez l'ensemble des plats disponibles dans l'application.</CardDescription>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Dialog open={isImportOpen} onOpenChange={setImportOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <Upload className="mr-2 h-4 w-4" />
                                                                Import CSV/JSON
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Importation en masse</DialogTitle>
                                                                <DialogDescription>
                                                                    Chargez vos plats par lot. Ils seront ajoutés comme "non vérifiés".
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <BulkDishImporter onImportComplete={() => setImportOpen(false)} />
                                                        </DialogContent>
                                                    </Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button onClick={handleAddNew} size="sm" className="bg-primary hover:bg-primary/90">
                                                            <PlusCircle className="mr-2 h-4 w-4" />
                                                            Nouveau plat
                                                        </Button>
                                                    </DialogTrigger>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <Tabs defaultValue="unverified" className="w-full">
                                                    <TabsList className="mb-4 bg-muted/30 p-1 h-auto">
                                                        <TabsTrigger value="unverified" className="py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                                                            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                                                            À vérifier
                                                            <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                                                {dishes?.filter(d => !d.isVerified).length || 0}
                                                            </Badge>
                                                        </TabsTrigger>
                                                        <TabsTrigger value="verified" className="py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                                                            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                                            Vérifiés
                                                            <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                                                                {dishes?.filter(d => d.isVerified).length || 0}
                                                            </Badge>
                                                        </TabsTrigger>
                                                    </TabsList>

                                                    {['unverified', 'verified'].map((status) => (
                                                        <TabsContent key={status} value={status} className="mt-0">
                                                            <div className="rounded-md border">
                                                                <Table>
                                                                    <TableHeader className="bg-muted/30">
                                                                        <TableRow>
                                                                            <TableHead className="w-[80px]">Image</TableHead>
                                                                            <TableHead>Nom</TableHead>
                                                                            <TableHead>Détails</TableHead>
                                                                            <TableHead>Infos</TableHead>
                                                                            <TableHead>Calories</TableHead>
                                                                            <TableHead className="text-center">Vérifié</TableHead>
                                                                            <TableHead className="text-right">Actions</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {dishes && dishes.filter(d => status === 'verified' ? d.isVerified : !d.isVerified).length > 0 ? (
                                                                            dishes.filter(d => status === 'verified' ? d.isVerified : !d.isVerified).map((dish) => (
                                                                                <TableRow key={dish.id} className="group hover:bg-muted/20 transition-colors">
                                                                                    <TableCell>
                                                                                        <div className="relative h-12 w-12 overflow-hidden rounded-lg shadow-sm border">
                                                                                            {dish.imageUrl ? (
                                                                                                <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover" />
                                                                                            ) : (
                                                                                                <div className="h-full w-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase font-black">
                                                                                                    NO IMG
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-bold text-sm leading-tight">{dish.name}</span>
                                                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{dish.origin}</span>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            <Badge variant="outline" className="text-[10px] py-0">{dish.category}</Badge>
                                                                                            {dish.type && <Badge variant="secondary" className="text-[10px] py-0">{dish.type}</Badge>}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                                            <Clock className="h-3 w-3" />
                                                                                            {dish.cookingTime}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                                                                                            <Flame className="h-3 w-3" />
                                                                                            {dish.calories || '--'}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className="text-center">
                                                                                        <Switch
                                                                                            checked={!!dish.isVerified}
                                                                                            onCheckedChange={() => handleToggleVerify(dish.id, !!dish.isVerified)}
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell className="text-right">
                                                                                        <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(dish)}>
                                                                                                <Edit className="h-4 w-4" />
                                                                                            </Button>
                                                                                            <AlertDialog>
                                                                                                <AlertDialogTrigger asChild>
                                                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                                                                        <Trash2 className="h-4 w-4" />
                                                                                                    </Button>
                                                                                                </AlertDialogTrigger>
                                                                                                <AlertDialogContent>
                                                                                                    <AlertDialogHeader>
                                                                                                        <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                                                                                                        <AlertDialogDescription>
                                                                                                            Le plat "{dish.name}" sera retiré du catalogue. Cette action est irréversible.
                                                                                                        </AlertDialogDescription>
                                                                                                    </AlertDialogHeader>
                                                                                                    <AlertDialogFooter>
                                                                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                                                        <AlertDialogAction onClick={() => handleDelete(dish.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                                                                                    </AlertDialogFooter>
                                                                                                </AlertDialogContent>
                                                                                            </AlertDialog>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))
                                                                        ) : (
                                                                            <TableRow>
                                                                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic bg-muted/5">
                                                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                                                        <Utensils className="h-8 w-8 opacity-20" />
                                                                                        <span>Aucun plat {status === 'verified' ? 'vérifié' : 'en attente'} pour le moment.</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        )}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </TabsContent>
                                                    ))}
                                                </Tabs>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Tab for user contributions */}
                                    <TabsContent value="user_dishes">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Contributions des utilisateurs</CardTitle>
                                                <CardDescription>Validez ou rejetez les plats soumis par les utilisateurs.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Nom du plat</TableHead>
                                                            <TableHead>Auteur</TableHead>
                                                            <TableHead>Calories</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Statut</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {userContributions && userContributions.length > 0 ? (
                                                            userContributions.map((contribution) => (
                                                                <TableRow key={contribution.id}>
                                                                    <TableCell className="font-medium">{contribution.name}</TableCell>
                                                                    <TableCell className="text-muted-foreground">{contribution.authorName}</TableCell>
                                                                    <TableCell className="text-muted-foreground">{contribution.calories} kcal</TableCell>
                                                                    <TableCell>{contribution.createdAt ? format(contribution.createdAt.toDate(), 'd MMM yyyy', { locale: fr }) : 'N/A'}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={
                                                                            contribution.status === 'approved' ? 'default' :
                                                                                contribution.status === 'rejected' ? 'destructive' :
                                                                                    'secondary'
                                                                        }>
                                                                            {contribution.status}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {contribution.status === 'pending' && (
                                                                            <>
                                                                                <Button variant="outline" size="sm" onClick={() => handleAddToDishesFromContribution(contribution)}>
                                                                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="text-destructive ml-2" onClick={() => handleContributionStatusUpdate(contribution.id, 'rejected')}>
                                                                                    <XCircle className="h-4 w-4" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="text-destructive ml-2">
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Cette action est irréversible et supprimera la contribution définitivement.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleDeleteContribution(contribution.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="h-24 text-center">
                                                                    Aucune contribution pour le moment.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Tab for missing meals */}
                                    <TabsContent value="missing_dishes">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Repas indisponibles signalés</CardTitle>
                                                <CardDescription>Repas que les utilisateurs ont recherchés sans succès.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Nom du repas</TableHead>
                                                            <TableHead>Utilisateur</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Statut</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {missingMeals && missingMeals.length > 0 ? (
                                                            missingMeals.map((missing) => (
                                                                <TableRow key={missing.id}>
                                                                    <TableCell className="font-medium text-primary">{missing.name}</TableCell>
                                                                    <TableCell>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-medium">{missing.userName}</span>
                                                                            <span className="text-[10px] text-muted-foreground">{missing.userEmail}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>{missing.createdAt ? format(missing.createdAt.toDate(), 'd MMM HH:mm', { locale: fr }) : 'N/A'}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={
                                                                            missing.status === 'added' ? 'default' :
                                                                                missing.status === 'rejected' ? 'destructive' :
                                                                                    'secondary'
                                                                        }>
                                                                            {missing.status === 'added' ? 'Ajouté' : missing.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {missing.status === 'pending' && (
                                                                            <>
                                                                                <Button variant="outline" size="sm" onClick={() => handleAddToDishesFromMissingMeal(missing)}>
                                                                                    <PlusCircle className="mr-2 h-4 w-4" /> Créer le plat
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="text-destructive ml-2" onClick={() => handleMissingStatusUpdate(missing.id, 'rejected')}>
                                                                                    <XCircle className="h-4 w-4" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="text-destructive ml-2">
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Supprimer l'entrée ?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Cette action supprimera définitivement le signalement.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleDeleteMissingMeal(missing.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium italic">
                                                                    Aucun plat absent signalé pour le moment.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingDish && 'id' in editingDish ? 'Modifier le plat' : 'Nouveau plat'}</DialogTitle>
                                        <DialogDescription>
                                            Remplissez les informations ci-dessous.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DishForm
                                        onSubmit={handleFormSubmit}
                                        initialData={editingDish}
                                    />
                                </DialogContent>
                            </Dialog>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
