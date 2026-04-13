
// AI flows are now imported dynamically within each action function to avoid bundling
// server-side modules (like 'fs') into the client-side code during static export.
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getSuggestionsAction } = await import('./actions.native');
        return getSuggestionsAction(input);
    }
    try {
        const { suggestHealthyReplacements } = await import('@/ai/flows/suggest-healthy-replacements');
        const result = await suggestHealthyReplacements(input);
        return { suggestions: result.suggestions, error: null };
    } catch (e) {
        console.error(e);
        return { suggestions: null, error: 'Failed to get suggestions.' };
    }
}

export async function getTipsAction(input: ProvidePersonalizedDietaryTipsInput) {
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getTipsAction } = await import('./actions.native');
        return getTipsAction(input);
    }
    try {
        const { providePersonalizedDietaryTips } = await import('@/ai/flows/provide-personalized-dietary-tips');
        const result = await providePersonalizedDietaryTips(input);
        return { tips: result.tips, error: null };
    } catch (e) {
        console.error(e);
        return { tips: null, error: 'Failed to get tips.' };
    }
}

export async function chatAction(input: NutritionalAgentChatInput) {
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { chatAction } = await import('./actions.native');
        return chatAction(input);
    }
    const { nutritionalAgentChat } = await import('@/ai/flows/nutritional-agent-chat');
    return nutritionalAgentChat(input);
}

export async function generateTitleAction(input: GenerateConversationTitleInput) {
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { generateTitleAction } = await import('./actions.native');
        return generateTitleAction(input);
    }
    try {
        const { generateConversationTitle } = await import('@/ai/flows/generate-conversation-title');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getRecipesFromIngredientsAction } = await import('./actions.native');
        return getRecipesFromIngredientsAction(input);
    }
    try {
        const { suggestRecipesFromIngredients } = await import('@/ai/flows/suggest-recipes-from-ingredients');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getMealPlanAction } = await import('./actions.native');
        return getMealPlanAction(input);
    }
    try {
        const { suggestMealPlan } = await import('@/ai/flows/suggest-meal-plan');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getSingleMealSuggestionAction } = await import('./actions.native');
        return getSingleMealSuggestionAction(input);
    }
    try {
        const { suggestSingleMeal } = await import('@/ai/flows/suggest-single-meal');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { estimateCaloriesAction } = await import('./actions.native');
        return estimateCaloriesAction(input);
    }
    try {
        const { estimateCalories } = await import('@/ai/flows/estimate-calories');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getMotivationalMessageAction } = await import('./actions.native');
        return getMotivationalMessageAction(input);
    }
    try {
        const { getMotivationalMessage } = await import('@/ai/flows/generate-motivational-message');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { generateRecipeAction } = await import('./actions.native');
        return generateRecipeAction(input);
    }
    try {
        const { generateRecipe } = await import('@/ai/flows/generate-recipe');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { suggestDayPlanAction } = await import('./actions.native');
        return suggestDayPlanAction(input);
    }
    try {
        const { suggestDayPlan } = await import('@/ai/flows/suggest-day-plan');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { generateReminderMessageAction } = await import('./actions.native');
        return generateReminderMessageAction(input);
    }
    try {
        const { generateReminderMessage } = await import('@/ai/flows/generate-reminder-message');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { generateShoppingListAction } = await import('./actions.native');
        return generateShoppingListAction(input);
    }
    try {
        const { generateShoppingList } = await import('@/ai/flows/generate-shopping-list');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getRecommendedDishesAction } = await import('./actions.native');
        return getRecommendedDishesAction(input);
    }
    try {
        const { suggestRecommendedDishes } = await import('@/ai/flows/suggest-recommended-dishes');
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { trackInteractionAction } = await import('./actions.native');
        return trackInteractionAction(userId, dishName, dishOrigin, dishCategory, eventType);
    }
    try {
        const { trackUserInteraction } = await import('@/ai/flows/suggest-recommended-dishes');
        await trackUserInteraction(userId, dishName, dishOrigin, dishCategory, eventType);
        return { success: true };
    } catch (e) {
        console.error("Action error trackInteractionAction", e);
        return { success: false };
    }
}

export async function getInviteAction(inviteId: string) {
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { getInviteAction } = await import('./actions.native');
        return getInviteAction(inviteId);
    }
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
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true') {
        const { explainCalorieGoalAction } = await import('./actions.native');
        return explainCalorieGoalAction(input);
    }
    try {
        const { explainCalorieGoal } = await import('@/ai/flows/explain-calorie-goal');
        const result = await explainCalorieGoal(input);
        return { explanation: result.explanation, error: null };
    } catch (e: any) {
        console.error('Error in explainCalorieGoalAction:', e);
        return { explanation: null, error: e.message || 'Failed to explain calorie goal.' };
    }
}
