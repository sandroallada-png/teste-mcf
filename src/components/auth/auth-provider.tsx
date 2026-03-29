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

          const hasBasicProfile = !!(data?.age && data?.country && data?.referralSource);
          const hasPersonalization = !!data?.theme;
          const hasPreferences = !!data?.mainObjective;
          const hasPricing = !!data?.subscriptionStatus;
          const hasAvatar = !!data?.avatarUrl;
          const isFamilyMember = !!data?.chefId;
          const fullySetup = (hasBasicProfile && hasPersonalization && hasPreferences && hasPricing && hasAvatar) || isFamilyMember;

          setIsFullySetup(fullySetup);
          setLoading(false);
          signalAppReady();

          const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/join-family');

          if (isAdmin) {
              if (!pathname.startsWith('/admin')) {
                  router.replace('/admin');
              }
          } else if (isFamilyMember) {
              if (isAuthRoute || ['/welcome', '/personalization', '/preferences', '/pricing', '/avatar-selection'].some(p => pathname.startsWith(p))) {
                  router.replace('/dashboard');
              }
          } else {
              // Onboarding logic
              if (!hasBasicProfile && !pathname.startsWith('/welcome') && !pathname.startsWith('/register') && !pathname.startsWith('/join-family')) {
                  router.replace('/welcome');
              } else if (hasBasicProfile && !hasPersonalization && !pathname.startsWith('/personalization')) {
                  router.replace('/personalization');
              } else if (hasPersonalization && !hasPreferences && !pathname.startsWith('/preferences')) {
                  router.replace('/preferences');
              } else if (hasPreferences && !hasPricing && !pathname.startsWith('/pricing')) {
                  router.replace('/pricing');
              } else if (hasPricing && !hasAvatar && !pathname.startsWith('/avatar-selection')) {
                  router.replace('/avatar-selection');
              } else if (fullySetup && (isAuthRoute || ['/welcome', '/personalization', '/preferences', '/pricing', '/avatar-selection'].some(p => pathname.startsWith(p)))) {
                  router.replace('/dashboard');
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

  return (
    <AuthContext.Provider value={{ user, loading, userData, isFullySetup, firestore }}>
      <Suspense fallback={null}>
        <NavigationEvents />
      </Suspense>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
}
