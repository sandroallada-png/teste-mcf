// @ts-nocheck
/**
 * @fileoverview This file is executed by the Genkit CLI. It exports the
 * configuration for the AI developer experience.
 */

import {ai} from '@/ai/genkit';
import {defineDevServer, DevServerConfig} from 'genkit/dev';

// Import all the flows you want to be able to run from the developer UI.
import * as estimateCalories from '@/ai/flows/estimate-calories';
import * as generateConversationTitle from '@/ai/flows/generate-conversation-title';
import * as generateMotivationalMessage from '@/ai/flows/generate-motivational-message';
import * as generateRecipe from '@/ai/flows/generate-recipe';
import * as nutritionalAgentChat from '@/ai/flows/nutritional-agent-chat';
import * as providePersonalizedDietaryTips from '@/ai/flows/provide-personalized-dietary-tips';
import * as suggestHealthyReplacements from '@/ai/flows/suggest-healthy-replacements';
import * as suggestMealPlan from '@/ai/flows/suggest-meal-plan';
import * as suggestRecipesFromIngredients from '@/ai/flows/suggest-recipes-from-ingredients';
import * as suggestSingleMeal from '@/ai/flows/suggest-single-meal';
import * as suggestDayPlan from '@/ai/flows/suggest-day-plan';
import * as generateReminderMessage from '@/ai/flows/generate-reminder-message';

const flows = Object.values({
  ...estimateCalories,
  ...generateConversationTitle,
  ...generateMotivationalMessage,
  ...generateRecipe,
  ...nutritionalAgentChat,
  ...providePersonalizedDietaryTips,
  ...suggestHealthyReplacements,
  ...suggestMealPlan,
  ...suggestRecipesFromIngredients,
  ...suggestSingleMeal,
  ...suggestDayPlan,
  ...generateReminderMessage,
}).filter((f: any) => f.name && f.run);

export default defineDevServer(
  (config: DevServerConfig) =>
    new Promise(resolve => {
      ai.configure(config.dotEnv).then(() => {
        resolve({
          name: 'My Cook Flex',
          flows,
        });
      });
    })
);
