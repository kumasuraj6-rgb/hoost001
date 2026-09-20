import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  confirmPasswordReset,
  updatePassword,
} from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Configure Firestore with auto-detect long polling for iframe sandbox / proxy compatibility
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

// CRITICAL: Initialize Firestore using the designated firestoreDatabaseId from configuration
export const db = firestoreDb || getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider setup for one-click authentication
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection to Firestore verified successfully.');
    return true;
  } catch (error: any) {
    if (
      (error instanceof Error && error.message.includes('the client is offline')) ||
      error?.code === 'unavailable'
    ) {
      console.info('[Firebase] Firestore client operating in offline mode or network standby. Local store active.');
    } else {
      console.warn('[Firebase] Initial connection check status:', error?.message || error);
    }
    return false;
  }
}

// Helper for Google Sign-In via Popup
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Normal user cancellation: closing or cancelling the popup window
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.info('[Firebase Auth] Google Sign-In popup dismissed or cancelled by user.');
      return null;
    }

    // Popup blocked by browser or sandboxed iframe
    if (error?.code === 'auth/popup-blocked') {
      console.warn('[Firebase Auth] Sign-In popup was blocked by browser. Please enable popups or open in a new tab.');
      return null;
    }

    console.warn('[Firebase Auth] Google Sign-In notification:', error?.message || error);
    return null;
  }
}

// Helper for Sign Out
export async function logoutFirebaseUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Firebase Auth] Sign out error:', error);
    throw error;
  }
}

// Helper for Email/Password Sign-In
export async function loginWithFirebaseEmailPassword(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.warn('[Firebase Auth] Email/Password Sign-In notice:', error?.code || error?.message);
    throw error;
  }
}

// Helper for Email/Password Registration
export async function registerWithFirebaseEmailPassword(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.warn('[Firebase Auth] Email/Password Registration notice:', error?.code || error?.message);
    throw error;
  }
}

// Helper for Password Reset Email Dispatch
export async function sendFirebasePasswordReset(email: string): Promise<boolean> {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: any) {
    console.warn('[Firebase Auth] Password reset note:', error?.message || error);
    return false;
  }
}

// Helper for Resetting Password with OOB Code
export async function resetFirebasePasswordWithCode(oobCode: string, newPassword: string): Promise<boolean> {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    return true;
  } catch (error: any) {
    console.warn('[Firebase Auth] Password confirmation reset note:', error?.message || error);
    return false;
  }
}

