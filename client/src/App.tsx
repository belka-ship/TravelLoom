import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Pricing from "@/pages/pricing";
import Checkout, { PaymentSuccess } from "@/pages/checkout";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { handleRedirectResult } from "@/lib/firebase";

function PlanRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/plan');
  }, [setLocation]);
  
  return null; // Don't render anything, just redirect
}

function Router() {
  const { isAuthenticated, isLoading, user, needsPlanSelection } = useAuth();
  
  console.log("Router state:", { isAuthenticated, isLoading, hasUser: !!user });

  // Handle Firebase redirect result
  useEffect(() => {
    console.log("Checking for redirect result, current URL:", window.location.href);
    handleRedirectResult().then((result) => {
      if (result?.user) {
        console.log("User signed in via redirect:", result.user);
        console.log("User details:", {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        // Don't need to do anything here - onAuthStateChanged will handle the user sync
      } else if (result === null) {
        console.log("No redirect result - user either didn't come from redirect or already handled");
      } else {
        console.log("Redirect result:", result);
      }
    }).catch((error) => {
      console.error("Error handling redirect result:", error);
      console.error("Error details:", error.code, error.message);
    });
  }, []);

  console.log("Rendering routes - isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
  
  // Show loading while auth or subscription is loading
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Render different route sets based on auth state
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/sign-up" component={Login} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  if (needsPlanSelection) {
    return (
      <Switch>
        <Route path="/plan">
          <Pricing key="authenticated-pricing" />
        </Route>
        <Route path="/checkout" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/" component={PlanRedirect} />
        <Route component={PlanRedirect} />
      </Switch>
    );
  }
  
  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/plan" component={Pricing} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:id" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
