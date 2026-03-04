'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    SidebarProvider,
    Sidebar as AppSidebar,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useUser, useFirebase, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, query, Timestamp, doc, where } from 'firebase/firestore';
import type { Dish, Meal, UserProfile } from '@/lib/types';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { startOfToday, addDays, format } from 'date-fns';
import {
    Package, Calendar, ChevronRight, Sparkles, Clock, Flame, ArrowRight,
    UtensilsCrossed, Coffee, Sun, Apple, Moon, Loader2, ZoomIn, Info,
    RefreshCw, Check, X, Settings2, CalendarDays, CalendarRange, User2,
    Target, MapPin, HeartPulse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/app-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';
import { ImageZoomLightbox } from '@/components/shared/image-zoom-lightbox';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ═══════════════════════════════ TYPES ═════════════════════════════ */
type BoxMeal = {
    id: string;
    name: string;
    time: string;
    calories: number;
    image: string;
    category: string;
    type: 'breakfast' | 'lunch' | 'dessert' | 'dinner';
    matchReason?: string; // why this dish was chosen
};

type DayPlan = { day: number; label: string; meals: BoxMeal[] };
type WeeklyBox = { week: number; title: string; description: string; theme: string; color: string; days: DayPlan[] };
type PlanEntry = BoxMeal & { dayIndex: number; dayLabel: string; enabled: boolean };

const MEAL_TYPES: BoxMeal['type'][] = ['breakfast', 'lunch', 'dessert', 'dinner'];

const mealTypesMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    breakfast: { label: 'Petit-déj', icon: <Coffee className="h-3 w-3" /> },
    lunch: { label: 'Déjeuner', icon: <Sun className="h-3 w-3" /> },
    dessert: { label: 'Goûter', icon: <Apple className="h-3 w-3" /> },
    dinner: { label: 'Dîner', icon: <Moon className="h-3 w-3" /> },
};

/* ═══════════════════════════ SCORING ENGINE ════════════════════════ */
function scoreDish(dish: Dish, profile: UserProfile | null | undefined): number {
    if (!profile) return Math.random() * 10;

    let score = 0;
    const dishOrigin = (dish.origin || '').toLowerCase();
    const dishCat = (dish.category || '').toLowerCase();
    const dishName = (dish.name || '').toLowerCase();
    const origin = (profile.origin || '').toLowerCase();
    const country = (profile.country || '').toLowerCase();
    const obj = (profile.mainObjective || '').toLowerCase();
    const allergies = (profile.allergies || '').toLowerCase();
    const prefs = (profile.preferences || '').toLowerCase();

    // ── Hard block: allergies ─────────────────────────────────────────
    if (allergies) {
        const words = allergies.split(/[,;|\s]+/).map(s => s.trim()).filter(Boolean);
        if (words.some(w => dishName.includes(w) || dishCat.includes(w))) return -9999;
    }

    // ── Cultural match ────────────────────────────────────────────────
    if (origin && dishOrigin.includes(origin)) score += 35; // from their roots
    if (country && dishOrigin.includes(country)) score += 20; // local food

    // ── Virtual profile (machine-learned scores) ──────────────────────
    const vp = profile.virtualProfile;
    if (vp) {
        score += (vp.originScores?.[dish.origin] || 0) * 6;
        score += (vp.categoryScores?.[dish.category] || 0) * 5;
    }

    // ── Objective alignment ───────────────────────────────────────────
    const cal = dish.calories || 500;
    if (obj.includes('poids') || obj.includes('minceur') || obj.includes('perte')) {
        if (cal < 350) score += 18;
        else if (cal < 500) score += 10;
        else if (cal > 700) score -= 15;
    }
    if (obj.includes('masse') || obj.includes('muscle') || obj.includes('prise')) {
        if (cal > 600) score += 18;
        const hiProtein = ['poulet', 'viande', 'bœuf', 'boeuf', 'poisson', 'oeuf', 'lentille', 'pois', 'haricot', 'thon', 'saumon', 'crevette'];
        if (hiProtein.some(k => dishName.includes(k) || dishCat.includes(k))) score += 12;
    }
    if (obj.includes('vég') || obj.includes('végétar') || obj.includes('vegan')) {
        const meat = ['poulet', 'bœuf', 'boeuf', 'porc', 'agneau', 'veau', 'canard', 'saumon', 'thon', 'crevette', 'viande'];
        if (meat.some(k => dishName.includes(k))) score -= 25;
    }

    // ── Explicit preferences ──────────────────────────────────────────
    if (prefs) {
        const liked = prefs.split(/[,;|]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        if (liked.some(w => dishName.includes(w) || dishCat.includes(w) || dishOrigin.includes(w))) score += 12;
    }

    // ── Small random factor to avoid monotony between weeks ───────────
    score += Math.random() * 6;
    return score;
}

function matchReason(dish: Dish, profile: UserProfile | null | undefined): string {
    if (!profile) return '';
    const origin = (profile.origin || '').toLowerCase();
    const country = (profile.country || '').toLowerCase();
    const obj = (profile.mainObjective || '').toLowerCase();
    const dishOrigin = (dish.origin || '').toLowerCase();

    if (origin && dishOrigin.includes(origin)) return `✦ Cuisine de vos origines (${profile.origin})`;
    if (country && dishOrigin.includes(country)) return `✦ Cuisine locale (${profile.country})`;
    if (obj.includes('poids') && (dish.calories || 500) < 450) return `✦ Faible en calories — parfait pour votre objectif`;
    if (obj.includes('masse') && (dish.calories || 500) > 600) return `✦ Riche en énergie — adapté à la prise de masse`;
    const vp = profile.virtualProfile;
    if (vp && (vp.categoryScores?.[dish.category] || 0) > 0) return `✦ Catégorie appréciée selon vos habitudes`;
    return '✦ Sélectionné pour vous';
}

/* ═══════════════════════════ BOX BUILDER ═══════════════════════════ */
function buildBoxes(dishes: Dish[], profile: UserProfile | null | undefined): WeeklyBox[] {
    if (!dishes?.length) return [];

    const obj = (profile?.mainObjective || '').toLowerCase();
    const originLabel = profile?.origin || '';
    const countryLabel = profile?.country || '';

    const themes = [
        {
            title: obj.includes('poids') ? 'Légèreté & Équilibre' : 'Équilibre Gourmand',
            theme: originLabel ? `Saveurs ${originLabel}` : "Saveurs d'Antan",
            color: 'from-emerald-600 to-teal-600',
        },
        {
            title: obj.includes('masse') ? 'Force & Vitalité' : 'Boost Énergie',
            theme: 'Performance & Santé',
            color: 'from-blue-600 to-indigo-600',
        },
        {
            title: 'Découverte & Diversité',
            theme: countryLabel ? `Cuisine de ${countryLabel}` : 'Voyage Culinaire',
            color: 'from-amber-500 to-orange-500',
        },
        {
            title: profile?.virtualProfile ? 'Rien que Pour Vous' : 'Fusion Culturelle',
            theme: 'Sélection Personnalisée',
            color: 'from-rose-600 to-pink-600',
        },
    ];

    // Sort dishes once by profile score
    const scored = dishes
        .map(d => ({ dish: d, score: scoreDish(d, profile) }))
        .filter(s => s.score > -9000) // remove hard-blocked
        .sort((a, b) => b.score - a.score)
        .map(s => s.dish);

    const fallback = dishes; // if all are blocked, use all

    return [1, 2, 3, 4].map(w => {
        const t = themes[w - 1];
        // Slightly reshuffle per week for variety
        const pool = [...scored].sort((a, b) => {
            const diff = scoreDish(b, profile) - scoreDish(a, profile);
            return diff + (w - 1) * 0.5; // bias shifts per week
        });
        const src = pool.length ? pool : fallback;

        return {
            week: w, ...t,
            description: profile?.mainObjective
                ? `Adapté à votre objectif : ${profile.mainObjective}`
                : 'Un programme complet pour une semaine parfaite.',
            days: [1, 2, 3, 4, 5, 6, 7].map(d => {
                const label = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][d - 1];
                const meals: BoxMeal[] = MEAL_TYPES.map((type, tIdx) => {
                    const idx = ((d - 1) * 4 + tIdx + (w - 1) * 11) % src.length;
                    const dish = src[idx];
                    return {
                        id: `w${w}d${d}t${type}`,
                        name: dish.name,
                        time: dish.cookingTime || '20 min',
                        calories: dish.calories || 450,
                        image: dish.imageUrl || `https://picsum.photos/seed/${dish.name}/400/400`,
                        category: dish.category,
                        type,
                        matchReason: matchReason(dish, profile),
                    };
                });
                return { day: d, label, meals };
            }),
        };
    });
}

/* ═══════════════════════ PLAN ENTRY BUILDER ════════════════════════ */
const buildPlanEntries = (box: WeeklyBox, days: number): PlanEntry[] =>
    box.days.slice(0, days).flatMap(dp =>
        dp.meals.map(m => ({ ...m, dayIndex: dp.day, dayLabel: dp.label, enabled: true }))
    );

/* ═══════════════════════ PROFILE INSIGHTS ══════════════════════════ */
function buildProfileInsights(profile: UserProfile | null | undefined) {
    if (!profile) return [];
    const items: { icon: React.ReactNode; label: string; value: string; color: string }[] = [];
    if (profile.origin) items.push({ icon: <MapPin className="h-3.5 w-3.5" />, label: 'Origine', value: profile.origin, color: 'text-emerald-500' });
    if (profile.country) items.push({ icon: <MapPin className="h-3.5 w-3.5" />, label: 'Pays', value: profile.country, color: 'text-blue-500' });
    if (profile.mainObjective) items.push({ icon: <Target className="h-3.5 w-3.5" />, label: 'Objectif', value: profile.mainObjective, color: 'text-primary' });
    if (profile.targetCalories) items.push({ icon: <Flame className="h-3.5 w-3.5" />, label: 'Calories', value: `${profile.targetCalories} kcal/j`, color: 'text-orange-500' });
    if (profile.allergies) items.push({ icon: <HeartPulse className="h-3.5 w-3.5" />, label: 'Allergies', value: profile.allergies, color: 'text-rose-500' });
    if (profile.preferences) items.push({ icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Préférences', value: profile.preferences, color: 'text-violet-500' });
    const vp = profile.virtualProfile;
    if (vp?.totalInteractions) items.push({ icon: <User2 className="h-3.5 w-3.5" />, label: 'Historique', value: `${vp.totalInteractions} repas analysés`, color: 'text-sky-500' });
    return items;
}

/* ═══════════════════════════════ PAGE ══════════════════════════════ */
export default function BoxPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [selectedWeek, setSelectedWeek] = useState(1);
    const [selectedDay, setSelectedDay] = useState(1);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date>(startOfToday());
    const [planOpen, setPlanOpen] = useState(false);
    const [duration, setDuration] = useState<3 | 7>(7);
    const [planEntries, setPlanEntries] = useState<PlanEntry[]>([]);
    const [isPlanning, setIsPlanning] = useState(false);

    /* ── Data ──────────────────────────────────────── */
    const dishesRef = useMemoFirebase(
        () => query(collection(firestore, 'dishes'), where('isVerified', '==', true)),
        [firestore]
    );
    const { data: dishes, isLoading: isLoadingDishes } = useCollection<Dish>(dishesRef);

    const profileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile } = useDoc<UserProfile>(profileRef);
    const effectiveChefId = userProfile?.chefId || user?.uid;

    const mealsRef = useMemoFirebase(
        () => (effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'foodLogs') : null),
        [effectiveChefId, firestore]
    );
    const { data: mealsData } = useCollection<Meal>(mealsRef);

    /* ── Derived ───────────────────────────────────── */
    const boxes = useMemo(() => buildBoxes(dishes || [], userProfile), [dishes, userProfile]);
    const currentBox = useMemo(() => boxes.find(b => b.week === selectedWeek) || boxes[0], [boxes, selectedWeek]);
    const currentDay = useMemo(() => currentBox?.days.find(d => d.day === selectedDay) || currentBox?.days[0], [currentBox, selectedDay]);
    const totalKcal = currentDay?.meals.reduce((s, m) => s + m.calories, 0) || 0;
    const profileInsights = useMemo(() => buildProfileInsights(userProfile), [userProfile]);

    /* ── Plan dialog ───────────────────────────────── */
    const openPlanDialog = useCallback(() => {
        if (!currentBox) return;
        setPlanEntries(buildPlanEntries(currentBox, duration));
        setPlanOpen(true);
    }, [currentBox, duration]);

    const handleDurationChange = (d: 3 | 7) => {
        setDuration(d);
        if (currentBox) setPlanEntries(buildPlanEntries(currentBox, d));
    };

    const toggleEntry = (id: string, dayIndex: number) =>
        setPlanEntries(prev => prev.map(e =>
            e.id === id && e.dayIndex === dayIndex ? { ...e, enabled: !e.enabled } : e
        ));

    const swapMeal = (id: string, dayIndex: number) => {
        if (!dishes?.length) return;
        setPlanEntries(prev => prev.map(e => {
            if (e.id !== id || e.dayIndex !== dayIndex) return e;
            // Profile-scored pool, exclude current dish
            const pool = [...dishes]
                .filter(d => d.name !== e.name)
                .map(d => ({ dish: d, score: scoreDish(d, userProfile) }))
                .filter(s => s.score > -9000)
                .sort((a, b) => b.score - a.score)
                .map(s => s.dish);
            const candidates = pool.filter(d => d.category === e.category);
            const src = candidates.length ? candidates : pool;
            if (!src.length) return e;
            const pick = src[Math.floor(Math.random() * Math.min(src.length, 5))]; // pick from top-5
            return {
                ...e,
                name: pick.name,
                time: pick.cookingTime || '20 min',
                calories: pick.calories || 450,
                image: pick.imageUrl || `https://picsum.photos/seed/${pick.name}/400/400`,
                category: pick.category,
                matchReason: matchReason(pick, userProfile),
            };
        }));
    };

    /* ── Confirm plan ──────────────────────────────── */
    const handleConfirmPlan = async () => {
        if (!user || !effectiveChefId || !currentBox) return;
        setIsPlanning(true);
        const cookingRef = collection(firestore, 'users', effectiveChefId, 'cooking');
        const planStartDate = startDate || startOfToday();
        const enabled = planEntries.filter(e => e.enabled);

        try {
            await Promise.all(enabled.map(entry => {
                const date = addDays(planStartDate, entry.dayIndex - 1);
                const dish = dishes?.find(d => d.name === entry.name);
                return addDocumentNonBlocking(cookingRef, {
                    userId: user.uid,
                    name: entry.name,
                    calories: entry.calories,
                    cookingTime: entry.time,
                    type: entry.type,
                    imageUrl: entry.image,
                    recipe: dish?.recipe || '',
                    imageHint: dish?.imageHint || entry.name,
                    createdAt: Timestamp.now(),
                    plannedFor: Timestamp.fromDate(date),
                });
            }));
            toast({
                title: '✅ Box Planifiée !',
                description: `${enabled.length} repas basés sur votre profil, ajoutés à partir du ${format(planStartDate, 'dd MMMM', { locale: fr })}.`,
            });
            setPlanOpen(false);
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
        } finally {
            setIsPlanning(false);
        }
    };

    const groupedEntries = useMemo(() => {
        const map: Record<number, { label: string; entries: PlanEntry[] }> = {};
        planEntries.forEach(e => {
            if (!map[e.dayIndex]) map[e.dayIndex] = { label: e.dayLabel, entries: [] };
            map[e.dayIndex].entries.push(e);
        });
        return Object.values(map);
    }, [planEntries]);

    const enabledCount = planEntries.filter(e => e.enabled).length;

    const sidebarProps = {
        goals: userProfile?.mainObjective || 'Perdre du poids...',
        setGoals: () => { },
        meals: mealsData || [],
    };

    /* ══════════════════════════ RENDER ══════════════════════════════ */
    return (
        <div className="h-screen w-full bg-background font-body select-none">
            <SidebarProvider>
                <AppSidebar collapsible="icon" className="w-80 peer hidden md:block" variant="sidebar">
                    <Sidebar {...sidebarProps} />
                </AppSidebar>
                <SidebarInset>
                    <div className="flex h-full flex-1 flex-col overflow-hidden">
                        <AppHeader title="Ma Box Nutritionnelle" icon={<Package className="h-6 w-6" />} user={user} sidebarProps={sidebarProps} />
                        <main className="flex-1 overflow-y-auto">
                            {isLoadingDishes ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                            ) : boxes.length === 0 ? (
                                <div className="flex flex-col h-64 items-center justify-center text-center space-y-3 p-8">
                                    <Package className="h-12 w-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">Revenez bientôt !</p>
                                </div>
                            ) : (
                                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">

                                    {/* ── HERO ── */}
                                    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/10 p-6 md:p-8">
                                        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 blur-[120px] -mr-20 -mt-20 rounded-full pointer-events-none" />
                                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                            <div className="flex-1 space-y-4">
                                                <Badge variant="secondary" className="px-3 py-1 rounded-full bg-primary/20 text-primary font-black uppercase tracking-widest text-[9px]">
                                                    Programme Premium
                                                </Badge>
                                                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                                                    28 Repas par Box.<br />
                                                    <span className="text-primary italic">7 jours complets.</span>
                                                </h1>
                                                <p className="text-muted-foreground text-sm font-medium max-w-lg leading-relaxed">
                                                    {userProfile?.mainObjective
                                                        ? `Chaque repas est sélectionné pour votre objectif : "${userProfile.mainObjective}".`
                                                        : 'Petit-déjeuner, déjeuner, goûter et dîner : tout est prévu. Personnalisez avant d\'activer.'}
                                                </p>
                                                <div className="flex flex-wrap gap-3 pt-1">
                                                    {[
                                                        { icon: <Calendar className="h-4 w-4 text-primary" />, label: '7 Jours / 7' },
                                                        { icon: <UtensilsCrossed className="h-4 w-4 text-primary" />, label: '4 Repas / Jour' },
                                                        { icon: <Settings2 className="h-4 w-4 text-primary" />, label: '100% Personnalisable' },
                                                    ].map(({ icon, label }) => (
                                                        <div key={label} className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-xl border border-border/50 text-xs font-bold">
                                                            {icon} {label}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="hidden md:flex shrink-0 relative w-36 h-36 cursor-zoom-in" onClick={() => setZoomImage('/box.png')}>
                                                <div className={cn('absolute inset-0 rounded-3xl blur-3xl opacity-30 bg-gradient-to-br', currentBox?.color)} />
                                                <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white hover:-rotate-3 transition-transform duration-500">
                                                    <Image src="/box.png" alt="Ma Box MyFlex" fill className="object-contain p-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* ── WEEK SELECTOR ── */}
                                    <div className="flex flex-wrap items-center gap-3 justify-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Semaine :</p>
                                        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-full border shadow-inner">
                                            {boxes.map(box => (
                                                <button key={box.week}
                                                    title={box.title}
                                                    onClick={() => { setSelectedWeek(box.week); setSelectedDay(1); }}
                                                    className={cn(
                                                        'relative h-10 w-10 rounded-full text-sm font-black transition-all flex items-center justify-center',
                                                        selectedWeek === box.week
                                                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105'
                                                            : 'text-muted-foreground hover:bg-background hover:text-foreground'
                                                    )}
                                                >
                                                    {box.week}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Active week label */}
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {currentBox?.title}
                                        </span>
                                    </div>

                                    {/* ── CONTENT GRID ── */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                                        {/* LEFT PANEL – sticky on desktop, horizontal scroll on mobile */}
                                        <div className="lg:col-span-3">
                                            {/* Mobile: horizontal day scroller */}
                                            <div className="lg:hidden flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 px-0.5">
                                                {currentBox?.days?.map(d => (
                                                    <button key={d.day} onClick={() => setSelectedDay(d.day)}
                                                        className={cn(
                                                            'shrink-0 px-3 h-8 rounded-full text-xs font-bold whitespace-nowrap transition-all border',
                                                            selectedDay === d.day
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                                : 'text-muted-foreground border-border/40 hover:bg-muted/30'
                                                        )}
                                                    >
                                                        {d.label.slice(0, 3)}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Mobile: compact action bar */}
                                            <div className="lg:hidden flex items-center gap-2 pt-1">
                                                <Button onClick={openPlanDialog} size="sm" className="flex-1 h-9 rounded-xl font-black text-xs uppercase tracking-wider">
                                                    <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                                                    Personnaliser
                                                </Button>
                                                <Badge variant="outline" className="h-9 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-accent/50 flex items-center gap-1 shrink-0">
                                                    <Flame className="h-3 w-3 text-orange-500" />{totalKcal} kcal
                                                </Badge>
                                            </div>


                                            <div className="hidden lg:block sticky top-4 space-y-3">

                                                {/* Box card */}
                                                <Card className="overflow-hidden border-none shadow-lg">
                                                    <div className={cn('p-4 bg-gradient-to-br text-white', currentBox?.color)}>
                                                        <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase tracking-widest mb-1.5">
                                                            Semaine {selectedWeek}
                                                        </Badge>
                                                        <h2 className="text-lg font-black leading-tight">{currentBox?.title}</h2>
                                                        <p className="text-white/60 text-[10px] font-semibold mt-0.5">{currentBox?.theme}</p>
                                                    </div>
                                                    <CardContent className="p-3 space-y-3">
                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                            <span>Début</span>
                                                            <span className="text-primary">{format(startDate, 'eeee d MMM', { locale: fr })}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" className="h-10 w-10 rounded-xl flex-shrink-0 border-primary/20 hover:bg-primary/5 p-0">
                                                                        <Calendar className="h-4 w-4 text-primary" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden border shadow-2xl" align="start">
                                                                    <CalendarComponent mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus locale={fr} />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Button onClick={openPlanDialog} className="flex-1 h-10 rounded-xl font-black text-xs uppercase tracking-wider">
                                                                <Settings2 className="mr-2 h-3.5 w-3.5" />
                                                                Personnaliser
                                                                <ArrowRight className="ml-1.5 h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <p className="text-[9px] text-center text-muted-foreground">
                                                            Fin le {format(addDays(startDate, 6), 'eeee d MMMM', { locale: fr })}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                {/* Day selector */}
                                                <div className="bg-background border border-border/50 rounded-xl p-2 space-y-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary text-center py-1">Jours</p>
                                                    {currentBox?.days?.map(d => (
                                                        <button key={d.day} onClick={() => setSelectedDay(d.day)}
                                                            className={cn(
                                                                'w-full px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all',
                                                                selectedDay === d.day
                                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                                    : 'text-muted-foreground hover:bg-muted/30 border border-transparent'
                                                            )}
                                                        >
                                                            <span>{d.label}</span>
                                                            {selectedDay === d.day && <ChevronRight className="h-3 w-3" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT PANEL */}
                                        <div className="lg:col-span-9 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm">
                                                        {selectedDay}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black uppercase tracking-tighter leading-none">Menu du {currentDay?.label}</h3>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{currentBox?.theme}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="h-7 border px-3 rounded-lg font-bold text-[10px] uppercase tracking-widest bg-accent/50">
                                                    <Flame className="h-3 w-3 mr-1 text-orange-500" />{totalKcal} kcal
                                                </Badge>
                                            </div>

                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={`${selectedWeek}-${selectedDay}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
                                                >
                                                    {currentDay?.meals?.map(meal => (
                                                        <div key={meal.type}
                                                            className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-muted aspect-[3/4] cursor-zoom-in"
                                                            onClick={() => setZoomImage(meal.image)}
                                                        >
                                                            <Image src={meal.image} alt={meal.name} fill
                                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <ZoomIn className="h-7 w-7 text-white drop-shadow-lg" />
                                                            </div>
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                                                                <span className="flex items-center gap-1 text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">
                                                                    {mealTypesMeta[meal.type].icon}
                                                                    {mealTypesMeta[meal.type].label}
                                                                </span>
                                                                <h4 className="text-white font-black text-sm leading-tight line-clamp-2 group-hover:-translate-y-1 transition-transform">
                                                                    {meal.name}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1.5 text-[9px] font-semibold text-white/50 uppercase tracking-widest">
                                                                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{meal.time}</span>
                                                                    <span className="flex items-center gap-0.5"><Flame className="h-2.5 w-2.5 text-orange-400" />{meal.calories}</span>
                                                                </div>
                                                                {meal.matchReason && (
                                                                    <p className="text-[8px] text-primary/80 font-bold mt-1 truncate">{meal.matchReason}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            </AnimatePresence>

                                            {/* Profile insight banner */}
                                            <div className="flex items-start gap-4 bg-gradient-to-r from-primary/5 to-transparent border border-dashed border-primary/20 rounded-xl p-4">
                                                <div className="shrink-0 h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                                    <User2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Sélection basée sur votre profil</p>
                                                    {profileInsights.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {profileInsights.map(i => (
                                                                <span key={i.label} className={cn('text-[9px] font-bold flex items-center gap-1 bg-background/60 rounded-lg px-2 py-1 border border-border/30', i.color)}>
                                                                    {i.icon} <span className="text-muted-foreground font-medium">{i.label}:</span> {i.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">
                                                            Complétez votre profil pour des recommandations encore plus précises →{' '}
                                                            <a href="/preferences" className="text-primary font-bold hover:underline">Paramètres</a>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pb-32 md:pb-10" />
                                </div>
                            )}
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* ══════════════ PLAN DIALOG ══════════════════════════════════ */}
            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogContent className="max-w-3xl w-full sm:rounded-[2rem] border-none p-0 overflow-hidden shadow-2xl bg-background/95 backdrop-blur-xl flex flex-col h-[100dvh] md:h-auto max-h-[100dvh]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Personnaliser ma planification</DialogTitle>
                        <DialogDescription>Basé sur votre profil nutritionnel.</DialogDescription>
                    </DialogHeader>

                    {/* Dialog header */}
                    <div className={cn('p-5 bg-gradient-to-br text-white flex items-center justify-between', currentBox?.color)}>
                        <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Planification personnalisée</p>
                            <h2 className="text-xl font-black leading-tight mt-0.5">{currentBox?.title}</h2>
                            {userProfile?.mainObjective && (
                                <p className="text-white/70 text-xs mt-0.5 font-medium">Objectif : {userProfile.mainObjective}</p>
                            )}
                        </div>
                        <Badge className="bg-white/20 text-white border-none text-xs font-bold px-3 py-1">
                            {enabledCount} repas
                        </Badge>
                    </div>

                    {/* Profile summary strip */}
                    {profileInsights.length > 0 && (
                        <div className="px-5 py-3 bg-primary/5 border-b border-primary/10 flex flex-wrap gap-2">
                            {profileInsights.slice(0, 4).map(i => (
                                <span key={i.label} className={cn('text-[9px] font-bold flex items-center gap-1 bg-background rounded-full px-2.5 py-1 border border-border/30', i.color)}>
                                    {i.icon} {i.value}
                                </span>
                            ))}
                            <span className="text-[9px] text-muted-foreground flex items-center">
                                — Sélection basée sur ce profil
                            </span>
                        </div>
                    )}

                    {/* Duration & date */}
                    <div className="px-5 py-4 border-b border-border/30 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/10">
                        <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Durée</p>
                            <div className="flex gap-2">
                                {([3, 7] as const).map(d => (
                                    <button key={d} onClick={() => handleDurationChange(d)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-black border transition-all',
                                            duration === d
                                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/30'
                                                : 'bg-background text-muted-foreground border-border/50 hover:border-primary/30'
                                        )}
                                    >
                                        {d === 3 ? <CalendarDays className="h-3.5 w-3.5" /> : <CalendarRange className="h-3.5 w-3.5" />}
                                        {d === 3 ? '3 Jours' : 'Semaine complète'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date de début</p>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-9 rounded-xl border-primary/20 text-xs font-bold gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        {format(startDate, 'eeee d MMM', { locale: fr })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden border shadow-2xl" align="end">
                                    <CalendarComponent mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus locale={fr} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Meals grid */}
                    <ScrollArea className="flex-1 md:max-h-[50vh]">
                        <div className="p-5 space-y-6">
                            {groupedEntries.map(({ label, entries }) => (
                                <div key={label}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                        <span className="h-px flex-1 bg-border/40" />{label}<span className="h-px flex-1 bg-border/40" />
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {entries.map(entry => (
                                            <div key={`${entry.dayIndex}-${entry.type}`}
                                                className={cn(
                                                    'group relative rounded-xl overflow-hidden border-2 transition-all duration-200',
                                                    entry.enabled ? 'border-primary/30 shadow-sm' : 'border-border/20 opacity-50 grayscale'
                                                )}
                                            >
                                                <div className="relative aspect-square bg-muted">
                                                    <Image src={entry.image} alt={entry.name} fill className="object-cover" sizes="150px" />
                                                    <div className="absolute inset-0 bg-black/40" />
                                                    <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-wider text-white/80 flex items-center gap-0.5">
                                                        {mealTypesMeta[entry.type].icon} {mealTypesMeta[entry.type].label}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleEntry(entry.id, entry.dayIndex)}
                                                        className={cn(
                                                            'absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all',
                                                            entry.enabled
                                                                ? 'bg-primary border-primary text-white'
                                                                : 'bg-background/60 border-white/30 text-white/60'
                                                        )}
                                                    >
                                                        {entry.enabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3" />}
                                                    </button>
                                                </div>
                                                <div className="p-2 bg-background">
                                                    <p className="text-xs font-bold leading-tight line-clamp-2 mb-1">{entry.name}</p>
                                                    {entry.matchReason && (
                                                        <p className="text-[8px] text-primary/70 font-medium truncate mb-1">{entry.matchReason}</p>
                                                    )}
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-0.5">
                                                            <Flame className="h-2.5 w-2.5 text-orange-400" />{entry.calories}
                                                        </span>
                                                        <button
                                                            onClick={() => swapMeal(entry.id, entry.dayIndex)}
                                                            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-primary hover:text-primary/70 transition-colors"
                                                            title="Changer ce plat (profil-compatible)"
                                                        >
                                                            <RefreshCw className="h-2.5 w-2.5" /> Changer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 md:p-5 border-t border-border/10 bg-background/50 backdrop-blur-md shrink-0 mb-safe flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-muted-foreground font-medium w-full sm:w-auto text-center sm:text-left">
                            <span className="font-black text-foreground">{enabledCount}</span> / {planEntries.length} repas sélectionnés
                        </p>
                        <div className="flex w-full sm:w-auto gap-2">
                            <Button variant="outline" className="flex-1 sm:flex-none rounded-xl h-12 sm:h-10 text-xs font-bold" onClick={() => setPlanOpen(false)}>
                                Annuler
                            </Button>
                            <Button
                                className="flex-2 sm:flex-none rounded-xl h-12 sm:h-10 font-black text-xs uppercase tracking-wider px-6 shadow-xl active:scale-[0.98] transition-all"
                                onClick={handleConfirmPlan}
                                disabled={isPlanning || enabledCount === 0}
                            >
                                {isPlanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                                {isPlanning ? 'En cours...' : `Planifier ${enabledCount} repas`}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ImageZoomLightbox isOpen={!!zoomImage} imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
        </div>
    );
}
