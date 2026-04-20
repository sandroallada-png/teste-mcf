'use client';
import React, { createContext, useContext, useEffect, useState, Suspense } from 'react';
import { signalAppReady } from '@/components/shared/native-splash';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLoading } from '@/contexts/loading-context';
import { setDoc, doc, getDoc, serverTimestamp, updateDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

const AUTH_COOKIE = 'mcf_auth';
const ADMIN_EMAIL = 'maxyculture11@gmail.com';
const APP_VERSION = '1.0.1-onboarding-fix-2026-04-20';

// Routes publiques (pas de redirection vers login)
const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/forgot-password', '/reset-password',
  '/about', '/support', '/market', '/forum', '/terms', '/privacy',
  '/join-family', '/offline', '/denied',
];

function setAuthCookie(role: 'admin' | 'user') {
  // Cookie accessible par le middleware Edge (pas httpOnly)
  const maxAge = 60 * 60 * 24 * 7; // 7 jours
  document.cookie = `${AUTH_COOKIE}=${role}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

function deleteAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  userData: any | null;
  isFullySetup: boolean;
  firestore: Firestore | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  userData: null,
  isFullySetup: false,
  firestore: null
});

function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hideLoading } = useLoading();

  useEffect(() => {
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserDataState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullySetup, setIsFullySetup] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const ADMIN_EMAIL_LOCAL = ADMIN_EMAIL;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setUserDataState(null);
        setIsFullySetup(false);
        setLoading(false);
        signalAppReady();
        deleteAuthCookie();

        const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/join-family');
        const isProtectedRoute = !PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) && !isAuthRoute;

        if (isProtectedRoute) {
          router.replace('/login');
        }
        return;
      }

      // User logged in - Set up real-time listener for user document
      const { onSnapshot } = await import('firebase/firestore');
      const userDocRef = doc(firestore, 'users', u.uid);
      
      const unsubDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists()) {
              const isAdmin = u.email === ADMIN_EMAIL_LOCAL;
              const newData = {
                id: u.uid,
                name: u.displayName || 'Nouvel utilisateur',
                email: u.email,
                photoURL: u.photoURL,
                role: isAdmin ? 'admin' : 'user',
                createdAt: serverTimestamp(),
                subscriptionStatus: '',
                xp: 0,
                level: 1,
              };
              await setDoc(userDocRef, newData, { merge: true });
              return; // next snapshot will handle it
          }

          const data = docSnap.data();
          const isAdmin = u.email === ADMIN_EMAIL_LOCAL;

          if (isAdmin && data?.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
          }

          setUserDataState(data);
          setAuthCookie(isAdmin ? 'admin' : 'user');

          if (data?.status === 'isDenied') {
              setLoading(false);
              signalAppReady();
              if (pathname !== '/denied') {
                  router.replace('/denied');
              }
              return;
          }

          // --- FLUX DE REDIRECTION (iPhone & Web) ---
          const hasPersonalization = !!data?.theme;
          const hasPreferences = !!data?.mainObjective;
          const hasPricing = !!data?.subscriptionStatus;
          const hasAvatar = !!data?.avatarUrl;
          const isFamilyMember = !!data?.chefId;
          
          const fullySetup = (hasPersonalization && hasPreferences && hasPricing && hasAvatar) || isFamilyMember;
          setIsFullySetup(fullySetup);
          setLoading(false);
          signalAppReady();

          const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/join-family');

          if (isAdmin) {
              if (!pathname.startsWith('/admin')) {
                  router.replace('/admin');
              }
          } else if (isFamilyMember) {
              if (isAuthRoute || ['/personalization', '/preferences', '/pricing', '/avatar-selection'].some(p => pathname.startsWith(p))) {
                  router.replace('/dashboard');
              }
          } else {
              // --- FLUX UTILISATEUR CLASSIQUE (VOTRE RECONSTITUTION) ---
              if (!hasPersonalization && !pathname.startsWith('/personalization') && !isAuthRoute) {
                  router.replace('/personalization');
              } else if (hasPersonalization && !hasPreferences && !pathname.startsWith('/preferences')) {
                  router.replace('/preferences');
              } else if (hasPreferences && !hasPricing && !pathname.startsWith('/pricing')) {
                  router.replace('/pricing');
              } else if (hasPricing && !hasAvatar && !pathname.startsWith('/avatar-selection')) {
                  router.replace('/avatar-selection');
              } else if (fullySetup) {
                  // Si tout est OK et qu'on essaie de retourner dans le flux, on renvoie au Dashboard
                  if (isAuthRoute || ['/personalization', '/preferences', '/pricing', '/avatar-selection'].some(p => pathname.startsWith(p))) {
                      router.replace('/dashboard?welcome=true');
                  }
              }
          }
      });

      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, [pathname, firestore, router]);

  // Le NativeSplashScreen reste visible PENDANT le chargement de l'auth.
  // Il reçoit le signal via signalAppReady() quand loading passe à false.
  // Plus besoin de return null ici — le splash couvre l'écran à la place.

  // Sécurité Hybride : Si on doit rediriger, on n'affiche PAS les enfants (le dashboard)
  // Cela évite les flashs et les boucles de rendu sur mobile.
  if (user && !loading && !isFullySetup && !PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) && !pathname.startsWith('/personalization') && !pathname.startsWith('/preferences') && !pathname.startsWith('/pricing') && !pathname.startsWith('/avatar-selection')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, userData, isFullySetup, firestore }}>
      <Suspense fallback={null}>
        <NavigationEvents />
      </Suspense>
      {children}
    </AuthContext.Provider>
  );
}

// Composant Loader simple pour l'auth
function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
}
