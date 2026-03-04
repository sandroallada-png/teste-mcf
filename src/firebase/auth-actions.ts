
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  UserCredential,
  sendEmailVerification,
  User,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

function showError(title: string, description: string) {
  toast({ variant: 'destructive', title, description });
}

function showSuccess(title: string, description: string) {
  toast({ variant: 'default', title, description });
}

/** Anonymous sign-in */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    console.error('Anonymous sign-in error:', error);
    showError('Erreur de connexion anonyme', "Impossible d'établir une session anonyme.");
  });
}

/** Email/password sign-up */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password)
    .then((cred) => {
      showSuccess('Inscription réussie', 'Votre compte a été créé.');
      return cred;
    })
    .catch((error) => {
      console.error('Email sign-up error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          showError("Erreur d'inscription", 'Cette adresse e-mail est déjà utilisée.');
          break;
        case 'auth/weak-password':
          showError('Mot de passe faible', 'Le mot de passe doit contenir au moins 6 caractères.');
          break;
        case 'auth/invalid-email':
          showError("Erreur d'inscription", "Adresse e-mail invalide.");
          break;
        default:
          showError("Erreur d'inscription", 'Une erreur inconnue est survenue.');
      }
      throw error;
    });
}

/** Email/password sign-in */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(authInstance, email, password);
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        showError('Échec de la connexion', "Adresse e-mail ou mot de passe incorrect.");
        break;
      case 'auth/too-many-requests':
        showError('Échec de la connexion', 'Trop de tentatives. Réessayez plus tard.');
        break;
      default:
        showError('Échec de la connexion', 'Une erreur inconnue est survenue.');
    }
    throw error; // Re-throw the error so the caller can handle it (e.g., stop loading state)
  }
}

/** Google sign-in — popup sur web, redirect sur Capacitor (in-app, sans Chrome) */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Détecte si on tourne dans Capacitor (APK natif)
  const isCapacitor = typeof window !== 'undefined' &&
    !!(window as any).Capacitor &&
    (window as any).Capacitor.isNativePlatform?.();

  if (isCapacitor) {
    // Sur mobile natif : signInWithRedirect + indexedDB pour la persistance locale
    // Firebase gère le redirect dans le même WebView sans ouvrir Chrome
    try {
      const { indexedDBLocalPersistence, setPersistence } = await import('firebase/auth');
      await setPersistence(authInstance, indexedDBLocalPersistence);
      await signInWithRedirect(authInstance, provider);
      // getRedirectResult est géré dans auth-provider.tsx au montage
    } catch (error: any) {
      console.error('Google sign-in redirect error:', error);
      showError('Erreur Google', 'La connexion Google a échoué. Essayez email/mot de passe.');
      throw error;
    }
  } else {
    // Sur web desktop : popup classique
    try {
      await signInWithPopup(authInstance, provider);
    } catch (error: any) {
      console.error('Google sign-in popup error:', error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        // Fallback redirect si popup bloqué
        try {
          await signInWithRedirect(authInstance, provider);
        } catch (redirectError) {
          showError('Erreur de Redirection', 'Connexion Google impossible.');
          throw redirectError;
        }
      } else if (error.code !== 'auth/cancelled-popup-request') {
        showError('Erreur de connexion Google', 'Connexion Google impossible. Vérifiez la configuration.');
        throw error;
      }
    }
  }
}


/** Send verification email */
export function initiateEmailVerification(currentUser: User | null): void {
  if (!currentUser) {
    showError('Erreur', 'Aucun utilisateur connecté.');
    return;
  }

  sendEmailVerification(currentUser)
    .then(() => {
      showSuccess('Email envoyé !', 'Un lien de vérification a été envoyé à votre adresse e-mail.');
    })
    .catch((error) => {
      console.error('Email verification error:', error);
      if (error.code === 'auth/too-many-requests') {
        showError('Trop de demandes', 'Un email a déjà été envoyé. Veuillez réessayer plus tard.');
      } else {
        showError("Erreur d'envoi", "Impossible d'envoyer l'e-mail de vérification.");
      }
    });
}

/** Send password reset email */
export async function initiatePasswordReset(authInstance: Auth, email: string): Promise<void> {
  try {
    // Let Firebase handle the redirect URL to its own hosted page.
    await sendPasswordResetEmail(authInstance, email);
    // The success message is now handled inside the component for better UX.
  } catch (error: any) {
    console.error('Password reset error:', error);
    // Errors are handled in the component for better UX, but we can log them here.
    // We avoid showing specific errors to prevent user enumeration.
    throw error;
  }
}

/** Phone Number sign-in (via shadow email) */
export async function initiatePhoneSignIn(
  authInstance: Auth,
  firestore: any, // Using any for Firestore instance to avoid complex type issues in this file
  phoneNumber: string,
  password: string
): Promise<UserCredential> {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');

    // 1. Find user by phone number
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showError('Échec de la connexion', "Aucun compte n'est associé à ce numéro.");
      throw new Error('User not found');
    }

    const userData = querySnapshot.docs[0].data();
    const shadowEmail = userData.email;

    if (!shadowEmail) {
      showError('Échec de la connexion', "Données de compte corrompues (email manquant).");
      throw new Error('Shadow email not found');
    }

    // 2. Standard sign-in with shadow email
    return await signInWithEmailAndPassword(authInstance, shadowEmail, password);
  } catch (error: any) {
    if (error.message === 'User not found' || error.message === 'Shadow email not found') {
      throw error;
    }
    console.error('Phone sign-in error:', error);
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        showError('Échec de la connexion', "Numéro ou mot de passe incorrect.");
        break;
      case 'auth/too-many-requests':
        showError('Échec de la connexion', 'Trop de tentatives. Réessayez plus tard.');
        break;
      default:
        showError('Échec de la connexion', 'Une erreur inconnue est survenue.');
    }
    throw error;
  }
}
