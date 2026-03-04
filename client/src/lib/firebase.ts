import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const auth = isConfigured
  ? (() => {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      setPersistence(authInstance, browserLocalPersistence).catch((error) => {
        console.error("Failed to set auth persistence:", error);
      });
      return authInstance;
    })()
  : null;

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  if (!auth) return Promise.reject(new Error("Firebase not configured"));
  provider.addScope("email");
  provider.addScope("profile");
  return signInWithPopup(auth, provider);
};

export const signOutUser = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};

export const handleRedirectResult = () => {
  if (!auth) return Promise.resolve(null);
  return getRedirectResult(auth).catch((error) => {
    console.error("Error in getRedirectResult:", error);
    throw error;
  });
};

export { onAuthStateChanged } from "firebase/auth";
