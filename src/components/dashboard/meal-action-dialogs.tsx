
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, Hourglass, Shuffle, UtensilsCrossed } from 'lucide-react';

interface MealActionDialogsProps {
  selectedMealForAction: any | null;
  setSelectedMealForAction: (meal: any | null) => void;
  handleScheduleMeal: (meal: any) => void;
  handleAddToPending: (meal: any) => void;
  mealConflict: { existing: any, new: any } | null;
  setMealConflict: (conflict: any | null) => void;
  handleConfirmReplace: () => void;
  mealTypeTranslations: Record<string, string>;
}

export function MealActionDialogs({
  selectedMealForAction,
  setSelectedMealForAction,
  handleScheduleMeal,
  handleAddToPending,
  mealConflict,
  setMealConflict,
  handleConfirmReplace,
  mealTypeTranslations
}: MealActionDialogsProps) {
  return (
    <>
      <Dialog open={!!selectedMealForAction} onOpenChange={(open) => !open && setSelectedMealForAction(null)}>
        <DialogContent
          className="sm:max-w-[400px] rounded-2xl p-6 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/20"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

          <DialogHeader className="space-y-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl font-black">Que voulez-vous faire ?</DialogTitle>
            <DialogDescription className="text-center text-sm font-medium leading-relaxed">
              Choisissez comment ajouter <span className="text-foreground font-extrabold">"{selectedMealForAction?.name}"</span> à votre journée.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-6">
            <Button
              onClick={() => selectedMealForAction && handleScheduleMeal(selectedMealForAction)}
              className="h-16 rounded-2xl flex items-center justify-start gap-4 px-5 text-left border-2 border-primary/10 bg-primary/5 hover:bg-primary hover:text-white hover:border-primary transition-all group/btn1 relative overflow-hidden"
            >
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/btn1:scale-110">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase tracking-tight">Cuisiner maintenant</span>
                <span className="text-[10px] opacity-70 font-bold group-hover/btn1:text-white/80 transition-colors">Ajouter à mon planning d'aujourd'hui</span>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => selectedMealForAction && handleAddToPending(selectedMealForAction)}
              className="h-16 rounded-2xl flex items-center justify-start gap-4 px-5 text-left border-2 border-muted hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all group/btn2 relative overflow-hidden"
            >
              <div className="h-10 w-10 rounded-xl bg-muted group-hover/btn2:bg-primary/10 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/btn2:scale-110">
                <Hourglass className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase tracking-tight">Mettre en attente</span>
                <span className="text-[10px] text-muted-foreground font-bold group-hover/btn2:text-primary/70 transition-colors">Envoyer vers la zone (Cuisine)</span>
              </div>
            </Button>
          </div>

          <div className="pt-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setSelectedMealForAction(null)}>
            Annuler
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mealConflict} onOpenChange={(open) => !open && setMealConflict(null)}>
        <DialogContent
          className="sm:max-w-[420px] rounded-[2.5rem] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-2xl shadow-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="h-32 bg-gradient-to-br from-orange-500/20 via-primary/10 to-transparent relative">
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <div className="h-20 w-20 rounded-3xl bg-background/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl rotate-3">
                <div className="h-16 w-16 rounded-2xl bg-orange-500 flex items-center justify-center -rotate-6 animate-pulse">
                  <Shuffle className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 pt-10 text-center space-y-6">
            <div className="space-y-2 text-center">
              <DialogTitle className="text-2xl font-black tracking-tight">Conflit de repas !</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                Un plat est déjà prévu pour ce créneau ({mealTypeTranslations[mealConflict?.new.type || 'lunch']}).
              </DialogDescription>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border/50 text-center">
                <div className="h-16 w-16 rounded-xl overflow-hidden grayscale opacity-50 border border-border bg-muted flex items-center justify-center">
                  {mealConflict?.existing.imageUrl ? (
                    <img src={mealConflict.existing.imageUrl} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-6 w-6 opacity-20" />
                  )}
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Actuel</p>
                <p className="text-[11px] font-bold truncate w-full">{mealConflict?.existing.name}</p>
              </div>

              <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20 scale-105 shadow-lg shadow-primary/5 text-center">
                <div className="h-16 w-16 rounded-xl overflow-hidden border border-primary/20 shadow-inner bg-muted flex items-center justify-center">
                  {mealConflict?.new.imageUrl ? (
                    <img src={mealConflict.new.imageUrl} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-6 w-6 opacity-20" />
                  )}
                </div>
                <p className="text-[10px] font-black uppercase text-primary">Nouveau</p>
                <p className="text-[11px] font-bold truncate w-full">{mealConflict?.new.name}</p>
              </div>
            </div>

            <div className="grid gap-3 pt-4">
              <Button
                onClick={handleConfirmReplace}
                className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/25"
              >
                Remplacer l'existant
              </Button>
              <Button
                variant="ghost"
                onClick={() => setMealConflict(null)}
                className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Garder actuel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
