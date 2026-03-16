'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  SidebarProvider,
  Sidebar as AppSidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, limit, updateDoc, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Meal, UserProfile } from '@/lib/types';
import { Loader2, Trophy, Star, ShieldCheck, Percent, BookOpen, Target, Flame, Lightbulb, BadgeCheck, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LevelBadge } from '@/components/my-level/level-badge';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getMotivationalMessageAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { useReadOnly } from '@/contexts/read-only-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const BASE_XP_PER_LEVEL = 500;

// Generic rewards for upcoming levels
const futureRewards = [
  { name: 'Nouveau Badge de Profil', icon: <BadgeCheck /> },
  { name: 'Accès à de nouveaux objectifs', icon: <Target /> },
  { name: 'Bonus d\'XP de Série Amélioré', icon: <Flame /> },
  { name: 'Personnalisation de l\'outil Avancée', icon: <Lightbulb /> },
];

export default function MyLevelPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isGettingMotivation, setIsGettingMotivation] = useState(false);
  const [isMotivationDialogOpen, setIsMotivationDialogOpen] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  // --- Data fetching for user profile (XP, level etc) ---
  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  // --- Data fetching for sidebar ---
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

  const { isReadOnly, chefName, effectiveLevel, effectiveXp } = useReadOnly();

  // --- Data fetching for household members ---
  const spaceId = userProfile?.chefId || (user ? user.uid : null);
  const householdMembersQuery = useMemoFirebase(
    () => (spaceId ? query(collection(firestore, 'users'), where('chefId', '==', spaceId)) : null),
    [spaceId, firestore]
  );
  const { data: householdMembers, isLoading: isLoadingHousehold } = useCollection<UserProfile>(householdMembersQuery);

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
    setGoals(newDescription);
    if (goalId && user) {
      const goalRef = doc(firestore, 'users', user.uid, 'goals', goalId);
      updateDoc(goalRef, { description: newDescription }).catch(console.error);
    }
  }

  // --- XP & Level Calculation ---
  const memberCount = householdMembers ? (userProfile?.chefId ? householdMembers.length : householdMembers.length + 1) : 1;
  const isSharedLevel = memberCount > 1;
  const XP_PER_LEVEL = BASE_XP_PER_LEVEL;

  const currentXP = effectiveXp;
  const currentLevel = effectiveLevel;
  const xpForCurrentLevel = currentXP % XP_PER_LEVEL;
  const progressPercentage = (xpForCurrentLevel / XP_PER_LEVEL) * 100;
  const currentStreak = userProfile?.streak ?? 0;

  const [animatedProgress, setAnimatedProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progressPercentage), 300);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  const handleGetMotivation = async () => {
    if (!userProfile) return;
    setIsGettingMotivation(true);
    try {
      const { message, error } = await getMotivationalMessageAction({
        level: currentLevel,
        streak: currentStreak,
        mainObjective: userProfile.mainObjective || 'Améliorer mon alimentation',
        userName: user?.displayName || 'champion(ne)',
      });
      if (error || !message) throw new Error(error || 'Aucun message reçu');

      setMotivationalMessage(message.message);
      setIsMotivationDialogOpen(true);

    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'obtenir un conseil pour le moment." });
    } finally {
      setIsGettingMotivation(false);
    }
  };


  const rankTitle = useMemo(() => {
    if (currentLevel < 10) return "Novice des Fourneaux";
    if (currentLevel < 20) return "Apprenti Alchimiste";
    if (currentLevel < 30) return "Commandant de Cuisine";
    if (currentLevel < 40) return "Maître des Saveurs";
    return "Légende Culinaire";
  }, [currentLevel]);

  if (isUserLoading || isLoadingAllMeals || isLoadingGoals || isLoadingProfile || isLoadingHousehold || !user) {
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

  return (
    <div className="min-h-screen w-full bg-background font-body">
      <SidebarProvider>
        <AppSidebar collapsible="icon" className="w-64 peer hidden md:block border-r bg-sidebar">
          <Sidebar {...sidebarProps} />
        </AppSidebar>
        <SidebarInset className="bg-background">
          <div className="flex flex-col min-h-screen">
            <AppHeader
              title="Progression"
              icon={<Trophy className="h-4 w-4" />}
              user={user}
              sidebarProps={sidebarProps}
            />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-6 md:py-10 space-y-8 md:space-y-12">

              {/* Header section */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-5xl mb-4">🏆</div>
                  <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                    {isSharedLevel ? "Notre Niveau & Progression" : "Mon Niveau & Progression"}
                  </h1>
                  <p className="text-muted-foreground text-sm max-w-2xl">
                    {isSharedLevel
                      ? "Votre foyer progresse ensemble ! Chaque membre contribue à l'XP collective pour débloquer de nouveaux succès."
                      : "Suivez votre évolution, gagnez des récompenses et restez motivé tout au long de votre parcours culinaire."}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGetMotivation}
                      disabled={isGettingMotivation}
                      variant="outline"
                      className="h-9 px-4 text-xs font-semibold rounded border shadow-sm hover:bg-accent transition-colors"
                    >
                      <Lightbulb className="mr-2 h-3.5 w-3.5" />
                      Obtenir un conseil de notre outil
                    </Button>
                  </div>

                  {isSharedLevel && (
                    <Alert className="bg-primary/5 border-primary/20 max-w-2xl">
                      <Users className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-xs font-bold uppercase tracking-tight">Espace Partagé ({memberCount} membres)</AlertTitle>
                      <AlertDescription className="text-xs">
                        Le seuil de progression est de {XP_PER_LEVEL} XP par niveau ({BASE_XP_PER_LEVEL} XP x {memberCount} personnes).
                        L'XP affichée est la somme des efforts de tous les membres !
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                {/* Level Summary */}
                <div className="md:col-span-4 space-y-6">
                  <div className="p-8 rounded-lg border bg-accent/10 flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-sm relative">
                      <span className="text-3xl font-bold text-primary">{currentLevel}</span>
                      <div className="absolute -bottom-1 bg-background px-2 py-0.5 border rounded-full">
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          {isSharedLevel ? "Notre Niveau" : "Niveau"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-bold">
                        {isSharedLevel ? "La Famille" : (user.displayName || 'Utilisateur')}
                      </h2>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                        {rankTitle}
                      </p>
                    </div>

                    <div className="w-full pt-4 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground/60">
                        <span>Progression</span>
                        <span>{xpForCurrentLevel} / {XP_PER_LEVEL} XP</span>
                      </div>
                      <Progress value={progressPercentage} className="h-1.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-lg border bg-background flex items-center gap-4">
                      <div className="h-10 w-10 rounded-md bg-orange-50 flex items-center justify-center border border-orange-100">
                        <Flame className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Série actuelle</p>
                        <p className="text-sm font-bold">{currentStreak} jours consécutifs</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-background flex items-center gap-4">
                      <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Target className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Objectif actif</p>
                        <p className="text-sm font-bold truncate max-w-[180px]">{userProfile?.mainObjective || "Non défini"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline & Rewards */}
                <div className="md:col-span-8 space-y-8">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Prochaines étapes</h2>
                  </div>

                  <div className="space-y-4">
                    {futureRewards.map((reward, index) => {
                      const nextLevel = currentLevel + index + 1;
                      return (
                        <div key={nextLevel} className="flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-accent/30 transition-colors group">
                          <div className="h-10 w-10 rounded border bg-accent/20 flex items-center justify-center text-sm font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                            {nextLevel}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground/90">{reward.name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground/50 italic uppercase tracking-wider">Bloqué · Requiert niveau {nextLevel}</p>
                          </div>
                          <div className="opacity-100 md:opacity-20 md:group-hover:opacity-100 transition-opacity">
                            {/* Icon from original data is a JSX element */}
                            {/* Just rendering a clone with smaller size */}
                            <div className="h-4 w-4 text-muted-foreground">
                              {reward.icon}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Alert className="bg-primary/5 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-xs font-bold uppercase tracking-tight">Conseil du coach</AlertTitle>
                    <AlertDescription className="text-xs italic text-muted-foreground">
                      "La régularité est la clé de la réussite. Planifiez vos repas à l'avance pour maximiser vos gains."
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={isMotivationDialogOpen} onOpenChange={setIsMotivationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span>Conseil personnalisé de notre outil</span>
            </DialogTitle>
            <DialogDescription>
              Voici une recommandation basée sur votre profil actuel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="p-6 rounded-lg bg-accent/20 border border-primary/10 text-sm leading-relaxed text-foreground/90 italic">
              "{motivationalMessage}"
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsMotivationDialogOpen(false)} className="h-9 px-6 text-xs font-bold rounded">
              Merci, c'est noté
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
