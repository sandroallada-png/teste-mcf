
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    SidebarProvider,
    Sidebar as AppSidebar,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, limit, updateDoc, Timestamp, orderBy, serverTimestamp, onSnapshot, setDoc, deleteDoc, getDoc, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Meal, SaveUserRecipeInput, Dish, Cooking, UserProfile, AtelierBook } from '@/lib/types';
import { PlusCircle, Library, Book, ClockIcon, Calendar, Search, X, BookOpen, ChefHat, Award, Sparkles, TrendingUp, Flame, Target, Save, MapPin, Bookmark, Loader2, Star, Lock, DollarSign, Filter, Apple, Pizza, Salad, Coffee, Utensils, UtensilsCrossed } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUploader } from '@/components/admin/image-uploader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SuggestionDialog } from '@/components/cuisine/suggestion-dialog';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
const recipeFormSchema = z.object({
    name: z.string().min(3, "Le nom doit faire au moins 3 caractères."),
    description: z.string().optional(),
    type: z.enum(['breakfast', 'lunch', 'dinner', 'dessert']),
    cookingTime: z.string().min(1, "Le temps de cuisson est requis."),
    calories: z.number().min(0, "Les calories doivent être un nombre positif."),
    recipe: z.string().min(10, "Les instructions sont requises."),
    imageUrl: z.string().url("Une URL d'image valide est requise."),
    imageHint: z.string().min(2, "Un indice d'image est requis."),
    plannedFor: z.date(),
    share: z.boolean().default(false),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export default function AtelierPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [userCookingItems, setUserCookingItems] = useState<(Cooking & { share?: boolean })[]>([]);
    const [isLoadingUserCooking, setIsLoadingUserCooking] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [goals, setGoals] = useState<string>('');
    const [isLoadingGoals, setIsLoadingGoals] = useState(true);
    const [allMeals, setAllMeals] = useState<Meal[]>([]);
    const [isLoadingAllMeals, setIsLoadingAllMeals] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(recipeFormSchema),
        defaultValues: {
            name: '',
            description: '',
            type: 'lunch',
            cookingTime: '30 min',
            calories: 450,
            recipe: '',
            imageUrl: '',
            imageHint: '',
            plannedFor: new Date(),
            share: false,
        },
    });

    const { handleSubmit, control, setValue, formState: { errors } } = form;

    // --- Data fetching ---
    const atelierCollectionRef = useMemoFirebase(() => collection(firestore, 'atelierBooks'), [firestore]);
    const { data: books, isLoading: isLoadingBooks } = useCollection<AtelierBook>(atelierCollectionRef);

    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const favoritesCollectionRef = useMemoFirebase(() => (user ? collection(firestore, 'users', user.uid, 'favoriteRecipes') : null), [user, firestore]);
    const { data: favorites } = useCollection<{ id: string }>(favoritesCollectionRef);

    useEffect(() => {
        if (!user) return;

        // Fetch goals
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribeGoals = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setGoals(docSnap.data().goals || 'Perdre du poids, manger plus sainement et réduire ma consommation de sucre.');
            } else {
                // If user doc doesn't exist or goals field is missing, set default
                setGoals('Perdre du poids, manger plus sainement et réduire ma consommation de sucre.');
            }
            setIsLoadingGoals(false);
        }, (error) => {
            console.error("Error fetching goals:", error);
            setIsLoadingGoals(false);
        });

        // Fetch all meals
        const mealsQuery = query(collection(firestore, 'users', user.uid, 'foodLogs'));
        const unsubscribeMeals = onSnapshot(mealsQuery, (snapshot) => {
            const mealsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal));
            setAllMeals(mealsData);
            setIsLoadingAllMeals(false);
        }, (error) => {
            console.error("Error fetching meals:", error);
            setIsLoadingAllMeals(false);
        });

        // Fetch user cooking items
        const userCookingCollectionRef = collection(firestore, `users/${user.uid}/cooking`);
        const userCookingQuery = query(userCookingCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribeUserCooking = onSnapshot(userCookingQuery, (snapshot) => {
            const cookingItemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (Cooking & { share?: boolean })));
            setUserCookingItems(cookingItemsData);
            setIsLoadingUserCooking(false);
        }, (error) => {
            console.error("Error fetching user cooking items:", error);
            setIsLoadingUserCooking(false);
        });

        return () => {
            unsubscribeGoals();
            unsubscribeMeals();
            unsubscribeUserCooking();
        };
    }, [user, firestore]);

    const updateGoals = async (newGoals: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(firestore, 'users', user.uid), { goals: newGoals });
            setGoals(newGoals);
            toast({ title: 'Objectif mis à jour', description: 'Votre nouvel objectif a été enregistré.' });
        } catch (error) {
            console.error('Error updating goals:', error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour l\'objectif.' });
        }
    };

    const filteredBooks = useMemo(() => {
        if (!books) return [];
        return books.filter(book => {
            const matchesSearch = book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.hashtags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = selectedCategory === 'all' ||
                (selectedCategory === 'favorites' && favorites?.some(f => f.id === book.id)) ||
                book.category?.toLowerCase() === selectedCategory.toLowerCase() ||
                book.hashtags?.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase());

            return matchesSearch && matchesCategory;
        });
    }, [books, searchTerm, selectedCategory, favorites]);

    const filteredUserCookingItems = useMemo(() => {
        if (!userCookingItems) return [];
        return userCookingItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [userCookingItems, searchTerm]);

    const onFormSubmit = async (data: RecipeFormValues) => {
        if (!user) return;
        setIsSaving(true);

        const recipeData: SaveUserRecipeInput = {
            ...data,
            plannedFor: Timestamp.fromDate(data.plannedFor),
        };

        try {
            const cookingCollectionRef = collection(firestore, 'users', user.uid, 'cooking');

            // Save to user's personal 'cooking' collection
            const cookingDocPromise = addDocumentNonBlocking(cookingCollectionRef, {
                ...recipeData,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });

            let publicationPromise: Promise<any> = Promise.resolve(null);
            if (data.share) {
                const contributionsCollectionRef = collection(firestore, 'userContributions');
                publicationPromise = addDocumentNonBlocking(contributionsCollectionRef, {
                    name: recipeData.name,
                    type: recipeData.type,
                    calories: recipeData.calories,
                    recipe: recipeData.recipe,
                    imageUrl: recipeData.imageUrl,
                    authorId: user.uid,
                    authorName: user.displayName || 'Anonyme',
                    status: 'pending',
                    createdAt: serverTimestamp(),
                });
            }

            await Promise.all([cookingDocPromise, publicationPromise]);

            toast({
                title: "Recette enregistrée !",
                description: "Votre nouvelle recette a été ajoutée à votre espace Cuisine.",
            });
            form.reset();
            setIsFormOpen(false);

        } catch (error) {
            console.error("Failed to save recipe:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'enregistrer la recette. Veuillez réessayer.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleShowRecipe = (item: AtelierBook | Cooking) => {
        setSelectedRecipe(item);
        setIsRecipeDialogOpen(true);
    };

    const handleAcceptSuggestion = async (meal: any, date: Date, recipe: string) => {
        if (!user) return;
        try {
            await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/cooking`), {
                userId: user.uid,
                name: meal.name,
                calories: meal.calories || 0,
                cookingTime: meal.cookingTime || '45 min',
                type: meal.type || 'lunch',
                recipe: recipe,
                imageHint: meal.imageHint || meal.name,
                imageUrl: meal.imageUrl,
                createdAt: serverTimestamp(),
                plannedFor: Timestamp.fromDate(date),
            });
            toast({ title: "Grimoire mis à jour", description: `${meal.name} a été ajouté à votre grimoire.` });
            setIsRecipeDialogOpen(false);
        } catch (error) {
            console.error("Error adding to cooking:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter au grimoire." });
        }
    };

    const handleToggleFavorite = async (meal: any) => {
        if (!user) return;
        const recipeId = meal.id || meal.name.replace(/\s/g, '_').toLowerCase();
        const favRef = doc(firestore, 'users', user.uid, 'favoriteRecipes', recipeId);

        const isFav = favorites?.some(f => f.id === recipeId);

        try {
            if (isFav) {
                await deleteDocumentNonBlocking(favRef);
                toast({ title: "Retiré des favoris", description: `${meal.name} n'est plus dans vos favoris.` });
            } else {
                await setDoc(favRef, {
                    id: recipeId,
                    name: meal.name,
                    imageUrl: meal.imageUrl,
                    addedAt: serverTimestamp()
                });
                toast({ title: "Ajouté aux favoris", description: `${meal.name} a été ajouté à vos favoris.` });
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const isLoading = isUserLoading || isLoadingAllMeals || isLoadingGoals || isLoadingBooks || isLoadingUserCooking || !user;

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const sidebarProps = {
        goals: goals,
        setGoals: updateGoals,
        meals: allMeals
    };

    return (
        <SidebarProvider style={{ "--sidebar-width": "20rem" } as React.CSSProperties}>
            <AppSidebar collapsible="icon" className="peer hidden md:block [&>div:last-child]:border-r-0 dark:[&_[data-sidebar=sidebar]]:bg-[#0d0d0d] shadow-none transition-all duration-300" variant="sidebar">
                <Sidebar {...sidebarProps} />
            </AppSidebar>
            <SidebarInset className="bg-background flex flex-col min-h-svh w-full overflow-x-hidden">
                <AppHeader
                    title="Atelier culinaire"
                    icon={<Library className="h-4 w-4" />}
                    user={user}
                    sidebarProps={sidebarProps}
                    className="border-b-0 px-1 md:px-2 dark:bg-[#0d0d0d] bg-background backdrop-blur-none"
                />
                <main className="flex-1 w-full pb-32 md:pb-20">
                    {/* Hero Section - Premium Chef Style (Locked to dark theme) */}
                    <div className="relative w-full overflow-hidden bg-[#0d0d0d] pt-10 md:pt-16 pb-12 md:pb-20 px-4 md:px-8 border-b border-white/5">
                        {/* Radial Glow optimized */}
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(168,124,64,0.15)_0%,_transparent_50%)] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(168,124,64,0.1)_0%,_transparent_50%)] pointer-events-none" />

                        <div className="max-w-6xl mx-auto relative z-10">
                            <div className="flex flex-col space-y-8 md:space-y-12">
                                <div className="space-y-3 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1 text-amber-500/80 tracking-[0.2em] md:tracking-[0.3em] font-black text-[8px] md:text-[12px] uppercase">
                                        <Sparkles className="h-3 w-3 shrink-0" />
                                        <span className="truncate">Atelier culinaire</span>
                                        <Sparkles className="h-3 w-3 shrink-0" />
                                    </div>
                                    <h1 className="text-2xl sm:text-4xl md:text-7xl font-black text-white tracking-tight leading-[1.1] md:leading-[0.9] uppercase break-words">
                                        Devenez un <br className="hidden md:block" />
                                        <span className="italic font-serif text-amber-500/90 font-medium lowercase">vrai chef</span>
                                    </h1>

                                    <p className="text-white/40 text-[9px] md:text-xl font-bold uppercase tracking-widest md:tracking-[0.3em] max-w-full md:max-w-xl mx-auto md:mx-0">
                                        Techniques pro & Secrets exclusifs
                                    </p>
                                </div>

                                {/* Search Bar - Responsive Fix */}
                                <div className="w-full max-w-2xl relative group mx-auto md:mx-0">
                                    <Input
                                        type="text"
                                        placeholder="Recette, ingrédient..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-11 md:h-20 pl-4 md:pl-10 pr-10 md:pr-20 rounded-md md:rounded-[2rem] bg-white/5 border-white/10 text-white text-[10px] md:text-lg focus:bg-white/10 transition-all focus:ring-1 md:focus:ring-2 focus:ring-amber-500/30 placeholder:text-white/20 w-full"
                                    />
                                    <div className="absolute right-3 md:right-10 top-1/2 -translate-y-1/2">
                                        <Search className="h-4 w-4 md:h-7 md:w-7 text-white/30 group-focus-within:text-amber-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="w-full px-4 md:px-6 space-y-8 md:space-y-12 mt-4 md:mt-6">
                        {/* Categories Filter - Pill Style */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide px-1 -mx-1 snap-x select-none">
                            {[
                                { id: 'all', label: 'Tout' },
                                { id: 'favorites', label: 'Favoris' },
                                { id: 'entrée', label: 'Entrées' },
                                { id: 'plat', label: 'Plats' },
                                { id: 'dessert', label: 'Desserts' },
                                { id: 'technique', label: 'Techniques' },
                            ].map((cat) => (
                                <Button
                                    key={cat.id}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "h-9 px-5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shrink-0 border border-border/40 snap-start",
                                        selectedCategory === cat.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {cat.label}
                                </Button>
                            ))}
                        </div>

                        {/* Featured Volumes Section - Premium Horizontal Carousel */}
                        <div className="w-full space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight font-serif text-foreground">À la une</h2>
                                <Link href="/courses" className="text-xs font-bold text-[#8c8279] hover:text-primary transition-colors flex items-center gap-1">
                                    Voir tout <span className="text-lg">→</span>
                                </Link>
                            </div>

                            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                                <CarouselContent className="-ml-3 md:-ml-4">
                                    {books?.slice(0, 3).map((book, idx) => (
                                        <CarouselItem key={book.id} className="pl-3 md:pl-4 basis-[85%] sm:basis-[80%] lg:basis-[48%]">
                                            <div
                                                className="flex flex-row min-h-[120px] md:min-h-[240px] w-full rounded-xl md:rounded-2xl overflow-hidden cursor-pointer shadow-md border border-border bg-card transition-all hover:shadow-xl group"
                                                onClick={() => handleShowRecipe(book)}
                                            >
                                                {/* Left Side: Illustration Area */}
                                                <div className="w-[35%] md:w-[40%] bg-secondary/30 flex items-center justify-center relative p-1.5 md:p-6 shrink-0 border-r border-border/50">
                                                    <div className="relative w-full h-[85%] md:h-full transform transition-all duration-700 group-hover:scale-110 group-hover:-rotate-2 shadow-lg rounded-lg md:rounded-xl overflow-hidden">
                                                        <Image
                                                            src={book.imageUrl}
                                                            alt={book.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 35vw, 20vw"
                                                        />
                                                    </div>
                                                </div>
 
                                                {/* Right Side: Content Area */}
                                                <div className="flex-1 bg-card p-1.5 md:p-8 flex flex-col justify-center relative min-w-0">
                                                    <div className="space-y-0.5 md:space-y-4">
                                                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border-none text-[4px] md:text-[10px] font-black uppercase tracking-widest px-1 py-0.5 rounded-full w-fit">
                                                            {book.category || 'CHEF'}
                                                        </Badge>
 
                                                        <div className="space-y-0.5 min-w-0 text-left">
                                                            <h3 className="text-[9px] md:text-4xl font-black text-foreground font-serif leading-tight line-clamp-2 md:line-clamp-none">
                                                                {book.name}
                                                            </h3>
                                                        </div>
 
                                                        <div className="flex items-center gap-1 text-muted-foreground text-[6px] md:text-sm font-bold mt-1">
                                                            <ClockIcon className="h-1.5 w-1.5 md:h-4 md:w-4" />
                                                            <span>{(book as any).cookingTime || '45 min'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        </div>

                        <Tabs defaultValue="chef_recipes" className="w-full space-y-6 md:space-y-10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/30 pb-4">
                                <TabsList className="h-12 w-full md:w-auto p-1 bg-muted/20 backdrop-blur-md rounded-xl border border-border/40 flex">
                                    <TabsTrigger value="chef_recipes" className="flex-1 md:flex-none px-4 md:px-10 rounded-lg font-black text-[10px] uppercase tracking-normal md:tracking-[0.2em] data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all">
                                        Galerie
                                    </TabsTrigger>
                                    <TabsTrigger value="my_recipes" className="flex-1 md:flex-none px-4 md:px-10 rounded-lg font-black text-[10px] uppercase tracking-normal md:tracking-[0.2em] data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all">
                                        Grimoire
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="my_recipes" className="mt-0 focus-visible:ring-0 outline-none w-full">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
                                    {isLoadingUserCooking ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="aspect-[16/10] w-full bg-muted/50 rounded-lg animate-pulse border border-border/50" />
                                        ))
                                    ) : filteredUserCookingItems.length > 0 ? (
                                        filteredUserCookingItems.map((item) => (
                                            <Card
                                                key={item.id}
                                                className="group relative aspect-[7/10] rounded-lg overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-muted"
                                            >
                                                <div className="absolute inset-0 z-0">
                                                    <Image
                                                        src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/500`}
                                                        alt={item.name}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        className="object-cover transition-all duration-1000 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent group-hover:via-black/40 transition-all duration-500" />
                                                </div>

                                                <CardContent className="relative z-10 h-full flex flex-col justify-end p-4">
                                                    <div className="space-y-1 transform transition-transform duration-500 group-hover:-translate-y-1">
                                                        <Badge className="bg-primary/20 backdrop-blur-sm text-white border-white/10 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm w-fit">
                                                            {item.type || 'Création'}
                                                        </Badge>
                                                        <CardTitle className="text-xs md:text-sm font-black text-white tracking-tight leading-tight uppercase italic font-serif truncate">
                                                            {item.name}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-2 text-white/70 text-[8px] font-black uppercase tracking-widest">
                                                            <div className="flex items-center gap-1">
                                                                <ClockIcon className="h-2.5 w-2.5 text-primary" />
                                                                <span>{item.cookingTime || 'Prêt'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0">
                                                        <Button
                                                            className="w-full h-7 rounded-lg font-black bg-white text-primary border-none shadow-lg hover:bg-white/90 transition-all text-[6px] uppercase tracking-widest"
                                                            onClick={() => handleShowRecipe(item)}
                                                            disabled={!item.recipe}
                                                        >
                                                            <BookOpen className="mr-1 h-2 w-2" />
                                                            Découvrir
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center bg-card border border-border rounded-lg px-6">
                                            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                                                <BookOpen className="h-8 w-8 text-primary/40" />
                                            </div>
                                            <h3 className="text-lg font-black tracking-tight uppercase mb-2">Votre grimoire est vierge</h3>
                                            <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto mb-8">Il est l'heure de commencer votre héritage culinaire.</p>
                                            <Button onClick={() => setIsFormOpen(true)} className="h-10 px-8 rounded-lg font-black shadow-sm uppercase text-[9px] tracking-widest">
                                                Rédiger mon premier volume
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="chef_recipes" className="mt-0 focus-visible:ring-0 outline-none w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
                                    {isLoadingBooks ? (
                                        Array.from({ length: 12 }).map((_, i) => (
                                            <div key={i} className="aspect-[3/4] w-full bg-muted/50 rounded-xl animate-pulse border border-border/50" />
                                        ))
                                    ) : filteredBooks.length > 0 ? (
                                        filteredBooks.map((book) => (
                                            <Card key={book.id} className="group relative rounded-xl border-none transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 overflow-hidden bg-card">
                                                <CardContent className="p-0 h-full flex flex-col">
                                                    {/* Top: Image Section */}
                                                    <div className="relative aspect-square md:aspect-[4/5] w-full overflow-hidden bg-muted">
                                                        <Image
                                                            src={book.imageUrl}
                                                            alt={book.name}
                                                            fill
                                                            className={cn(
                                                                "object-cover transition-all duration-1000 group-hover:scale-110",
                                                                book.price > 0 && "grayscale-[0.4] brightness-[0.8]"
                                                            )}
                                                            sizes="(max-width: 768px) 50vw, 15vw"
                                                        />

                                                        {/* Locked State with cadena.png - Automatic based on price */}
                                                        {book.price > 0 && (
                                                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20">
                                                                <div className="relative w-12 h-12 md:w-16 md:h-16 transform transition-all duration-700 group-hover:scale-110 drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
                                                                    <Image
                                                                        src="/cadena.png"
                                                                        alt="Verrouillé"
                                                                        fill
                                                                        className="object-contain"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Badges/Price on Image */}
                                                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                                                            <Badge className={cn(
                                                                "font-black text-[6px] md:text-[7px] uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-xl border-none",
                                                                book.price === 0 ? "bg-emerald-500 text-white" : "bg-primary text-white"
                                                            )}>
                                                                {book.price === 0 ? 'GRATUIT' : `${book.price} €`}
                                                            </Badge>
                                                        </div>

                                                        <div className="absolute top-2 right-2 z-20">
                                                            <div className="bg-white/90 dark:bg-black/60 backdrop-blur-sm text-primary dark:text-white text-[6px] md:text-[7px] font-black px-2 py-0.5 rounded-sm shadow-lg uppercase tracking-tight">
                                                                {book.category || 'Atelier'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bottom: Info Section */}
                                                    <div className="p-4 md:p-5 flex flex-col space-y-1.5 md:space-y-2 bg-background flex-1">
                                                        <p className="text-[#a87c40] font-black text-[8px] md:text-[9px] uppercase tracking-[0.2em] line-clamp-1">
                                                            {book.hashtags?.[0] || 'GASTRONOMIE'}
                                                        </p>
                                                        <h3 className="text-sm md:text-base font-bold text-foreground font-serif leading-tight line-clamp-2 min-h-[2.4em]">
                                                            {book.name}
                                                        </h3>

                                                        <div className="flex items-center gap-2 mt-auto pt-2">
                                                            <div className="flex items-center gap-1 text-muted-foreground text-[9px] md:text-[11px] font-bold">
                                                                <ClockIcon className="h-3.5 w-3.5 opacity-50" />
                                                                <span>{(book as any).cookingTime || '45 min'}</span>
                                                            </div>
                                                            {/* Level dots */}
                                                            <div className="flex items-center gap-1 ml-auto">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                            </div>
                                                        </div>

                                                        <div className="pt-3">
                                                            <Button
                                                                className={cn("w-full h-8 md:h-9 rounded-lg border-none font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all shadow-md group/btn", book.price > 0 ? "bg-[#a87c40] text-black hover:bg-[#8c6735]" : "bg-emerald-600 text-white hover:bg-emerald-700")}
                                                                onClick={() => handleShowRecipe(book)}
                                                            >
                                                                <span className="flex items-center justify-center gap-1.5">
                                                                    <PlusCircle className="h-3 w-3" />
                                                                    {book.price > 0 ? 'PREMIUM' : 'GRATUIT'}
                                                                </span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="col-span-full h-60 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-lg border border-border px-6 text-center">
                                            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                                <Search className="h-7 w-7 opacity-20" />
                                            </div>
                                            <p className="font-black italic uppercase text-[10px] tracking-widest">Aucune œuvre trouvée par ici</p>
                                            <p className="text-xs mt-2 opacity-50">Tentez une autre recherche ou changez de catégorie.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                    </div>
                </main>
                {
                    selectedRecipe && (
                        <SuggestionDialog
                            suggestion={{
                                id: selectedRecipe.id,
                                name: selectedRecipe.name,
                                calories: 'calories' in selectedRecipe ? selectedRecipe.calories : 0,
                                cookingTime: (selectedRecipe as any).cookingTime || '45 min',
                                type: ('type' in selectedRecipe && (selectedRecipe as any).type ? (selectedRecipe as any).type.toLowerCase() : 'lunch') as any,
                                imageHint: 'imageHint' in selectedRecipe ? (selectedRecipe as any).imageHint || `${selectedRecipe.name}` :
                                    'hashtags' in selectedRecipe ? (selectedRecipe.hashtags as string[]).join(' ') :
                                        `${'category' in selectedRecipe ? (selectedRecipe as any).category : ''} ${'origin' in selectedRecipe ? (selectedRecipe as any).origin : ''}`,
                                imageUrl: selectedRecipe.imageUrl,
                                recipe: 'recipe' in selectedRecipe ? selectedRecipe.recipe : undefined,
                                description: 'description' in selectedRecipe ? selectedRecipe.description : undefined,
                                price: 'price' in selectedRecipe ? (selectedRecipe as any).price : 0,
                            }}
                            isOpen={isRecipeDialogOpen}
                            onClose={() => {
                                setIsRecipeDialogOpen(false);
                                setSelectedRecipe(null);
                            }}
                            onAccept={handleAcceptSuggestion}
                            isFavorite={favorites?.some(f => f.id === (selectedRecipe?.id || selectedRecipe?.name?.replace(/\s/g, '_').toLowerCase()))}
                            onToggleFavorite={handleToggleFavorite}
                            mode="recipe"
                        />
                    )
                }
            </SidebarInset >
        </SidebarProvider >
    );
}
