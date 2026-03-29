
'use client';

import { useState } from 'react';
import type { MealPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, Timestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Check, Utensils, Zap, Loader2, Clock, AlertTriangle, User, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MealPlanCardProps {
  plan: MealPlan;
}

export function MealPlanCard({ plan }: MealPlanCardProps) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<{ id: string; name: string; date: string; type: string; collection: 'cooking' | 'foodLogs' }[]>([]);

  const checkConflicts = async () => {
    if (!user) return [];
    
    const foundConflicts: any[] = [];
    const cookingRef = collection(firestore, `users/${user.uid}/cooking`);
    const foodLogsRef = collection(firestore, `users/${user.uid}/foodLogs`);

    for (const meal of plan) {
      const mealDate = parseISO(meal.date);
      const start = new Date(mealDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(mealDate);
      end.setHours(23, 59, 59, 999);

      // Check cooking
      const qC = query(cookingRef, where('plannedFor', '>=', Timestamp.fromDate(start)), where('plannedFor', '<=', Timestamp.fromDate(end)), where('type', '==', meal.type));
      const snapC = await getDocs(qC);
      snapC.forEach(d => foundConflicts.push({ id: d.id, name: d.data().name, date: meal.date, type: meal.type, collection: 'cooking' }));

      // Check foodLogs (though less common to replace logs)
      const qL = query(foodLogsRef, where('date', '>=', Timestamp.fromDate(start)), where('date', '<=', Timestamp.fromDate(end)), where('type', '==', meal.type));
      const snapL = await getDocs(qL);
      snapL.forEach(d => foundConflicts.push({ id: d.id, name: d.data().name, date: meal.date, type: meal.type, collection: 'foodLogs' }));
    }

    return foundConflicts;
  };

  const executeApproval = async (shouldReplace: boolean) => {
    if (!user) return;
    setIsAdding(true);
    const cookingCollection = collection(firestore, `users/${user.uid}/cooking`);

    try {
      if (shouldReplace) {
        for (const c of conflicts) {
          await deleteDoc(doc(firestore, `users/${user.uid}/${c.collection}`, c.id));
        }
      }

      const promises = plan.map(meal => {
        const mealDate = parseISO(meal.date);
        return addDocumentNonBlocking(cookingCollection, {
          userId: user.uid,
          name: meal.name,
          calories: meal.calories,
          type: meal.type,
          plannedFor: Timestamp.fromDate(mealDate),
          cookingTime: "25 min",
          imageHint: meal.imageHint || meal.name,
          imageUrl: meal.imageUrl || null,
          cookedBy: meal.cookedBy || null,
          isDone: false,
          createdAt: Timestamp.now(),
        });
      });

      await Promise.all(promises);
      setIsAdded(true);
      setConflictDialogOpen(false);
      toast({
        title: 'Planning mis à jour !',
        description: 'Les repas ont été ajoutés à votre calendrier de cuisine.',
      });
    } catch (error) {
      console.error('Failed to add meal plan:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer le plan." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!user || isAdded || isAdding) return;

    setIsAdding(true);
    try {
      const foundConflicts = await checkConflicts();
      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setConflictDialogOpen(true);
        setIsAdding(false);
      } else {
        await executeApproval(false);
      }
    } catch (e) {
      console.error(e);
      setIsAdding(false);
    }
  };

  const groupedByDate = plan.reduce((acc, meal) => {
    const dateStr = meal.date;
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(meal);
    return acc;
  }, {} as Record<string, MealPlan>);

  return (
    <Card className="mt-4 bg-muted/30 border-primary/10 shadow-2xl overflow-hidden rounded-3xl relative">
      <CardContent className="p-0">
        <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary">Plan suggéré</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Synchronisation calendrier</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-primary">{plan.length}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Plats</span>
          </div>
        </div>

        <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto scrollbar-thin">
          {Object.entries(groupedByDate).map(([date, meals]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary/20 rounded-full" />
                <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground/80">
                  {format(parseISO(date), 'eeee d MMMM', { locale: fr })}
                </h4>
              </div>
              
              <div className="grid gap-3">
                {meals.map((meal, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={meal.name + idx} 
                    className="group relative flex gap-3 p-3 bg-background/50 hover:bg-background border border-primary/5 hover:border-primary/20 rounded-2xl transition-all duration-300 shadow-sm"
                  >
                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl overflow-hidden border border-primary/10 shrink-0 bg-muted flex items-center justify-center">
                      {meal.imageUrl ? (
                        <img 
                          src={meal.imageUrl}
                          alt={meal.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <Utensils className="h-6 w-6 text-primary/20" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                          meal.type === 'breakfast' && "bg-amber-100 text-amber-700",
                          meal.type === 'lunch' && "bg-blue-100 text-blue-700",
                          meal.type === 'dinner' && "bg-indigo-100 text-indigo-700",
                          meal.type === 'snack' && "bg-emerald-100 text-emerald-700",
                        )}>
                          {meal.type}
                        </span>
                        <div className="flex items-center gap-1 text-primary/60">
                          <Zap className="h-3 w-3 fill-current" />
                          <span className="text-[10px] font-black">{meal.calories}</span>
                        </div>
                      </div>
                      <h5 className="text-sm font-black text-foreground line-clamp-1">{meal.name}</h5>
                      
                      <div className="flex items-center gap-3 mt-1.5 opacity-60">
                        {meal.cookedBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase">{meal.cookedBy}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase">25 min</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-primary/5">
          <Button
            onClick={handleApprovePlan}
            disabled={isAdding || isAdded}
            className={cn(
              "w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-500",
              isAdded ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-primary shadow-primary/20 hover:scale-[1.02]"
            )}
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isAdded ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {isAdded ? 'Programme validé !' : isAdding ? 'Traitement...' : 'Approuver le programme'}
          </Button>
        </div>

        {/* Conflict UI Overlay */}
        <AnimatePresence>
          {conflictDialogOpen && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
             >
               <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                 <AlertTriangle className="h-8 w-8 text-orange-600" />
               </div>
               <h4 className="text-xl font-black mb-2 uppercase tracking-tight">Conflit détecté</h4>
               <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                 Vous avez déjà des repas programmés pour certaines de ces tranches horaires.<br/>
                 <span className="font-bold text-foreground">Souhaitez-vous les remplacer par ce nouveau plan ?</span>
               </p>
               
               <div className="w-full space-y-3">
                 <Button 
                   className="w-full h-12 rounded-2xl bg-primary font-black uppercase tracking-widest text-xs"
                   onClick={() => executeApproval(true)}
                   disabled={isAdding}
                 >
                   Remplacer et valider
                 </Button>
                 <Button 
                   variant="ghost" 
                   className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs text-muted-foreground"
                   onClick={() => setConflictDialogOpen(false)}
                 >
                   Annuler
                 </Button>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
