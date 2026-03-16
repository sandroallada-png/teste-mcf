
'use client';

import { useState, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { PlusCircle, Refrigerator, X, Sparkles, Loader2, Bot, ShoppingCart, ChefHat, Info } from 'lucide-react';
import { useUser, useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Input } from '../ui/input';
import { getRecipesFromIngredientsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useReadOnly } from '@/contexts/read-only-context';

interface FridgeItem {
    id: string;
    name: string;
}

interface RecipeSuggestion {
    name: string;
    description: string;
    missingIngredients: string[];
}

export function MainPanel() {
    const { user } = useUser();
    const router = useRouter();
    const { firestore } = useFirebase();
    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const effectiveChefId = userProfile?.chefId || user?.uid;

    const [newItem, setNewItem] = useState('');
    const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isSendingToKitchen, setIsSendingToKitchen] = useState<string | null>(null);
    const [isSoonDialogOpen, setIsSoonDialogOpen] = useState(false);
    const { toast } = useToast();
    const { isReadOnly, guardAction, triggerBlock } = useReadOnly();

    const fridgeCollectionRef = useMemoFirebase(
        () => (effectiveChefId ? collection(firestore, 'users', effectiveChefId, 'fridge') : null),
        [effectiveChefId, firestore]
    );

    const fridgeQuery = useMemoFirebase(
        () => fridgeCollectionRef ? query(fridgeCollectionRef, orderBy('createdAt', 'asc')) : null,
        [fridgeCollectionRef]
    );

    const { data: ingredients, isLoading: isLoadingIngredients } = useCollection<FridgeItem>(fridgeQuery);

    const handleAddItem = guardAction((e: FormEvent) => {
        e.preventDefault();
        if (!newItem.trim() || !fridgeCollectionRef || !user) return;
        addDocumentNonBlocking(fridgeCollectionRef, {
            name: newItem.trim(),
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        setNewItem('');
    });

    const handleRemoveItem = guardAction((itemId: string) => {
        if (!effectiveChefId) return;
        const itemRef = doc(firestore, 'users', effectiveChefId, 'fridge', itemId);
        deleteDocumentNonBlocking(itemRef);
    });

    const handleGetSuggestions = async () => {
        if (!ingredients || ingredients.length === 0) return;
        setIsLoadingSuggestions(true);
        setSuggestions([]);
        const ingredientNames = ingredients.map(i => i.name);
        const { recipes, error } = await getRecipesFromIngredientsAction({ ingredients: ingredientNames });
        setIsLoadingSuggestions(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer des suggestions.' });
        } else {
            setSuggestions(recipes || []);
        }
    };

    const handleSendToKitchen = async (recipe: RecipeSuggestion) => {
        if (isReadOnly) { triggerBlock(); return; }
        if (!effectiveChefId) return;
        setIsSendingToKitchen(recipe.name);
        try {
            const pendingCookingCollectionRef = collection(firestore, 'users', effectiveChefId, 'pendingCookings');

            await addDocumentNonBlocking(pendingCookingCollectionRef, {
                userId: user?.uid || '',
                name: recipe.name,
                createdAt: Timestamp.now(),
                imageHint: recipe.name,
            });

            toast({
                title: 'Recette mise en attente !',
                description: `${recipe.name} a été ajouté à votre section "En attente" dans la Cuisine.`,
            });

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: e.message || 'Impossible d\'envoyer la recette.' });
        } finally {
            setIsSendingToKitchen(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-background">
            <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 md:py-10 space-y-10">

                {/* Header Section */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                            <Refrigerator className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Mon Frigo</h1>
                        <p className="text-muted-foreground text-sm max-w-2xl">
                            Gérez vos ingrédients disponibles et recevez des suggestions de recettes personnalisées par notre IA.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleGetSuggestions}
                            disabled={isLoadingSuggestions || !ingredients || ingredients.length === 0}
                            className="h-10 px-5 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all bg-primary text-white"
                        >
                            {isLoadingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Générer des idées
                        </Button>

                        <Button
                            onClick={() => router.push('/courses')}
                            variant="outline"
                            className="h-9 px-4 text-xs font-semibold rounded shadow-sm transition-colors"
                        >
                            <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                            Ma Liste de Courses
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Ingredients Column */}
                    <div className="md:col-span-4 space-y-6 bg-accent/5 p-4 rounded-3xl border border-border/40">
                        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Stock actuel</h2>
                        </div>

                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div className="relative group/input">
                                <Input
                                    placeholder={isReadOnly ? "Consultation uniquement..." : "Ajouter un ingrédient..."}
                                    className="h-12 px-4 text-sm rounded-xl border-2 border-primary/30 bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-md transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed pr-12 placeholder:text-muted-foreground/40"
                                    value={newItem}
                                    onChange={e => setNewItem(e.target.value)}
                                    disabled={isReadOnly}
                                    onClick={isReadOnly ? () => triggerBlock() : undefined}
                                    readOnly={isReadOnly}
                                />
                                {!isReadOnly && (
                                    <button
                                        type="submit"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors disabled:opacity-30"
                                        disabled={!newItem.trim()}
                                    >
                                        <PlusCircle className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {isLoadingIngredients ? (
                            <div className="py-10 flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {ingredients && ingredients.length > 0 ? (
                                    ingredients.map(item => (
                                        <div key={item.id} className="group flex items-center justify-between rounded-xl px-3 py-2 bg-background border border-border/50 hover:border-primary/30 transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                <span className="text-sm font-semibold">{item.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                                onClick={() => handleRemoveItem(item.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-background/50 border-muted-foreground/10 text-center px-4">
                                        <Refrigerator className="h-8 w-8 text-primary/10 mb-2" />
                                        <p className="text-[10px] font-black font-medium text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                                            Votre frigo est vide
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* AI Suggestions Column */}
                    <div className="md:col-span-8 space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Idées de recettes</h2>
                        </div>

                        {isLoadingSuggestions ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-40 rounded-lg border bg-accent/10 animate-pulse" />
                                ))}
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {suggestions.map((recipe, index) => (
                                    <Card key={index} className="flex flex-col rounded-lg border shadow-sm hover:border-primary/20 transition-all">
                                        <CardHeader className="p-5 pb-2">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-1">
                                                Suggestion IA
                                            </div>
                                            <CardTitle className="text-lg font-bold">{recipe.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-2 flex-grow space-y-4">
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {recipe.description}
                                            </p>

                                            {recipe.missingIngredients.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60">Manquants :</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {recipe.missingIngredients.map(ing => (
                                                            <span key={ing} className="text-[9px] font-bold bg-destructive/5 text-destructive border border-destructive/10 px-2 py-0.5 rounded">
                                                                {ing}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                variant="outline"
                                                className="w-full h-8 text-xs font-bold rounded mt-auto"
                                                onClick={() => handleSendToKitchen(recipe)}
                                                disabled={isSendingToKitchen === recipe.name}
                                            >
                                                {isSendingToKitchen === recipe.name ? (
                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                ) : (
                                                    <ChefHat className="mr-2 h-3.5 w-3.5" />
                                                )}
                                                Cuisiner cette recette
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-accent/5 border border-dashed rounded-lg text-center px-10">
                                <Bot className="h-8 w-8 text-muted-foreground/20 mb-4" />
                                <h4 className="text-sm font-bold mb-1">Aucune suggestion pour le moment</h4>
                                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                                    Ajoutez quelques ingrédients dans votre frigo pour que l'IA puisse vous proposer des recettes.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isSoonDialogOpen} onOpenChange={setIsSoonDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <DialogTitle className="text-center text-xl font-black">Bientôt Disponible ✨</DialogTitle>
                        <DialogDescription className="text-center pt-2 px-2 text-sm text-foreground/80 leading-relaxed font-medium">
                            Cette fonctionnalité est en cours de préparation.
                            <br /><br />
                            L'IA analysera automatiquement tous les ingrédients de votre stock actuel et vous proposera instantanément des recettes sur-mesure !
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-center pb-2">
                        <Button onClick={() => setIsSoonDialogOpen(false)} className="w-full md:w-auto px-8 rounded-full font-bold">
                            J'ai compris
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
