
'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import {
  SidebarProvider,
  Sidebar as AppSidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useUser, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, limit, updateDoc } from 'firebase/firestore';
import { Loader2, Bot } from 'lucide-react';
import { ChatInterface } from '@/components/my-flex-ai/chat-interface';
import { useState, useEffect } from 'react';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Meal } from '@/lib/types';
import { HistoryPanel } from '@/components/my-flex-ai/history-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/layout/app-header';
import { PageWrapper } from '@/components/shared/page-wrapper';

export default function MyFlexAIPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');

  const mealsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'foodLogs') : null),
    [user, firestore]
  );
  const { data: meals, isLoading: isLoadingMeals } = useCollection<Omit<Meal, 'id'>>(mealsCollectionRef);

  const goalsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'goals') : null),
    [user, firestore]
  );
  const singleGoalQuery = useMemoFirebase(
    () => goalsCollectionRef ? query(goalsCollectionRef, limit(1)) : null,
    [goalsCollectionRef]
  );
  const { data: goalsData, isLoading: isLoadingGoals } = useCollection<{ description: string }>(singleGoalQuery);
  const [goals, setGoals] = useState('Perdre du poids, manger plus sainement et réduire ma consommation de sucre.');
  const [goalId, setGoalId] = useState<string | null>(null);

  useEffect(() => {
    if (goalsData) {
      if (goalsData.length > 0 && goalsData[0]) {
        setGoals(goalsData[0].description);
        setGoalId(goalsData[0].id);
      } else if (user && !isLoadingGoals) {
        const defaultGoal = {
          userId: user.uid,
          description: 'Perdre du poids, manger plus sainement et réduire ma consommation de sucre.',
          targetValue: 2000,
          timeFrame: 'daily',
        };
        addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'goals'), defaultGoal);
      }
    }
  }, [goalsData, user, isLoadingGoals, firestore]);

  const updateGoals = (newDescription: string) => {
    setGoals(newDescription);
    if (goalId && user) {
      const goalRef = doc(firestore, 'users', user.uid, 'goals', goalId);
      updateDoc(goalRef, { description: newDescription }).catch(console.error);
    }
  };

  const handleSelectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setActiveTab('chat');
  };

  if (isUserLoading || isLoadingMeals || isLoadingGoals || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const sidebarProps = {
    goals,
    setGoals: updateGoals,
    meals: meals ?? [],
  };

  return (
    <div className="h-screen w-full bg-background font-body flex flex-col overflow-hidden">
      <SidebarProvider>
        <AppSidebar collapsible="icon" className="w-80 peer hidden md:block" variant="sidebar">
          <Sidebar {...sidebarProps} />
        </AppSidebar>
        <SidebarInset className="bg-background flex flex-col min-h-0 flex-1">
          {/* Header fixe */}
          <AppHeader
            title="My Flex Coach"
            icon={<Bot className="h-6 w-6" />}
            user={user}
            sidebarProps={sidebarProps}
          />

          {/* Zone principale qui remplit tout l'espace restant */}
          <PageWrapper className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Barre de tabs compacte */}
              <div className="shrink-0 px-3 md:px-6 pt-3 md:pt-4 pb-2">
                {/* Hero condensé pour mobile */}
                <div className="hidden md:flex items-center gap-4 mb-4 px-2">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Intelligence Artificielle
                    </p>
                    <h2 className="text-lg font-black tracking-tight">My Flex Coach</h2>
                  </div>
                </div>

                <TabsList className="h-10 md:h-12 p-1 bg-muted/30 backdrop-blur-sm border border-primary/10 rounded-2xl grid w-full grid-cols-2">
                  <TabsTrigger
                    value="chat"
                    className="rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
                  >
                    Conversation
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
                  >
                    Historique
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Contenu des tabs — remplit l'espace restant */}
              <div className="flex-1 min-h-0 relative">
                <TabsContent
                  value="history"
                  className="absolute inset-0 m-0 focus-visible:ring-0 outline-none overflow-y-auto px-3 md:px-6 pb-6"
                >
                  <HistoryPanel
                    onSelectConversation={handleSelectConversation}
                    activeConversationId={activeConversationId}
                  />
                </TabsContent>

                <TabsContent
                  value="chat"
                  className="absolute inset-0 m-0 focus-visible:ring-0 outline-none flex flex-col"
                >
                  {/* ChatInterface rempli entièrement — gère son propre scroll + input collé en bas */}
                  <div className="flex-1 mx-3 md:mx-6 mb-3 md:mb-4 rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 bg-background/50 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5 min-h-0 flex flex-col">
                    <ChatInterface
                      conversationId={activeConversationId}
                      setConversationId={setActiveConversationId}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </PageWrapper>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
