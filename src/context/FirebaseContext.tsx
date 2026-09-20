import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logoutFirebaseUser, testFirestoreConnection } from '../firebase/firebase';
import { saveCustomerToFirestore, fetchCustomerFromFirestore } from '../firebase/firestoreService';

interface FirebaseContextType {
  firebaseUser: User | null;
  isAuthReady: boolean;
  isLoggingIn: boolean;
  loginWithGoogle: () => Promise<User | null>;
  logoutFirebase: () => Promise<void>;
  isFirebaseAdmin: boolean;
  firestoreConnected: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const ADMIN_EMAIL = 'ms0736687@gmail.com';

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
        try {
          // Persist / update customer profile in Firestore
          await saveCustomerToFirestore({
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || 'Rider',
            phone: currentUser.phoneNumber || '',
            role: currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'CUSTOMER',
            createdAt: new Date().toISOString(),
          });
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

  const logoutFirebase = async () => {
    await logoutFirebaseUser();
  };

  const isFirebaseAdmin = Boolean(
    firebaseUser?.email && firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        isAuthReady,
        isLoggingIn,
        loginWithGoogle,
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
