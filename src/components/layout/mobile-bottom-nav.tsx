"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
import { LayoutDashboard, Calendar, Sparkles, ChefHat, Bot, Loader2, UtensilsCrossed, X, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, limit } from 'firebase/firestore';
import type { UserProfile, DayPlanMeal, AIPersonality } from '@/lib/types';
import { suggestDayPlanAction } from '@/app/actions';
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

    // ── Magic overlay state ──────────────────────────────────────────────
    const [isMagicOpen, setIsMagicOpen] = useState(false);
    const [selectedMagicMeal, setSelectedMagicMeal] = useState<DayPlanMeal | null>(null);
    const [dayPlan, setDayPlan] = useState<DayPlanMeal[]>([]);
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    const [planFetched, setPlanFetched] = useState(false);

    // ── Firebase data ────────────────────────────────────────────────────
    const profileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile } = useDoc<UserProfile>(profileRef);

    const goalsRef = useMemoFirebase(
        () => (user ? query(collection(firestore, 'users', user.uid, 'goals'), limit(1)) : null),
        [user, firestore]
    );
    const { data: goalsData } = useCollection<{ description: string }>(goalsRef);
    const goals = goalsData?.[0]?.description || 'Manger équilibré et sainement.';

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
            const { plan, error } = await suggestDayPlanAction({
                dietaryGoals: goals,
                personality,
                householdMembers: userProfile.household || [],
            });
            if (error) throw new Error(error);
            setDayPlan(plan || []);
            setPlanFetched(true);
        } catch {
            setDayPlan([]);
        } finally {
            setIsLoadingPlan(false);
        }
    }, [userProfile, goals]);

    // ── Open magic overlay ───────────────────────────────────────────────
    const handleMagicPress = useCallback(() => {
        setIsMagicOpen(true);
        if (!planFetched && userProfile) {
            fetchDayPlan();
        }
    }, [planFetched, userProfile, fetchDayPlan]);

    const closeOverlay = useCallback(() => {
        setIsMagicOpen(false);
        setSelectedMagicMeal(null);
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
        { href: '/calendar', icon: Library, label: 'Calendrier' },
        { href: '/atelier', icon: Calendar, label: 'Atelier' },
        { href: '/my-flex-ai', icon: Bot, label: 'Coach' },
    ];
    const leftItems = navItems.slice(0, 2);
    const rightItems = navItems.slice(2);

    return (
        <>
            {/* ── NAV BAR ─────────────────────────────────────────────────── */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-[40] bg-background/85 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
                <div
                    className="flex items-end justify-around px-1 pt-1"
                    style={{ paddingBottom: 'max(1.1rem, env(safe-area-inset-bottom))' }}
                >
                    {leftItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <motion.button
                                key={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all relative",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                )}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.push(item.href)}
                            >
                                <item.icon className={cn("h-[22px] w-[22px]", isActive && "animate-in fade-in zoom-in duration-300")} />
                                <span className="text-[9px] font-black tracking-wide uppercase">{item.label}</span>
                                {isActive && (
                                    <motion.span
                                        layoutId="nav-pill"
                                        className="absolute bottom-1 h-0.5 w-4 bg-primary rounded-full"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}

                    {/* Center: Magic button */}
                    <div className="relative flex flex-col items-center" style={{ marginTop: '-26px' }}>
                        <motion.button
                            ref={scope}
                            onClick={handleMagicPress}
                            className="h-16 w-16 rounded-full bg-primary shadow-2xl shadow-primary/40 border-4 border-background flex items-center justify-center active:scale-95 group"
                            whileTap={{ scale: 0.92 }}
                        >
                            <Sparkles className="h-7 w-7 text-primary-foreground group-hover:rotate-12 transition-transform duration-300" />
                        </motion.button>
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest mt-1 transition-colors",
                            isAIPage ? "text-muted-foreground" : "text-primary"
                        )}>
                            Magie
                        </span>
                    </div>

                    {rightItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <motion.button
                                key={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all relative",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                )}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.push(item.href)}
                            >
                                <item.icon className={cn("h-[22px] w-[22px]", isActive && "animate-in fade-in zoom-in duration-300")} />
                                <span className="text-[9px] font-black tracking-wide uppercase">{item.label}</span>
                                {isActive && (
                                    <motion.span
                                        layoutId="nav-pill"
                                        className="absolute bottom-1 h-0.5 w-4 bg-primary rounded-full"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* ── MAGIC OVERLAY ───────────────────────────────────────────── */}
            <AnimatePresence>
                {isMagicOpen && (
                    <motion.div
                        key="magic-overlay"
                        className="md:hidden fixed inset-0 z-[200] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={closeOverlay}
                        />

                        {/* Card */}
                        <motion.div
                            className="relative z-10 w-[88vw] max-w-sm bg-background rounded-2xl shadow-2xl shadow-primary/30 border border-primary/20 overflow-hidden"
                            initial={{ scale: 0.85, y: 40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.85, y: 40, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/60 px-5 pt-6 pb-8 relative overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                                <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary-foreground/60">
                                            Choisissez votre plat
                                        </p>
                                        <h2 className="text-xl font-black text-primary-foreground mt-0.5 flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 animate-pulse" /> Magie ✨
                                        </h2>
                                    </div>
                                    <button
                                        onClick={closeOverlay}
                                        className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-primary-foreground/80 hover:bg-white/20 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Meal List */}
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
                                        <p className="text-sm font-bold">Aucun plan pour aujourd&apos;hui</p>
                                        <button
                                            onClick={fetchDayPlan}
                                            className="text-xs font-black text-primary underline underline-offset-2"
                                        >
                                            Régénérer
                                        </button>
                                    </div>
                                ) : (
                                    dayPlan.map((meal, idx) => {
                                        const isSelected = selectedMagicMeal?.name === meal.name;
                                        return (
                                            <motion.div
                                                key={meal.name}
                                                onClick={() => setSelectedMagicMeal(isSelected ? null : meal)}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.07 }}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98]",
                                                    isSelected
                                                        ? "bg-primary/10 border-primary shadow-sm shadow-primary/20"
                                                        : "bg-accent/30 border-border/50 hover:border-primary/30"
                                                )}
                                            >
                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                                                    {meal.imageUrl ? (
                                                        <Image src={meal.imageUrl} alt={meal.name} fill sizes="48px" className="object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <UtensilsCrossed className="h-5 w-5 opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("font-black text-sm truncate", isSelected && "text-primary")}>{meal.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full",
                                                            isSelected ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary/70"
                                                        )}>
                                                            {({ 'breakfast': 'Petit-déj', 'lunch': 'Déjeuner', 'dinner': 'Dîner', 'dessert': 'Dessert / Collation' } as Record<string, string>)[meal.type] || meal.type}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground">{meal.calories} kcal</span>
                                                    </div>
                                                </div>
                                                {/* Checkmark */}
                                                <div className={cn(
                                                    "h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                                )}>
                                                    {isSelected && (
                                                        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="2,6 5,9 10,3" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* CTA */}
                            {dayPlan.length > 0 && (
                                <div className="px-4 pb-5 pt-3">
                                    <AnimatePresence mode="wait">
                                        {!selectedMagicMeal ? (
                                            <motion.p
                                                key="hint"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="text-center text-xs text-muted-foreground font-medium py-2"
                                            >
                                                👆 Sélectionnez un plat à cuisiner
                                            </motion.p>
                                        ) : (
                                            <motion.button
                                                key="cta"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                onClick={() => {
                                                    const encoded = encodeURIComponent(selectedMagicMeal.name);
                                                    closeOverlay();
                                                    router.push(`/cuisine?prep=${encoded}`);
                                                }}
                                                className="w-full rounded-2xl bg-primary text-primary-foreground font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all py-3.5"
                                            >
                                                <ChefHat className="h-5 w-5" />
                                                Cuisiner &ldquo;{selectedMagicMeal.name.length > 22
                                                    ? selectedMagicMeal.name.slice(0, 22) + '…'
                                                    : selectedMagicMeal.name}&rdquo;
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
