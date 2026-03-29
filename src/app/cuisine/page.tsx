'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    SidebarProvider,
    Sidebar as AppSidebar,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, limit, updateDoc, Timestamp, orderBy, getDoc, increment, setDoc, serverTimestamp, where, getDocs, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Meal, AIPersonality, SingleMealSuggestion, Dish, Cooking, PendingCooking, UserProfile, SuggestSingleMealInput } from '@/lib/types';
import { Trash2, Loader2, ChefHat, Search, Clock as ClockIcon, MapPin, AlarmClock, Bot, PlusCircle, Sprout, Calendar, Calendar as CalendarIcon, History, Hourglass, Sparkles, X, UtensilsCrossed, CookingPot, BookOpen, ZoomIn, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/layout/app-header';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSingleMealSuggestionAction, getRecommendedDishesAction, trackInteractionAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { ImageZoomLightbox } from '@/components/shared/image-zoom-lightbox';
import { SuggestionDialog } from '@/components/cuisine/suggestion-dialog';
import { CookingMode } from '@/components/cuisine/cooking-mode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { format, isPast, startOfToday, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WhoIsCooking } from '@/components/cuisine/who-is-cooking';
import { useReadOnly } from '@/contexts/read-only-context';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/shared/page-wrapper';
import { openDishPreview } from '@/components/shared/global-dish-preview';

type TimeOfDay = 'matin' | 'midi' | 'soir' | 'dessert';

const getContextualInfo = (hour: number): { message: string, image: string, timeOfDay: TimeOfDay } => {
    if (hour >= 5 && hour < 10) {
        return {
            message: "C'est l'heure du petit-déjeuner ! Préparez quelque chose de nutritif pour bien commencer la journée.",
            image: "/matin.png",
            timeOfDay: 'matin'
        };
    }
    if (hour >= 10 && hour < 12) {
        return {
            message: 'La matinée est bien avancée, pensez à vous hydrater. Bientôt l\'heure du déjeuner !',
            image: "/midi.png",
            timeOfDay: 'midi'
        };
    }
    if (hour >= 12 && hour < 14) {
        return {
            message: 'Bon appétit ! Profitez de votre pause déjeuner.',
            image: "/midi.png",
            timeOfDay: 'midi'
        };
    }
    if (hour >= 14 && hour < 16) {
        return {
            message: "L'après-midi commence. Un petit café ou un thé pour rester concentré ?",
            image: "/colation.png",
            timeOfDay: 'dessert'
        };
    }
    if (hour >= 16 && hour < 18) {
        return {
            message: "C'est l'heure du goûter ! Un fruit ou quelques noix pour recharger les batteries ?",
            image: "/colation.png",
            timeOfDay: 'dessert'
        };
    }
    if (hour >= 18 && hour < 20) {
        return {
            message: 'Que diriez-vous de commencer à préparer un bon dîner ?',
            image: "/soir.png",
            timeOfDay: 'soir'
        };
    }
    if (hour >= 20 && hour < 22) {
        return {
            message: 'Passez une bonne soirée. Un repas léger est idéal avant de se coucher.',
            image: "/soir.png",
            timeOfDay: 'soir'
        };
    }
    return {
        message: 'Planifiez vos repas, mangez sainement, et profitez de chaque bouchée !',
        image: "/soir.png",
        timeOfDay: 'soir'
    };
};

const tabDetails = {
    suggestions: { title: 'Inspiration', icon: <Sparkles className="h-4 w-4" /> },
    pending: { title: 'En attente', icon: <Hourglass className="h-4 w-4" /> },
    in_progress: { title: 'En cuisine', icon: <CookingPot className="h-4 w-4" /> },
    history: { title: 'Archives', icon: <History className="h-4 w-4" /> },
};

type TabValue = keyof typeof tabDetails;

export default function CuisinePage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const { isReadOnly, triggerBlock, guardAction } = useReadOnly();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<TabValue>('suggestions');

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<SingleMealSuggestion | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [pendingItemToCook, setPendingItemToCook] = useState<PendingCooking | null>(null);
    const [recommendations, setRecommendations] = useState<(Dish & { matchReason?: string })[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [cookingModeItem, setCookingModeItem] = useState<Cooking | null>(null);
    const [pendingActionItem, setPendingActionItem] = useState<PendingCooking | null>(null);
    const [tabFlash, setTabFlash] = useState(false);
    const [dismissingId, setDismissingId] = useState<string | null>(null);
    const [dismissingCookingId, setDismissingCookingId] = useState<string | null>(null);

    const processedMissedIdsRef = useRef<Set<string>>(new Set());

    // --- Data Fetching from Firestore ---
    const dishesCollectionRef = useMemoFirebase(() => query(collection(firestore, 'dishes'), where('isVerified', '==', true)), [firestore]);
    const { data: dishes, isLoading: isLoadingDishes } = useCollection<Dish>(dishesCollectionRef);

    // --- User Profile ---
    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    const effectiveChefId = userProfile?.chefId || user?.uid;
    const effectiveChefProfileRef = useMemoFirebase(() => (effectiveChefId ? doc(firestore, 'users', effectiveChefId) : null), [effectiveChefId, firestore]);
    const { data: effectiveChefProfile } = useDoc<UserProfile>(effectiveChefProfileRef);

    const cookingCollectionRef = useMemoFirebase(() => (effectiveChefId ? collection(firestore, `users/${effectiveChefId}/cooking`) : null), [effectiveChefId, firestore]);
    const cookingQuery = useMemoFirebase(() => (cookingCollectionRef ? query(cookingCollectionRef, orderBy('plannedFor', 'desc')) : null), [cookingCollectionRef]);
    const { data: cookingItems, isLoading: isLoadingCookingItems } = useCollection<Cooking>(cookingQuery);
    const [selectedCookingItem, setSelectedCookingItem] = useState<Cooking | null>(null);
    const [isViewOnlySuggestion, setIsViewOnlySuggestion] = useState(false);

    const pendingCookingCollectionRef = useMemoFirebase(() => (effectiveChefId ? collection(firestore, `users/${effectiveChefId}/pendingCookings`) : null), [effectiveChefId, firestore]);
    const pendingCookingQuery = useMemoFirebase(() => (pendingCookingCollectionRef ? query(pendingCookingCollectionRef, orderBy('createdAt', 'desc')) : null), [pendingCookingCollectionRef]);
    const { data: pendingCookingItems, isLoading: isLoadingPendingItems } = useCollection<PendingCooking>(pendingCookingQuery);

    const favoritesCollectionRef = useMemoFirebase(() => (user ? collection(firestore, 'users', user.uid, 'favoriteRecipes') : null), [user, firestore]);
    const { data: favorites } = useCollection<{ id: string }>(favoritesCollectionRef);

    const currentDayStr = currentTime ? format(currentTime, 'yyyy-MM-dd') : null;

    const { cookingInProgress, pastCookingItems } = useMemo(() => {
        if (!cookingItems) {
            return { cookingInProgress: [], pastCookingItems: [] };
        }
        const today = startOfToday();
        const inProgress: Cooking[] = [];
        const past: Cooking[] = [];

        cookingItems.forEach(item => {
            const plannedDate = item.plannedFor?.toDate();
            if (!plannedDate) return;

            const isDayPast = isPast(plannedDate) && !format(plannedDate, 'yyyy-MM-dd').includes(format(today, 'yyyy-MM-dd'));

            if (item.isDone || isDayPast) {
                past.push(item);
            } else {
                inProgress.push(item);
            }
        });

        inProgress.sort((a, b) => (a.plannedFor?.toDate() ?? 0) > (b.plannedFor?.toDate() ?? 0) ? 1 : -1);

        return { cookingInProgress: inProgress, pastCookingItems: past };
    }, [cookingItems, currentDayStr]);

    const dishCategories = useMemo(() => {
        if (!dishes) return [];
        return [...new Set(dishes.map(d => d.category))];
    }, [dishes]);

    const filteredDishes = useMemo(() => {
        if (!dishes) return [];

        let result = dishes;

        if (selectedCategory && selectedCategory !== 'all') {
            result = result.filter(dish => dish.category === selectedCategory);
        }

        if (searchTerm) {
            result = result.filter(dish =>
                dish.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return result;
    }, [dishes, searchTerm, selectedCategory]);

    const { message: contextualMessage, image: contextualImage, timeOfDay } = currentTime ? getContextualInfo(currentTime.getHours()) : { message: 'Chargement...', image: "/soir.png", timeOfDay: 'soir' as TimeOfDay };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            const tab = queryParams.get('tab');
            if (tab && tabDetails[tab as TabValue]) {
                setActiveTab(tab as TabValue);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && dishes && dishes.length > 0) {
            const queryParams = new URLSearchParams(window.location.search);
            const cookDishName = queryParams.get('cook');
            if (cookDishName) {
                // 1. Chercher dans les plats programmés
                const programmed = cookingInProgress.find(d => d.name.toLowerCase() === cookDishName.toLowerCase());
                if (programmed) {
                    setCookingModeItem(programmed);
                } else {
                    // 2. Chercher dans les plats en attente
                    const pending = pendingCookingItems?.find(d => d.name.toLowerCase() === cookDishName.toLowerCase());
                    if (pending) {
                        setCookingModeItem({
                            ...pending,
                            plannedFor: Timestamp.now(),
                            isDone: false,
                            servings: userProfile?.household?.length ? userProfile.household.length + 1 : 1
                        } as Cooking);
                    } else {
                        // 3. Chercher dans le catalogue global
                        const dish = dishes.find(d => d.name.toLowerCase() === cookDishName.toLowerCase());
                        if (dish) {
                            setCookingModeItem({
                                ...dish,
                                plannedFor: Timestamp.now(),
                                isDone: false,
                                servings: userProfile?.household?.length ? userProfile.household.length + 1 : 1
                            } as unknown as Cooking);
                        }
                    }
                }
                
                // Clear the param from URL without refreshing
                const newUrl = window.location.pathname + (window.location.hash || '');
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [dishes, cookingInProgress, pendingCookingItems, userProfile]);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Effect to handle missed meals
    useEffect(() => {
        if (!effectiveChefId || !userProfileRef || !pastCookingItems.length) return;
        
        // Filter out items that are already being processed by this Ref to avoid "burst toasts"
        const missedItems = pastCookingItems.filter(item => 
            !item.isDone && 
            !(item as any).isMissedProcessed && 
            !processedMissedIdsRef.current.has(item.id)
        );

        if (missedItems.length > 0) {
            // Track these IDs immediately
            missedItems.forEach(item => processedMissedIdsRef.current.add(item.id));

            const processMissedMeals = async () => {
                const totalXpPenalty = -5 * missedItems.length;
                
                // Marquer tout comme traité
                missedItems.forEach(item => {
                    const ref = doc(firestore, 'users', effectiveChefId, 'cooking', item.id);
                    updateDoc(ref, { isMissedProcessed: true }).catch(console.error);
                });

                try {
                    const userDoc = await getDoc(userProfileRef);
                    if (userDoc.exists()) {
                        const currentXp = userDoc.data()?.xp ?? 0;
                        const newXp = Math.max(0, currentXp + totalXpPenalty);
                        const newLevel = Math.floor(newXp / 500) + 1;
                        await updateDoc(userProfileRef, { xp: newXp, level: newLevel });
                        
                        const title = missedItems.length === 1 ? 'Repas manqué' : 'Repas manqués';
                        const description = missedItems.length === 1 
                            ? `Oups ! Vous n'avez pas cuisiné "${missedItems[0].name}" dernièrement. -5 XP.` 
                            : `Oups ! Vous avez manqué ${missedItems.length} repas récemment. ${totalXpPenalty} XP.`;
                            
                        toast({
                            variant: 'destructive',
                            title: title,
                            description: description
                        });
                    }
                } catch (e) {
                    console.error("Failed to deduct XP for missed meals", e);
                }
            };
            
            processMissedMeals();
        }
    }, [pastCookingItems, effectiveChefId, userProfileRef, toast, firestore]);

    useEffect(() => {
        const fetchRecs = async () => {
            if (!user) return;
            setIsLoadingRecs(true);
            const mappedTimeOfDay =
                timeOfDay === 'matin' ? 'breakfast' :
                    timeOfDay === 'midi' ? 'lunch' :
                        timeOfDay === 'soir' ? 'dinner' : 'dessert';

            const { recommendations: recs, error } = await getRecommendedDishesAction({
                userId: user.uid,
                count: 6,
                timeOfDay: mappedTimeOfDay as any
            });

            if (recs && recs.length > 0) {
                setRecommendations(recs as any);
            } else if (dishes && dishes.length > 0) {
                // Fallback to random dishes from catalogue if AI fails or has no recommendations
                const fallbackDishes = [...dishes].sort(() => 0.5 - Math.random()).slice(0, 3).map(d => ({
                    ...d,
                    matchReason: 'Découverte du catalogue'
                }));
                // Wait for dishes to be populated
                setRecommendations(fallbackDishes as any);
            }
            setIsLoadingRecs(false);
        };
        if (user && dishes && dishes.length > 0) {
            fetchRecs();
        } else if (user && (!dishes || dishes.length === 0)) {
            // Allow initial skeleton load while dishes load
        }
    }, [user, timeOfDay, dishes]);

    // --- Data fetching for sidebar and AI ---
    const allMealsCollectionRef = useMemoFirebase(
        () => (effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'foodLogs') : null),
        [effectiveChefId, firestore]
    );

    const allMealsQuery = useMemoFirebase(
        () => allMealsCollectionRef ? query(allMealsCollectionRef, orderBy('date', 'desc'), limit(15)) : null,
        [allMealsCollectionRef]
    );

    const { data: allMeals, isLoading: isLoadingAllMeals } = useCollection<Meal>(allMealsQuery);

    const mealHistory = useMemo(() => allMeals?.map(meal => meal.name) || [], [allMeals]);

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
    const [goalId, setGoalId] = useState<string | null>(null);

    useEffect(() => {
        if (goalsData) {
            if (goalsData.length > 0 && goalsData[0]) {
                setGoals(goalsData[0].description);
                setGoalId(goalsData[0].id);
            } else if (user && !isLoadingGoals) {
                const defaultGoal = {
                    userId: user.uid,
                    description: 'Perdre du poids, manger plus sainement et réduire ma consommation de sucre.',
                    targetValue: 2000,
                    timeFrame: 'daily',
                };
                addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'goals'), defaultGoal);
            }
        }
    }, [goalsData, user, isLoadingGoals, firestore]);

    const updateGoals = (newDescription: string) => {
        if (isReadOnly) { triggerBlock(); return; }
        setGoals(newDescription);
        if (goalId && effectiveChefId) {
            const goalRef = doc(firestore, 'users', effectiveChefId, 'goals', goalId);
            updateDoc(goalRef, { description: newDescription }).catch(console.error);
        }
    }

    const handleGetSuggestion = async (pendingItem?: PendingCooking) => {
        setIsSuggesting(true);
        setSuggestion(null);
        setPendingItemToCook(null);
        setIsViewOnlySuggestion(false);

        const mealName = pendingItem?.name;
        const imageHint = pendingItem?.imageHint;

        if (pendingItem) {
            setPendingItemToCook(pendingItem);
        } else {
            setPendingItemToCook(null);
        }

        try {
            let personality: AIPersonality | undefined;
            if (userProfile?.isAITrainingEnabled) {
                personality = {
                    tone: userProfile.tone,
                    mainObjective: userProfile.mainObjective,
                    allergies: userProfile.allergies,
                    preferences: userProfile.preferences,
                };
            }

            const { suggestion: newSuggestion, error } = await getSingleMealSuggestionAction({
                timeOfDay: timeOfDay as SuggestSingleMealInput['timeOfDay'],
                dietaryGoals: goals,
                personality: personality,
                mealHistory: mealHistory,
            });

            if (error) throw new Error(error);

            const finalSuggestion = {
                ...newSuggestion,
                name: mealName || newSuggestion!.name,
                imageHint: imageHint || newSuggestion!.imageHint,
                imageUrl: newSuggestion!.imageUrl,
                recipe: newSuggestion!.recipe,
            } as SingleMealSuggestion

            setSuggestion(finalSuggestion);

            if (finalSuggestion) {
                setIsDialogOpen(true);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de générer une suggestion." });
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleShowRecipeForDish = (dish: Dish) => {
        setSuggestion({
            id: dish.id,
            name: dish.name,
            calories: dish.calories || 450,
            cookingTime: dish.cookingTime,
            type: (dish.type?.toLowerCase() || 'lunch') as SingleMealSuggestion['type'],
            imageHint: `${dish.category} ${dish.origin}`,
            imageUrl: dish.imageUrl,
            recipe: dish.recipe,
        });
        setPendingItemToCook(null);
        setIsViewOnlySuggestion(false);
        setIsDialogOpen(true);

        if (user) {
            trackInteractionAction(user.uid, dish.name, dish.origin, dish.category, 'view');
        }
    };

    const handleAcceptSuggestion = guardAction(async (meal: SingleMealSuggestion, date: Date, recipe: string) => {
        if (!effectiveChefId || !userProfileRef) return;

        const XP_PER_LEVEL = 500;
        const xpGained = (meal as any).xpGained || 10;

        const relatedDish = dishes?.find(d => d.name === meal.name);
        if (user) {
            trackInteractionAction(
                user.uid,
                meal.name,
                relatedDish?.origin || 'Inconnue',
                relatedDish?.category || 'Inconnue',
                'cook_complete'
            );
        }

        // Conflict prevention: remove existing meal of same type for the same day
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const mealsRef = collection(firestore, 'users', effectiveChefId!, 'foodLogs');
        const cookingRef = collection(firestore, 'users', effectiveChefId!, 'cooking');

        const qMeals = query(mealsRef, where('date', '>=', Timestamp.fromDate(dayStart)), where('date', '<=', Timestamp.fromDate(dayEnd)), where('type', '==', meal.type));
        const qCooking = query(cookingRef, where('plannedFor', '>=', Timestamp.fromDate(dayStart)), where('plannedFor', '<=', Timestamp.fromDate(dayEnd)), where('type', '==', meal.type));

        const [mSnap, cSnap] = await Promise.all([getDocs(qMeals), getDocs(qCooking)]);

        // Execute deletions
        const deletePromises: Promise<void>[] = [];
        mSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        cSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        await Promise.all(deletePromises);

        addDocumentNonBlocking(mealsRef, {
            userId: user?.uid,
            name: meal.name,
            calories: meal.calories,
            type: meal.type,
            imageUrl: meal.imageUrl || '',
            date: Timestamp.fromDate(date)
        });

        addDocumentNonBlocking(cookingRef, {
            userId: user?.uid,
            name: meal.name,
            calories: meal.calories,
            cookingTime: meal.cookingTime,
            type: meal.type,
            recipe: recipe,
            imageHint: meal.imageHint,
            imageUrl: meal.imageUrl,
            createdAt: Timestamp.now(),
            plannedFor: Timestamp.fromDate(date),
        });

        try {
            const targetProfileRef = effectiveChefProfileRef || userProfileRef;
            if (!targetProfileRef) return;

            const targetDoc = await getDoc(targetProfileRef);
            const currentXp = targetDoc.data()?.xp ?? 0;
            const newXp = currentXp + xpGained;
            const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

            await updateDoc(targetProfileRef, {
                xp: increment(xpGained),
                level: newLevel
            });
        } catch (error) {
            console.error("Error updating user XP:", error);
        }

        if (pendingItemToCook) {
            const pendingDocRef = doc(firestore, 'users', effectiveChefId!, 'pendingCookings', pendingItemToCook.id);
            deleteDocumentNonBlocking(pendingDocRef);
            setPendingItemToCook(null);
        }

        toast({
            title: "Repas ajouté !",
            description: `${meal.name} a été ajouté à votre journal. +${xpGained} XP !`
        });
        setSuggestion(null);
        setIsDialogOpen(false);
    });

    const handleSelectCookingItem = (item: Cooking | null) => {
        setSelectedCookingItem(item);
        if (item) {
            const plannedDate = item.plannedFor.toDate();
            const isPlannedForPast = isPast(plannedDate) && !format(plannedDate, 'yyyy-MM-dd').includes(format(new Date(), 'yyyy-MM-dd'));

            if (isPlannedForPast) setActiveTab('history');
            else setActiveTab('in_progress');
        }
    }

    const animateAndRemovePending = (itemId: string, afterAnim: () => void) => {
        setDismissingId(itemId);
        setTimeout(() => {
            afterAnim();
            setDismissingId(null);
        }, 420);
    };

    const handleCookingItemDone = guardAction(async (item: Cooking) => {
        if (!effectiveChefId || !user) return;
        // Animate card out then MARK AS DONE in Firestore to move it to Archives
        setDismissingCookingId(item.id);
        setTimeout(async () => {
            if (effectiveChefId) {
                // Règle Ultime: Quand un plat est fait, on l'ajoute au journal alimentaitre (foodLogs)
                const mealsRef = collection(firestore, 'users', effectiveChefId, 'foodLogs');
                addDocumentNonBlocking(mealsRef, {
                    userId: user?.uid,
                    name: item.name,
                    calories: item.calories,
                    type: item.type,
                    imageUrl: item.imageUrl || '',
                    date: Timestamp.now()
                });

                const ref = doc(firestore, 'users', effectiveChefId, 'cooking', item.id);
                updateDoc(ref, { isDone: true }).catch(console.error);

                const xpGained = 15;
                const targetProfileRef = effectiveChefProfileRef || userProfileRef;
                if (targetProfileRef) {
                    getDoc(targetProfileRef).then(targetDoc => {
                        const currentXp = targetDoc.data()?.xp ?? 0;
                        const newXp = currentXp + xpGained;
                        const newLevel = Math.floor(newXp / 500) + 1;
                        updateDoc(targetProfileRef, { xp: increment(xpGained), level: newLevel });
                        toast({ title: 'Repas terminé !', description: `Vous avez cuisiné ${item.name}. +${xpGained} XP pour le foyer !` });
                    }).catch(console.error);
                }
            }
            setDismissingCookingId(null);
            setCookingModeItem(null);
        }, 450);
    });

    const handleDeleteCookingItem = guardAction(async (item: Cooking) => {
        if (!effectiveChefId) return;

        setDismissingCookingId(item.id);
        setTimeout(() => {
            const ref = doc(firestore, 'users', effectiveChefId, 'cooking', item.id);
            deleteDocumentNonBlocking(ref);
            setDismissingCookingId(null);
            toast({
                title: "Repas retiré",
                description: `${item.name} a été retiré de la cuisine.`,
            });
        }, 450);
    });

    const handleDeletePendingItem = guardAction(async (itemId: string) => {
        if (!effectiveChefId) return;
        animateAndRemovePending(itemId, () => {
            const itemRef = doc(firestore, 'users', effectiveChefId, 'pendingCookings', itemId);
            deleteDocumentNonBlocking(itemRef);
            toast({
                variant: "destructive",
                title: "Repas retiré",
                description: "Le repas a été retiré de la liste d'attente.",
            });
        });
    });

    const handlePreviewPendingItem = async (item: PendingCooking, viewOnly: boolean = false) => {
        // Find the dish in the master list if possible to get more details (robust search)
        const masterDish = dishes?.find(d =>
            d.name.toLowerCase().trim() === item.name.toLowerCase().trim()
        );

        setSuggestion({
            id: masterDish?.id || item.id,
            name: item.name,
            calories: masterDish?.calories || 450,
            cookingTime: masterDish?.cookingTime || '30 min',
            type: (masterDish?.type?.toLowerCase() || 'lunch') as SingleMealSuggestion['type'],
            imageHint: masterDish?.imageHint || item.imageHint || item.name,
            imageUrl: masterDish?.imageUrl || '',
            recipe: masterDish?.recipe || '',
        });
        setPendingItemToCook(item);
        setIsViewOnlySuggestion(viewOnly);
        setIsDialogOpen(true);
    };

    const handlePreviewCookingItem = (item: Cooking) => {
        setSuggestion({
            id: item.id,
            name: item.name,
            calories: item.calories,
            cookingTime: item.cookingTime,
            type: item.type as any,
            imageHint: item.imageHint,
            imageUrl: item.imageUrl || '',
            recipe: item.recipe || '',
        });
        setPendingItemToCook(null);
        setIsViewOnlySuggestion(true);
        setIsDialogOpen(true);
    };

    const handleCookNow = guardAction(async (item: PendingCooking) => {
        if (!user || !effectiveChefId) return;

        // Find master dish for more info (robust search)
        const masterDish = dishes?.find(d =>
            d.name.toLowerCase().trim() === item.name.toLowerCase().trim()
        );

        try {
            const mealType = masterDish?.type || 'lunch';
            const dayStart = startOfDay(new Date());
            const dayEnd = endOfDay(new Date());

            const mealsRef = collection(firestore, 'users', effectiveChefId, 'foodLogs');
            const cookingRef = collection(firestore, 'users', effectiveChefId, 'cooking');

            const qMeals = query(mealsRef, where('date', '>=', Timestamp.fromDate(dayStart)), where('date', '<=', Timestamp.fromDate(dayEnd)), where('type', '==', mealType));
            const qCooking = query(cookingRef, where('plannedFor', '>=', Timestamp.fromDate(dayStart)), where('plannedFor', '<=', Timestamp.fromDate(dayEnd)), where('type', '==', mealType));

            const [mSnap, cSnap] = await Promise.all([getDocs(qMeals), getDocs(qCooking)]);

            const deletePromises: Promise<void>[] = [];
            mSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
            cSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
            await Promise.all(deletePromises);

            await addDocumentNonBlocking(cookingRef, {
                userId: user.uid,
                name: item.name,
                calories: masterDish?.calories || 0,
                cookingTime: masterDish?.cookingTime || '',
                type: masterDish?.type || 'lunch',
                recipe: masterDish?.recipe || '',
                imageHint: item.imageHint || item.name,
                imageUrl: masterDish?.imageUrl || '',
                createdAt: serverTimestamp(),
                plannedFor: Timestamp.fromDate(new Date()),
            });
            // Delete from pending with animation
            animateAndRemovePending(item.id, () => {
                const pendingRef = doc(firestore, 'users', effectiveChefId, 'pendingCookings', item.id);
                deleteDocumentNonBlocking(pendingRef);
            });

            setPendingActionItem(null);
            toast({ title: "🍳 Envoyé en cuisine !", description: `${item.name} est maintenant dans votre cuisine.` });

            // Flash animation then switch tab
            setTabFlash(true);

            // Track interaction
            if (user) {
                const masterDish = dishes?.find(d => d.name === item.name);
                trackInteractionAction(
                    user.uid,
                    item.name,
                    masterDish?.origin || 'Inconnue',
                    masterDish?.category || 'Inconnue',
                    'cook_start'
                );
            }

            setTimeout(() => {
                setActiveTab('in_progress');
                setTabFlash(false);
            }, 800);
        } catch (error) {
            console.error('Error cooking now:', error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'envoyer en cuisine.' });
        }
    });

    const handleToggleFavorite = guardAction(async (meal: any) => {
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
    });

    const handleAddToPendingDish = guardAction(async (meal: SingleMealSuggestion) => {
        if (!user || !effectiveChefId) return;

        try {
            await addDocumentNonBlocking(collection(firestore, 'users', effectiveChefId, 'pendingCookings'), {
                userId: user.uid,
                name: meal.name,
                imageHint: meal.imageHint,
                createdAt: serverTimestamp(),
            });

            // Track interaction
            if (user) {
                const masterDish = dishes?.find(d => d.name === meal.name);
                trackInteractionAction(
                    user.uid,
                    meal.name,
                    masterDish?.origin || (meal as any).origin || 'Inconnue',
                    masterDish?.category || (meal as any).category || 'Inconnue',
                    'view' // Add to pending is a high interest view
                );
            }

            toast({
                title: "Mis en attente",
                description: `${meal.name} est maintenant dans votre liste d'attente.`,
            });
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error adding to pending:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre le plat en attente." });
        }
    });

    const handlePlanDish = guardAction(async (meal: SingleMealSuggestion, date: Date, slot: 'breakfast' | 'lunch' | 'dinner' | 'dessert') => {
        if (!user || !effectiveChefId) return;

        try {
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);

            const mealsRef = collection(firestore, 'users', effectiveChefId, 'foodLogs');
            const cookingRef = collection(firestore, 'users', effectiveChefId, 'cooking');

            const qMeals = query(mealsRef, where('date', '>=', Timestamp.fromDate(dayStart)), where('date', '<=', Timestamp.fromDate(dayEnd)), where('type', '==', slot));
            const qCooking = query(cookingRef, where('plannedFor', '>=', Timestamp.fromDate(dayStart)), where('plannedFor', '<=', Timestamp.fromDate(dayEnd)), where('type', '==', slot));

            const [mSnap, cSnap] = await Promise.all([getDocs(qMeals), getDocs(qCooking)]);

            const deletePromises: Promise<void>[] = [];
            mSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
            cSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
            await Promise.all(deletePromises);

            const conflict = cSnap.size > 0 || mSnap.size > 0;

            await addDocumentNonBlocking(cookingRef, {
                userId: user.uid,
                name: meal.name,
                calories: meal.calories || 0,
                cookingTime: meal.cookingTime || '30 min',
                type: slot,
                imageHint: meal.imageHint || meal.name,
                imageUrl: meal.imageUrl || '',
                recipe: meal.recipe || '',
                plannedFor: Timestamp.fromDate(date),
                createdAt: serverTimestamp(),
            });

            // Track interaction
            if (user) {
                const masterDish = dishes?.find(d => d.name === meal.name);
                trackInteractionAction(
                    user.uid,
                    meal.name,
                    masterDish?.origin || (meal as any).origin || 'Inconnue',
                    masterDish?.category || (meal as any).category || 'Inconnue',
                    'cook_start'
                );
            }

            // If we came from pending, remove it
            if (pendingItemToCook) {
                const pendingRef = doc(firestore, 'users', effectiveChefId, 'pendingCookings', pendingItemToCook.id);
                deleteDocumentNonBlocking(pendingRef);
                setPendingItemToCook(null);
            }

            toast({
                title: conflict ? "Repas remplacé" : "Repas programmé",
                description: `${meal.name} est maintenant prévu pour le ${format(date, 'd MMMM', { locale: fr })} (${slot}).`,
            });
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error planning dish:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de programmer le repas." });
        }
    });

    const tabsRef = useRef<HTMLDivElement>(null);

    const todayStr_fixed = currentTime ? format(currentTime, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    const mealsToday = useMemo(() => cookingInProgress.filter(item => {
        const plannedDate = item.plannedFor?.toDate();
        if (!plannedDate) return false;
        return format(plannedDate, 'yyyy-MM-dd') === todayStr_fixed;
    }), [cookingInProgress, todayStr_fixed]);

    const mealsUpcoming = useMemo(() => cookingInProgress.filter(item => {
        const plannedDate = item.plannedFor?.toDate();
        if (!plannedDate) return false;
        return format(plannedDate, 'yyyy-MM-dd') > todayStr_fixed;
    }), [cookingInProgress, todayStr_fixed]);

    const isLoading = isUserLoading || isLoadingAllMeals || isLoadingGoals || isLoadingProfile || isLoadingDishes || isLoadingCookingItems || isLoadingPendingItems;

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const sidebarProps = {
        goals,
        setGoals: updateGoals,
        meals: allMeals ?? [],
    };

    const renderCookingCard = (item: Cooking) => (
        <div
            key={item.id}
            style={{
                transition: 'transform 0.45s cubic-bezier(0.36,0.07,0.19,0.97), opacity 0.45s ease',
                transform: dismissingCookingId === item.id ? 'translateY(130%) rotate(-4deg) scale(0.75)' : 'translateY(0) rotate(0deg) scale(1)',
                opacity: dismissingCookingId === item.id ? 0 : 1,
                pointerEvents: dismissingCookingId === item.id ? 'none' : 'auto',
            }}
        >
            <Card
                className="group flex flex-col rounded-xl border border-border/50 shadow-sm hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden"
            >
                <div
                    className="relative aspect-[16/9] bg-muted overflow-hidden cursor-pointer"
                    onClick={() => handleSelectCookingItem(item)}
                >
                    <Image
                        src={item.imageUrl || `https://picsum.photos/seed/${item.name.replace(/\s/g, '-')}/400/250`}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                        <Badge className="bg-primary/90 text-white text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 animate-pulse shadow-lg shadow-primary/30">
                            🍳 En cuisine
                        </Badge>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCookingItem(item);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 backdrop-blur-md text-white/70 hover:bg-rose-500 hover:text-white transition-all border border-white/10 z-10"
                        title="Retirer ce repas"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-3 left-3">
                        <p className="text-white font-black text-base leading-tight drop-shadow">{item.name}</p>
                    </div>
                </div>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-3 w-3" />
                            <span>{item.cookingTime || 'Prêt'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>{item.plannedFor ? format(item.plannedFor.toDate(), 'd MMM', { locale: fr }) : 'Chef'}</span>
                        </div>
                    </div>
                    <Button
                        onClick={() => guardAction(setCookingModeItem)(item)}
                        className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest bg-primary text-white border border-primary shadow-lg hover:bg-primary/90 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="text-lg mr-2">👨‍🍳</span>
                        Cuisine moi !
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar collapsible="icon" className="w-64 peer hidden md:block border-r bg-sidebar">
                <Sidebar {...sidebarProps} />
            </AppSidebar>
            <SidebarInset className="bg-background flex flex-col h-screen">
                <AppHeader
                    title="Cuisine"
                    icon={<ChefHat className="h-4 w-4" />}
                    user={user}
                    sidebarProps={sidebarProps}
                />
                <PageWrapper className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden w-full bg-background relative">
                    <Tabs value={activeTab} onValueChange={(value) => {
                        setSelectedCookingItem(null);
                        setActiveTab(value as TabValue);
                    }} className="flex-1 flex flex-col">
                        <div className="max-w-6xl mx-auto w-full py-4 md:py-6 space-y-0">

                            {/* Header Section */}
                            <div className="space-y-3 px-4 md:px-8 pb-4 pt-20 md:pt-24">
                                <div className="relative w-14 h-14 md:w-16 md:h-16 mb-2 select-none">
                                    <Image
                                        src={contextualImage}
                                        alt="Context Icon"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                                <h1 className="text-2xl md:text-4xl font-black tracking-tight">Espace Cuisine</h1>
                                <p className="text-muted-foreground text-xs md:text-sm max-w-2xl hidden sm:block">
                                    Planifiez vos repas, explorez de nouveaux plats et suivez votre historique culinaire. {contextualMessage}
                                </p>
                            </div>
                        </div>

                        {/* ── PERMANENTLY STABLE FIXED TABS DOCK ── */}
                        {/* Fixed below the h-14 header (top-14) to avoid overlapping the brand navigation */}
                        <div className="fixed top-14 left-0 md:left-64 right-0 z-[45] pointer-events-none transform-gpu transition-[left] duration-300">
                            {/* Visual mask matching header backdrop offset to top-14 */}
                            <div className="absolute inset-x-0 bottom-0 top-0 bg-background/80 backdrop-blur-xl border-b border-border/40 -z-10" />

                            <div className="pointer-events-auto pt-4 pb-4 w-full flex justify-center px-4 max-w-6xl mx-auto">
                                <div className="bg-background/80 backdrop-blur-xl border border-border/40 shadow-2xl rounded-2xl p-1.5 flex items-center max-w-full relative transition-all shadow-primary/5">
                                    <div className="overflow-x-auto scrollbar-hide flex items-center w-full overscroll-x-contain">
                                        <TabsList className="h-9 bg-transparent border-none flex w-max flex-nowrap shrink-0 gap-1.5 px-0.5 items-center">
                                            {Object.entries(tabDetails).map(([value, { title, icon }]) => (
                                                <TabsTrigger
                                                    key={value}
                                                    value={value}
                                                    className="h-8 px-4 rounded-xl font-bold text-[10px] md:text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95"
                                                >
                                                    <span className="opacity-70">{icon}</span>
                                                    {title}
                                                </TabsTrigger>
                                            ))}

                                            {activeTab === 'suggestions' && (
                                                <div className="flex items-center pl-1 ml-1 border-l border-border/50 h-6 shrink-0">
                                                    <Button
                                                        onClick={() => isReadOnly ? triggerBlock() : handleGetSuggestion()}
                                                        disabled={isSuggesting}
                                                        size="sm"
                                                        className="h-8 px-4 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl shadow-md bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white active:scale-95 transition-all flex items-center gap-1.5 border-none"
                                                    >
                                                        {isSuggesting ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="h-3.5 w-3.5" />
                                                        )}
                                                        <span>Inspiration IA</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </TabsList>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layout Spacer: Replaces the space taken by the fixed dock in the document flow */}
                        <div className="h-[76px] w-full shrink-0" />
                        {/* ── TAB CONTENT ── */}
                        <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-5 md:pt-7">
                            <TabsContent value="suggestions" className="m-0 focus-visible:ring-0 outline-none space-y-7">
                                <div className="p-4 rounded-lg border bg-accent/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Bot className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Organisation du foyer</h3>
                                    </div>
                                    <WhoIsCooking />
                                </div>

                                {/* NEW: Personalized Recommendations Section */}
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-base md:text-lg font-bold flex items-center gap-2 shrink-0">
                                                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                                    Recommandé pour vous
                                                </h2>
                                                <Badge variant="outline" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20 whitespace-nowrap shrink-0">
                                                    Algorithme MyFlex
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">Inspirations basées sur votre profil <span className="font-bold text-foreground">({userProfile?.origin || 'Cuisine variée'})</span> et vos saveurs préférées.</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="hidden sm:flex text-[10px] uppercase font-bold tracking-widest" onClick={() => window.location.reload()}>
                                            Rafraîchir
                                        </Button>
                                    </div>

                                    {isLoadingRecs ? (
                                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-40 md:h-48 rounded-xl bg-accent/5 border border-dashed animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                            {recommendations.slice(0, 3).map((dish, idx) => (
                                                <Card key={idx} className="group relative aspect-[5/7] overflow-hidden border-none shadow-lg transition-all rounded-xl cursor-pointer" onClick={() => handleShowRecipeForDish(dish)}>
                                                    <div className="absolute top-3 right-3 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/90 shadow-sm" onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (user) trackInteractionAction(user.uid, dish.name, dish.origin, dish.category, 'like');
                                                            toast({ title: "Ajouté à vos favoris", description: "L'IA affinera vos prochaines suggestions." });
                                                        }}>
                                                            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                                                        </Button>
                                                    </div>
                                                    <Image
                                                        src={dish.imageUrl || `https://picsum.photos/seed/${dish.name.replace(/\s/g, '-')}/400/550`}
                                                        alt={dish.name}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-end p-3 md:p-5">
                                                        <Badge variant="outline" className="mb-1.5 w-fit text-[7px] md:text-[8px] bg-primary/20 backdrop-blur border-white/10 text-white font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                                                            ✨ {dish.matchReason || 'Suggestion MyFlex'}
                                                        </Badge>
                                                        <h3
                                                            className="text-sm md:text-xl font-black text-white uppercase italic leading-tight group-hover:-translate-y-1 transition-transform hover:underline underline-offset-4 decoration-primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDishPreview(dish.name, dish);
                                                            }}
                                                        >
                                                            {dish.name}
                                                        </h3>
                                                        <div className="mt-1 md:mt-2 flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/50 uppercase tracking-[0.1em] md:tracking-[0.2em]">
                                                            <div className="flex items-center gap-1">
                                                                <ClockIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                                                <span>{dish.cookingTime}</span>
                                                            </div>
                                                            <div className="hidden sm:flex items-center gap-1">
                                                                <MapPin className="h-2.5 w-2.5" />
                                                                <span>{dish.origin}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <div className="space-y-5">
                                    <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b pb-3">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold">Explorer les plats</h3>
                                            <p className="text-xs text-muted-foreground">Découvrez notre catalogue de repas équilibrés.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="Rechercher..."
                                                    className="h-9 pl-9 w-full sm:w-48 text-xs font-medium rounded border-muted/20"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                                                <SelectTrigger className="h-9 w-full sm:w-40 text-xs font-medium rounded border-muted/20 bg-background">
                                                    <SelectValue placeholder="Catégorie" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-md border shadow-lg text-xs">
                                                    <SelectItem value="all">Toutes catégories</SelectItem>
                                                    {dishCategories.map(category => (
                                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 pb-6">
                                        {filteredDishes.length > 0 ? (
                                            filteredDishes.map((dish, index) => (
                                                <Card key={`${dish.id}-${index}`}
                                                    className="group relative aspect-[5/7] rounded-xl overflow-hidden border-none shadow-lg transition-all cursor-pointer bg-muted"
                                                    onClick={() => handleShowRecipeForDish(dish)}>
                                                    <Image
                                                        src={dish.imageUrl || `https://picsum.photos/seed/${dish.name.replace(/\s/g, '-')}/400/550`}
                                                        alt={dish.name}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                                                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                                        data-ai-hint={dish.imageHint}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-end p-3 md:p-5">
                                                        <div className="flex gap-1 mb-1.5">
                                                            <Badge className="bg-primary/20 backdrop-blur-sm text-white border-white/10 text-[7px] md:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                                                                {dish.category}
                                                            </Badge>
                                                        </div>
                                                        <h4
                                                            className="text-sm md:text-xl font-black text-white uppercase italic leading-tight mb-1.5 group-hover:-translate-y-1 transition-transform hover:underline underline-offset-4 decoration-primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDishPreview(dish.name, dish);
                                                            }}
                                                        >
                                                            {dish.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/50 uppercase tracking-widest">
                                                            <div className="flex items-center gap-1">
                                                                <ClockIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                                                <span>{dish.cookingTime}</span>
                                                            </div>
                                                            <div className="hidden sm:flex items-center gap-1">
                                                                <MapPin className="h-2.5 w-2.5" />
                                                                <span className="truncate max-w-[80px]">{dish.origin || 'Standard'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-20 text-center border border-dashed rounded-lg bg-accent/5">
                                                <h3 className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Aucun plat trouvé</h3>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="pending" className="m-0 focus-visible:ring-0 outline-none">
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                    {pendingCookingItems && pendingCookingItems.length > 0 ? pendingCookingItems.map(item => (
                                        <div
                                            key={item.id}
                                            style={{
                                                transition: 'transform 0.42s cubic-bezier(0.36,0.07,0.19,0.97), opacity 0.42s ease',
                                                transform: dismissingId === item.id ? 'translateY(120%) rotate(3deg) scale(0.8)' : 'translateY(0) rotate(0deg) scale(1)',
                                                opacity: dismissingId === item.id ? 0 : 1,
                                                pointerEvents: dismissingId === item.id ? 'none' : 'auto',
                                            }}
                                        >
                                            <Card className="flex flex-col rounded-lg border shadow-sm hover:border-primary/20 transition-colors">
                                                <CardHeader className="p-3 md:p-5 pb-1.5 md:pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                                            En attente
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 md:h-6 md:w-6 rounded text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeletePendingItem(item.id)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <CardTitle
                                                        className="text-sm md:text-lg font-bold truncate mt-0.5 hover:text-primary transition-colors cursor-pointer hover:underline decoration-primary/30"
                                                        onClick={() => openDishPreview(item.name)}
                                                    >
                                                        {item.name}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-5 pt-1.5 md:pt-2 flex-grow space-y-3">
                                                    <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                                        <span className="truncate">Le {item.createdAt ? format(item.createdAt.toDate(), 'd MMM', { locale: fr }) : ''}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 md:gap-2 mt-auto">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handlePreviewPendingItem(item, true)}
                                                            className="h-7 md:h-9 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded border-muted/20 hover:bg-accent/50 group/btn px-1.5"
                                                        >
                                                            <Search className="mr-1 h-3 w-3 opacity-50 group-hover/btn:text-primary transition-colors" />
                                                            Voir
                                                        </Button>
                                                        <Button
                                                            onClick={() => guardAction(setPendingActionItem)(item)}
                                                            className="h-7 md:h-9 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded shadow-sm bg-primary text-white hover:scale-105 transition-all px-1.5"
                                                        >
                                                            <CookingPot className="mr-1 h-3 w-3" />
                                                            Cuisiner
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                        </div>
                                    )) : (
                                        <div className="col-span-full py-20 text-center border border-dashed rounded-lg bg-accent/5">
                                            <h3 className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">File d'attente vide</h3>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="in_progress" className="m-0 focus-visible:ring-0 outline-none">
                                {selectedCookingItem && !isPast(selectedCookingItem.plannedFor.toDate()) ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedCookingItem(null)} className="h-8 rounded font-semibold text-xs border-muted/20">
                                            &larr; Retour à la liste
                                        </Button>
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                            <div className="lg:col-span-8 space-y-8 text-foreground/90">
                                                <div className="space-y-4">
                                                    <h2 className="text-4xl font-bold tracking-tight">{selectedCookingItem.name}</h2>
                                                    <div className="flex flex-wrap gap-4">
                                                        <Badge variant="secondary" className="bg-accent/50 text-foreground font-bold px-2 py-0.5 rounded text-[10px]">
                                                            {selectedCookingItem.calories} kcal
                                                        </Badge>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                                            <ClockIcon className="h-3.5 w-3.5" />
                                                            <span>{selectedCookingItem.cookingTime}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="prose prose-sm dark:prose-invert max-w-none pt-4 border-t">
                                                    <ReactMarkdown>
                                                        {selectedCookingItem.recipe || "Chargement des instructions..."}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-4">
                                                <div className="rounded-lg border overflow-hidden shadow-sm aspect-[4/3] relative group cursor-zoom-in">
                                                    <Image
                                                        src={selectedCookingItem.imageUrl || `https://picsum.photos/seed/${selectedCookingItem.name.replace(/\s/g, '-')}/400/300`}
                                                        alt={selectedCookingItem.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onClick={() => setZoomImage(selectedCookingItem.imageUrl || `https://picsum.photos/seed/${selectedCookingItem.name.replace(/\s/g, '-')}/400/300`)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 md:bg-black/0 md:group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 pointer-events-none md:pointer-events-auto">
                                                        <ZoomIn className="h-10 w-10 text-white drop-shadow-lg" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
                                                <span className="bg-primary/10 text-primary p-2 rounded-xl">🍽️</span> 
                                                Repas du jour
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {mealsToday.length > 0 ? mealsToday.map(renderCookingCard) : (
                                                    <div className="col-span-full py-12 text-center border border-dashed rounded-lg bg-accent/5">
                                                        <h3 className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Aucun repas prévu aujourd'hui</h3>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
                                                <span className="bg-primary/10 text-primary p-2 rounded-xl">📅</span> 
                                                À venir
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {mealsUpcoming.length > 0 ? mealsUpcoming.map(renderCookingCard) : (
                                                    <div className="col-span-full py-12 text-center border border-dashed rounded-lg bg-accent/5">
                                                        <h3 className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Aucun repas à venir</h3>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="m-0 focus-visible:ring-0 outline-none">
                                {selectedCookingItem && isPast(selectedCookingItem.plannedFor.toDate()) ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedCookingItem(null)} className="h-8 rounded font-semibold text-xs border-muted/20">
                                            &larr; Retour à l'historique
                                        </Button>
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 opacity-80">
                                            <div className="lg:col-span-8 space-y-8">
                                                <div className="space-y-4">
                                                    <h2 className="text-4xl font-bold tracking-tight grayscale-[0.2]">{selectedCookingItem.name}</h2>
                                                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                                                        <History className="h-3.5 w-3.5" />
                                                        <span>Cuisiné le {format(selectedCookingItem.plannedFor.toDate(), 'd MMMM yyyy', { locale: fr })}</span>
                                                    </div>
                                                </div>
                                                <div className="prose prose-sm dark:prose-invert max-w-none pt-4 border-t">
                                                    <ReactMarkdown>
                                                        {selectedCookingItem.recipe || "Détails du plat archivés."}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-4">
                                                <div className="rounded-lg border overflow-hidden shadow-sm aspect-[4/3] relative grayscale-[0.5]">
                                                    <Image
                                                        src={selectedCookingItem.imageUrl || `https://picsum.photos/seed/${selectedCookingItem.name.replace(/\s/g, '-')}/400/300`}
                                                        alt={selectedCookingItem.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {pastCookingItems && pastCookingItems.length > 0 ? pastCookingItems.map(item => (
                                            <Card
                                                key={item.id}
                                                className="group flex flex-col rounded-lg border shadow-xs hover:border-primary/20 transition-all cursor-pointer grayscale-[0.3] hover:grayscale-0"
                                                onClick={() => handleSelectCookingItem(item)}
                                            >
                                                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                                                    <Image
                                                        src={item.imageUrl || `https://picsum.photos/seed/${item.name.replace(/\s/g, '-')}/400/250`}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <CardContent className="p-5 space-y-4">
                                                    <h4 className="text-base font-bold group-hover:text-primary transition-colors line-clamp-1">{item.name}</h4>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                            <History className="h-3 w-3" />
                                                            <span>{format(item.plannedFor.toDate(), 'd MMM yyyy', { locale: fr })}</span>
                                                            {item.isDone ? (
                                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-1.5 py-0 h-4">Fini</Badge>
                                                            ) : (
                                                                <Badge className="bg-destructive/10 text-destructive border-none px-1.5 py-0 h-4">Manqué</Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-3 rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-black text-[9px] uppercase tracking-widest transition-all"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePreviewCookingItem(item);
                                                            }}
                                                        >
                                                            <BookOpen className="mr-1.5 h-3 w-3" />
                                                            Voir
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )) : (
                                            <div className="col-span-full py-20 text-center border border-dashed rounded-lg bg-accent/5">
                                                <h3 className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Historique vide</h3>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </PageWrapper>
                {suggestion && (
                    <SuggestionDialog
                        suggestion={suggestion}
                        isOpen={isDialogOpen}
                        onClose={() => {
                            setIsDialogOpen(false);
                            // On ne vide plus les datas ici pour éviter le flash
                        }}
                        onAccept={isViewOnlySuggestion ? undefined : handleAcceptSuggestion}
                        onAddToPending={(pendingItemToCook || isViewOnlySuggestion) ? undefined : handleAddToPendingDish}
                        onPlan={isViewOnlySuggestion ? undefined : handlePlanDish}
                        existingCookings={cookingItems as any}
                        isFavorite={favorites?.some(f => f.id === (suggestion?.id || suggestion?.name?.replace(/\s/g, '_').toLowerCase()))}
                        onToggleFavorite={handleToggleFavorite}
                        mode="dish"
                    />
                )}
                {cookingModeItem && (
                    <CookingMode
                        meal={cookingModeItem}
                        isOpen={true}
                        onClose={() => setCookingModeItem(null)}
                        onFinished={() => handleCookingItemDone(cookingModeItem)}
                    />
                )}

                {/* Dialog: Planifier ou Cuisiner maintenant */}
                <Dialog open={!!pendingActionItem} onOpenChange={(o) => !o && setPendingActionItem(null)}>
                    <DialogContent className="max-w-sm w-[95vw] sm:rounded-2xl rounded-2xl border-none bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Options de cuisine</DialogTitle>
                            <DialogDescription>Choisissez quand cuisiner ce repas</DialogDescription>
                        </DialogHeader>
                        {pendingActionItem && (
                            <div className="p-6 space-y-5">
                                <div className="text-center space-y-1">
                                    <span className="text-3xl">👨‍🍳</span>
                                    <h3 className="font-black text-lg leading-tight mt-2">{pendingActionItem.name}</h3>
                                    <p className="text-muted-foreground text-xs font-medium">Que souhaitez-vous faire ?</p>
                                </div>

                                <div className="space-y-3">
                                    {/* Option 1: Cuisiner maintenant */}
                                    <button
                                        onClick={() => handleCookNow(pendingActionItem)}
                                        className="w-full p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white group text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors">
                                                <CookingPot className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">Cuisiner maintenant</p>
                                                <p className="text-[10px] font-medium text-muted-foreground group-hover:text-white/70 transition-colors">Envoyer directement en cuisine</p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Option 2: Programmer */}
                                    <button
                                        onClick={() => {
                                            setPendingActionItem(null);
                                            // Ouvrir la preview avec planification (viewOnly = false)
                                            handlePreviewPendingItem(pendingActionItem, false);
                                        }}
                                        className="w-full p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-accent/30 group text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">Programmer</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">Choisir une date de préparation</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </SidebarInset>
            <ImageZoomLightbox
                isOpen={!!zoomImage}
                imageUrl={zoomImage}
                onClose={() => setZoomImage(null)}
            />
        </SidebarProvider >
    );
}
