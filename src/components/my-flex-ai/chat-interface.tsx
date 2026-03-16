
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatAction, generateTitleAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Send, Loader2, BotMessageSquare, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser, useFirebase, useDoc, useMemoFirebase, addDocumentNonBlocking, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { MealPlanCard } from './meal-plan-card';
import type { MealPlan, AIPersonality, Meal, FridgeItem, Cooking, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, endOfDay } from 'date-fns';

type Message = {
    role: 'user' | 'ai';
    text: string;
};

interface ConversationDoc {
    messages: Message[];
    title: string;
}

interface ChatInterfaceProps {
    conversationId: string | null;
    setConversationId: (id: string | null) => void;
}

const parseMealPlan = (text: string): { intro: string, plan: MealPlan | null } => {
    const regex = /```json-meal-plan\s*([\s\S]*?)\s*```/;
    const match = text.match(regex);

    if (!match || !match[1]) {
        return { intro: text, plan: null };
    }

    try {
        const plan = JSON.parse(match[1]);
        const intro = text.replace(regex, '').trim();
        return { intro, plan };
    } catch (e) {
        console.error("Failed to parse meal plan JSON:", e);
        return { intro: text, plan: null };
    }
};


export function ChatInterface({ conversationId, setConversationId }: ChatInterfaceProps) {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: "Bonjour ! Je suis votre coach nutritionnel personnel. Comment puis-je vous aider aujourd'hui ?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState<Record<number, boolean>>({});

    // --- Data Fetching for AI Context ---
    const conversationRef = useMemoFirebase(() => {
        if (!user || !conversationId) return null;
        return doc(firestore, 'users', user.uid, 'conversations', conversationId);
    }, [user, conversationId, firestore]);

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);

    const mealHistoryQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/foodLogs`), orderBy('date', 'desc'), limit(50));
    }, [user, firestore]);

    const fridgeQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/fridge`), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const plannedMealsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/cooking`), where('plannedFor', '>=', Timestamp.now()), limit(10));
    }, [user, firestore]);

    const todaysMealsQuery = useMemoFirebase(() => {
        if (!user) return null;
        const start = startOfDay(new Date());
        const end = endOfDay(new Date());
        return query(
            collection(firestore, 'users', user.uid, 'foodLogs'),
            where('date', '>=', Timestamp.fromDate(start)),
            where('date', '<=', Timestamp.fromDate(end))
        );
    }, [user, firestore]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);
    const { data: conversationData, isLoading: isLoadingConversation } = useDoc<ConversationDoc>(conversationRef);
    const { data: mealHistoryData, isLoading: isLoadingHistory } = useCollection<Meal>(mealHistoryQuery);
    const { data: fridgeItems, isLoading: isLoadingFridge } = useCollection<FridgeItem>(fridgeQuery);
    const { data: plannedMeals, isLoading: isLoadingPlannedMeals } = useCollection<Cooking>(plannedMealsQuery);
    const { data: todaysMeals, isLoading: isLoadingTodaysMeals } = useCollection<Meal & { cookedBy?: string }>(todaysMealsQuery);

    const mealHistory = useMemo(() => mealHistoryData?.map(meal => meal.name) || [], [mealHistoryData]);
    const fridgeContents = useMemo(() => fridgeItems?.map(item => item.name) || [], [fridgeItems]);
    const householdMembers = useMemo(() => userProfile?.household || [], [userProfile]);

    const todaysCooks = useMemo(() => {
        if (!todaysMeals) return {};
        return todaysMeals.reduce((acc, meal) => {
            if (meal.cookedBy) {
                acc[meal.type] = meal.cookedBy;
            }
            return acc;
        }, {} as Record<string, string>);
    }, [todaysMeals]);

    useEffect(() => {
        if (conversationData) {
            setMessages(conversationData.messages);
        } else if (!conversationId) {
            // Reset to initial state for a new conversation
            setMessages([{ role: 'ai', text: `Bonjour ${user?.displayName || ''} ! Je suis votre coach nutritionnel personnel. Comment puis-je vous aider aujourd'hui ?` }]);
        }
        setFeedbackSent({}); // Reset feedback status on conversation change
    }, [conversationData, conversationId, user]);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSaveConversation = async (newMessages: Message[]) => {
        if (!user || !firestore) return;

        if (!conversationId) {
            // Create a new conversation document
            const convCollection = collection(firestore, 'users', user.uid, 'conversations');
            const docRef = await addDoc(convCollection, {
                userId: user.uid,
                createdAt: serverTimestamp(),
                messages: newMessages,
                title: "Nouvelle conversation..." // Placeholder title
            });
            setConversationId(docRef.id);
            return docRef.id;
        } else {
            // Update the existing conversation
            const convRef = doc(firestore, 'users', user.uid, 'conversations', conversationId);
            await updateDoc(convRef, { messages: newMessages });
            return conversationId;
        }
    };

    const handleGenerateTitle = async (convId: string, finalMessages: Message[]) => {
        if (!user || !firestore || finalMessages.length < 2) return;

        const { title } = await generateTitleAction({ messages: finalMessages.slice(0, 4) });
        if (title) {
            const convRef = doc(firestore, 'users', user.uid, 'conversations', convId);
            await updateDoc(convRef, { title });
        }
    };

    const handleFeedback = (messageIndex: number, rating: 1 | -1) => {
        if (!user) return;
        const message = messages[messageIndex];
        if (!message || message.role !== 'ai' || feedbackSent[messageIndex]) return;

        const feedbackCollection = collection(firestore, 'feedbacks');
        addDocumentNonBlocking(feedbackCollection, {
            userId: user.uid,
            userName: user.displayName,
            rating,
            comment: message.text,
            page: 'My Flex AI',
            status: 'new',
            createdAt: serverTimestamp(),
        });

        setFeedbackSent(prev => ({ ...prev, [messageIndex]: true }));
        toast({ title: "Merci !", description: "Votre retour a bien été pris en compte." });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            text: inputValue,
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        const currentInput = inputValue;
        setInputValue('');
        setIsLoading(true);

        try {
            let personality: AIPersonality | undefined = undefined;
            if (userProfile?.isAITrainingEnabled) {
                personality = {
                    tone: userProfile.tone,
                    mainObjective: userProfile.mainObjective, // Using mainObjective now
                    allergies: userProfile.allergies,
                    preferences: userProfile.preferences,
                };
            }

            const response = await chatAction({
                message: currentInput,
                userName: userProfile?.name || user?.displayName || undefined,
                personality: personality,
                mealHistory: mealHistory,
                fridgeContents: fridgeContents,
                userLevel: userProfile?.level,
                plannedMeals: plannedMeals?.map(m => ({ name: m.name, date: format(m.plannedFor.toDate(), 'yyyy-MM-dd') })),
                householdMembers: householdMembers,
                todaysCooks: todaysCooks,
            });
            const textResponse = typeof response === 'string' ? response : (response as any).message || "Désolé, une erreur technique est survenue.";
            const aiResponse: Message = { role: 'ai', text: textResponse };
            const finalMessages = [...newMessages, aiResponse];
            setMessages(finalMessages);

            const savedConvId = await handleSaveConversation(finalMessages);

            if (savedConvId && !conversationId && finalMessages.length > 2) {
                handleGenerateTitle(savedConvId, finalMessages);
            }

        } catch (error) {
            console.error(error);
            const aiErrorMessage: Message = {
                role: 'ai',
                text: "Désolé, une erreur s'est produite. Veuillez réessayer.",
            };
            setMessages(prev => [...prev, aiErrorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const isDataLoading = isLoadingConversation || isLoadingProfile || isLoadingHistory || isLoadingFridge || isLoadingPlannedMeals || isLoadingTodaysMeals;

    return (
        <div className="flex h-full flex-col bg-transparent min-h-0">
            {/* Zone scrollable des messages - remplit tout l'espace disponible */}
            <div className="flex-1 overflow-y-auto min-h-0" ref={scrollAreaRef}>
                <div className="p-3 md:p-6 space-y-6" ref={viewportRef}>
                    {(isDataLoading && conversationId) ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronisation...</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => {
                                const { intro, plan } = message.role === 'ai' ? parseMealPlan(message.text) : { intro: message.text, plan: null };
                                const isAiMessage = message.role === 'ai';

                                return (
                                    <div key={index} className={cn(
                                        "group flex items-start gap-2 md:gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500",
                                        !isAiMessage && "justify-end"
                                    )}>
                                        {isAiMessage && (
                                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center shrink-0 shadow-lg shadow-primary/5 mt-0.5">
                                                <BotMessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                            </div>
                                        )}

                                        <div className={cn("flex flex-col gap-2 max-w-[85%] sm:max-w-xl", isAiMessage ? "items-start" : "items-end")}>
                                            <div
                                                className={cn(
                                                    "rounded-2xl p-3 md:p-4 text-sm font-medium leading-relaxed transition-all duration-300",
                                                    !isAiMessage
                                                        ? 'bg-primary text-white shadow-xl shadow-primary/20 rounded-tr-none'
                                                        : 'bg-muted/50 backdrop-blur-sm border border-primary/5 text-foreground rounded-tl-none hover:border-primary/20'
                                                )}
                                            >
                                                <ReactMarkdown
                                                    className="prose prose-sm dark:prose-invert max-w-none"
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-0" {...props} />,
                                                    }}
                                                >
                                                    {intro}
                                                </ReactMarkdown>
                                                {plan && (
                                                    <div className="mt-4 pt-4 border-t border-primary/10">
                                                        <MealPlanCard plan={plan} />
                                                    </div>
                                                )}
                                            </div>

                                            {isAiMessage && !isLoading && index > 0 && (
                                                <div className={cn(
                                                    "flex items-center gap-1.5 transition-all duration-300",
                                                    feedbackSent[index] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                )}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-7 w-7 rounded-xl text-muted-foreground/40 hover:text-green-500 hover:bg-green-500/10 transition-colors",
                                                            feedbackSent[index] === true && "text-green-500 bg-green-500/10"
                                                        )}
                                                        onClick={() => handleFeedback(index, 1)}
                                                        disabled={feedbackSent[index]}
                                                    >
                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-7 w-7 rounded-xl text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors",
                                                            feedbackSent[index] === true && "text-red-500 bg-red-500/10"
                                                        )}
                                                        onClick={() => handleFeedback(index, -1)}
                                                        disabled={feedbackSent[index]}
                                                    >
                                                        <ThumbsDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {!isAiMessage && (
                                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-muted border border-primary/5 flex items-center justify-center shrink-0 overflow-hidden shadow-lg mt-0.5">
                                                {user?.photoURL ? (
                                                    <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="font-black text-xs text-muted-foreground">{(userProfile?.name || user?.displayName || user?.email || '?').charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {isLoading && (
                                <div className="flex items-start gap-2 md:gap-4">
                                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center shrink-0">
                                        <BotMessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary animate-pulse" />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-none p-3 md:p-4 bg-muted/30 backdrop-blur-sm border border-primary/5 flex items-center gap-3 shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Barre de saisie - toujours visible, collée en bas */}
            <div className="shrink-0 p-2 md:p-4 border-t border-primary/5 bg-background/80 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 p-1.5 md:p-2 rounded-2xl bg-muted/30 backdrop-blur-xl border border-primary/10 focus-within:border-primary/30 transition-all shadow-lg">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Posez votre question..."
                            className="flex-1 bg-transparent border-none focus-visible:ring-0 h-9 md:h-11 px-3 font-medium text-sm placeholder:text-muted-foreground/50"
                            disabled={isLoading || isDataLoading}
                            autoComplete="off"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isLoading || isDataLoading}
                            className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                        >
                            <Send className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="sr-only">Envoyer</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

