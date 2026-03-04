
'use client';

import React from 'react';
import { Flame, UtensilsCrossed, Target, Award, PlusCircle, Coffee, Pizza, Cookie, Moon, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface StatCardsProps {
  displayMeals: any[];
  userProfile: any;
  calculateRecommendedCalories: (profile: any) => number;
  isEditGoalOpen: boolean;
  setIsEditGoalOpen: (open: boolean) => void;
  newTargetCalories: string;
  setNewTargetCalories: (val: string) => void;
  handleUpdateTargetCalories: () => void;
  handleExplainCalories: () => void;
  isExplainingCalories: boolean;
  calorieExplanation: string | null;
  setCalorieExplanation: (val: string | null) => void;
  cooksForToday: Record<string, string>;
}

export function StatCards({
  displayMeals,
  userProfile,
  calculateRecommendedCalories,
  isEditGoalOpen,
  setIsEditGoalOpen,
  newTargetCalories,
  setNewTargetCalories,
  handleUpdateTargetCalories,
  handleExplainCalories,
  isExplainingCalories,
  calorieExplanation,
  setCalorieExplanation,
  cooksForToday
}: StatCardsProps) {
  const stats = [
    {
      label: 'CALORIES',
      value: displayMeals.reduce((acc, m) => acc + (m.calories || 0), 0),
      unit: 'kcal',
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      progress: (displayMeals.reduce((acc, m) => acc + (m.calories || 0), 0) / (userProfile?.targetCalories || 2000)) * 100
    },
    {
      label: 'REPAS',
      value: displayMeals.filter(m => !m.isScheduled).length,
      unit: `/ ${userProfile?.targetMeals || 4}`,
      icon: UtensilsCrossed,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      progress: (displayMeals.filter(m => !m.isScheduled).length / (userProfile?.targetMeals || 4)) * 100
    },
    {
      label: 'OBJECTIF',
      value: userProfile?.targetCalories || calculateRecommendedCalories(userProfile),
      unit: 'kcal / jour',
      icon: Target,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      description: `${(userProfile?.household?.length || 0) + 1 > 1 ? "Famille" : "Individuel"} - ${userProfile?.targetCalories ? "Manuel" : "Profil"}`
    },
    {
      label: 'QUI CUISINE',
      value: (() => {
        const uniqueCooks = Array.from(new Set(Object.values(cooksForToday)));
        if (uniqueCooks.length === 0) return 'Personne';
        if (uniqueCooks.length === 1) return uniqueCooks[0];
        return 'Plusieurs';
      })(),
      unit: '',
      icon: Award,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      description: Object.entries(cooksForToday).length > 0 ? "Assignations actives" : "Aucun cuisinier"
    },
  ];

  return (
    <div className="border border-border rounded-xl p-3 md:p-5 bg-card shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group relative bg-background border border-border rounded-lg p-2.5 md:p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={cn("p-1.5 rounded-md", stat.bg)}>
                  <stat.icon className={cn("h-3 w-3 md:h-3.5 md:w-3.5", stat.color)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] md:text-[9px] font-black tracking-widest text-muted-foreground uppercase">{stat.label}</span>
                  {stat.label === 'OBJECTIF' && (
                    <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="p-1 hover:bg-muted rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => setNewTargetCalories((userProfile?.targetCalories || calculateRecommendedCalories(userProfile)).toString())}
                        >
                          <PlusCircle className="h-3 w-3 text-emerald-500" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Modifier l'objectif calorique</DialogTitle>
                          <DialogDescription>
                            Définissez votre objectif quotidien de calories.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Objectif (kcal / jour)</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={newTargetCalories}
                                  onChange={(e) => setNewTargetCalories(e.target.value)}
                                  className="flex h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                />
                                <Button onClick={handleUpdateTargetCalories} className="h-11 px-6 rounded-xl font-black">
                                  OK
                                </Button>
                              </div>
                            </div>

                            {/* Power BI Style Preview */}
                            <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 space-y-4">
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { label: 'Pdj', icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-500/10', pct: 0.2 },
                                  { label: 'Dej', icon: Pizza, color: 'text-yellow-500', bg: 'bg-yellow-500/10', pct: 0.35 },
                                  { label: 'Col', icon: Cookie, color: 'text-orange-500', bg: 'bg-orange-500/10', pct: 0.1 },
                                  { label: 'Din', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-500/10', pct: 0.35 },
                                ].map((slot, idx) => (
                                  <div key={idx} className="flex flex-col items-center gap-2 p-2 rounded-xl bg-background/50 border border-border/50">
                                    <div className={cn("p-2 rounded-lg", slot.bg)}>
                                      <slot.icon className={cn("h-4 w-4", slot.color)} />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[8px] font-black uppercase text-muted-foreground">{slot.label}</p>
                                      <p className="text-[10px] font-bold">{Math.round((parseInt(newTargetCalories) || 0) * slot.pct)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="h-3 w-full bg-background rounded-full border border-border/50 overflow-hidden flex p-0.5">
                                <div style={{ width: '20%' }} className="h-full rounded-full mx-0.5 bg-blue-500" />
                                <div style={{ width: '35%' }} className="h-full rounded-full mx-0.5 bg-yellow-500" />
                                <div style={{ width: '10%' }} className="h-full rounded-full mx-0.5 bg-orange-500" />
                                <div style={{ width: '35%' }} className="h-full rounded-full mx-0.5 bg-purple-500" />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border/30">
                              {calorieExplanation ? (
                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 relative">
                                  <p className="text-[10px] leading-relaxed italic text-foreground/80">{calorieExplanation}</p>
                                  <button onClick={() => setCalorieExplanation(null)} className="mt-2 text-[8px] font-black uppercase text-primary/60">Fermer</button>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm" onClick={handleExplainCalories} disabled={isExplainingCalories} className="w-full h-9 rounded-xl border-dashed">
                                  {isExplainingCalories ? 'Analyse...' : 'Explique-moi avec l\'IA'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 w-full truncate">
                  <span className="text-lg md:text-2xl font-black tracking-tight truncate">{stat.value}</span>
                  {stat.unit && <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase shrink-0">{stat.unit}</span>}
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate">{stat.label}</p>
                {stat.description && <p className="text-[8px] font-medium text-emerald-500/70 border-t border-emerald-500/10 mt-1 pt-1">{stat.description}</p>}
              </div>
              {stat.progress !== undefined && (
                <div className="mt-2 h-1 md:h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-border/50">
                  <div
                    className={cn("h-full transition-all duration-1000 ease-out rounded-full", stat.color.replace('text', 'bg'))}
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
