
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar as DashboardSidebar } from '@/components/dashboard/sidebar';
import type { Meal, Cooking, AIPersonality, PendingCooking, UserProfile, DayPlanMeal, CarouselItem as CarouselItemType, Dish } from '@/lib/types';
import { Coffee, Moon, IceCream, Apple } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar as AppSidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, where, limit, updateDoc, Timestamp, increment, writeBatch, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2, PartyPopper, LayoutDashboard, ChefHat, PlusCircle, Sparkles, UtensilsCrossed, X, BarChart2, Bot, Calendar, AlarmClock, Check, Shuffle, Award, Flame, Target, TrendingUp, Search, ArrowRight, Pizza, Sandwich, Salad, Cookie, Hourglass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/loading-context';
import { startOfDay, endOfDay } from 'date-fns';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddMealWindow } from '@/components/dashboard/add-meal-window';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SuggestionsDialog } from '@/components/dashboard/suggestions-dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { estimateCaloriesAction, suggestDayPlanAction, explainCalorieGoalAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ImageZoomLightbox } from '@/components/shared/image-zoom-lightbox';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { StatCards } from '@/components/dashboard/stat-cards';
import { HouseholdBanner } from '@/components/dashboard/household-banner';
import { FoodJournal } from '@/components/dashboard/food-journal';
import { AIAssistantPanel } from '@/components/dashboard/ai-assistant-panel';
import { MealActionDialogs } from '@/components/dashboard/meal-action-dialogs';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/shared/page-wrapper';

const XP_PER_LEVEL = 500;

const getContextualInfo = (hour: number): { message: string, image: string } => {
  if (hour >= 5 && hour < 10) return { message: "Préparez un bon petit-déjeuner pour bien démarrer !", image: "/matin.png" };
  if (hour >= 10 && hour < 12) return { message: "Bientôt l'heure du déjeuner !", image: "/midi.png" };
  if (hour >= 12 && hour < 14) return { message: 'Bon appétit ! Profitez de votre pause déjeuner.', image: "/midi.png" };
  if (hour >= 14 && hour < 16) return { message: "L'après-midi commence, restez concentré.", image: "/colation.png" };
  if (hour >= 16 && hour < 18) return { message: "C'est l'heure du goûter ! Un fruit pour recharger les batteries ?", image: "/colation.png" };
  if (hour >= 18 && hour < 20) return { message: 'Que diriez-vous de commencer à préparer un bon dîner ?', image: "/soir.png" };
  if (hour >= 20 && hour < 22) return { message: 'Passez une bonne soirée. Un repas léger est idéal.', image: "/soir.png" };
  return { message: 'Planifiez vos repas, mangez sainement, et profitez !', image: "/soir.png" };
};


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { hideLoading } = useLoading();
  const router = useRouter();

  const [isFormOpen, setFormOpen] = useState(false);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState<Meal['type'] | undefined>(undefined);
  const [suggestionMeal, setSuggestionMeal] = useState<Meal | null>(null);
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [selectedMagicMeal, setSelectedMagicMeal] = useState<DayPlanMeal | null>(null);

  const openFormForType = (type?: Meal['type']) => {
    setDefaultMealType(type);
    setFormOpen(true);
  };
  const [currentTime, setCurrentTime] = useState(new Date());

  const [dayPlan, setDayPlan] = useState<DayPlanMeal[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isAcceptingPlan, setIsAcceptingPlan] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [newTargetCalories, setNewTargetCalories] = useState<string>('');
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [selectedMealForAction, setSelectedMealForAction] = useState<DayPlanMeal | null>(null);
  const [mealConflict, setMealConflict] = useState<{ existing: any, new: DayPlanMeal } | null>(null);
  const [isExplainingCalories, setIsExplainingCalories] = useState(false);
  const [calorieExplanation, setCalorieExplanation] = useState<string | null>(null);


  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  const effectiveChefId = userProfile?.chefId || user?.uid;

  const currentDayStr = currentTime.toISOString().split('T')[0];

  // --- Meals Data ---
  // This query specifically fetches meals for the current day for the main panel
  const todaysMealsQuery = useMemoFirebase(() => {
    if (!effectiveChefId) return null;
    const todayStart = startOfDay(currentTime);
    const todayEnd = endOfDay(currentTime);
    return query(
      collection(firestore, 'users', effectiveChefId, 'foodLogs'),
      where('date', '>=', Timestamp.fromDate(todayStart)),
      where('date', '<=', Timestamp.fromDate(todayEnd))
    );
  }, [effectiveChefId, firestore, currentDayStr]);
  const { data: todaysMeals, isLoading: isLoadingTodaysMeals } = useCollection<Meal>(todaysMealsQuery);

  // This query fetches scheduled meals for today
  const scheduledMealsQuery = useMemoFirebase(() => {
    if (!effectiveChefId) return null;
    const todayStart = startOfDay(currentTime);
    const todayEnd = endOfDay(currentTime);
    return query(
      collection(firestore, 'users', effectiveChefId, 'cooking'),
      where('plannedFor', '>=', Timestamp.fromDate(todayStart)),
      where('plannedFor', '<=', Timestamp.fromDate(todayEnd))
    );
  }, [effectiveChefId, firestore, currentDayStr]);
  const { data: scheduledMeals, isLoading: isLoadingScheduledMeals } = useCollection<Cooking>(scheduledMealsQuery);

  // This query fetches all meals, which is needed for the sidebar context (AI tips)
  const allMealsCollectionRef = useMemoFirebase(
    () => (effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'foodLogs') : null),
    [effectiveChefId, firestore]
  );
  const { data: allMeals, isLoading: isLoadingAllMeals } = useCollection<Omit<Meal, 'id'>>(allMealsCollectionRef);

  const carouselCollectionRef = useMemoFirebase(() => collection(firestore, 'carouselItems'), [firestore]);
  const { data: carouselItems, isLoading: isLoadingCarousel } = useCollection<CarouselItemType>(carouselCollectionRef);

  // --- Dishes (to enrich meal photos) ---
  const dishesCollectionRef = useMemoFirebase(() => query(collection(firestore, 'dishes'), where('isVerified', '==', true)), [firestore]);
  const { data: dishes } = useCollection<Dish>(dishesCollectionRef);

  // Map dish name -> imageUrl for fast lookup
  const dishImageMap = useMemo(() => {
    const map = new Map<string, string>();
    (dishes ?? []).forEach(d => { if (d.name && d.imageUrl) map.set(d.name.toLowerCase(), d.imageUrl); });
    return map;
  }, [dishes]);


  // --- Goals & Personality Data for AI ---
  const goalsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'goals') : null),
    [user, firestore]
  );
  const singleGoalQuery = useMemoFirebase(
    () => goalsCollectionRef ? query(goalsCollectionRef, limit(1)) : null,
    [goalsCollectionRef]
  );
  const { data: goalsData, isLoading: isLoadingGoals } = useCollection<{ description: string }>(singleGoalQuery);

  const [goals, setGoals] = useState('Perdre du poids, manger plus sainement et réduire ma consommation de sucre.');
  const [goalId, setGoalId] = useState<string | null>(null);

  const fetchDayPlan = useCallback(async () => {
    if (!userProfile) return;
    setIsLoadingPlan(true);
    try {
      let personality: AIPersonality | undefined;
      if (userProfile.isAITrainingEnabled) {
        personality = {
          tone: userProfile.tone,
          mainObjective: userProfile.mainObjective,
          allergies: userProfile.allergies,
          preferences: userProfile.preferences,
        };
      }
      const { plan, error } = await suggestDayPlanAction({
        dietaryGoals: goals,
        personality,
        householdMembers: userProfile.household || [],
      });
      if (error) throw new Error(error);
      setDayPlan(plan || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur de planification', description: 'Impossible de générer un plan.' });
    } finally {
      setIsLoadingPlan(false);
    }
  }, [userProfile, goals, toast]);

  const calculateRecommendedCalories = (profile?: UserProfile) => {
    const eatersCount = (profile?.household?.length || 0) + 1;
    if (!profile || !profile.weight || !profile.height || !profile.age || !profile.gender) {
      return 2000 * eatersCount;
    }

    // Mifflin-St Jeor Equation
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    if (profile.gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const activityFactors: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const multiplier = activityFactors[profile.activityLevel || 'sedentary'] || 1.2;
    return Math.round(bmr * multiplier) * eatersCount;
  };

  useEffect(() => {
    if (userProfile) {
      fetchDayPlan();
    }
  }, [userProfile, fetchDayPlan]);


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const { message: contextualMessage, image: contextualImage } = getContextualInfo(currentTime.getHours());

  const mealTypes: Meal['type'][] = ['breakfast', 'lunch', 'dinner', 'dessert'];

  const mealTypeDetails: Record<string, { translation: string; className: string; icon: any; glow: string }> = {
    breakfast: { translation: 'Petit-déjeuner', className: "border-blue-500/20 bg-blue-500/5", icon: Coffee, glow: "shadow-blue-500/20" },
    lunch: { translation: 'Déjeuner', className: "border-yellow-500/20 bg-yellow-500/5", icon: UtensilsCrossed, glow: "shadow-yellow-500/20" },
    dinner: { translation: 'Dîner', className: "border-purple-500/20 bg-purple-500/5", icon: Moon, glow: "shadow-purple-500/20" },
    dessert: { translation: 'Dessert / Collation', className: "border-green-500/20 bg-green-500/5", icon: Apple, glow: "shadow-green-500/20" },
  };

  const mealTypeTranslations: Record<string, string> = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    dessert: 'Dessert / Collation',
  };

  useEffect(() => {
    if (goalsData) {
      if (goalsData.length > 0 && goalsData[0]) {
        setGoals(goalsData[0].description);
        setGoalId((goalsData[0] as any).id);
      } else if (user && !isLoadingGoals) {
        // No goals found, create a default one
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
    setGoals(newDescription);
    if (goalId && user) {
      const goalRef = doc(firestore, 'users', user.uid, 'goals', goalId);
      updateDoc(goalRef, { description: newDescription }).catch(console.error);
    }
  };

  const handleUpdateTargetCalories = async () => {
    if (!user || isNaN(parseInt(newTargetCalories))) return;
    try {
      const userRef = doc(firestore, `users/${user.uid}`);
      await updateDoc(userRef, {
        targetCalories: parseInt(newTargetCalories)
      });
      toast({ title: 'Objectif mis à jour !', description: `Votre nouvel objectif est de ${newTargetCalories} kcal par jour.` });
      setIsEditGoalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour l'objectif." });
    }
  };

  const handleExplainCalories = async () => {
    const kcal = parseInt(newTargetCalories);
    if (isNaN(kcal)) return;
    setIsExplainingCalories(true);
    setCalorieExplanation(null);
    try {
      const { explanation, error } = await explainCalorieGoalAction({
        targetCalories: kcal,
        eatersCount: (userProfile?.household?.length || 0) + 1,
        personality: userProfile?.isAITrainingEnabled ? {
          tone: userProfile.tone,
          mainObjective: userProfile.mainObjective,
          allergies: userProfile.allergies,
          preferences: userProfile.preferences,
        } : undefined
      });
      if (error) throw new Error(error);
      setCalorieExplanation(explanation);
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'obtenir l'explication AI." });
    } finally {
      setIsExplainingCalories(false);
    }
  };

  const addMeal = async (meal: { name: string; type: Meal['type'], cookedBy?: string, calories?: number, imageUrl?: string }) => {
    if (!user || !userProfileRef) return;
    setIsAddingMeal(true);

    try {
      let calories = meal.calories;
      let xpGained = 0;

      if (!calories) {
        const estimation = await estimateCaloriesAction({
          mealName: meal.name,
          userObjective: userProfile?.mainObjective || 'Manger équilibré'
        });

        if (estimation.error || estimation.xpGained === null || estimation.calories === null) {
          throw new Error(estimation.error || 'Failed to analyze meal.');
        }
        calories = estimation.calories;
        xpGained = estimation.xpGained;
      } else {
        xpGained = 5;
      }

      const fullMealData = { ...meal, calories, userId: user?.uid, date: Timestamp.now() };

      // Règle Ultime: 1 repas max par type (Nettoyage des doublons cachés)
      if (meal.type) {
        const toDeleteLogs = todaysMeals?.filter(m => m.type === meal.type) || [];
        const toDeleteCooking = scheduledMeals?.filter(m => m.type === meal.type) || [];
        for (const t of toDeleteLogs) {
          deleteDocumentNonBlocking(doc(firestore, 'users', effectiveChefId!, 'foodLogs', t.id));
        }
        for (const t of toDeleteCooking) {
          deleteDocumentNonBlocking(doc(firestore, 'users', effectiveChefId!, 'cooking', t.id));
        }
      }

      const cookingCollectionRef = collection(firestore, 'users', effectiveChefId!, 'cooking');
      addDocumentNonBlocking(cookingCollectionRef, {
        userId: user?.uid,
        name: meal.name,
        calories: calories,
        cookingTime: '30 min',
        type: meal.type,
        recipe: '',
        imageHint: meal.name,
        imageUrl: meal.imageUrl || '',
        createdAt: Timestamp.now(),
        plannedFor: Timestamp.now(),
        isDone: false
      });

      toast({ title: 'Repas ajouté en cuisine !', description: `${meal.name} (${calories} kcal) a été envoyé en cuisine.` });
      setFormOpen(false);

    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le repas en cuisine." });
    } finally {
      setIsAddingMeal(false);
    }
  };

  const handleAddToPending = (meal: Omit<Meal, 'id' | 'date'>) => {
    if (!effectiveChefId || !user) return;
    const pendingCookingCollectionRef = collection(firestore, 'users', effectiveChefId, 'pendingCookings');
    addDocumentNonBlocking(pendingCookingCollectionRef, {
      userId: user.uid,
      name: meal.name,
      createdAt: Timestamp.now(),
      imageHint: meal.name,
      imageUrl: (meal as any).imageUrl || '',
    });
    toast({
      title: 'Repas mis en attente',
      description: `${meal.name} est prêt à être cuisiné depuis la page Cuisine.`,
    });
    setSelectedMealForAction(null);
  };

  const handleScheduleMeal = async (meal: DayPlanMeal) => {
    if (!effectiveChefId || !user) return;

    const existingMeal = displayMeals.find(m => m.type === meal.type);
    if (existingMeal) {
      setMealConflict({ existing: existingMeal, new: meal });
      setSelectedMealForAction(null);
      return;
    }

    try {
      const cookingCollectionRef = collection(firestore, 'users', effectiveChefId, 'cooking');
      await addDocumentNonBlocking(cookingCollectionRef, {
        userId: user.uid,
        name: meal.name,
        calories: meal.calories,
        type: meal.type,
        imageHint: meal.name,
        imageUrl: meal.imageUrl || '',
        plannedFor: Timestamp.now(),
        isDone: false,
        createdAt: Timestamp.now()
      });
      toast({
        title: 'Repas programmé !',
        description: `${meal.name} a été ajouté à votre programme du jour.`,
      });
      setSelectedMealForAction(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de programmer le repas.' });
    }
  };

  const handleConfirmReplace = async () => {
    if (!mealConflict || !effectiveChefId || !user) return;
    try {
      // Nettoie proprement tout de ce type
      const type = mealConflict.new.type;
      if (type) {
        const toDeleteLogs = todaysMeals?.filter(m => m.type === type) || [];
        const toDeleteCooking = scheduledMeals?.filter(m => m.type === type) || [];
        for (const t of toDeleteLogs) {
          deleteDocumentNonBlocking(doc(firestore, 'users', effectiveChefId, 'foodLogs', t.id));
        }
        for (const t of toDeleteCooking) {
          deleteDocumentNonBlocking(doc(firestore, 'users', effectiveChefId, 'cooking', t.id));
        }
      } else {
        await removeMeal(mealConflict.existing.id, mealConflict.existing.isScheduled);
      }

      const cookingCollectionRef = collection(firestore, 'users', effectiveChefId, 'cooking');
      await addDocumentNonBlocking(cookingCollectionRef, {
        userId: user.uid,
        name: mealConflict.new.name,
        calories: mealConflict.new.calories,
        type: mealConflict.new.type,
        imageHint: mealConflict.new.name,
        imageUrl: mealConflict.new.imageUrl || '',
        plannedFor: Timestamp.now(),
        isDone: false,
        createdAt: Timestamp.now()
      });

      toast({ title: 'Repas remplacé !', description: `${mealConflict.new.name} est maintenant prévu.` });
      setMealConflict(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de remplacer le repas.' });
    }
  };

  const removeMeal = async (mealId: string, isScheduled: boolean = false) => {
    if (!effectiveChefId) return;
    const targetMeal = displayMeals.find(m => m.id === mealId);

    // Si on trouve le repas affiché, on supprime TOUT ce qui correspond à ce type pour être sûr de ne rien cacher (Règle Ultime)
    if (targetMeal && targetMeal.type) {
      const type = targetMeal.type;
      const toDeleteLogs = todaysMeals?.filter(m => m.type === type) || [];
      const toDeleteCooking = scheduledMeals?.filter(m => m.type === type) || [];

      for (const t of toDeleteLogs) {
        deleteDocumentNonBlocking(doc(firestore, 'users', effectiveChefId, 'foodLogs', t.id));
      }
      for (const t of toDeleteCooking) {
        deleteDocumentNonBlocking(doc(firestore, 'users', effectiveChefId, 'cooking', t.id));
      }
    } else {
      const collectionName = isScheduled ? 'cooking' : 'foodLogs';
      const mealRef = doc(firestore, 'users', effectiveChefId, collectionName, mealId);
      deleteDocumentNonBlocking(mealRef);
    }
  };

  const handleAcceptPlan = async () => {
    if (!effectiveChefId || dayPlan.length === 0 || !user) return;
    setIsAcceptingPlan(true);

    try {
      const batch = writeBatch(firestore);
      const mealsCollectionRef = collection(firestore, 'users', effectiveChefId, 'foodLogs');
      const cookingCollectionRef = collection(firestore, 'users', effectiveChefId, 'cooking');
      const today = Timestamp.now();
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      const existingScheduled = await getDocs(cookingCollectionRef);
      const existingLogs = await getDocs(mealsCollectionRef);

      const typesToOverwrite = dayPlan.map(m => m.type);

      existingScheduled.forEach(d => {
        const data = d.data() as any;
        const pDate = data.plannedFor?.toDate();
        if (pDate && pDate >= todayStart && pDate <= todayEnd) {
          batch.delete(d.ref);
        }
      });

      existingLogs.forEach(d => {
        const data = d.data() as any;
        const lDate = data.date?.toDate();
        if (lDate && lDate >= todayStart && lDate <= todayEnd && typesToOverwrite.includes(data.type)) {
          batch.delete(d.ref);
        }
      });

      const currentUser = user;
      dayPlan.forEach(meal => {
        const newCookingRef = doc(cookingCollectionRef);
        batch.set(newCookingRef, {
          userId: currentUser.uid,
          name: meal.name,
          calories: meal.calories || 0,
          cookingTime: '30 min',
          type: meal.type,
          recipe: '',
          imageHint: meal.name,
          imageUrl: meal.imageUrl || '',
          createdAt: today,
          plannedFor: today,
          isDone: false
        });
      });

      await batch.commit();
      toast({ title: 'Planning accepté !', description: "Les repas d'aujourd'hui ont été ajoutés à votre journal." });
    } catch (error) {
      console.error("Failed to accept plan:", error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer le planning." });
    } finally {
      setIsAcceptingPlan(false);
    }
  };

  const displayMeals = useMemo(() => {
    const mealMap = new Map<string, any>();

    (todaysMeals ?? []).forEach(m => {
      if (!m.type) return;
      mealMap.set(m.type, {
        ...m,
        id: m.id,
        imageUrl: m.imageUrl || dishImageMap.get(m.name?.toLowerCase()) || '',
        isScheduled: false
      });
    });

    (scheduledMeals ?? []).forEach(s => {
      if (!s.type || mealMap.has(s.type)) return;
      mealMap.set(s.type, {
        ...s,
        id: s.id,
        imageUrl: s.imageUrl || dishImageMap.get(s.name?.toLowerCase()) || '',
        isScheduled: true,
        date: s.plannedFor
      });
    });

    return (Array.from(mealMap.values()) as (Meal & { isScheduled: boolean })[]).filter(m => ['breakfast', 'lunch', 'dinner', 'dessert'].includes(m.type as string));
  }, [todaysMeals, scheduledMeals, dishImageMap]);

  const handleReplaceWithAlternative = async (alternativeName: string) => {
    if (!suggestionMeal?.id || !effectiveChefId) return;
    try {
      const isScheduled = (suggestionMeal as any).isScheduled;
      const collectionName = isScheduled ? 'cooking' : 'foodLogs';
      const mealRef = doc(firestore, 'users', effectiveChefId, collectionName, suggestionMeal.id);

      const altImageUrl = dishImageMap.get(alternativeName.toLowerCase()) || '';
      await updateDoc(mealRef, {
        name: alternativeName,
        imageUrl: altImageUrl,
      });
      toast({
        title: 'Repas modifié !',
        description: `"${suggestionMeal.name}" a été remplacé par "${alternativeName}".`,
      });
      setSuggestionMeal(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le repas.' });
    }
  };

  const cooksForToday = useMemo(() => {
    const cooks: Partial<Record<Meal['type'], string>> = {};
    displayMeals.forEach(meal => {
      if (meal.type && meal.cookedBy && !cooks[meal.type]) {
        cooks[meal.type] = meal.cookedBy;
      }
    });
    return cooks;
  }, [displayMeals]);


  const isLoading = isUserLoading || isLoadingTodaysMeals || isLoadingScheduledMeals || isLoadingGoals || isLoadingAllMeals || !user || isLoadingProfile || isLoadingCarousel;

  useEffect(() => {
    if (!isLoading) {
      hideLoading();
    }
  }, [isLoading, hideLoading]);

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
    meals: allMeals ?? []
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar collapsible="icon" className="group peer hidden md:block text-sidebar-foreground border-r border-border">
        <DashboardSidebar {...sidebarProps} />
      </AppSidebar>
      <SidebarInset className="bg-background flex flex-col h-screen">
        <AppHeader
          title="Tableau de bord"
          icon={<LayoutDashboard className="h-4 w-4" />}
          user={user}
          sidebarProps={sidebarProps}
        />

        <PageWrapper className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 md:py-8 space-y-4 md:space-y-8">
          <WelcomeSection
            userName={userProfile?.name?.split(' ')[0] || 'Chef'}
            contextualMessage={contextualMessage}
            contextualImage={contextualImage}
          />

          <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
            <Button
              className="h-9 md:h-10 w-full md:w-auto px-3 md:px-5 text-[10px] md:text-xs font-black rounded-lg border border-primary/20 shadow-md shadow-primary/10 hover:scale-105 active:scale-95 transition-all"
              onClick={() => setFormOpen(true)}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Ajouter un repas
            </Button>
            <Button variant="outline" className="h-9 md:h-10 w-full md:w-auto px-3 md:px-5 text-[10px] md:text-xs font-black rounded-lg border border-border hover:bg-accent transition-all shadow-sm" asChild>
              <Link href="/cuisine">
                <ChefHat className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                Cuisiner
              </Link>
            </Button>
          </div>

          {carouselItems && carouselItems.length > 0 && (
            <div className="w-full">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {carouselItems.map((slide, index) => (
                    <CarouselItem key={slide.id || index} className="pl-2 md:pl-4 basis-[45%] md:basis-1/3 lg:basis-1/4">
                      <Link href={slide.link || '#'} className={cn("block", !slide.link && "cursor-default")} target={slide.link?.startsWith('http') ? '_blank' : undefined}>
                        <div className="group relative aspect-[21/9] md:aspect-[3/1] lg:aspect-[21/9] w-full overflow-hidden rounded-xl border border-border shadow-sm">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.title || ""}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 45vw, (max-width: 1200px) 33vw, 25vw"
                            priority={index === 0}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
                          <div className="absolute bottom-0 left-0 p-2 md:p-3">
                            {slide.subtitle && <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/70 font-bold">{slide.subtitle}</p>}
                            {slide.title && <p className="text-xs md:text-sm font-black text-white">{slide.title}</p>}
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
                <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
              </Carousel>
            </div>
          )}

          <StatCards
            displayMeals={displayMeals}
            userProfile={userProfile}
            calculateRecommendedCalories={calculateRecommendedCalories}
            isEditGoalOpen={isEditGoalOpen}
            setIsEditGoalOpen={setIsEditGoalOpen}
            newTargetCalories={newTargetCalories}
            setNewTargetCalories={setNewTargetCalories}
            handleUpdateTargetCalories={handleUpdateTargetCalories}
            handleExplainCalories={handleExplainCalories}
            isExplainingCalories={isExplainingCalories}
            calorieExplanation={calorieExplanation}
            setCalorieExplanation={setCalorieExplanation}
            cooksForToday={cooksForToday as Record<string, string>}
          />

          <HouseholdBanner
            cooksForToday={cooksForToday as Record<string, string>}
            mealTypeTranslations={mealTypeTranslations}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 relative">
            <FoodJournal
              mealTypes={mealTypes}
              mealTypeDetails={mealTypeDetails}
              displayMeals={displayMeals}
              currentTime={currentTime}
              openFormForType={openFormForType}
              setSuggestionMeal={setSuggestionMeal}
              setZoomImageUrl={setZoomImageUrl}
              removeMeal={removeMeal}
            />

            <AIAssistantPanel
              isLoadingPlan={isLoadingPlan}
              dayPlan={dayPlan}
              setZoomImageUrl={setZoomImageUrl}
              openMealActionDialog={setSelectedMealForAction}
              contextualMessage={contextualMessage}
            />
          </div>
        </PageWrapper>

        <MealActionDialogs
          selectedMealForAction={selectedMealForAction}
          setSelectedMealForAction={setSelectedMealForAction}
          handleScheduleMeal={handleScheduleMeal}
          handleAddToPending={handleAddToPending}
          mealConflict={mealConflict}
          setMealConflict={setMealConflict}
          handleConfirmReplace={handleConfirmReplace}
          mealTypeTranslations={mealTypeTranslations}
        />

        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
          <AddMealWindow
            isOpen={isFormOpen}
            onClose={() => setFormOpen(false)}
            onSubmit={addMeal}
            household={userProfile?.household || []}
            userId={user?.uid}
            chefId={effectiveChefId}
            defaultType={defaultMealType}
          />
        </Dialog>

        <AnimatePresence>
          {isMagicOpen && (
            <motion.div
              key="magic-overlay"
              className="md:hidden fixed inset-0 z-[200] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => { setIsMagicOpen(false); setSelectedMagicMeal(null); }}
              />

              <motion.div
                layoutId="magic-btn"
                className="relative z-10 w-[88vw] max-w-sm bg-background rounded-2xl shadow-2xl shadow-primary/30 border border-primary/20 overflow-hidden"
                style={{ originX: 0.5, originY: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/60 px-5 pt-6 pb-8 relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary-foreground/60">Choisissez votre plat</p>
                      <h2 className="text-xl font-black text-primary-foreground mt-0.5 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 animate-pulse" /> Magie ✨
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsMagicOpen(false)}
                      className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-primary-foreground/80 hover:bg-white/20 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="px-4 pt-3 pb-2 space-y-2 -mt-4">
                  {isLoadingPlan ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                        <Loader2 className="relative h-8 w-8 animate-spin text-primary" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">Génération du planning...</span>
                    </div>
                  ) : dayPlan.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                      <ChefHat className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-bold">Aucun plan pour aujourd'hui</p>
                      <button
                        onClick={() => fetchDayPlan()}
                        className="text-xs font-black text-primary underline underline-offset-2"
                      >Régénérer</button>
                    </div>
                  ) : (
                    dayPlan.map((meal) => {
                      const isSelected = selectedMagicMeal?.name === meal.name;
                      return (
                        <motion.div
                          key={meal.name}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedMagicMeal(isSelected ? null : meal)}
                          className={cn(
                            "group relative flex flex-col gap-2 p-2.5 rounded-2xl border-2 transition-all duration-300",
                            isSelected
                              ? "bg-primary/5 border-primary shadow-md shadow-primary/10"
                              : "bg-muted/30 border-transparent hover:border-muted-foreground/20"
                          )}
                        >
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-border shadow-sm">
                            {meal.imageUrl ? (
                              <Image src={meal.imageUrl} alt={meal.name} fill sizes="150px" className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <UtensilsCrossed className="h-6 w-6 opacity-20" />
                              </div>
                            )}
                            <div className={cn(
                              "absolute inset-0 transition-opacity duration-300",
                              isSelected ? "bg-primary/10" : "bg-black/0 group-hover:bg-black/5"
                            )} />
                          </div>
                          <div className="min-w-0">
                            <p className={cn("font-black text-[11px] leading-tight truncate px-0.5", isSelected ? "text-primary" : "text-foreground/90")}>
                              {meal.name}
                            </p>
                          </div>
                          {isSelected && (
                            <motion.div
                              layoutId="check"
                              className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-lg"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Check className="h-3 w-3 text-white stroke-[4px]" />
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {selectedMagicMeal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="px-1"
                  >
                    <button
                      onClick={() => {
                        const encoded = encodeURIComponent(selectedMagicMeal.name);
                        setIsMagicOpen(false);
                        setSelectedMagicMeal(null);
                        router.push(`/cuisine?prep=${encoded}`);
                      }}
                      className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-all"
                    >
                      <ChefHat className="h-4 w-4" />
                      Cuisiner ce plat
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {suggestionMeal && (
          <SuggestionsDialog
            meal={suggestionMeal}
            goals={goals}
            open={!!suggestionMeal}
            onOpenChange={() => setSuggestionMeal(null)}
            onImageClick={setZoomImageUrl}
            onSelectAlternative={handleReplaceWithAlternative}
          />
        )}

        <ImageZoomLightbox
          isOpen={!!zoomImageUrl}
          imageUrl={zoomImageUrl || ''}
          onClose={() => setZoomImageUrl(null)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
