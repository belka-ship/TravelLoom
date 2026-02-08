import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to chat if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user) {
        const idToken = await user.getIdToken();
        
        try {
          // Sync with backend
          await apiRequest("POST", "/api/auth/sync", {
            idToken,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
        } catch (syncError) {
          // If sync fails but user is authenticated, wait a moment and try again
          console.log("Initial sync failed, retrying...", syncError);
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await apiRequest("POST", "/api/auth/sync", {
              idToken: await user.getIdToken(), // Get fresh token
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            });
          } catch (retryError) {
            console.log("Sync retry also failed, but user is authenticated:", retryError);
            // Don't throw - user is still authenticated
          }
        }
        
        // Auth state change will handle redirect automatically
        // No need to manually redirect or show toast
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign-in Failed",
        description: "Sign in was not successful. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let user;
      
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      }
      
      if (user) {
        const idToken = await user.getIdToken();
        
        try {
          // Sync with backend
          await apiRequest("POST", "/api/auth/sync", {
            idToken,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || email.split('@')[0],
            photoURL: user.photoURL,
          });
        } catch (syncError) {
          // If sync fails but user is authenticated, wait a moment and try again
          console.log("Initial sync failed, retrying...", syncError);
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await apiRequest("POST", "/api/auth/sync", {
              idToken: await user.getIdToken(), // Get fresh token
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || email.split('@')[0],
              photoURL: user.photoURL,
            });
          } catch (retryError) {
            console.log("Sync retry also failed, but user is authenticated:", retryError);
            // Don't throw - user is still authenticated
          }
        }
        
        // Auth state change will handle redirect automatically
        // No need to manually redirect or show toast
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      let errorMessage = "Sign in was not successful. Please try again.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If authenticated, don't render login form (useEffect will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Redirecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Create a free account
            </h1>
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-gray-900">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-sm text-gray-600">
                {isSignUp 
                  ? "Welcome! Please fill in the details to get started." 
                  : "Please sign in to your account."}
              </p>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Please wait..." : `Continue ${isSignUp ? "→" : ""}`}
            </Button>
          </form>

          {/* Toggle Sign In/Up */}
          <div className="text-center text-sm text-gray-600">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>

          {/* Terms */}
          {isSignUp && (
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </a>
              .
            </p>
          )}
        </div>
      </div>

      {/* Right side - Gradient Background */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-purple-400 to-blue-500">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-purple-800/40 via-purple-600/20 to-transparent" />
          
          {/* Decorative elements */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-400/15 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
}