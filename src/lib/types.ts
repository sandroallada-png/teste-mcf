import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type Meal = {
  id: string;
  name: string;
  type: MealType;
  calories: number;
  date: Timestamp;
  cookedBy?: string;
  imageUrl?: string;
};

export const CookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  calories: z.number(),
  cookingTime: z.string(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  recipe: z.string().optional(),
  imageHint: z.string(),
  imageUrl: z.string().optional().nullable().transform(val => (val === "" ? undefined : val)),
  createdAt: z.any(), // Firestore Timestamp
  plannedFor: z.any(), // Firestore Timestamp for the planned date
  isDone: z.boolean().optional(),
});
export type Cooking = z.infer<typeof CookingSchema>;

export const PendingCookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  createdAt: z.any(), // Firestore Timestamp
  imageHint: z.string().optional(),
});
export type PendingCooking = z.infer<typeof PendingCookingSchema>;


export const AIPersonalitySchema = z.object({
  tone: z.string().optional().describe('The desired tone for the AI assistant.'),
  mainObjective: z.string().optional().describe("The user's main health and dietary goals."),
  allergies: z.string().optional().describe('A list of the user\'s allergies and intolerances.'),
  preferences: z.string().optional().describe('A list of the user\'s food preferences and dislikes.'),
});
export type AIPersonality = z.infer<typeof AIPersonalitySchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  photoURL: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
  country: z.string().optional(),
  origin: z.string().optional(),
  xp: z.number().default(0),
  level: z.number().default(1),
  streak: z.number().default(0),
  mainObjective: z.string().optional(),
  secondaryObjectives: z.array(z.string()).optional(),
  isAITrainingEnabled: z.boolean().optional(),
  role: z.enum(['user', 'admin']).optional(),
  subscriptionStatus: z.enum(['free', 'welcome', 'eco', 'premium']).optional(),
  language: z.string().optional().default('system'),
  household: z.array(z.string()).optional().describe('List of household members for cooking rotation.'),
  // Virtual Profile for recommendations
  virtualProfile: z.object({
    originScores: z.record(z.number()).default({}),
    categoryScores: z.record(z.number()).default({}),
    lastInteractions: z.array(z.string()).default([]),
    totalInteractions: z.number().default(0),
  }).optional(),
  // AI Personality fields merged here
  tone: z.string().optional(),
  // mainGoals: z.string().optional(), // Deprecated in favor of mainObjective
  allergies: z.string().optional(),
  preferences: z.string().optional(),
  chefId: z.string().optional().describe('The UID of the household chef/owner if this user is a member.'),
  // Physical Metrics for calculation
  weight: z.number().optional().describe('Weight in kg'),
  height: z.number().optional().describe('Height in cm'),
  age: z.number().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  targetCalories: z.number().optional().default(2000),
  targetMeals: z.number().optional().default(4),
  createdAt: z.any().optional(),
  referralSource: z.string().optional(),
  theme: z.string().optional(),
  phoneNumber: z.string().optional(),
  isFloatingShortcutsEnabled: z.boolean().optional().default(true),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type HouseholdInvite = {
  id: string;
  chefId: string;
  chefName: string;
  name: string;
  phone: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: 'pending' | 'accepted';
};


export const PromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  link: z.string().url().optional(),
  isActive: z.boolean(),
  createdAt: z.any(),
});
export type Promotion = z.infer<typeof PromotionSchema>;

export const CarouselItemSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  imageUrl: z.string().url(),
  link: z.string().url().optional(),
  createdAt: z.any(),
});
export type CarouselItem = z.infer<typeof CarouselItemSchema>;

export const PublicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
  price: z.string().optional(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().optional(),
  category: z.enum(['recipe', 'guide']),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.any(), // Firestore Timestamp
});
export type Publication = z.infer<typeof PublicationSchema>;

export const DishSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  origin: z.string(),
  cookingTime: z.string(),
  calories: z.number().optional(),
  imageUrl: z.string().optional().nullable().transform(val => (val === "" ? undefined : val)),
  type: z.string().optional().describe("Type de plat ou régime (ex: 'Sans gluten', 'Végétarien')"),
  momentSuggest: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', '']).optional().describe("Moment conseillé pour ce plat"),
  recipe: z.string().optional(),
  imageHint: z.string().optional(),
  isVerified: z.boolean().optional(),
});
export type Dish = z.infer<typeof DishSchema>;

export const AtelierBookSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().url(),
  recipe: z.string(), // Markdown
  description: z.string(),
  hashtags: z.array(z.string()),
  price: z.number().default(0),
  cookingTime: z.string().optional(),
  category: z.string().optional(),
  galleryUrls: z.array(z.string()), // 3 to 10 photos
  createdAt: z.any(),
});
export type AtelierBook = z.infer<typeof AtelierBookSchema>;

export const FeedbackSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  rating: z.number().min(-1).max(5).describe("Rating: -1 (dislike), 0 (neutral/info), 1-5 (stars)"),
  comment: z.string(),
  page: z.string().optional(),
  status: z.enum(['new', 'read', 'archived']).default('new'),
  createdAt: z.any(), // Firestore Timestamp
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const UserContributionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  calories: z.number(),
  authorId: z.string(),
  authorName: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.any(),
  recipe: z.string().optional(),
  imageUrl: z.string().url().optional(),
});
export type UserContribution = z.infer<typeof UserContributionSchema>;

export type MissingMeal = {
  id: string;
  name: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'added' | 'rejected';
  createdAt: Timestamp;
};

export const FridgeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type FridgeItem = z.infer<typeof FridgeItemSchema>;

export const UserAnalyticSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  dishId: z.string().optional(),
  dishName: z.string(),
  eventType: z.enum(['view', 'cook_start', 'cook_complete', 'like', 'dislike']),
  origin: z.string().optional(),
  category: z.string().optional(),
  createdAt: z.any(),
});
export type UserAnalytic = z.infer<typeof UserAnalyticSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string().url().optional(),
  isRead: z.boolean(),
  createdAt: z.any(), // Firestore Timestamp
});
export type Notification = z.infer<typeof NotificationSchema>;


// Types for AI Flows

// generate-shopping-list
export const GenerateShoppingListInputSchema = z.object({
  likedMeals: z.array(z.string()).describe("A list of meals the user likes or has recently cooked."),
  origin: z.string().optional().describe("The user's cultural origin (e.g., 'Française', 'Sénégalaise')."),
  country: z.string().optional().describe("The user's current country of residence."),
  fridgeContents: z.array(z.string()).describe("A list of ingredients currently in the user's fridge."),
  personality: AIPersonalitySchema.optional().describe("The user's AI training preferences (allergies, goals, etc.)."),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

export const ShoppingListItemSchema = z.object({
  name: z.string().describe("The name of the item to buy."),
  category: z.string().describe("The category of the item (e.g., 'Légumes', 'Épicerie')."),
  quantity: z.string().optional().describe("Estimated quantity (e.g., '1kg', '2 unités')."),
  reason: z.string().optional().describe("Why this item is suggested (e.g., 'Pour votre plat préféré')."),
});

export const GenerateShoppingListOutputSchema = z.object({
  items: z.array(ShoppingListItemSchema),
  summary: z.string().describe("A short summary of why these items were chosen."),
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

export const ShoppingListHistoryItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  items: z.array(ShoppingListItemSchema),
  summary: z.string(),
  createdAt: z.any(), // Firestore Timestamp
});
export type ShoppingListHistoryItem = z.infer<typeof ShoppingListHistoryItemSchema>;


// nutritional-agent-chat
export const NutritionalAgentChatInputSchema = z.object({
  message: z.string().describe("The user's message to the agent."),
  userName: z.string().optional().describe("The user's display name."),
  personality: AIPersonalitySchema.optional().describe("The user's AI training preferences."),
  mealHistory: z.array(z.string()).optional().describe("A list of the user's recently logged meals to provide context and avoid repetition."),
  fridgeContents: z.array(z.string()).optional().describe("A list of ingredients currently in the user's fridge."),
  userLevel: z.number().optional().describe("The user's current level in the app."),
  plannedMeals: z.array(z.object({ name: z.string(), date: z.string() })).optional().describe("A list of meals the user has planned for the future."),
  householdMembers: z.array(z.string()).optional().describe("A list of the user's household members."),
  todaysCooks: z.record(z.string()).optional().describe("An object mapping meal types to the name of the person cooking it today."),
  isAITrainingEnabled: z.boolean().optional().describe("Whether the user has enabled AI training/personalization."),
});
export type NutritionalAgentChatInput = z.infer<typeof NutritionalAgentChatInputSchema>;
export type NutritionalAgentChatOutput = string;


// generate-conversation-title
const MessageSchema = z.object({
  role: z.enum(['user', 'ai']),
  text: z.string(),
});

export const GenerateConversationTitleInputSchema = z.object({
  messages: z.array(MessageSchema).describe('The first few messages of the conversation.'),
});
export type GenerateConversationTitleInput = z.infer<typeof GenerateConversationTitleInputSchema>;

export const GenerateConversationTitleOutputSchema = z.object({
  title: z
    .string()
    .describe(
      'A short, descriptive title for the conversation (3-5 words max).'
    ),
});
export type GenerateConversationTitleOutput = z.infer<typeof GenerateConversationTitleOutputSchema>;


// provide-personalized-dietary-tips
export const ProvidePersonalizedDietaryTipsInputSchema = z.object({
  foodLogs: z
    .string()
    .describe('A summary of the user\'s food logs for the past day or week.'),
  dietaryGoals: z
    .string()
    .describe('The user\'s dietary goals, such as weight loss, muscle gain, or healthy eating.'),
});
export type ProvidePersonalizedDietaryTipsInput = z.infer<typeof ProvidePersonalizedDietaryTipsInputSchema>;

export const ProvidePersonalizedDietaryTipsOutputSchema = z.object({
  tips: z
    .string()
    .describe(
      'Personalized dietary tips and recommendations based on the user\'s food logs and dietary goals.'
    ),
});
export type ProvidePersonalizedDietaryTipsOutput = z.infer<typeof ProvidePersonalizedDietaryTipsOutputSchema>;


// suggest-healthy-replacements
export const SuggestHealthyReplacementsInputSchema = z.object({
  loggedFood: z.string().describe('The food items that the user has logged.'),
  healthGoals: z.string().describe('The health goals of the user.'),
});
export type SuggestHealthyReplacementsInput = z.infer<typeof SuggestHealthyReplacementsInputSchema>;

export const HealthyReplacementSchema = z.object({
  name: z.string().describe('Le nom de l\'alternative plus saine.'),
  calories: z.number().describe('Nombre de calories estimé.'),
  imageHint: z.string().describe('Mots-clés pour l\'image (ex: "salade de lentilles").'),
  imageUrl: z.string().optional().nullable().transform(val => (val === "" ? undefined : val)),
});

export const SuggestHealthyReplacementsOutputSchema = z.object({
  suggestions: z.array(HealthyReplacementSchema).describe('Une liste d\'alternatives plus saines au repas enregistré.'),
});
export type SuggestHealthyReplacementsOutput = z.infer<typeof SuggestHealthyReplacementsOutputSchema>;

// suggest-meal-plan
export const SuggestMealPlanInputSchema = z.object({
  dietaryGoals: z.string().describe("The user's dietary goals."),
  personality: AIPersonalitySchema.optional().describe("The user's AI training preferences."),
});
export type SuggestMealPlanInput = z.infer<typeof SuggestMealPlanInputSchema>;

export const MealSuggestionSchema = z.object({
  name: z.string().describe('The name of the meal.'),
  calories: z.number().describe('Estimated calorie count for the meal.'),
  cookingTime: z.string().describe('Estimated cooking time (e.g., "20 min").'),
  imageHint: z.string().describe('Two or three English keywords for a stock photo search (e.g., "grilled salmon").'),
  imageUrl: z.string().optional().nullable().transform(val => (val === "" ? undefined : val)),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']).describe('The type of meal.'),
  recipe: z.string().optional(),
});

export const SuggestMealPlanOutputSchema = z.array(MealSuggestionSchema);
export type SuggestMealPlanOutput = z.infer<typeof SuggestMealPlanOutputSchema>;
export type SuggestedMeal = z.infer<typeof MealSuggestionSchema>;


// suggest-recipes-from-ingredients
export const SuggestRecipesFromIngredientsInputSchema = z.object({
  ingredients: z.array(z.string()).describe('The ingredients the user has available.'),
});
export type SuggestRecipesFromIngredientsInput = z.infer<typeof SuggestRecipesFromIngredientsInputSchema>;

const RecipeSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  description: z.string().describe('A short, enticing description of the recipe.'),
  missingIngredients: z.array(z.string()).describe('A list of common, essential ingredients the user might need to buy.'),
});

export const SuggestRecipesFromIngredientsOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('A list of 2-3 recipe suggestions.'),
});
export type SuggestRecipesFromIngredientsOutput = z.infer<typeof SuggestRecipesFromIngredientsOutputSchema>;

// Chat-based meal planning
const MealPlanItemSchema = z.object({
  name: z.string(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  calories: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  imageUrl: z.string().url().optional(),
  imageHint: z.string().optional(),
  cookedBy: z.string().optional(),
});

export const MealPlanSchema = z.array(MealPlanItemSchema);
export type MealPlan = z.infer<typeof MealPlanSchema>;


// suggest-single-meal
export const SuggestSingleMealInputSchema = z.object({
  timeOfDay: z.enum(['matin', 'midi', 'soir', 'dessert']).describe("Le moment de la journée pour lequel suggérer un repas."),
  dietaryGoals: z.string().describe("Les objectifs alimentaires de l'utilisateur."),
  personality: AIPersonalitySchema.optional().describe("Les préférences de l'utilisateur pour l'entraînement de l'IA."),
  mealHistory: z.array(z.string()).optional().describe("Une liste des repas récents de l'utilisateur pour éviter les répétitions."),
});
export type SuggestSingleMealInput = z.infer<typeof SuggestSingleMealInputSchema>;

export const SingleMealSuggestionSchema = z.object({
  id: z.string().optional().describe("L'identifiant unique du repas."),
  name: z.string().describe("Le nom du repas."),
  calories: z.number().describe("Nombre de calories estimé."),
  cookingTime: z.string().describe("Temps de cuisson estimé (ex: '20 min')."),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']).describe("Le type de repas."),
  imageHint: z.string().describe("Deux ou trois mots-clés pour une recherche d'image (ex: 'salade saine')."),
  imageUrl: z.string().optional().nullable().transform(val => (val === "" ? undefined : val)),
  recipe: z.string().optional().describe("La recette détaillée du plat au format Markdown."),
  description: z.string().optional().describe("Un court résumé ou une description du plat."),
  message: z.string().optional().describe("Un message amical de l'IA expliquant pourquoi elle suggère ce repas."),
  price: z.number().optional().describe("Le prix du repas si c'est un contenu premium."),
});
export type SingleMealSuggestion = z.infer<typeof SingleMealSuggestionSchema>;

export const SuggestSingleMealOutputSchema = SingleMealSuggestionSchema;
export type SuggestSingleMealOutput = z.infer<typeof SuggestSingleMealOutputSchema>;

// estimate-calories
export const EstimateCaloriesInputSchema = z.object({
  mealName: z.string().describe('The name of the meal to estimate calories for.'),
  userObjective: z.string().describe("The user's primary dietary objective (e.g., 'Perte de poids', 'Prise de masse').")
});
export type EstimateCaloriesInput = z.infer<typeof EstimateCaloriesInputSchema>;

export const EstimateCaloriesOutputSchema = z.object({
  calories: z.number().describe('The estimated number of calories for the meal.'),
  xpGained: z.number().describe('The XP points gained or lost based on alignment with the user objective.'),
});
export type EstimateCaloriesOutput = z.infer<typeof EstimateCaloriesOutputSchema>;


// generate-motivational-message
export const GetMotivationalMessageInputSchema = z.object({
  userName: z.string(),
  level: z.number(),
  streak: z.number(),
  mainObjective: z.string(),
});
export type GetMotivationalMessageInput = z.infer<typeof GetMotivationalMessageInputSchema>;

export const GetMotivationalMessageOutputSchema = z.object({
  message: z.string(),
});
export type GetMotivationalMessageOutput = z.infer<typeof GetMotivationalMessageOutputSchema>;

// generate-recipe
export const GenerateRecipeInputSchema = z.object({
  mealName: z.string().describe('The name of the meal to generate a recipe for.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

export const GenerateRecipeOutputSchema = z.object({
  recipe: z.string().describe("La recette détaillée du plat au format Markdown."),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;


// save-user-recipe
export const SaveUserRecipeInputSchema = CookingSchema.omit({ id: true, userId: true, createdAt: true });
export type SaveUserRecipeInput = z.infer<typeof SaveUserRecipeInputSchema>;

export const SaveUserRecipeOutputSchema = z.object({
  cookingId: z.string(),
  publicationId: z.string().optional(),
});
export type SaveUserRecipeOutput = z.infer<typeof SaveUserRecipeOutputSchema>;


// suggest-day-plan
export const SuggestDayPlanInputSchema = z.object({
  dietaryGoals: z.string().describe("The user's dietary goals."),
  personality: AIPersonalitySchema.optional().describe("The user's AI training preferences."),
  householdMembers: z.array(z.string()).optional().describe('List of household members for assigning cooks.'),
});
export type SuggestDayPlanInput = z.infer<typeof SuggestDayPlanInputSchema>;

export const DayPlanMealSchema = z.object({
  name: z.string(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  calories: z.number(),
  cookedBy: z.string().optional(),
  imageUrl: z.string().optional().nullable().transform(val => (val === "" ? undefined : val)),
});
export type DayPlanMeal = z.infer<typeof DayPlanMealSchema>;

export const SuggestDayPlanOutputSchema = z.array(DayPlanMealSchema);
export type SuggestDayPlanOutput = z.infer<typeof SuggestDayPlanOutputSchema>;


// generate-reminder-message
export const GenerateReminderInputSchema = z.object({
  type: z.enum(['notification', 'email']),
  userSegment: z.string().describe("The user segment to target (e.g., 'inactive for 3 days', 'haven't completed a goal this week')."),
});
export type GenerateReminderInput = z.infer<typeof GenerateReminderInputSchema>;

export const GenerateReminderOutputSchema = z.object({
  subject: z.string().optional().describe('The subject of the email, if type is email.'),
  body: z.string().describe('The content of the message.'),
});
export type GenerateReminderOutput = z.infer<typeof GenerateReminderOutputSchema>;
// suggest-recommended-dishes
export const SuggestRecommendedDishesInputSchema = z.object({
  userId: z.string(),
  count: z.number().default(6),
  timeOfDay: z.enum(['breakfast', 'lunch', 'dinner', 'dessert', '']).optional(),
});
export type SuggestRecommendedDishesInput = z.infer<typeof SuggestRecommendedDishesInputSchema>;

export const RecommendedDishSchema = DishSchema.extend({
  relevanceScore: z.number().optional(),
  matchReason: z.string().optional().describe("Why this dish was recommended (e.g., 'Inspiré de vos origines italiennes')"),
});

export const SuggestRecommendedDishesOutputSchema = z.array(RecommendedDishSchema);
export type SuggestRecommendedDishesOutput = z.infer<typeof SuggestRecommendedDishesOutputSchema>;

// explain-calorie-goal
export const ExplainCalorieGoalInputSchema = z.object({
  targetCalories: z.number().describe("The user's defined daily calorie target. If family, this should be the total."),
  eatersCount: z.number().optional().describe("Number of people the meals are cooked for."),
  personality: AIPersonalitySchema.optional(),
});
export type ExplainCalorieGoalInput = z.infer<typeof ExplainCalorieGoalInputSchema>;

export const ExplainCalorieGoalOutputSchema = z.object({
  explanation: z.string().describe("A friendly and concrete explanation of what the calorie target represents in terms of meals."),
});
export type ExplainCalorieGoalOutput = z.infer<typeof ExplainCalorieGoalOutputSchema>;
