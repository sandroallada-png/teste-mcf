
'use client';

import React from 'react';
import { Bot, Sparkles, Loader2, ArrowRight, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { openDishPreview } from '@/components/shared/global-dish-preview';

interface AIAssistantPanelProps {
  isLoadingPlan: boolean;
  dayPlan: any[];
  setZoomImageUrl: (url: string) => void;
  openMealActionDialog: (meal: any) => void;
  contextualMessage: string;
}

export function AIAssistantPanel({
  isLoadingPlan,
  dayPlan,
  setZoomImageUrl,
  openMealActionDialog,
  contextualMessage
}: AIAssistantPanelProps) {
  return (
    <div className="lg:col-span-5 space-y-5 md:space-y-8 relative lg:sticky lg:top-4 self-start">
      <div className="bg-gradient-to-br from-card to-background border border-border rounded-xl p-4 md:p-6 shadow-sm flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />

        <div className="flex items-center gap-3 mb-6 relative">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-foreground">My Flex Coach</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">En ligne • Prêt à vous aider</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 relative">
          <div className="bg-muted/30 flex items-center gap-4 rounded-2xl p-4 md:p-5 border border-border/50 relative overflow-hidden group/message">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl flex-shrink-0" />
            <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0">
              <div className="absolute inset-0 bg-white rounded-2xl shadow-md border border-primary/10 transform -rotate-3 transition-transform duration-700 group-hover/message:rotate-0" />
              <div className="relative w-full h-full p-1.5 bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden transform rotate-3 transition-transform duration-700 group-hover/message:-rotate-3">
                <Image
                  src="/plat-vide.png"
                  alt="Vide"
                  fill
                  className={cn("object-cover transition-opacity duration-700 ease-in-out", dayPlan.length > 0 ? "opacity-0" : "opacity-100")}
                  sizes="100px"
                  priority
                />
                <Image
                  src="/repas-plein.png"
                  alt="Plein"
                  fill
                  className={cn("object-cover transition-opacity duration-700 ease-in-out", dayPlan.length > 0 ? "opacity-100" : "opacity-0")}
                  sizes="100px"
                />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium italic text-muted-foreground leading-relaxed">
              "{contextualMessage}"
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Planning suggéré</span>
              <Badge variant="secondary" className="text-[7px] font-black uppercase tracking-tighter bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">Alpha v2</Badge>
            </div>

            {isLoadingPlan ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 bg-muted/5 rounded-xl border border-dashed border-muted-foreground/30">
                <Loader2 className="h-5 w-5 animate-spin text-primary opacity-40" />
                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-foreground opacity-40">Analyse en cours...</span>
              </div>
            ) : dayPlan.length > 0 ? (
              <div className="space-y-2">
                {dayPlan.map((meal: any, idx: number) => (
                  <motion.div 
                    key={meal.name} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-background border border-border hover:border-primary/30 transition-all group/plan shadow-sm active:scale-[0.98]"
                  >
                    <div
                      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted border border-border cursor-zoom-in group/plan active:scale-95 transition-transform"
                      onClick={() => meal.imageUrl && setZoomImageUrl(meal.imageUrl)}
                    >
                      {meal.imageUrl ? (
                        <Image src={meal.imageUrl} alt={meal.name} width={40} height={40} className="h-full w-full object-cover group-hover/plan:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/5">
                          <Sparkles className="h-4 w-4 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p 
                        className="text-[10px] font-black truncate leading-tight uppercase tracking-tight hover:text-primary transition-colors cursor-pointer hover:underline underline-offset-2"
                        onClick={() => openDishPreview(meal.name, meal)}
                      >
                        {meal.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-extrabold text-primary uppercase">
                          {({ 'breakfast': 'Petit-déj', 'lunch': 'Déjeuner', 'dinner': 'Dîner', 'dessert': 'Dessert / Collation', 'snack': 'Dessert / Collation' } as Record<string, string>)[meal.type] || meal.type}
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground">• {meal.calories} kcal</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openMealActionDialog(meal)}
                      className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </div>

          <Link href="/my-flex-ai" className="block mt-4">
            <Button className="w-full h-12 flex bg-background border border-primary/20 text-foreground hover:bg-primary hover:text-white transition-all rounded-xl shadow-sm text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em] group/chat items-center justify-between px-4 md:px-6">
              <span className="truncate mr-2">Une question nutrition ?</span>
              <span className="flex items-center gap-1.5 shrink-0 text-primary group-hover/chat:text-white">
                <span>Lancer le Chat</span>
                <ArrowRight className="h-4 w-4 group-hover/chat:translate-x-1 transition-transform" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
