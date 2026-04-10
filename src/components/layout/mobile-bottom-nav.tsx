"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
import { LayoutDashboard, Calendar, Sparkles, ChefHat, Bot, Loader2, UtensilsCrossed, X, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, limit, where, Timestamp } from 'firebase/firestore';
import type { UserProfile, DayPlanMeal, AIPersonality, Cooking, Meal, FridgeItem } from '@/lib/types';
import { getApiUrl } from '@/lib/api-utils';
import { startOfDay, endOfDay } from 'date-fns';
import Image from 'next/image';

const HIDDEN_PATHS = [
    '/login',
    '/register',
    '/personalization',
    '/preferences',
    '/pricing',
    '/welcome',
    '/join-family',
    '/verify-email',
    '/onboarding',
];

export function MobileBottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const { firestore } = useFirebase();
    const [scope, animate] = useAnimate();
    const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasDrainedRef = useRef(false);

    // ── States ────────────────────────────────────────────────────────
    const [isMagicOpen, setIsMagicOpen] = useState(false);
    const [dayPlan, setDayPlan] = useState<DayPlanMeal[]>([]);
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    const [planFetched, setPlanFetched] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [magicSuggestion, setMagicSuggestion] = useState<DayPlanMeal | null>(null);

    const generationTexts = [
        "Analyse de votre frigo...",
        "Vérification de votre historique...",
        "Lecture de votre profil et objectifs...",
        "Consultation de vos plats favoris...",
        "Création de votre plat magique..."
    ];

    // ── Time Update ───────────────────────────────────────────────────
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // ── Firebase data ────────────────────────────────────────────────────
    const profileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile } = useDoc<UserProfile>(profileRef);
    const effectiveChefId = userProfile?.chefId || user?.uid;

    const goalsRef = useMemoFirebase(
        () => (effectiveChefId ? query(collection(firestore, 'users', effectiveChefId, 'goals'), limit(1)) : null),
        [effectiveChefId, firestore]
    );
    const { data: goalsData } = useCollection<{ description: string }>(goalsRef);
    const goals = goalsData?.[0]?.description || 'Manger équilibré et sainement.';

    // Scheduled meals for today
    const scheduledMealsQuery = useMemoFirebase(() => {
        if (!effectiveChefId) return null;
        const todayStart = startOfDay(currentTime);
        const todayEnd = endOfDay(currentTime);
        return query(
            collection(firestore, 'users', effectiveChefId, 'cooking'),
            where('plannedFor', '>=', Timestamp.fromDate(todayStart)),
            where('plannedFor', '<=', Timestamp.fromDate(todayEnd))
        );
    }, [effectiveChefId, firestore, currentTime]);
    const { data: scheduledMeals } = useCollection<Cooking>(scheduledMealsQuery);

    // Fridge and History (for context in generation)
    const fridgeRef = useMemoFirebase(() => effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'fridge') : null, [effectiveChefId, firestore]);
    const { data: fridgeItems } = useCollection<FridgeItem>(fridgeRef);

    const historyRef = useMemoFirebase(() => effectiveChefId ? query(collection(firestore, 'users', effectiveChefId, 'foodLogs'), limit(10)) : null, [effectiveChefId, firestore]);
    const { data: historyItems } = useCollection<Meal>(historyRef);

    // ── Fetch day plan ───────────────────────────────────────────────────
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
            const response = await fetch(getApiUrl('/api/ai/suggest-day-plan'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dietaryGoals: goals,
                    personality,
                    householdMembers: userProfile.household || [],
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch plan');
            setDayPlan(data.plan || []);
            setPlanFetched(true);
        } catch {
            setDayPlan([]);
        } finally {
            setIsLoadingPlan(false);
        }
    }, [userProfile, goals]);

    // ── Magic Context Logic ───────────────────────────────────────────
    const magicInfo = useMemo(() => {
        const now = currentTime;
        const hour = now.getHours();
        
        // 1. Chercher dans les plats programmés par l'utilisateur
        let targetType: DayPlanMeal['type'] = 'lunch';
        let targetTime = '13:00';

        if (hour < 10) { targetType = 'breakfast'; targetTime = '08:30'; }
        else if (hour < 15) { targetType = 'lunch'; targetTime = '13:00'; }
        else if (hour < 22) { targetType = 'dinner'; targetTime = '20:00'; }
        else { targetType = 'breakfast'; targetTime = 'demain 08:30'; }

        const programmedMeal = scheduledMeals?.find(m => m.type === targetType && !m.isDone);
        
        const peopleCount = (userProfile?.household?.length || 0) + 1;

        if (programmedMeal) {
            return {
                time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                meal: programmedMeal,
                targetTime,
                peopleCount,
                isProgrammed: true
            };
        }

        // 2. Si rien de programmé, mais qu'on a déjà une suggestion générée
        if (magicSuggestion) {
            return {
                time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                meal: magicSuggestion,
                targetTime,
                peopleCount,
                isProgrammed: false
            };
        }

        return {
            time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            meal: null,
            targetTime,
            peopleCount,
            isProgrammed: false
        };
    }, [scheduledMeals, magicSuggestion, currentTime, userProfile]);

    // ── Handlers ──────────────────────────────────────────────────────
    const handleGenerateMagicMeal = useCallback(async () => {
        setIsGenerating(true);
        setGenerationStep(0);

        // Simulation des étapes d'analyse
        for (let i = 0; i < generationTexts.length; i++) {
            setGenerationStep(i);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        try {
            const hour = currentTime.getHours();
            let timeOfDay: 'matin' | 'midi' | 'soir' | 'dessert' = 'midi';
            if (hour < 10) timeOfDay = 'matin';
            else if (hour < 15) timeOfDay = 'midi';
            else if (hour < 22) timeOfDay = 'soir';
            else timeOfDay = 'dessert';

            let personality: AIPersonality | undefined;
            if (userProfile?.isAITrainingEnabled) {
                personality = {
                    tone: userProfile.tone,
                    mainObjective: userProfile.mainObjective,
                    allergies: userProfile.allergies,
                    preferences: userProfile.preferences,
                };
            }

            const response = await fetch(getApiUrl('/api/ai/suggest-single-meal'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeOfDay,
                    dietaryGoals: goals,
                    personality,
                    mealHistory: historyItems?.map(m => m.name),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch suggestion');
            if (data.suggestion) {
                setMagicSuggestion(data.suggestion as DayPlanMeal);
            }
        } catch (e) {
            console.error("Magic generation failed:", e);
        } finally {
            setIsGenerating(false);
        }
    }, [userProfile, goals, historyItems, currentTime]);

    const handleMagicPress = useCallback(() => {
        setIsMagicOpen(true);
    }, []);

    const closeOverlay = useCallback(() => {
        setIsMagicOpen(false);
        setMagicSuggestion(null);
        setIsGenerating(false);
    }, []);

    // ── AI page drain animation ──────────────────────────────────────────
    const isAIPage = pathname === '/my-flex-ai';

    useEffect(() => {
        if (!scope.current) return;
        if (isAIPage && !hasDrainedRef.current) {
            animate(scope.current, { scale: 1, opacity: 1 }, { duration: 0.3 });
            drainTimerRef.current = setTimeout(() => {
                animate(
                    scope.current,
                    { scale: [1, 0.98, 0.88, 0.72, 0.6], opacity: [1, 0.95, 0.85, 0.75, 0.65] },
                    { duration: 5, ease: [0.25, 0.46, 0.45, 0.94], times: [0, 0.15, 0.4, 0.75, 1] }
                );
                hasDrainedRef.current = true;
            }, 3000);
        } else if (!isAIPage) {
            if (drainTimerRef.current) clearTimeout(drainTimerRef.current);
            hasDrainedRef.current = false;
            animate(scope.current, { scale: 1, opacity: 1 }, { duration: 0.4, ease: 'easeOut' });
        }
        return () => { if (drainTimerRef.current) clearTimeout(drainTimerRef.current); };
    }, [isAIPage, animate, scope]);

    const isHidden = HIDDEN_PATHS.some(p => pathname === p || pathname?.startsWith(p));
    if (isHidden) return null;

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
        { href: '/calendar', icon: Calendar, label: 'Calendrier' },
        { href: '/atelier', icon: Library, label: 'Atelier' },
        { href: '/my-flex-ai', icon: Bot, label: 'Coach' },
    ];
    const leftItems = navItems.slice(0, 2);
    const rightItems = navItems.slice(2);

    return (
        <>
            {/* ── NAV BAR ─────────────────────────────────────────────────── */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-[40] bg-background/85 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
                <div
                    className="flex items-center justify-between px-2"
                    style={{ paddingBottom: 'max(0.8rem, env(safe-area-inset-bottom))' }}
                >
                    {/* Items Gauche */}
                    <div className="flex flex-1 justify-around items-center">
                        {leftItems.map(item => {
                            const isActive = pathname === item.href;
                            return (
                                <motion.button
                                    key={item.href}
                                    className={cn(
                                        "flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all relative min-w-[64px]",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => router.push(item.href)}
                                >
                                    <item.icon className={cn("h-[22px] w-[22px]", isActive && "animate-in fade-in zoom-in duration-300")} />
                                    <span className="text-[9px] font-black tracking-wide uppercase">{item.label}</span>
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute bottom-0.5 h-0.5 w-4 bg-primary rounded-full"
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Centre: Bouton Magie */}
                    <div className="relative flex flex-col items-center px-2" style={{ marginTop: '-32px' }}>
                        <div className="absolute -top-1 inset-x-0 h-2 bg-background/20 blur-md rounded-full -z-10" />
                        <motion.button
                            ref={scope}
                            onClick={handleMagicPress}
                            className="h-16 w-16 rounded-full bg-primary shadow-[0_8px_32px_rgba(var(--primary-rgb),0.4)] border-4 border-background flex items-center justify-center group relative overflow-hidden"
                            whileTap={{ scale: 0.92 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Sparkles className="h-7 w-7 text-primary-foreground group-hover:rotate-12 transition-transform duration-300 relative z-10" />
                        </motion.button>
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest mt-1.5 transition-colors",
                            isAIPage ? "text-muted-foreground" : "text-primary drop-shadow-sm font-black"
                        )}>
                            Magie
                        </span>
                    </div>

                    {/* Items Droite */}
                    <div className="flex flex-1 justify-around items-center">
                        {rightItems.map(item => {
                            const isActive = pathname === item.href;
                            return (
                                <motion.button
                                    key={item.href}
                                    className={cn(
                                        "flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all relative min-w-[64px]",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => router.push(item.href)}
                                >
                                    <item.icon className={cn("h-[22px] w-[22px]", isActive && "animate-in fade-in zoom-in duration-300")} />
                                    <span className="text-[9px] font-black tracking-wide uppercase">{item.label}</span>
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute bottom-0.5 h-0.5 w-4 bg-primary rounded-full"
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── MAGIC OVERLAY ───────────────────────────────────────────── */}
            <AnimatePresence>
                {isMagicOpen && (
                    <motion.div
                        key="magic-overlay"
                        className="md:hidden fixed inset-0 z-[200] flex items-center justify-center px-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={closeOverlay}
                        />

                        {/* Card */}
                        <motion.div
                            className="relative z-10 w-full max-w-sm bg-background/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/20 border border-primary/20 overflow-hidden"
                            initial={{ scale: 0.8, y: 100, opacity: 0, rotate: -2 }}
                            animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, y: 100, opacity: 0, rotate: 2 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            {/* Decorative Sparkles Background */}
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <Sparkles className="absolute top-10 left-10 h-20 w-20 text-primary blur-2xl" />
                                <Sparkles className="absolute bottom-10 right-10 h-20 w-20 text-primary blur-2xl" />
                            </div>

                            {/* Header / Icon */}
                            <div className="pt-10 pb-4 flex justify-center">
                                <motion.div 
                                    className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary via-violet-500 to-orange-400 p-0.5 shadow-2xl relative"
                                    animate={{ 
                                        scale: [1, 1.1, 1], 
                                        rotate: [0, 10, -10, 0],
                                        boxShadow: ["0 0 0px var(--primary)", "0 0 30px var(--primary)", "0 0 0px var(--primary)"]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                        {magicInfo?.meal?.imageUrl ? (
                                            <div className="relative w-full h-full">
                                                <Image src={magicInfo.meal.imageUrl} alt="Meal" fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <Sparkles className="h-10 w-10 text-primary" />
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Magic Text Content */}
                            <div className="px-8 pb-10 text-center space-y-6 relative z-10">
                                {isGenerating ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-6 py-6"
                                    >
                                        <div className="relative">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                            <motion.div 
                                                className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
                                                animate={{ scale: [1, 1.5, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <AnimatePresence mode="wait">
                                                <motion.p 
                                                    key={generationStep}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="text-sm font-black text-foreground"
                                                >
                                                    {generationTexts[generationStep]}
                                                </motion.p>
                                            </AnimatePresence>
                                            <div className="flex justify-center gap-1">
                                                {generationTexts.map((_, i) => (
                                                    <div key={i} className={cn("h-1 w-4 rounded-full transition-all duration-500", i <= generationStep ? "bg-primary" : "bg-primary/10")} />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : magicInfo.meal ? (
                                    <>
                                        <div className="space-y-2">
                                            <motion.p 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"
                                            >
                                                {magicInfo.isProgrammed ? "Repas Programmé" : "Suggestion Magique"}
                                            </motion.p>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="space-y-4"
                                            >
                                                <h2 className="text-xl font-black leading-tight">
                                                    Il est <span className="text-primary">{magicInfo.time}</span>
                                                </h2>
                                                <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10">
                                                    <p className="text-sm font-bold text-foreground leading-relaxed">
                                                        {magicInfo.isProgrammed ? "Voici votre repas programmé :" : "J'ai trouvé une idée pour vous :"}
                                                        <br />
                                                        <span className="text-primary italic mt-2 inline-block">"{magicInfo.meal.name}"</span>
                                                    </p>
                                                    <div className="mt-4 flex items-center justify-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                                        <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                                            Cuisine pour {magicInfo.peopleCount} {magicInfo.peopleCount > 1 ? 'personnes' : 'personne'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <motion.button
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            onClick={() => {
                                                const encoded = encodeURIComponent(magicInfo.meal!.name);
                                                closeOverlay();
                                                router.push(`/cuisine?tab=in_progress&cook=${encoded}`);
                                            }}
                                            className="w-full bg-primary text-primary-foreground h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 active:scale-95 transition-all group"
                                        >
                                            <ChefHat className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                            Cuisiner
                                        </motion.button>
                                    </>
                                ) : (
                                    <div className="py-6 space-y-6">
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-black">Rien de prévu ?</h2>
                                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                                Vous n'avez pas encore programmé de repas pour ce moment de la journée.
                                            </p>
                                        </div>
                                        
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleGenerateMagicMeal}
                                            className="w-full bg-white text-black h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 border-2 border-primary/20 group"
                                        >
                                            <Sparkles className="h-5 w-5 text-primary group-hover:animate-pulse" />
                                            Générer un repas
                                        </motion.button>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={closeOverlay}
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors pt-2"
                                >
                                    Fermer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
