
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, User } from 'firebase/auth';
import { auth } from '@/firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/loading-context';
import { setDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

function NavigationEvents() {
  const pathname = usePathname();
  const { hideLoading } = useLoading();

  useEffect(() => {
    // Hide loading indicator whenever the path changes
    hideLoading();
  }, [pathname, hideLoading]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { showLoading, hideLoading } = useLoading();
  
  const ADMIN_EMAIL = 'emapms@gmail.com';

  useEffect(() => {
    // Récupérer le résultat du redirect Google (Capacitor natif)
    getRedirectResult(auth).catch((err) => {
      console.warn('getRedirectResult error (ignoré):', err?.code);
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      const isAuthRoute = ['/login', '/register', '/forgot-password'].some(p => pathname.startsWith(p));
      const isProtectedRoute = !isAuthRoute;
      const isSetupRoute = ['/pricing', '/personalization', '/preferences', '/avatar-selection'].some(p => pathname.startsWith(p));

      if (u) {
        // User is logged in
        const isAdmin = u.email === ADMIN_EMAIL;
        const userDocRef = doc(firestore, 'users', u.uid);
        
        try {
            let userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                // If doc doesn't exist, it's a new user (or first login after manual delete)
                // Create the user document with all necessary fields.
                await setDoc(userDocRef, {
                    id: u.uid,
                    name: u.displayName || 'Nouvel utilisateur',
                    email: u.email,
                    photoURL: u.photoURL,
                    role: isAdmin ? 'admin' : 'user',
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    // Set setup-related fields to null to enforce the setup flow
                    subscriptionStatus: null,
                    mainObjective: null,
                    avatarUrl: null, 
                    xp: 0,
                    level: 1,
                    streak: 0,
                });
                // Re-fetch the snapshot to have the most current data for the checks below
                userDocSnap = await getDoc(userDocRef);
            } else {
                // User exists, just update lastLogin and check admin role
                const updates: { [key: string]: any } = { lastLogin: serverTimestamp() };
                if (isAdmin && userDocSnap.data()?.role !== 'admin') {
                    updates.role = 'admin';
                }
                await updateDoc(userDocRef, updates);
            }
            
            const userData = userDocSnap.data();
            
            const isPreferencesSetupComplete = !!userData?.mainObjective;
            const isSubscriptionSetupComplete = !!userData?.subscriptionStatus;
            const isAvatarSetupComplete = !!userData?.avatarUrl;

            if (isAdmin) {
                if (!pathname.startsWith('/admin')) {
                    router.replace('/admin');
                }
            } else {
                // Regular user setup flow
                if (!isPreferencesSetupComplete) {
                    if (pathname !== '/preferences') router.replace('/preferences');
                } else if (!isSubscriptionSetupComplete) {
                    if (pathname !== '/pricing') router.replace('/pricing');
                } else if (!isAvatarSetupComplete) {
                    if (pathname !== '/avatar-selection') router.replace('/avatar-selection');
                } else if (isAuthRoute || isSetupRoute) {
                    // If all setup is complete, redirect from any auth/setup page to dashboard
                    router.replace('/dashboard');
                }
            }
        } catch (error) {
            console.error("Error handling user document:", error);
            // Fallback: if something goes wrong, maybe sign out to prevent broken state
            auth.signOut();
        }

      } else {
        // User is not logged in
        if (isProtectedRoute) {
          router.replace('/login');
        }
      }
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount
  
  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <NavigationEvents />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
