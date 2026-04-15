'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import '@/lib/i18n';

import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { LoadingProvider } from '@/contexts/loading-context';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { AccentThemeProvider } from '@/contexts/accent-theme-context';
import { FeedbackButton } from '@/components/layout/feedback-button';
import { FloatingShortcuts } from '@/components/layout/floating-shortcuts';
import { Toaster } from "@/components/ui/toaster";
import { ReadOnlyProvider } from '@/contexts/read-only-context';
import { FamilyMemberGuardModal } from '@/components/shared/family-member-guard';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { AnimatePresence } from 'framer-motion';
import { GlobalDishPreview } from '@/components/shared/global-dish-preview';
import { OfflineDetector } from '@/components/shared/offline-detector';
import { NativeSplashScreen } from '@/components/shared/native-splash';
import { useNativeBack } from '@/hooks/use-native-back';
import { PushNotificationManager } from '@/components/shared/push-notification-manager';
import { DexieSyncManager } from '@/lib/dexie/sync';

import ErrorBoundary from '@/components/shared/error-boundary';

export function Providers({ children }: { children: React.ReactNode }) {
  useNativeBack();

  useEffect(() => {
    // 1. Enregistrement du Super-Service Worker pour le cache local
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw-mcf.js').then((reg) => {
          console.log('[SW] Service Worker MCF activé et prêt !', reg.scope);
          // Forcer le cache initial en arrière-plan
          reg.active?.postMessage('CACHE_ALL');
        }).catch((err) => {
          console.error('[SW] Échec de l\'activation :', err);
        });
      });
    }

    // 2. Le "Leurre" Apple : Demander les accès natifs dès le début
    const requestNativeAccess = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Note: On importe dynamiquement les plugins pour ne pas casser le web
          const { Camera } = await import('@capacitor/camera');
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          // Demander Camera + Photos
          await Camera.requestPermissions();
          // Demander Notifications
          await PushNotifications.requestPermissions();
          
          console.log('[Native] Accès matériel demandés avec succès !');
        } catch (e) {
          console.warn('[Native] Erreur lors de la demande d\'accès (normal sur Web) :', e);
        }
      }
    };

    requestNativeAccess();
  }, []);

  return (
    <FirebaseClientProvider>
      <DexieSyncManager />
      {/* Le splash est monté en premier — il couvre tout pendant le chargement de l'auth */}
      <NativeSplashScreen />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AccentThemeProvider>
          <LoadingProvider>
            <AuthProvider>
              <PushNotificationManager />
              <ReadOnlyProvider>
                <ErrorBoundary>
                  <AnimatePresence mode="wait">
                    {children}
                  </AnimatePresence>
                </ErrorBoundary>
                <FamilyMemberGuardModal />
                <FeedbackButton />
                <FloatingShortcuts />
                <LoadingOverlay />
                <MobileBottomNav />
                <GlobalDishPreview />
                <Toaster />
                <OfflineDetector />
              </ReadOnlyProvider>
            </AuthProvider>
          </LoadingProvider>
        </AccentThemeProvider>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
}
