
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
} from '@/lib/types';

// Native implementations (Client-side stubs)
// These functions are used when the app is built for native platforms (APK/iOS).
// Instead of crashing or doing nothing, they now proxy the AI requests to the main PWA backend.

const API_URL = 'https://app.mycookflex.com';

export async function getSuggestionsAction(input: SuggestHealthyReplacementsInput) {
    return { suggestions: null, error: 'Not available in native mode' };
}

export async function getTipsAction(input: ProvidePersonalizedDietaryTipsInput) {
    return { tips: null, error: 'Not available in native mode' };
}

export async function chatAction(input: NutritionalAgentChatInput) {
    return { messages: [], error: 'Not available in native mode' };
}

export async function generateTitleAction(input: GenerateConversationTitleInput) {
    return { title: null, error: 'Not available in native mode' };
}

export async function getRecipesFromIngredientsAction(input: SuggestRecipesFromIngredientsInput) {
    return { recipes: null, error: 'Not available in native mode' };
}

export async function getMealPlanAction(
    input: SuggestMealPlanInput
): Promise<{ mealPlan: SuggestMealPlanOutput | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/generate-meal-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { mealPlan: null, error: e.message };
    }
}

export async function getSingleMealSuggestionAction(
    input: SuggestSingleMealInput
): Promise<{ suggestion: SingleMealSuggestion | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/suggest-single-meal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { suggestion: null, error: e.message };
    }
}

export async function estimateCaloriesAction(
    input: EstimateCaloriesInput
): Promise<EstimateCaloriesOutput & { error: string | null }> {
    return { calories: 0, xpGained: 0, error: 'Not available in native mode' };
}

export async function getMotivationalMessageAction(
    input: GetMotivationalMessageInput
): Promise<{ message: GetMotivationalMessageOutput | null; error: string | null }> {
    return { message: null, error: 'Not available in native mode' };
}

export async function generateRecipeAction(
    input: GenerateRecipeInput
): Promise<{ recipe: GenerateRecipeOutput | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/generate-recipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { recipe: null, error: e.message };
    }
}

export async function suggestDayPlanAction(
    input: SuggestDayPlanInput
): Promise<{ plan: SuggestDayPlanOutput | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/suggest-day-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { plan: null, error: e.message };
    }
}

export async function generateReminderMessageAction(
    input: GenerateReminderInput
): Promise<{ message: GenerateReminderOutput | null; error: string | null }> {
    return { message: null, error: 'Not available in native mode' };
}

export async function getInviteAction(inviteId: string) {
    return { invite: null, error: 'Not available in native mode' };
}

export async function trackInteractionAction(action: string, metadata?: any) {
    return { success: false, error: 'Not available in native mode' };
}

export async function explainCalorieGoalAction(userId: string) {
    return { explanation: null, error: 'Not available in native mode' };
}

export async function getRecommendedDishesAction(input: { userId: string; count?: number; timeOfDay?: string }) {
    // Sur APK natif, retourner null pour que cuisine/page.tsx utilise le fallback catalogue
    return { recommendations: null, error: 'Native mode - using catalogue fallback' };
}

export async function generateShoppingListAction(input: any) {
    return { list: null, error: 'Not available in native mode' };
}
