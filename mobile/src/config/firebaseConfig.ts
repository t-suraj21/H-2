import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase Configuration for HL²
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyC3NzzwPGqdOk6c_Vb1O0s6Xj6GGTNHkVk",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "hl-2-f237f.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "hl-2-f237f",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "hl-2-f237f.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "381098543504",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:381098543504:web:e3761e8ec8e96967f20b15",
};

// Initialize Firebase safely (avoid re-initialization on hot reloads)
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Auth instance
export const auth: Auth = getAuth(app);

export default app;
