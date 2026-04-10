
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiUrl } from '@/lib/api-utils';

export function ChatInterface({ conversationId, setConversationId }: ChatInterfaceProps) {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: "Bonjour ! Je suis votre coach nutritionnel personnel. Comment puis-je vous aider aujourd'hui ?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState<Record<number, 1 | -1>>({});

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
        const scrollToBottom = () => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({ 
                    top: scrollAreaRef.current.scrollHeight, 
                    behavior: 'smooth' 
                });
            }
        };

        scrollToBottom();
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

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

        try {
            const response = await fetch(getApiUrl('/api/ai/generate-title'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: finalMessages.slice(0, 4) }),
            });
            const data = await response.json();
            if (data.title) {
                const convRef = doc(firestore, 'users', user.uid, 'conversations', convId);
                await updateDoc(convRef, { title: data.title });
            }
        } catch (e) {
            console.error("Failed to generate title:", e);
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

        setFeedbackSent(prev => ({ ...prev, [messageIndex]: rating }));
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

            const response = await fetch(getApiUrl('/api/ai/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    history: messages,
                    userName: userProfile?.name || user?.displayName || undefined,
                    personality: personality,
                    mealHistory: mealHistory,
                    fridgeContents: fridgeContents,
                    userLevel: userProfile?.level,
                    plannedMeals: plannedMeals?.map(m => ({ name: m.name, date: format(m.plannedFor.toDate(), 'yyyy-MM-dd') })),
                    householdMembers: householdMembers,
                    todaysCooks: todaysCooks,
                    isAITrainingEnabled: userProfile?.isAITrainingEnabled,
                }),
            });

            const data = await response.json();
            const textResponse = typeof data === 'string' ? data : data.message || "Désolé, une erreur technique est survenue.";
            const aiResponse: Message = { role: 'ai', text: textResponse };
            const finalMessages = [...newMessages, aiResponse];
            setMessages(finalMessages);
            setIsLoading(false); // Stop loading immediately when response arrives

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
            setIsLoading(false);
        }
    };

    const isDataLoading = isLoadingConversation || isLoadingProfile || isLoadingHistory || isLoadingFridge || isLoadingPlannedMeals || isLoadingTodaysMeals;

    return (
        <div className="flex h-full flex-col bg-transparent min-h-0">
            {/* Zone scrollable des messages */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin overflow-x-hidden" ref={scrollAreaRef}>
                <div className="p-3 md:p-6 space-y-6" ref={viewportRef}>
                    {(isDataLoading && conversationId) ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronisation...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 w-full">
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

                                        <div className={cn("flex flex-col gap-2 w-full", isAiMessage ? "items-start" : "items-end")}>
                                                <div
                                                    className={cn(
                                                        "p-1 md:p-2 text-sm leading-relaxed transition-all duration-300",
                                                        !isAiMessage
                                                            ? 'bg-primary text-primary-foreground rounded-2xl p-3 md:p-4 rounded-tr-none prose-invert shadow-xl shadow-primary/20'
                                                            : 'bg-transparent text-foreground max-w-none'
                                                    )}
                                                >
                                                    {isAiMessage ? (
                                                        // Only use typewriter for the LAST message if it's the one we just received
                                                        (index === messages.length - 1 && isLoading === false && messages.length > 1) ? (
                                                            <TypewriterText text={intro} />
                                                        ) : (
                                                            <ReactMarkdown
                                                                className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed"
                                                                components={{
                                                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                                                }}
                                                            >
                                                                {intro}
                                                            </ReactMarkdown>
                                                        )
                                                    ) : (
                                                        <ReactMarkdown
                                                            className="prose prose-sm dark:prose-invert max-w-none"
                                                            components={{
                                                                p: ({ node, ...props }) => (
                                                                    <p 
                                                                        className="mb-0 text-white font-bold drop-shadow-sm" 
                                                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }} 
                                                                        {...props} 
                                                                    />
                                                                ),
                                                            }}
                                                        >
                                                            {intro}
                                                        </ReactMarkdown>
                                                    )}
                                                {plan && (
                                                    <div className="mt-4 pt-4 border-t border-primary/10">
                                                        <MealPlanCard plan={plan} />
                                                    </div>
                                                )}
                                            </div>

                                            {isAiMessage && (index > 0 || messages.length > 1) && !isLoading && !plan && (
                                                <div className="flex items-center gap-2 mt-1 ml-1 animate-in fade-in duration-700">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-8 w-8 rounded-full transition-all duration-300",
                                                            feedbackSent[index] === 1
                                                                ? "text-white bg-green-500 shadow-md scale-110"
                                                                : feedbackSent[index] === -1
                                                                    ? "text-muted-foreground/30 bg-muted/20 opacity-40"
                                                                    : "text-green-600/60 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600 hover:scale-105"
                                                        )}
                                                        onClick={() => handleFeedback(index, 1)}
                                                        disabled={feedbackSent[index] !== undefined}
                                                    >
                                                        <ThumbsUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-8 w-8 rounded-full transition-all duration-300",
                                                            feedbackSent[index] === -1
                                                                ? "text-white bg-red-500 shadow-md scale-110"
                                                                : feedbackSent[index] === 1
                                                                    ? "text-muted-foreground/30 bg-muted/20 opacity-40"
                                                                    : "text-red-600/60 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600 hover:scale-105"
                                                        )}
                                                        onClick={() => handleFeedback(index, -1)}
                                                        disabled={feedbackSent[index] !== undefined}
                                                    >
                                                        <ThumbsDown className="h-4 w-4" />
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
                        </div>
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
                    <p className="text-[10px] text-center text-muted-foreground/50 mt-2 font-medium">
                        L'IA peut faire des erreurs. Vérifiez les informations importantes.
                    </p>
                </form>
            </div>
        </div>
    );
}

