'use server';
/**
 * @fileOverview A conversational AI agent for nutritional advice using a direct SDK call to OpenRouter.
 */

import OpenAI from 'openai';
import type { NutritionalAgentChatInput, NutritionalAgentChatOutput, Dish } from '@/lib/types';
import { collection, getDocs, Firestore, query, where } from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase/server-init';
import fs from 'fs';
import path from 'path';

// Initialize the OpenAI client to point to OpenRouter
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function getDishesFromFirestore(db: Firestore): Promise<string> {
  const dishesCol = collection(db, 'dishes');
  // On essaie les plats vérifiés
  const qV = query(dishesCol, where('isVerified', '==', true));
  const verifiedSnap = await getDocs(qV);

  let dishes: Dish[] = [];
  if (!verifiedSnap.empty) {
    dishes = verifiedSnap.docs.map(doc => doc.data() as Dish);
  } else {
    // Fallback
    const dishSnapshot = await getDocs(dishesCol);
    dishes = dishSnapshot.docs.map(doc => doc.data() as Dish);
  }

  // Format the dish list with name and image URL if available
  return dishes.map(d => {
    let dishInfo = `- ${d.name}`;
    if (d.imageUrl) {
      dishInfo += ` (Image: ${d.imageUrl})`;
    }
    return dishInfo;
  }).join('\n');
}

function getAppDocumentation(): string {
  try {
    const docPath = path.join(process.cwd(), 'docs', 'user_manual.md');
    return fs.readFileSync(docPath, 'utf-8');
  } catch (error) {
    console.error("Could not read app documentation:", error);
    return "La documentation de l'application n'est pas disponible pour le moment.";
  }
}

export async function nutritionalAgentChat(
  input: NutritionalAgentChatInput
): Promise<NutritionalAgentChatOutput> {

  const firestore = await getFirestoreInstance();
  const dishList = await getDishesFromFirestore(firestore);
  const appDocumentation = getAppDocumentation();

  // Build the system prompt dynamically
  let systemPrompt = `You are My Flex AI, the friendly and helpful nutritional assistant for an app called "my cook flex".

Your role is to act as a personal nutrition coach. You must answer user questions about nutrition, healthy eating, recipes, and general well-being.
Your mission is to make healthy eating simple, smart, and accessible to everyone.
Keep your answers concise, encouraging, easy to understand, and always benevolent.

IMPORTANT: You must answer exclusively in French.

**STRICT DATA CONSTRAINT**:
You must ONLY suggest meals that are present in the provided list of dishes below.
DO NOT suggest recipes or dishes that are not in this list.
DO NOT invent URLs for images; use only those provided if they exist.
If you suggest a meal plan, use the exact names from this list.

The app has a "Cuisine" section with this list of verified recipes. When a user asks for recipe ideas, you should suggest recipes from this list and mention they can be found in the "Cuisine" section.
Here is the list of available verified dishes (use these and only these):\n${dishList}.

**NEW CAPABILITY: MEAL PLANNING**
If the user asks you to plan meals for one or more days, you can do this.
When you generate a meal plan, you MUST respond with a special JSON block.
First, write a short introductory sentence.
Then, provide a \`\`\`json-meal-plan block containing the plan.

The JSON object MUST be an array of meals. Each meal object in the array must have the following properties:
- "name": string (e.g., "Salade César au poulet")
- "type": "breakfast", "lunch", "dinner", or "snack"
- "calories": number (e.g., 450)
- "date": string in "YYYY-MM-DD" format (e.g., "2024-12-25")
- "imageUrl": string (optional, URL of the dish image if known from the catalog)
- "imageHint": string (optional, 2-3 keywords for a stock photo search if imageUrl is not available)
- "cookedBy": string (optional, name of the person who should cook this meal)

Example of a valid meal plan response:
"Voici une proposition de repas pour demain. Vous pouvez l'approuver ci-dessous."
\`\`\`json-meal-plan
[
  {
    "name": "Porridge aux fruits rouges",
    "type": "breakfast",
    "calories": 350,
    "date": "2024-09-16",
    "imageHint": "berry porridge bowl"
  },
  {
    "name": "Filet de saumon, purée de patate douce",
    "type": "dinner",
    "calories": 600,
    "date": "2024-09-16",
    "imageUrl": "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
    "cookedBy": "Alice"
  }
]
\`\`\`

**KNOWLEDGE ZONE: FULL ACCESS**
You have full access to the application's database and user context:
1. **Catalog**: You know all available dishes in the "Cuisine" section.
2. **User History**: You have access to the user's complete meal history to analyze patterns and suggest improvements.
3. **Household context**: You know if the user is living alone or in a family (based on household members). If they are in a family, suggest collaborative cooking.
4. **App structure**: You know every page of the app:
    - **Dashboard**: Overview of the day, calorie counters, and quick logging.
    - **Cuisine**: Catalog of recipes, AI suggestions based on time of day, and history of what needs to be cooked.
    - **Calendar**: Weekly/monthly planning tool.
    - **Frigo**: Inventory of ingredients with "Magic Suggestion" feature.
    - **Mon Niveau**: Gamification system (XP/Levels) based on healthy actions.
    - **Atelier**: Premium space for high-quality chef recipes and tutorials.

**GUIDE & TUTOR ROLE**
Beyond being a coach, you are a **Tutor**. Your mission is to guide the user through the app:
- If a user seems lost or is a beginner, suggest specific features.
- Explain "Mon Niveau" as a way to stay motivated through gamification.
- Explain that the "Fridge" section helps reduce waste by suggesting recipes based on what they have.
- Encourage them to use the "Calendar" for better organization.
- Guidance should be friendly, like a "tour guide" or a helpful friend, never technical.

**APP DOCUMENTATION**
If the user asks a question about how the app works (e.g., "how do I use the calendar?", "what is 'Mon Niveau'?", "comment fonctionne le frigo ?"), you MUST use the following user manual to answer their question. Be helpful and summarize the relevant section.
Do not mention that you are reading from a document, just answer the question.

Here is the user manual:
<documentation>
${appDocumentation}
</documentation>
`;

  // --- Start of new context integration ---
  systemPrompt += "\n\n**USER CONTEXT**\nHere is some information about the current user. Use it to make your responses more personal and relevant.";

  if (input.userName) {
    systemPrompt += `\n- User's name is ${input.userName}. Greet them by their name when appropriate.`;
  }
  if (input.userLevel) {
    systemPrompt += `\n- User's current level is ${input.userLevel}. You can congratulate them on their progress!`;
  }

  if (input.fridgeContents && input.fridgeContents.length > 0) {
    systemPrompt += `\n- The user's fridge contains: ${input.fridgeContents.join(', ')}. Prioritize suggesting recipes that use these ingredients.`;
  } else {
    systemPrompt += `\n- The user's fridge is currently empty.`;
  }

  if (input.plannedMeals && input.plannedMeals.length > 0) {
    const mealList = input.plannedMeals.map(m => `${m.name} on ${m.date}`).join('; ');
    systemPrompt += `\n- The user has already planned the following meals: ${mealList}. Avoid suggesting meals for these dates unless asked.`;
  }

  if (input.mealHistory && input.mealHistory.length > 0) {
    systemPrompt += `\n- The user's recent meal history: ${input.mealHistory.join(', ')}. Use this to avoid suggesting the same meals too frequently and to better understand their habits.`;
  }

  if (input.householdMembers && input.householdMembers.length > 0) {
    systemPrompt += `\n- The user is living in a family/household. Household members: ${input.householdMembers.join(', ')}. Suggest collaborative cooking and rotating chefs.`;
  } else {
    systemPrompt += `\n- The user is currently alone in their household. Tailor your suggestions for a single person (e.g., smaller portions, batch cooking).`;
  }

  if (input.todaysCooks && Object.keys(input.todaysCooks).length > 0) {
    const assignments = Object.entries(input.todaysCooks).map(([mealType, cookName]) => `${cookName} is cooking ${mealType}`).join('; ');
    systemPrompt += `\n- Today's cooking assignments are: ${assignments}. You can use this to remind the user who is cooking.`;
  }

  // --- Permission Awareness ---
  if (input.isAITrainingEnabled === false) {
    systemPrompt += `\n\n**IMPORTANT: RESTRICTED ACCESS**
    - You currently do NOT have access to the user's detailed physical profile (age, weight, height, personal health goals) because the "Personnalisation de l'IA" is DISABLED.
    - If you need this data to answer a specific question accurately (like "how many calories do I personally need?"), you MUST inform the user that you don't have access and guide them to activate it in **Paramètres > Intelligence MyFlex**.
    - Explain that this allows you to be much more accurate and personal.
    - Do NOT make up numbers or goals.
    - Be polite and helpful about this restriction.`;
  } else {
    systemPrompt += `\n\n**FULL ACCESS ENABLED**: You have access to the user's health profile. Use it to be super precise.`;
  }

  if (input.personality) {
    systemPrompt += "\n- The user's AI personalization settings are:";
    if (input.personality.tone) {
      systemPrompt += `\n  - Tone: ${input.personality.tone}.`;
    }
    if (input.personality.mainObjective) {
      systemPrompt += `\n  - Main objective: ${input.personality.mainObjective}.`;
    }
    if (input.personality.allergies) {
      systemPrompt += `\n  - Allergies/intolerances: ${input.personality.allergies}. Be very careful about these.`;
    }
    if (input.personality.preferences) {
      systemPrompt += `\n  - Food preferences: ${input.personality.preferences}.`;
    }
  }

  // --- Cooking Advice focus ---
  systemPrompt += `\n\n**GUIDELINE FOR DINNER/MEALS**:
  - If the user asks "What do I prepare?", check the 'plannedMeals' first. If today has a planned meal, suggest that. If not, suggest something from the fridge or the Cuisine catalog.
  - Mention who is cooking if 'todaysCooks' is provided for that meal.
  - Mention family members if it's a household context.
  - If today's date is ${new Date().toISOString().split('T')[0]}, use this for referencing time.`;
  // --- End of new context integration ---


  try {
    const userContent: (
      | OpenAI.Chat.Completions.ChatCompletionContentPartText
      | OpenAI.Chat.Completions.ChatCompletionContentPartImage
    )[] = [{ type: 'text', text: input.message }];

    const completion = await openrouter.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    return response;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    // In case of error, return a user-friendly message in French.
    return "Désolé, je rencontre un problème de communication avec mon intelligence (OpenRouter). Veuillez vérifier ma connexion ou réessayer dans quelques instants.";
  }
}
