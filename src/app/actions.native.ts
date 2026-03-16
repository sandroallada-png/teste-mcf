
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

// ──────────────────────────────────────────────────────────────────────────────
// Native AI Proxy — toutes les requêtes IA sont redirigées vers le backend PWA
// ⚠️  Si le domaine change, mettez à jour cette constante.
// ──────────────────────────────────────────────────────────────────────────────
// Utiliser en permanence l'URL de la PWA (production) qui sert de backend à l'APK.
// NE JAMAIS UTILISER L'IP LOCALE ICI ! L'APK s'appuie sur la PWA en ligne.
const API_URL = 'https://app.mycookflex.com';

export async function getSuggestionsAction(
    input: SuggestHealthyReplacementsInput
): Promise<{ suggestions: string[] | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/suggest-healthy-replacements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { suggestions: null, error: e.message };
    }
}

export async function getTipsAction(
    input: ProvidePersonalizedDietaryTipsInput
): Promise<{ tips: string | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/provide-dietary-tips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { tips: null, error: e.message };
    }
}

export async function chatAction(
    input: NutritionalAgentChatInput
): Promise<string> {
    try {
        const res = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Erreur serveur ${res.status} : ${errorText}`);
        }
        return await res.json();
    } catch (e: any) {
        return `Désolé, une erreur réseau est survenue lors de la communication avec le serveur (Détail: ${e.message}). Veuillez vérifier que le serveur ${API_URL} est bien accessible depuis votre téléphone.`;
    }
}

export async function generateTitleAction(
    input: GenerateConversationTitleInput
): Promise<{ title: string | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/generate-title`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { title: null, error: e.message };
    }
}

export async function getRecipesFromIngredientsAction(
    input: SuggestRecipesFromIngredientsInput
): Promise<{ recipes: any[] | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/recipes-from-ingredients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { recipes: null, error: e.message };
    }
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
    try {
        const res = await fetch(`${API_URL}/api/ai/estimate-calories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { calories: 0, xpGained: 0, error: e.message };
    }
}

export async function getMotivationalMessageAction(
    input: GetMotivationalMessageInput
): Promise<{ message: GetMotivationalMessageOutput | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/get-motivational-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { message: null, error: e.message };
    }
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
    try {
        const res = await fetch(`${API_URL}/api/ai/generate-reminder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { message: null, error: e.message };
    }
}

export async function getInviteAction(inviteId: string) {
    try {
        const res = await fetch(`${API_URL}/api/ai/get-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteId })
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { invite: null, error: e.message };
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
        const res = await fetch(`${API_URL}/api/ai/track-interaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, dishName, dishOrigin, dishCategory, eventType })
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function explainCalorieGoalAction(
    input: any
): Promise<{ explanation: string | null; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/explain-calorie-goal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { explanation: null, error: e.message };
    }
}

export async function getRecommendedDishesAction(input: { userId: string; count?: number; timeOfDay?: string }) {
    try {
        const res = await fetch(`${API_URL}/api/ai/get-recommended-dishes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { recommendations: null, error: e.message };
    }
}

export async function generateShoppingListAction(
    input: any
): Promise<{ list: any; error: string | null }> {
    try {
        const res = await fetch(`${API_URL}/api/ai/generate-shopping-list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (e: any) {
        return { list: null, error: e.message };
    }
}
