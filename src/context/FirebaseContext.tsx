import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logoutFirebaseUser,
  testFirestoreConnection,
  loginWithFirebaseEmailPassword,
  registerWithFirebaseEmailPassword,
  sendFirebasePasswordReset,
} from '../firebase/firebase';
import { saveCustomerToFirestore, logUserActionToFirestore } from '../firebase/firestoreService';

interface FirebaseContextType {
  firebaseUser: User | null;
  isAuthReady: boolean;
  isLoggingIn: boolean;
  loginWithGoogle: () => Promise<User | null>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<User | null>;
  registerWithEmailPassword: (email: string, pass: string) => Promise<User | null>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logoutFirebase: () => Promise<void>;
  isFirebaseAdmin: boolean;
  firestoreConnected: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const ADMIN_EMAILS = ['ms0736687@gmail.com', 'skgsurajshahu317@gmail.com'];

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(false);

  useEffect(() => {
    // 1. Check Firestore connection on boot
    testFirestoreConnection().then((connected) => {
      setFirestoreConnected(connected);
    });

    // 2. Listen to Auth State
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      setIsAuthReady(true);

      if (currentUser && currentUser.email) {
        const isAdmin = ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim());
        try {
          // Persist / update profile in Firestore
          await saveCustomerToFirestore({
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || (isAdmin ? 'Admin' : 'Rider'),
            phone: currentUser.phoneNumber || '',
            role: isAdmin ? 'ADMIN' : 'CUSTOMER',
            createdAt: new Date().toISOString(),
          });

          // Log auth state sync to Firestore audit trail
          await logUserActionToFirestore(
            'AUTH_STATE_CHANGED',
            isAdmin ? 'ADMIN' : 'CUSTOMER',
            currentUser.email,
            currentUser.uid,
            { provider: currentUser.providerData?.[0]?.providerId || 'firebase' }
          );
        } catch (err) {
          console.warn('[Firebase] Profile sync notice:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    setIsLoggingIn(true);
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
        await logUserActionToFirestore('GOOGLE_LOGIN_SUCCESS', isAdmin ? 'ADMIN' : 'CUSTOMER', user.email, user.uid);
      }
      return user;
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return null;
      }
      console.warn('[Firebase] Sign-in flow interrupted:', err?.message || err);
      return null;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string): Promise<User | null> => {
    setIsLoggingIn(true);
    try {
      const user = await loginWithFirebaseEmailPassword(email, pass);
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());
      await logUserActionToFirestore('EMAIL_LOGIN_SUCCESS', isAdmin ? 'ADMIN' : 'CUSTOMER', email, user.uid);
      return user;
    } catch (err: any) {
      console.warn('[Firebase] Email password login notice:', err?.message || err);
      return null;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const registerWithEmailPassword = async (email: string, pass: string): Promise<User | null> => {
    setIsLoggingIn(true);
    try {
      const user = await registerWithFirebaseEmailPassword(email, pass);
      await logUserActionToFirestore('EMAIL_REGISTER_SUCCESS', 'CUSTOMER', email, user.uid);
      return user;
    } catch (err: any) {
      console.warn('[Firebase] Email password registration notice:', err?.message || err);
      return null;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
      const success = await sendFirebasePasswordReset(email);
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());
      await logUserActionToFirestore('PASSWORD_RESET_EMAIL_DISPATCHED', isAdmin ? 'ADMIN' : 'CUSTOMER', email);
      return success;
    } catch (err) {
      console.warn('[Firebase] Password reset error:', err);
      return false;
    }
  };

  const logoutFirebase = async () => {
    if (firebaseUser?.email) {
      const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase().trim());
      await logUserActionToFirestore('LOGOUT', isAdmin ? 'ADMIN' : 'CUSTOMER', firebaseUser.email, firebaseUser.uid);
    }
    await logoutFirebaseUser();
  };

  const isFirebaseAdmin = Boolean(
    firebaseUser?.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase().trim())
  );

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        isAuthReady,
        isLoggingIn,
        loginWithGoogle,
        loginWithEmailPassword,
        registerWithEmailPassword,
        sendPasswordReset,
        logoutFirebase,
        isFirebaseAdmin,
        firestoreConnected,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
