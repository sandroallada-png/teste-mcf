
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, Timestamp, getDocs, writeBatch } from 'firebase/firestore';
import type { UserProfile, Meal, MealType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Trash2, Loader2, Utensils, ChefHat, Calendar as CalendarIcon, Share, Users } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfDay, endOfDay, format, startOfToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { fr } from 'date-fns/locale';
import { useReadOnly } from '@/contexts/read-only-context';


type TimeSlot = 'breakfast' | 'lunch' | 'dinner' | 'morning-lunch' | 'morning-dinner' | 'lunch-dinner' | 'all-day';

type CookAssignment = {
    cookName: string;
    date: Date;
    timeSlot: TimeSlot;
}

const timeSlotTranslations: Record<TimeSlot, string> = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    'morning-lunch': 'Matin & Midi',
    'morning-dinner': 'Matin & Soir',
    'lunch-dinner': 'Midi & Soir',
    'all-day': 'Toute la journée',
};


export function WhoIsCooking() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const { isReadOnly, guardAction, triggerBlock } = useReadOnly();

    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    // Dynamic household fetching: 
    // If I'm the chef, household = people who have me as chef.
    // If I have a chef, household = people who have the same chef.
    const effectiveChefId = userProfile?.chefId || user?.uid;

    const chefProfileRef = useMemoFirebase(() => (effectiveChefId ? doc(firestore, 'users', effectiveChefId) : null), [effectiveChefId, firestore]);
    const { data: chefProfile } = useDoc<UserProfile>(chefProfileRef);

    const membersQuery = useMemoFirebase(() => {
        if (!effectiveChefId) return null;
        return query(collection(firestore, 'users'), where('chefId', '==', effectiveChefId));
    }, [effectiveChefId, firestore]);
    const { data: otherMembers } = useCollection<UserProfile>(membersQuery);

    const household = useMemo(() => {
        const list: { name: string, id: string }[] = [];
        if (chefProfile) list.push({ name: chefProfile.name, id: chefProfile.id });
        if (otherMembers) {
            otherMembers.forEach(m => {
                if (m.id !== chefProfile?.id) {
                    list.push({ name: m.name, id: m.id });
                }
            });
        }
        return list;
    }, [chefProfile, otherMembers]);

    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedCook, setSelectedCook] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('dinner');

    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [pendingAssignment, setPendingAssignment] = useState<CookAssignment | null>(null);

    const [todaysCooks, setTodaysCooks] = useState<Partial<Record<MealType, string>>>({});
    const [isLoadingCooks, setIsLoadingCooks] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!user || !effectiveChefId) return;

        setIsLoadingCooks(true);
        const todayStart = startOfToday();
        const todayEnd = endOfDay(new Date());

        const foodLogsQuery = query(
            collection(firestore, `users/${effectiveChefId}/foodLogs`),
            where('date', '>=', Timestamp.fromDate(todayStart)),
            where('date', '<=', Timestamp.fromDate(todayEnd))
        );
        const scheduledQuery = query(
            collection(firestore, `users/${effectiveChefId}/cooking`),
            where('plannedFor', '>=', Timestamp.fromDate(todayStart)),
            where('plannedFor', '<=', Timestamp.fromDate(todayEnd))
        );

        Promise.all([getDocs(foodLogsQuery), getDocs(scheduledQuery)]).then(([logsSnap, schedSnap]) => {
            const cooks: Partial<Record<MealType, string>> = {};
            logsSnap.docs.forEach(doc => {
                const meal = doc.data() as Meal;
                if (meal.cookedBy) cooks[meal.type] = meal.cookedBy;
            });
            schedSnap.docs.forEach(doc => {
                const meal = doc.data() as any;
                if (meal.cookedBy) cooks[meal.type as MealType] = meal.cookedBy;
            });
            setTodaysCooks(cooks);
        }).finally(() => setIsLoadingCooks(false));
    }, [user, effectiveChefId, firestore]);

    const handleOpenAssignDialog = (cookName: string) => {
        if (isReadOnly) { triggerBlock(); return; }
        setSelectedCook(cookName);
        setSelectedDate(new Date()); // Reset to today
        setSelectedTimeSlot('dinner'); // Reset to default
        setIsAssignDialogOpen(true);
    };

    const handleConfirmAssignment = () => {
        if (!selectedCook) return;
        setPendingAssignment({ cookName: selectedCook, date: selectedDate, timeSlot: selectedTimeSlot });
        setIsAssignDialogOpen(false);
        setIsConfirmDialogOpen(true);
    };

    const handleSetCook = guardAction(async () => {
        if (!user || !pendingAssignment) return;
        const { cookName, date, timeSlot } = pendingAssignment;

        setIsUpdating(true);
        setIsConfirmDialogOpen(false);

        let mealTypesToUpdate: MealType[] = [];
        switch (timeSlot) {
            case 'breakfast': mealTypesToUpdate = ['breakfast']; break;
            case 'lunch': mealTypesToUpdate = ['lunch']; break;
            case 'dinner': mealTypesToUpdate = ['dinner']; break;
            case 'morning-lunch': mealTypesToUpdate = ['breakfast', 'lunch']; break;
            case 'morning-dinner': mealTypesToUpdate = ['breakfast', 'dinner']; break;
            case 'lunch-dinner': mealTypesToUpdate = ['lunch', 'dinner']; break;
            case 'all-day': mealTypesToUpdate = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert']; break;
        }

        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const foodLogsQuery = query(
            collection(firestore, `users/${effectiveChefId}/foodLogs`),
            where('date', '>=', Timestamp.fromDate(dayStart)),
            where('date', '<=', Timestamp.fromDate(dayEnd))
        );
        const scheduledQuery = query(
            collection(firestore, `users/${effectiveChefId}/cooking`),
            where('plannedFor', '>=', Timestamp.fromDate(dayStart)),
            where('plannedFor', '<=', Timestamp.fromDate(dayEnd))
        );

        try {
            const batch = writeBatch(firestore);
            const [logsSnap, schedSnap] = await Promise.all([getDocs(foodLogsQuery), getDocs(scheduledQuery)]);

            const logsToUpdate = logsSnap.docs.filter(doc => mealTypesToUpdate.includes((doc.data() as Meal).type));
            const schedToUpdate = schedSnap.docs.filter(doc => mealTypesToUpdate.includes((doc.data() as any).type));

            const totalDocs = logsToUpdate.length + schedToUpdate.length;

            if (totalDocs === 0) {
                toast({
                    title: `Aucun repas planifié`,
                    description: `Ajoutez des repas pour le créneau "${timeSlotTranslations[timeSlot]}" du ${format(date, 'd MMMM', { locale: fr })} afin d'assigner un cuisinier.`,
                });
            } else {
                logsToUpdate.forEach(doc => batch.update(doc.ref, { cookedBy: cookName }));
                schedToUpdate.forEach(doc => batch.update(doc.ref, { cookedBy: cookName }));
                await batch.commit();

                // If it's for today, update local state for immediate feedback
                if (format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                    const newCooks = { ...todaysCooks };
                    mealTypesToUpdate.forEach(type => newCooks[type] = cookName);
                    setTodaysCooks(newCooks);
                }

                toast({
                    title: 'Cuisinier assigné !',
                    description: `${cookName} est en charge de "${timeSlotTranslations[timeSlot]}" le ${format(date, 'd MMMM', { locale: fr })}.`,
                });
            }
        } catch (error) {
            console.error("Failed to set cook:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le cuisinier.' });
        } finally {
            setIsUpdating(false);
            setPendingAssignment(null);
        }
    });

    const isLoading = isLoadingProfile || isUpdating || isLoadingCooks;
    const mealTypeTranslations: Record<MealType, string> = {
        breakfast: 'Petit-déjeuner',
        lunch: 'Déjeuner',
        dinner: 'Dîner',
        snack: 'Collation',
        dessert: 'Dessert'
    };

    return (
        <div className="space-y-6">
            {isLoading ? (
                <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.keys(todaysCooks).length > 0 ? (
                        Object.entries(todaysCooks).map(([type, name]) => (
                            <div key={type} className="flex items-center justify-between p-3 rounded-md border bg-background/50 text-sm">
                                <span className="font-semibold text-muted-foreground">{mealTypeTranslations[type as MealType]}</span>
                                <Badge variant="secondary" className="font-bold bg-accent/50 text-foreground">
                                    {name}
                                </Badge>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full py-2 text-center text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest">
                            Aucun cuisinier assigné pour aujourd'hui
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Cuisiner aujourd'hui</p>
                <div className="flex flex-wrap gap-2">
                    {household.map(member => (
                        <Button
                            key={member.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAssignDialog(member.name)}
                            disabled={isUpdating}
                            className="h-8 rounded font-semibold text-xs border-muted/20 hover:border-primary/20 hover:bg-primary/5"
                        >
                            <ChefHat className="mr-2 h-3.5 w-3.5 opacity-60" /> {member.name}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 pt-4">
                <p className="text-sm font-medium">Membres du foyer</p>
                <div className="space-y-2">
                    {household.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback></Avatar>
                                <span className="text-sm">{member.name} {member.id === effectiveChefId ? '(Chef)' : ''}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {!userProfile?.chefId && (
                <div className="pt-6 mt-6 border-t border-muted/20">
                    <Link href="/foyer-control">
                        <Button
                            variant="outline"
                            className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all shadow-sm"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Gérer les membres & Invitations
                        </Button>
                    </Link>
                </div>
            )}
            {/* --- Dialogs --- */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assigner {selectedCook}</DialogTitle>
                        <DialogDescription>Pour quel(s) repas et à quelle date ?</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus locale={fr} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Créneau</label>
                            <Select value={selectedTimeSlot} onValueChange={(v) => setSelectedTimeSlot(v as TimeSlot)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un créneau" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="breakfast">Petit-déjeuner</SelectItem>
                                    <SelectItem value="lunch">Déjeuner</SelectItem>
                                    <SelectItem value="dinner">Dîner</SelectItem>
                                    <SelectItem value="morning-lunch">Matin & Midi</SelectItem>
                                    <SelectItem value="all-day">Toute la journée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleConfirmAssignment}>Valider</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer l'assignation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous êtes sur le point de désigner <span className="font-bold">{pendingAssignment?.cookName}</span> pour préparer <span className="font-bold">{pendingAssignment && `"${timeSlotTranslations[pendingAssignment.timeSlot]}"`}</span> le <span className="font-bold">{pendingAssignment && format(pendingAssignment.date, 'd MMMM', { locale: fr })}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingAssignment(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSetCook}>Confirmer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
