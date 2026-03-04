'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Conversation {
    id: string;
    title: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | null;
}

interface HistoryPanelProps {
    onSelectConversation: (id: string | null) => void;
    activeConversationId: string | null;
}

export function HistoryPanel({ onSelectConversation, activeConversationId }: HistoryPanelProps) {
  const { user } = useUser();
  const { firestore } = useFirebase();

  const conversationsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, `users/${user.uid}/conversations`), orderBy('createdAt', 'desc')) : null,
    [user, firestore]
  );
  
  const { data: conversations, isLoading } = useCollection<Conversation>(conversationsQuery);
  
  const formatDate = (timestamp: Conversation['createdAt']) => {
    if (!timestamp) return "À l'instant";
    const date = new Date(timestamp.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };


    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex h-full flex-col md:p-2"
        >
            <div className="flex items-center justify-between pb-6 px-1">
                <div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Historique
                    </h2>
                    <p className="text-xs font-medium text-muted-foreground mt-1">Vos échanges précédents avec l'IA</p>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        // Small vibration / interaction feedback
                        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate(50);
                        }
                        onSelectConversation(null);
                    }}
                    className="cursor-pointer h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                    title="Nouvelle conversation"
                >
                    <Plus className="h-5 w-5 md:h-6 md:w-6" />
                </motion.button>
            </div>
            
            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-3 pb-8">
            {isLoading && (
                 <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}
                    {conversations && conversations.map((conv, idx) => (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            className={cn(
                                "w-full text-left p-4 rounded-2xl transition-all group border",
                                activeConversationId === conv.id 
                                    ? "bg-primary/5 border-primary/20" 
                                    : "bg-background border-border hover:bg-muted/50 hover:border-primary/20 shadow-sm"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-sm font-bold truncate text-foreground">{conv.title}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1.5">{formatDate(conv.createdAt)}</p>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                    {!isLoading && conversations?.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center space-y-4 py-12 bg-muted/30 rounded-3xl border border-dashed border-border"
                        >
                            <div className="h-16 w-16 mx-auto bg-background rounded-full flex items-center justify-center shadow-sm border border-border">
                                <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black">Aucun historique</h3>
                                <p className="text-xs text-muted-foreground mt-1">Vos conversations apparaîtront ici.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="rounded-full h-8 text-xs font-bold uppercase tracking-widest mt-2"
                                onClick={() => onSelectConversation(null)}
                            >
                                <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" /> Lancer le chat
                            </Button>
                        </motion.div>
                    )}
                </div>
            </ScrollArea>
        </motion.div>
    );
}
