
'use client';

import React, { useState, useEffect } from 'react';
import { SuggestionDialog } from '@/components/cuisine/suggestion-dialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { SingleMealSuggestion, Dish } from '@/lib/types';

/**
 * Global component to display dish details in a dialog without action buttons.
 * Use via window.dispatchEvent(new CustomEvent('open-dish-preview', { detail: { dishName: '...' } }))
 * or by using the useDishPreview hook.
 */
export function GlobalDishPreview() {
    const { firestore } = useFirebase();
    const [isOpen, setIsOpen] = useState(false);
    const [suggestion, setSuggestion] = useState<SingleMealSuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const dishesCollectionRef = useMemoFirebase(() => 
        query(collection(firestore, 'dishes'), where('isVerified', '==', true)), 
    [firestore]);
    const { data: allDishes } = useCollection<Dish>(dishesCollectionRef);

    useEffect(() => {
        const handleOpen = async (event: any) => {
            const { dishName, dishData } = event.detail;
            
            if (!dishName) return;

            setIsLoading(true);
            
            // Try to find in already loaded dishes first
            const foundLocally = allDishes?.find(d => d.name.toLowerCase() === dishName.toLowerCase());
            
            if (foundLocally) {
                setSuggestion({
                    id: foundLocally.id,
                    name: foundLocally.name,
                    calories: foundLocally.calories || dishData?.calories || 0,
                    cookingTime: foundLocally.cookingTime || 'N/A',
                    type: (foundLocally.type?.toLowerCase() || dishData?.type || 'lunch') as any,
                    imageHint: foundLocally.imageHint || foundLocally.name,
                    imageUrl: foundLocally.imageUrl || dishData?.imageUrl || '',
                    recipe: foundLocally.recipe || '',
                    description: (foundLocally as any).description || '',
                });
                setIsOpen(true);
                setIsLoading(false);
                return;
            }

            // Fallback: search in Firestore
            try {
                const q = query(collection(firestore, 'dishes'), where('name', '==', dishName), limit(1));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const d = snap.docs[0].data() as Dish;
                    setSuggestion({
                        id: snap.docs[0].id,
                        name: d.name,
                        calories: d.calories || dishData?.calories || 0,
                        cookingTime: d.cookingTime || 'N/A',
                        type: (d.type?.toLowerCase() || dishData?.type || 'lunch') as any,
                        imageHint: d.imageHint || d.name,
                        imageUrl: d.imageUrl || dishData?.imageUrl || '',
                        recipe: d.recipe || '',
                        description: (d as any).description || '',
                    });
                    setIsOpen(true);
                    return;
                }
            } catch (err) {
                console.error("Error fetching dish for preview:", err);
            } finally {
                setIsLoading(false);
            }

            // If not found in DB at all, use the passed dishData as fallback
            if (dishData) {
                setSuggestion({
                    id: dishData.id || dishName,
                    name: dishData.name || dishName,
                    calories: dishData.calories || 0,
                    cookingTime: dishData.cookingTime || 'N/A',
                    type: dishData.type || 'lunch',
                    imageHint: dishData.imageHint || dishData.name || dishName,
                    imageUrl: dishData.imageUrl || '',
                    recipe: dishData.recipe || '',
                    description: dishData.description || '',
                });
                setIsOpen(true);
            }
        };

        window.addEventListener('open-dish-preview', handleOpen);
        return () => window.removeEventListener('open-dish-preview', handleOpen);
    }, [firestore, allDishes]);

    return (
        <SuggestionDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            suggestion={suggestion}
            mode="dish"
            // No action handlers provided = view only (based on SuggestionDialog logic)
        />
    );
}

/**
 * Utility function to open a dish preview from anywhere
 */
export const openDishPreview = (dishName: string, dishData?: any) => {
    window.dispatchEvent(new CustomEvent('open-dish-preview', { 
        detail: { dishName, dishData } 
    }));
};
