import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!!auth);
  const [shouldShowPricing, setShouldShowPricing] = useState(false);
  useEffect(() => {
    if (!auth) return;
    let syncInProgress = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User signed in" : "User signed out");
      
      if (firebaseUser && !syncInProgress) {
        syncInProgress = true;
        try {
          console.log("Syncing user with backend...");
          const idToken = await firebaseUser.getIdToken();
          const response = await apiRequest("POST", "/api/auth/sync", {
            idToken,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          
          if (response.ok) {
            console.log("User synced successfully");
            setUser(firebaseUser);
          } else {
            console.error("Backend sync failed:", response.status);
            setUser(firebaseUser); // Still keep the Firebase user
          }
        } catch (error) {
          console.error("Failed to sync user with backend:", error);
          setUser(firebaseUser); // Still keep the Firebase user
        } finally {
          syncInProgress = false;
        }
      } else if (!firebaseUser) {
        setUser(null);
        syncInProgress = false;
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Query user subscription status
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user && !isLoading,
    retry: false,
  });

  const hasSelectedPlan = subscription ? (subscription as any).hasSelectedPlan : false;
  const needsPlanSelection = !!user && !isLoading && !subscriptionLoading && !hasSelectedPlan;
  
  console.log("Subscription status:", { 
    subscription, 
    hasSelectedPlan, 
    needsPlanSelection,
    user: !!user,
    isLoading,
    subscriptionLoading,
    userDetails: user ? { uid: user.uid, email: user.email } : null
  });

  return {
    user,
    isLoading: isLoading || subscriptionLoading,
    isAuthenticated: !!user,
    shouldShowPricing,
    setShouldShowPricing,
    hasSelectedPlan,
    needsPlanSelection,
    subscription,
  };
}
