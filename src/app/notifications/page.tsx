
'use client';

import { useState } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, writeBatch, Timestamp, getDocs, where } from 'firebase/firestore';
import type { Notification, Meal } from '@/lib/types';
import { AppHeader } from '@/components/layout/app-header';
import { PageWrapper } from '@/components/shared/page-wrapper';
import { Bell, CheckCircle, Loader2, Trash2, Inbox, Calendar, Link as LinkIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, Sidebar as AppSidebar, SidebarInset } from '@/components/ui/sidebar';
import { Sidebar as DashboardSidebar } from '@/components/dashboard/sidebar';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const notificationsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc')) : null),
    [user, firestore]
  );

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleMarkAsRead = (id: string) => {
    if (!user) return;
    const notifRef = doc(firestore, 'users', user.uid, 'notifications', id);
    updateDocumentNonBlocking(notifRef, { isRead: true });
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !notifications || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      const batch = writeBatch(firestore);
      notifications.forEach(n => {
        if (!n.isRead) {
          const notifRef = doc(firestore, 'users', user.uid, 'notifications', n.id);
          batch.update(notifRef, { isRead: true });
        }
      });
      await batch.commit();
      toast({ title: 'Succès', description: 'Toutes les notifications ont été marquées comme lues.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de marquer toutes les notifications comme lues.' });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDeleteNotification = (id: string) => {
    if (!user) return;
    const notifRef = doc(firestore, 'users', user.uid, 'notifications', id);
    deleteDocumentNonBlocking(notifRef);
    toast({ title: 'Supprimée', description: 'La notification a été supprimée.' });
  };

  const handleDeleteAllRead = async () => {
    const readNotifs = notifications?.filter(n => n.isRead) || [];
    if (!user || readNotifs.length === 0) return;
    
    setIsDeletingAll(true);
    try {
      const batch = writeBatch(firestore);
      readNotifs.forEach(n => {
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', n.id);
        batch.delete(notifRef);
      });
      await batch.commit();
      toast({ title: 'Succès', description: 'Toutes les notifications lues ont été supprimées.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer les notifications.' });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Sidebar context fallback
  const allMealsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'foodLogs') : null),
    [user, firestore]
  );
  const { data: allMeals } = useCollection<Meal>(allMealsCollectionRef);

  const sidebarProps = {
    goals: '',
    setGoals: () => {},
    meals: allMeals || []
  };

  if (isUserLoading || (isLoading && !notifications)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar collapsible="icon" className="group peer hidden md:block text-sidebar-foreground border-r border-border">
        <DashboardSidebar {...sidebarProps} />
      </AppSidebar>
      <SidebarInset className="bg-background flex flex-col h-screen">
        <AppHeader 
          title="Historique des Notifications" 
          icon={<Bell className="h-4 w-4" />} 
          user={user} 
          sidebarProps={sidebarProps}
        />
        
        <PageWrapper className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 md:py-8 md:space-y-8 max-w-4xl mx-auto w-full pb-24 md:pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Notifications</h1>
              <p className="text-muted-foreground text-sm">Gérez votre historique et restez informé.</p>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMarkAllAsRead} 
                  disabled={isMarkingAll}
                  className="rounded-full text-xs font-bold border-primary/20 hover:bg-primary/5"
                >
                  {isMarkingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin md:mr-2" /> : <CheckCircle className="h-3.5 w-3.5 md:mr-2" />}
                  <span className="hidden md:inline">Tout marquer comme lu</span>
                  <span className="md:hidden text-[10px]">Tout lu</span>
                </Button>
              )}
              {notifications && notifications.some(n => n.isRead) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteAllRead} 
                  disabled={isDeletingAll}
                  className="rounded-xl px-2 md:px-3 text-[10px] md:text-xs font-bold text-destructive hover:bg-destructive/5"
                >
                  {isDeletingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin md:mr-2" /> : <Trash2 className="h-3.5 w-3.5 md:mr-2" />}
                  <span className="hidden md:inline">Effacer les lues</span>
                  <span className="md:hidden text-[10px]">Effacer</span>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={cn(
                    "group border-border/50 transition-all duration-300 hover:shadow-md hover:border-primary/20",
                    !notif.isRead ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-card"
                  )}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                        !notif.isRead ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                      )}>
                        {notif.link ? <LinkIcon className="h-6 w-6" /> : <Info className="h-6 w-6" />}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className={cn("text-base font-black truncate max-w-[200px] md:max-w-md", !notif.isRead ? "text-primary" : "text-foreground")}>
                            {notif.title}
                          </h3>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { locale: fr, addSuffix: true }) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          "{notif.body}"
                        </p>
                        
                        <div className="flex items-center justify-between pt-3">
                          <div className="flex items-center gap-2">
                            {!notif.isRead && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs font-black text-primary uppercase tracking-widest hover:no-underline"
                                onClick={() => handleMarkAsRead(notif.id)}
                              >
                                Marquer comme lu
                              </Button>
                            )}
                            {notif.link && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs font-black text-primary uppercase tracking-widest hover:no-underline"
                                asChild
                              >
                                <Link href={notif.link}>Voir le détail</Link>
                              </Button>
                            )}
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/5"
                            onClick={() => handleDeleteNotification(notif.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <Inbox className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase">Tout est à jour</h2>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Vous n'avez pas de notifications pour le moment. Revenez plus tard !
                  </p>
                </div>
                <Button variant="outline" className="rounded-full font-bold" asChild>
                  <Link href="/dashboard">Retour au tableau de bord</Link>
                </Button>
              </div>
            )}
          </div>
        </PageWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
