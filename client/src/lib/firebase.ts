import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, signInWithPopup, GoogleAuthProvider, getRedirectResult, signOut, onAuthStateChanged, type User, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Firebase config:", {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  authDomain: firebaseConfig.authDomain,
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to local (browser storage)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set auth persistence:", error);
});

const provider = new GoogleAuthProvider();

// Sign in with Google (using popup for better debugging)
export const signInWithGoogle = () => {
  console.log("Initiating Google sign in with popup...");
  provider.addScope('email');
  provider.addScope('profile');
  return signInWithPopup(auth, provider).then(result => {
    console.log("Popup sign in successful:", result.user);
    return result;
  }).catch(error => {
    console.error("Popup sign in failed:", error);
    throw error;
  });
};

// Sign out
export const signOutUser = () => {
  return signOut(auth);
};

// Handle redirect result
export const handleRedirectResult = () => {
  console.log("Getting redirect result...");
  return getRedirectResult(auth).then(result => {
    console.log("Redirect result received:", result);
    return result;
  }).catch(error => {
    console.error("Error in getRedirectResult:", error);
    throw error;
  });
};

// Auth state observer
export { onAuthStateChanged } from "firebase/auth";