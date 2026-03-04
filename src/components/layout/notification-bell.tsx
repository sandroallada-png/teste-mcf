
'use client';

import { useState } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { user } = useUser();
  const { firestore } = useFirebase();

  const notificationsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc'), limit(10)) : null),
    [user, firestore]
  );

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
    updateDocumentNonBlocking(notifRef, { isRead: true });
  };
  
  const handleMarkAllAsRead = () => {
    if (!user || !notifications) return;
    notifications.forEach(n => {
        if (!n.isRead) {
             const notifRef = doc(firestore, 'users', user.uid, 'notifications', n.id);
             updateDocumentNonBlocking(notifRef, { isRead: true });
        }
    });
  };
  
  const renderNotificationItem = (notif: Notification) => {
    const itemContent = (
      <div className="flex flex-col items-start gap-2 w-full p-2">
        <div className="flex items-start justify-between w-full">
            <p className="font-semibold text-sm">{notif.title}</p>
            {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0 ml-2" />}
        </div>
        <p className="text-xs text-muted-foreground">{notif.body}</p>
         <div className="flex items-center justify-between w-full mt-1">
            <p className="text-xs text-muted-foreground/80">
                {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { locale: fr, addSuffix: true }) : ''}
            </p>
            {!notif.isRead && (
                <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={(e) => handleMarkAsRead(e, notif.id)}>
                    <CheckCircle className="mr-1 h-3 w-3" /> Marquer comme lu
                </Button>
            )}
         </div>
      </div>
    );

    if (notif.link) {
        return (
            <Link href={notif.link} className="block cursor-pointer w-full">
              {itemContent}
            </Link>
        );
    }
    return itemContent;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative transition-transform active:scale-95">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAllAsRead}>
                Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map(notif => (
              <DropdownMenuItem key={notif.id} className={cn("flex-col items-start gap-2 whitespace-normal p-0")} onSelect={(e) => e.preventDefault()}>
                  {renderNotificationItem(notif)}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-sm text-muted-foreground">Aucune nouvelle notification.</p>
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-primary hover:bg-primary/5 rounded-lg" asChild>
            <Link href="/notifications">Voir tout l'historique</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
