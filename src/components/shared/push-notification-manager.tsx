'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { useAuthContext } from '@/components/auth/auth-provider';
import { updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationManager() {
    const { user, firestore } = useAuthContext();
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            // Sur mobile, c'est le code Swift qui gère ça, donc on arrête le code web ici
            console.log('[Push] Native app detected, skipping Web Push registration.');
            return;
        }

        if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
            console.warn('Push notifications are not supported in this browser.');
            return;
        }

        setPermission(Notification.permission);

        // Only register if user is logged in and permission is not denied
        if (user && firestore && Notification.permission !== 'denied') {
            requestPermissionAndGetToken();
        }
        
    }, [user, firestore]);

    const requestPermissionAndGetToken = async () => {
        try {
            const status = await Notification.requestPermission();
            setPermission(status);

            if (status === 'granted') {
                const messaging = getMessaging();
                
                // Actual VAPID KEY from Firebase Console
                const vapidKey = "BBGiGJfDEOViTGrg753GED-PJ92nMj4lBzy5OMD5RxVRzNKA2mOToPvltfL_9eKNOIcNhtKtSUuMGLfLOPDGoGo";
                
                const token = await getToken(messaging, {
                    vapidKey: vapidKey
                }).catch(async (e) => {
                    console.log("Error getting token without VAPID key, trying to continue...", e);
                    return null;
                });

                if (token) {
                    console.log('FCM Token received:', token);
                    // Save token to Firestore
                    const userRef = doc(firestore!, 'users', user!.uid);
                    await updateDoc(userRef, {
                        fcmToken: token,
                        pwaNotificationEnabled: true,
                        lastTokenRefresh: new Date().toISOString()
                    });
                }

                // Listen for foreground messages
                onMessage(messaging, (payload) => {
                    console.log('Message received in foreground: ', payload);
                    toast({
                        title: payload.notification?.title || "Notification",
                        description: payload.notification?.body || "Vous avez un nouveau message.",
                    });
                });
            }
        } catch (error) {
            console.error('Error getting push token:', error);
        }
    };

    return null; // This component doesn't render anything
}
