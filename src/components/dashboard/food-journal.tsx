
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { Calendar, PlusCircle, Coffee, UtensilsCrossed, Moon, Apple, IceCream, Trash2, CookingPot, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MealType } from '@/lib/types';
import { openDishPreview } from '@/components/shared/global-dish-preview';
import { useToast } from '@/hooks/use-toast';

interface FoodJournalProps {
  mealTypes: string[];
  mealTypeDetails: Record<string, any>;
  displayMeals: any[];
  currentTime: Date;
  openFormForType: (type: MealType) => void;
  setSuggestionMeal: (meal: any) => void;
  setZoomImageUrl: (url: string) => void;
  removeMeal: (id: string, isScheduled: boolean) => void;
}

export function FoodJournal({
  mealTypes,
  mealTypeDetails,
  displayMeals,
  currentTime,
  openFormForType,
  setSuggestionMeal,
  setZoomImageUrl,
  removeMeal
}: FoodJournalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const notifiedMealsRef = useRef<Set<string>>(new Set());

  const thresholds: Record<string, number> = useMemo(() => ({
    breakfast: 8.5, // 08:30
    lunch: 11.5, // 11:30
    dessert: 16.0, // 16:00
    dinner: 19.5, // 19:30
  }), []);

  const currentHourMin = currentTime.getHours() + currentTime.getMinutes() / 60;

  useEffect(() => {
    displayMeals.forEach(meal => {
      if (meal.isScheduled && !meal.isDone) {
        const threshold = thresholds[meal.type as string];
        if (threshold !== undefined && currentHourMin >= threshold) {
          const mealKey = `${meal.id}-${meal.type}-late`;
          if (!notifiedMealsRef.current.has(mealKey)) {
            notifiedMealsRef.current.add(mealKey);
            toast({
              title: 'Céline (L\'IA) - A table !',
              description: `Avez-vous oublié de cuisiner votre ${mealTypeDetails[meal.type]?.translation.toLowerCase()} ("${meal.name}") ?`,
              variant: 'default',
            });
          }
        }
      }
    });
  }, [currentHourMin, displayMeals, thresholds, mealTypeDetails, toast]);

  const isMealLate = (meal: any) => {
    if (!meal.isScheduled || meal.isDone) return false;
    const threshold = thresholds[meal.type as string];
    return threshold !== undefined && currentHourMin >= threshold;
  };

  return (
    <div className="lg:col-span-7 border border-border rounded-xl p-3 md:p-5 bg-card shadow-sm space-y-4 md:space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-2 md:pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
          </div>
          <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">Journal Alimentaire</h2>
        </div>
        <Badge variant="outline" className="rounded-full font-bold bg-background border border-border px-2.5 py-0.5 text-[9px] md:text-[10px]">
          {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Badge>
      </div>

      <div className="grid gap-3 md:gap-4 text-left">
        {mealTypes.map(type => {
          const details = mealTypeDetails[type];
          const mealsForType = displayMeals.filter(m => m.type === type);

          return (
            <div key={type} className="group/meal flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <details.icon className={cn("h-4 w-4", details.className.split(' ')[0].replace('border-', 'text-'))} />
                  <h3 className="text-lg font-black tracking-tight">{details.translation}</h3>
                </div>
                <button
                  onClick={() => openFormForType(type as import('@/lib/types').MealType)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-muted/30 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/meal:opacity-100 border border-muted/40"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>

              <div className={cn(
                "relative rounded-2xl p-4 transition-all border-2",
                mealsForType.length > 0 ? "bg-background border-muted/60 shadow-sm" : "bg-muted/10 border-dashed border-muted/40"
              )}>
                {mealsForType.length > 0 ? (
                  <div className="space-y-3">
                    {mealsForType.map(meal => {
                      const late = isMealLate(meal);
                      return (
                      <div
                        key={meal.id}
                        className={cn(
                          "group/item flex items-center justify-between p-2 md:p-2.5 rounded-xl transition-all cursor-pointer border",
                          late ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30" : "border-transparent hover:border-border/50 hover:bg-accent/5"
                        )}
                        onClick={() => setSuggestionMeal(meal)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn("h-8 w-8 md:h-9 md:w-9 rounded-lg flex items-center justify-center shrink-0 border shadow-sm overflow-hidden cursor-zoom-in group/ph active:scale-95 transition-all", details.className)}
                            onClick={(e) => {
                              if (meal.imageUrl) {
                                e.stopPropagation();
                                setZoomImageUrl(meal.imageUrl);
                              }
                            }}
                          >
                            {meal.imageUrl ? (
                              <Image src={meal.imageUrl} alt={meal.name} width={40} height={40} className="h-full w-full object-cover group-hover/ph:scale-110 transition-transform duration-500" />
                            ) : (
                              <details.icon className="h-4 w-4 md:h-5 md:w-5 opacity-40 group-hover/ph:scale-110 transition-all duration-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 
                              className="text-sm font-black text-foreground truncate hover:text-primary transition-colors hover:underline underline-offset-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDishPreview(meal.name);
                              }}
                            >
                              {meal.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground">{meal.calories} kcal</span>
                              <div className="flex items-center gap-1.5">
                                {meal.isScheduled && (
                                  <Badge variant="secondary" className={cn("text-[7px] font-black uppercase px-1 py-0 border-none", late ? "bg-red-500/20 text-red-500" : "bg-primary/10 text-primary")}>Prévu</Badge>
                                )}
                                {late && (
                                  <Badge variant="outline" className="text-[7px] font-black uppercase px-1 py-0 text-red-500 border-red-500/30 flex items-center gap-1">
                                    <AlertCircle className="h-2 w-2" /> En retard
                                  </Badge>
                                )}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push('/cuisine');
                                  }}
                                  className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer"
                                >
                                  <CookingPot className="h-3.5 w-3.5 text-primary" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMeal(meal.id, meal.isScheduled);
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/item:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      )
                    })}
                  </div>
                ) : (
                  <button
                    onClick={() => openFormForType(type as import('@/lib/types').MealType)}
                    className="w-full flex items-center justify-center gap-2 py-4 group/add"
                  >
                    <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center group-hover/add:border-primary/50 group-hover/add:bg-primary/5 transition-all text-muted-foreground group-hover/add:text-primary">
                      <PlusCircle className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover/add:text-primary/70 transition-colors">Ajouter un repas</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
