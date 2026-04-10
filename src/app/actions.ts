'use server';

import {
    suggestHealthyReplacements,
} from '@/ai/flows/suggest-healthy-replacements';
import {
    providePersonalizedDietaryTips,
} from '@/ai/flows/provide-personalized-dietary-tips';
import {
    nutritionalAgentChat,
} from '@/ai/flows/nutritional-agent-chat';
import {
    generateConversationTitle,
} from '@/ai/flows/generate-conversation-title';
import {
    suggestRecipesFromIngredients,
} from '@/ai/flows/suggest-recipes-from-ingredients';
import {
    suggestMealPlan,
} from '@/ai/flows/suggest-meal-plan';
import {
    suggestSingleMeal,
} from '@/ai/flows/suggest-single-meal';
import {
    estimateCalories,
} from '@/ai/flows/estimate-calories';
import {
    getMotivationalMessage,
} from '@/ai/flows/generate-motivational-message';
import {
    generateRecipe,
} from '@/ai/flows/generate-recipe';
import {
    suggestDayPlan
} from '@/ai/flows/suggest-day-plan';
import {
    generateReminderMessage,
} from '@/ai/flows/generate-reminder-message';
import {
    generateShoppingList
} from '@/ai/flows/generate-shopping-list';
import {
    suggestRecommendedDishes,
    trackUserInteraction,
} from '@/ai/flows/suggest-recommended-dishes';
import type {
    SuggestHealthyReplacementsInput,
    ProvidePersonalizedDietaryTipsInput,
    NutritionalAgentChatInput,
    GenerateConversationTitleInput,
    SuggestRecipesFromIngredientsInput,
    SuggestMealPlanInput,
    SuggestMealPlanOutput,
    SuggestSingleMealInput,
    SingleMealSuggestion,
    EstimateCaloriesInput,
    GetMotivationalMessageInput,
    GetMotivationalMessageOutput,
    GenerateRecipeInput,
    GenerateRecipeOutput,
    EstimateCaloriesOutput,
    SuggestDayPlanInput,
    SuggestDayPlanOutput,
    GenerateReminderInput,
    GenerateReminderOutput,
    GenerateShoppingListInput,
    GenerateShoppingListOutput,
    SuggestRecommendedDishesInput,
    SuggestRecommendedDishesOutput,
    ExplainCalorieGoalInput,
    ExplainCalorieGoalOutput,
} from '@/lib/types';


export async function getSuggestionsAction(
    input: SuggestHealthyReplacementsInput
) {
    try {
        const result = await suggestHealthyReplacements(input);
        return { suggestions: result.suggestions, error: null };
    } catch (e) {
        console.error(e);
        return { suggestions: null, error: 'Failed to get suggestions.' };
    }
}

export async function getTipsAction(input: ProvidePersonalizedDietaryTipsInput) {
    try {
        const result = await providePersonalizedDietaryTips(input);
        return { tips: result.tips, error: null };
    } catch (e) {
        console.error(e);
        return { tips: null, error: 'Failed to get tips.' };
    }
}

export async function chatAction(input: NutritionalAgentChatInput) {
    return nutritionalAgentChat(input);
}

export async function generateTitleAction(input: GenerateConversationTitleInput) {
    try {
        const result = await generateConversationTitle(input);
        return { title: result.title, error: null };
    } catch (e) {
        console.error(e);
        return { title: null, error: 'Failed to generate title.' };
    }
}

export async function getRecipesFromIngredientsAction(
    input: SuggestRecipesFromIngredientsInput
) {
    try {
        const result = await suggestRecipesFromIngredients(input);
        return { recipes: result.recipes, error: null };
    } catch (e) {
        console.error(e);
        return { recipes: null, error: 'Failed to get recipes.' };
    }
}

export async function getMealPlanAction(
    input: SuggestMealPlanInput
): Promise<{ mealPlan: SuggestMealPlanOutput | null; error: string | null }> {
    try {
        const result = await suggestMealPlan(input);
        return { mealPlan: result, error: null };
    } catch (e: any) {
        console.error(e);
        return { mealPlan: null, error: e.message || 'Failed to get meal plan.' };
    }
}

export async function getSingleMealSuggestionAction(
    input: SuggestSingleMealInput
): Promise<{ suggestion: SingleMealSuggestion | null; error: string | null }> {
    try {
        const result = await suggestSingleMeal(input);
        return { suggestion: result as SingleMealSuggestion, error: null };
    } catch (e) {
        console.error(e);
        return { suggestion: null, error: 'Failed to get meal suggestion.' };
    }
}

export async function estimateCaloriesAction(
    input: EstimateCaloriesInput
): Promise<EstimateCaloriesOutput & { error: string | null }> {
    try {
        const result = await estimateCalories(input);
        return { ...result, error: null };
    } catch (e: any) {
        console.error(e);
        return { calories: 0, xpGained: 0, error: e.message || 'Failed to analyze meal.' };
    }
}

export async function getMotivationalMessageAction(
    input: GetMotivationalMessageInput
): Promise<{ message: GetMotivationalMessageOutput | null; error: string | null }> {
    try {
        const result = await getMotivationalMessage(input);
        return { message: result, error: null };
    } catch (e) {
        console.error(e);
        return { message: null, error: 'Failed to get motivational message.' };
    }
}

export async function generateRecipeAction(
    input: GenerateRecipeInput
): Promise<{ recipe: GenerateRecipeOutput | null; error: string | null }> {
    try {
        const result = await generateRecipe(input);
        return { recipe: result, error: null };
    } catch (e) {
        console.error(e);
        return { recipe: null, error: 'Failed to generate recipe.' };
    }
}

export async function suggestDayPlanAction(
    input: SuggestDayPlanInput
): Promise<{ plan: SuggestDayPlanOutput | null; error: string | null }> {
    try {
        const result = await suggestDayPlan(input);
        return { plan: result, error: null };
    } catch (e: any) {
        console.error('Error in suggestDayPlanAction:', e);
        return { plan: null, error: e.message || 'Failed to suggest day plan.' };
    }
}

export async function generateReminderMessageAction(
    input: GenerateReminderInput
): Promise<{ message: GenerateReminderOutput | null; error: string | null }> {
    try {
        const result = await generateReminderMessage(input);
        return { message: result, error: null };
    } catch (e: any) {
        console.error('Error in generateReminderMessageAction:', e);
        return { message: null, error: e.message || 'Failed to generate reminder message.' };
    }
}

export async function generateShoppingListAction(
    input: GenerateShoppingListInput
): Promise<{ list: GenerateShoppingListOutput | null; error: string | null }> {
    try {
        const result = await generateShoppingList(input);
        return { list: result, error: null };
    } catch (e: any) {
        console.error('Error in generateShoppingListAction:', e);
        return { list: null, error: e.message || 'Failed to generate shopping list.' };
    }
}

export async function getRecommendedDishesAction(
    input: SuggestRecommendedDishesInput
): Promise<{ recommendations: SuggestRecommendedDishesOutput | null; error: string | null }> {
    try {
        const result = await suggestRecommendedDishes(input);
        return { recommendations: result, error: null };
    } catch (e: any) {
        console.error('Error in getRecommendedDishesAction:', e);
        return { recommendations: null, error: e.message || 'Failed to get recommendations.' };
    }
}

export async function trackInteractionAction(
    userId: string,
    dishName: string,
    dishOrigin: string,
    dishCategory: string,
    eventType: 'view' | 'cook_start' | 'cook_complete' | 'like' | 'dislike'
) {
    try {
        await trackUserInteraction(userId, dishName, dishOrigin, dishCategory, eventType);
        return { success: true };
    } catch (e) {
        console.error("Action error trackInteractionAction", e);
        return { success: false };
    }
}
export async function getInviteAction(inviteId: string) {
    try {
        const { getFirestoreInstance } = await import('@/firebase/server-init');
        const { doc, getDoc } = await import('firebase/firestore');
        const firestore = await getFirestoreInstance();

        const inviteRef = doc(firestore, 'invites', inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            return { invite: null, error: 'Invitation introuvable.' };
        }

        const data = inviteSnap.data();
        const expiresAt = data.expiresAt.toDate();
        if (expiresAt < new Date()) {
            return { invite: null, error: 'Invitation expirée.' };
        }

        // Convert Firestore data to serializable format (Next.js server actions requirement)
        const serializableInvite = {
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            expiresAt: data.expiresAt.toDate().toISOString(),
        };

        return { invite: serializableInvite, error: null };
    } catch (e: any) {
        console.error(e);
        return { invite: null, error: 'Une erreur est survenue.' };
    }
}

export async function explainCalorieGoalAction(
    input: ExplainCalorieGoalInput
): Promise<{ explanation: string | null; error: string | null }> {
    try {
        const { explainCalorieGoal } = await import('@/ai/flows/explain-calorie-goal');
        const result = await explainCalorieGoal(input);
        return { explanation: result.explanation, error: null };
    } catch (e: any) {
        console.error('Error in explainCalorieGoalAction:', e);
        return { explanation: null, error: e.message || 'Failed to explain calorie goal.' };
    }
}
