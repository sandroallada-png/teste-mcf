'use client';

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
import { GoogleTranslateProvider } from '@/components/shared/google-translate';
import { OfflineDetector } from '@/components/shared/offline-detector';
import { NativeSplashScreen } from '@/components/shared/native-splash';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AccentThemeProvider>
          <LoadingProvider>
            <AuthProvider>
              <ReadOnlyProvider>
                <AnimatePresence mode="wait">
                  <GoogleTranslateProvider>
                    {children}
                  </GoogleTranslateProvider>
                </AnimatePresence>
                <FamilyMemberGuardModal />
                <FeedbackButton />
                <FloatingShortcuts />
                <LoadingOverlay />
                <MobileBottomNav />
                <GlobalDishPreview />
                <Toaster />
                <OfflineDetector />
                <NativeSplashScreen />
              </ReadOnlyProvider>
            </AuthProvider>
          </LoadingProvider>
        </AccentThemeProvider>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
}
