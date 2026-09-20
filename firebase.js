import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase using configuration keys
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export initialized authentication instance
export const auth = getAuth(app);

// Export initialized Firestore instance with designated database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { app, firebaseConfig };
export default app;
