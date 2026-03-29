
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    SidebarProvider,
    Sidebar as AppSidebar,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, limit, updateDoc, Timestamp, where, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Meal, Cooking, UserProfile } from '@/lib/types';
import { Loader2, Calendar as CalendarIcon, Clock, X, History, ChefHat, CookingPot, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format, startOfDay, endOfDay, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppHeader } from '@/components/layout/app-header';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useReadOnly } from '@/contexts/read-only-context';
import { PageWrapper } from '@/components/shared/page-wrapper';

export default function CalendarPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();
    const { isReadOnly, triggerBlock } = useReadOnly();

    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);
    const effectiveChefId = userProfile?.chefId || user?.uid;

    // --- Data fetching for the selected day's meals (Planned and Logged) ---
    const dailyLogsQuery = useMemoFirebase(() => {
        if (!effectiveChefId || !date) return null;
        const start = startOfDay(date);
        const end = endOfDay(date);
        return query(
            collection(firestore, 'users', effectiveChefId, 'foodLogs'),
            where('date', '>=', Timestamp.fromDate(start)),
            where('date', '<=', Timestamp.fromDate(end))
        );
    }, [effectiveChefId, firestore, date]);
    const { data: dailyLogs, isLoading: isLoadingDailyLogs } = useCollection<Meal>(dailyLogsQuery);

    const dailyPlannedQuery = useMemoFirebase(() => {
        if (!effectiveChefId || !date) return null;
        const start = startOfDay(date);
        const end = endOfDay(date);
        return query(
            collection(firestore, 'users', effectiveChefId, 'cooking'),
            where('plannedFor', '>=', Timestamp.fromDate(start)),
            where('plannedFor', '<=', Timestamp.fromDate(end))
        );
    }, [effectiveChefId, firestore, date]);
    const { data: dailyPlannedAll, isLoading: isLoadingDailyPlanned } = useCollection<Cooking>(dailyPlannedQuery);

    const dailyPlanned = useMemo(() => {
        return (dailyPlannedAll ?? []).filter(meal => !meal.isDone);
    }, [dailyPlannedAll]);


    // --- Data fetching for goals & personality (for AI context) ---
    const goalsCollectionRef = useMemoFirebase(
        () => (effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'goals') : null),
        [effectiveChefId, firestore]
    );
    const singleGoalQuery = useMemoFirebase(
        () => goalsCollectionRef ? query(goalsCollectionRef, limit(1)) : null,
        [goalsCollectionRef]
    )
    const { data: goalsData, isLoading: isLoadingGoals } = useCollection<{ description: string }>(singleGoalQuery);

    const [goals, setGoals] = useState('Perdre du poids, manger plus sainement et réduire ma consommation de sucre.');
    const [goalId, setGoalId] = useState<string | null>(null);

    // --- Data fetching for sidebar and history ---
    const allMealsCollectionRef = useMemoFirebase(
        () => (effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'foodLogs') : null),
        [effectiveChefId, firestore]
    );
    const allMealsQuery = useMemoFirebase(
        () => allMealsCollectionRef ? query(allMealsCollectionRef, orderBy('date', 'desc')) : null,
        [allMealsCollectionRef]
    );
    const { data: allMeals, isLoading: isLoadingAllMeals } = useCollection<Meal>(allMealsQuery);

    const mealTypeTranslations: Record<Meal['type'], string> = {
        breakfast: 'Petit-déjeuner',
        lunch: 'Déjeuner',
        dinner: 'Dîner',
        snack: 'Collation',
        dessert: 'Dessert',
    };

    const groupedMeals = useMemo(() => {
        if (!allMeals) return {};
        return allMeals.reduce((acc, meal) => {
            const dateStr = format(meal.date.toDate(), 'yyyy-MM-dd');
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(meal);
            return acc;
        }, {} as Record<string, Meal[]>);
    }, [allMeals]);

    // --- Global Query for all planned meals (to highlight in calendar) ---
    const allPlannedGlobalQuery = useMemoFirebase(() => {
        if (!effectiveChefId) return null;
        return query(
            collection(firestore, 'users', effectiveChefId, 'cooking'),
            orderBy('plannedFor', 'desc')
        );
    }, [effectiveChefId, firestore]);
    const { data: allPlannedGlobal } = useCollection<Cooking>(allPlannedGlobalQuery);

    const plannedDates = useMemo(() => {
        if (!allPlannedGlobal) return [];
        return allPlannedGlobal
            .filter(p => !p.isDone)
            .map(p => startOfDay(p.plannedFor.toDate()));
    }, [allPlannedGlobal]);

    const modifiers = {
        hasPlanned: plannedDates.filter(d => (!isPast(d) || isToday(d))),
        missed: (date: Date) => {
            if (!isPast(date) || isToday(date)) return false;
            const dateStr = format(date, 'yyyy-MM-dd');
            return allPlannedGlobal?.some(p => !p.isDone && format(p.plannedFor.toDate(), 'yyyy-MM-dd') === dateStr) || false;
        },
        pastDone: (date: Date) => {
            if (!isPast(date) || isToday(date)) return false;
            const dateStr = format(date, 'yyyy-MM-dd');
            // Soit il y a un plat 'done' dans cooking, soit il y a un log dans allMeals
            const hasDoneCooking = allPlannedGlobal?.some(p => p.isDone && format(p.plannedFor.toDate(), 'yyyy-MM-dd') === dateStr);
            const hasMealLog = allMeals?.some(m => format(m.date.toDate(), 'yyyy-MM-dd') === dateStr);
            return Boolean((hasDoneCooking || hasMealLog) && !allPlannedGlobal?.some(p => !p.isDone && format(p.plannedFor.toDate(), 'yyyy-MM-dd') === dateStr));
        }
    };

    const modifiersClassNames = {
        hasPlanned: "!bg-emerald-500/15 !text-emerald-600 !font-black !border-2 !border-emerald-500/20",
        missed: "!bg-red-500/15 !text-red-600 !font-black !border-2 !border-red-500/20",
        pastDone: "!bg-muted !text-muted-foreground !font-black border border-border grayscale opacity-60",
    };


    useEffect(() => {
        if (goalsData) {
            if (goalsData.length > 0 && goalsData[0]) {
                setGoals(goalsData[0].description);
                setGoalId(goalsData[0].id);
            } else if (effectiveChefId && !isLoadingGoals) {
                const defaultGoal = {
                    userId: effectiveChefId,
                    description: 'Perdre du poids, manger plus sainement et réduire ma consommation de sucre.',
                    targetValue: 2000,
                    timeFrame: 'daily',
                };
                addDocumentNonBlocking(collection(firestore, 'users', effectiveChefId, 'goals'), defaultGoal);
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

    const handleRemoveMeal = async (mealId: string, isScheduled: boolean = false) => {
        if (isReadOnly) { triggerBlock(); return; }
        if (!effectiveChefId) return;

        try {
            const collectionName = isScheduled ? 'cooking' : 'foodLogs';
            const docRef = doc(firestore, 'users', effectiveChefId, collectionName, mealId);
            deleteDocumentNonBlocking(docRef);
            toast({
                title: "Repas supprimé",
                variant: "destructive",
                description: `Le repas a été retiré de ${isScheduled ? 'votre planning' : 'votre historique'}.`,
            });
        } catch (error) {
            console.error("Error removing meal:", error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la suppression du repas.",
                variant: "destructive",
            });
        }
    };

    const isGlobalLoading = isUserLoading || isLoadingProfile || isLoadingAllMeals || isLoadingGoals || !user;

    if (isGlobalLoading) {
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

    const isSelectedDateInPast = date ? isPast(endOfDay(date)) : false;

    return (
        <div className="h-screen w-full bg-background font-body">
            <SidebarProvider>
                <AppSidebar collapsible="icon" className="w-80 peer hidden md:block" variant="sidebar">
                    <Sidebar {...sidebarProps} />
                </AppSidebar>
                <SidebarInset>
                    <div className="flex h-full flex-1 flex-col">
                        <AppHeader
                            title="Calendrier & Planning"
                            icon={<CalendarIcon className="h-6 w-6" />}
                            user={user}
                            sidebarProps={sidebarProps}
                        />
                        <PageWrapper className="flex-1 flex flex-col overflow-y-auto">
                            <Tabs defaultValue="planning" className="flex-1 flex flex-col pt-4 md:pt-6">
                                <div className="px-4 md:px-8 space-y-6">
                                    {/* Simplified Header */}
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                                                <CalendarIcon className="h-7 w-7 text-primary" />
                                                Votre Agenda Culinaire
                                            </h2>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                Gérez vos repas futurs et consultez votre historique de consommation.
                                            </p>
                                        </div>

                                        <TabsList className="h-12 p-1 bg-muted/50 backdrop-blur-sm rounded-2xl border border-white/5 shadow-inner shrink-0">
                                            <TabsTrigger
                                                value="planning"
                                                className="px-6 md:px-8 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
                                            >
                                                Plats Programmés
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="history"
                                                className="px-6 md:px-8 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
                                            >
                                                L'Historique
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-3 md:px-8 pb-6 md:pb-8">
                                    <TabsContent value="planning" className="mt-6 md:mt-8 space-y-8 focus-visible:ring-0 outline-none">
                                        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 min-h-[500px]">
                                            <Card className="lg:col-span-3 rounded-3xl border-2 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col">
                                                <div className="p-6 md:p-8 border-b-2 border-primary/5">
                                                    <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
                                                        <CalendarIcon className="h-5 w-5 text-primary" />
                                                        Sélecteur Temporel
                                                    </h3>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-x-auto">
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        onSelect={setDate}
                                                        className="w-full"
                                                        locale={fr}
                                                        modifiers={modifiers}
                                                        modifiersClassNames={modifiersClassNames}
                                                        classNames={{
                                                            day_today: "!bg-emerald-700 !text-white !font-black !rounded-xl !shadow-lg shadow-emerald-500/30",
                                                            day_selected: "!bg-orange-500 !text-white !font-black !rounded-xl !shadow-lg shadow-orange-500/30"
                                                        }}
                                                    />
                                                </div>
                                            </Card>

                                            <Card className="lg:col-span-4 rounded-3xl border-2 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col border-primary/10 shadow-2xl shadow-primary/5">
                                                <div className="p-6 md:p-8 border-b-2 border-primary/5 bg-primary/[0.02]">
                                                    <h3 className="text-xl font-black tracking-tighter">
                                                        Repas du {date ? format(date, 'eeee d MMMM', { locale: fr }) : '...'}
                                                    </h3>
                                                </div>
                                                <div className="flex-1 p-6 md:p-8 space-y-8">
                                                    {/* Section Programmés */}
                                                    <div className="space-y-4">
                                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                                            <CookingPot className="h-3.5 w-3.5" />
                                                            À Cuisiner
                                                        </h4>
                                                        {isLoadingDailyPlanned ? (
                                                            <div className="flex justify-center py-4">
                                                                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" />
                                                            </div>
                                                        ) : (dailyPlanned && dailyPlanned.length > 0) ? (
                                                            <div className="grid gap-3">
                                                                {dailyPlanned.map(meal => (
                                                                    <Card key={meal.id} className="group relative rounded-2xl border-2 border-primary/10 bg-primary/5 hover:border-primary/30 transition-all duration-300">
                                                                        <CardContent className="p-4 flex justify-between items-center">
                                                                            <div className="flex items-center gap-4">
                                                                                {date && isToday(date) && (
                                                                                    <div 
                                                                                        onClick={() => router.push(`/cuisine`)}
                                                                                        className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors group/pot"
                                                                                    >
                                                                                        <CookingPot className="h-5 w-5 text-primary group-hover/pot:scale-110 transition-transform" />
                                                                                    </div>
                                                                                )}
                                                                                <div className="space-y-1">
                                                                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-primary/10 border-none text-primary">
                                                                                        {mealTypeTranslations[meal.type]}
                                                                                    </Badge>
                                                                                    <p className="text-sm font-black tracking-tight">{meal.name}</p>
                                                                                    <p className="text-[10px] font-bold text-muted-foreground">{meal.calories} kcal</p>
                                                                                </div>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 rounded-full text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                                                                                onClick={() => handleRemoveMeal(meal.id, true)}
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground/60 italic px-2">Rien de programmé.</p>
                                                        )}
                                                    </div>

                                                    {/* Section Historique du jour */}
                                                    <div className="space-y-4">
                                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Consommé
                                                        </h4>
                                                        {isLoadingDailyLogs ? (
                                                            <div className="flex justify-center py-4">
                                                                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" />
                                                            </div>
                                                        ) : (dailyLogs && dailyLogs.length > 0) ? (
                                                            <div className="grid gap-3">
                                                                {dailyLogs.map(meal => (
                                                                    <Card key={meal.id} className="group relative rounded-2xl border-2 border-border/50 bg-background/50 grayscale-[0.5] hover:grayscale-0 transition-all">
                                                                        <CardContent className="p-4 flex justify-between items-center">
                                                                            <div className="space-y-1">
                                                                                <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                                                                                    {mealTypeTranslations[meal.type]}
                                                                                </Badge>
                                                                                <p className="text-sm font-bold text-foreground/80">{meal.name}</p>
                                                                                <p className="text-[10px] font-medium text-muted-foreground">{meal.calories} kcal</p>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 rounded-full text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                                                                                onClick={() => handleRemoveMeal(meal.id, false)}
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground/60 italic px-2">Aucun repas loggé.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="history" className="mt-6 md:mt-8 focus-visible:ring-0 outline-none">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                            {Object.keys(groupedMeals).length > 0 ? (
                                                Object.entries(groupedMeals).map(([dateStr, meals]) => (
                                                    <Card key={dateStr} className="rounded-3xl border-2 bg-background/50 backdrop-blur-sm overflow-hidden border-primary/5 hover:border-primary/10 transition-colors">
                                                        <div className="p-5 border-b-2 border-primary/5 bg-primary/[0.02]">
                                                            <h3 className="font-black text-sm uppercase tracking-widest">{format(new Date(dateStr), 'eeee d MMMM yyyy', { locale: fr })}</h3>
                                                        </div>
                                                        <div className="p-5 space-y-3">
                                                            {meals.map(meal => (
                                                                <div key={meal.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                                                                    <div>
                                                                        <p className="font-black text-sm tracking-tight">{meal.name}</p>
                                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{mealTypeTranslations[meal.type]} • {meal.calories} kcal</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Card>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-24 text-center space-y-6 bg-primary/[0.03] border-2 border-dashed border-primary/20 rounded-3xl">
                                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <History className="h-10 w-10 text-primary opacity-40" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-black tracking-tight">Archives Vierges</h3>
                                                        <p className="text-muted-foreground font-medium">Commencez à savourer vos plats pour remplir l'histoire.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </PageWrapper>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
