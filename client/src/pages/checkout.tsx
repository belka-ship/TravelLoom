import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ planName }: { planName: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Complete your {planName} subscription
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Complete your subscription to unlock full access to TravelLoom's AI travel planning tools.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
        <PaymentElement />
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isLoading ? "Processing..." : "Subscribe Now"}
        </Button>
      </form>
    </div>
  );
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<{
    plan: string;
    billing: string;
    priceId: string;
  } | null>(null);

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    const billing = urlParams.get('billing');
    const priceId = urlParams.get('priceId');

    if (plan && billing && priceId) {
      setPlanDetails({ plan, billing, priceId });
    } else {
      // Redirect to pricing if missing parameters
      setLocation('/plan');
    }
  }, [setLocation]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Create payment intent when component loads
  useEffect(() => {
    if (!planDetails || !isAuthenticated) return;

    const createPaymentIntent = async () => {
      try {
        console.log("Creating subscription with details:", planDetails);
        const response = await apiRequest("POST", "/api/create-subscription", {
          priceId: planDetails.priceId,
          planName: planDetails.plan,
          billing: planDetails.billing,
        });
        
        const data = await response.json();
        console.log("Subscription response data:", data);
        
        if (data && data.clientSecret) {
          console.log("Setting client secret:", data.clientSecret);
          setClientSecret(data.clientSecret);
        } else {
          console.error("No client secret in response:", data);
          toast({
            title: "Error",
            description: "Failed to initialize checkout. Missing client secret.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error creating payment intent:", error);
        toast({
          title: "Error",
          description: "Failed to initialize checkout. Please try again.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [planDetails, isAuthenticated]);

  // Show loading while checking auth or creating payment intent
  if (authLoading || !planDetails || !clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Setting up your checkout...</p>
        </div>
      </div>
    );
  }

  const planDisplayName = planDetails.plan.charAt(0).toUpperCase() + planDetails.plan.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <p className="text-gray-600">
            You're subscribing to the {planDisplayName} plan ({planDetails.billing})
          </p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#8b5cf6',
              },
            },
          }}
        >
          <CheckoutForm planName={planDisplayName} />
        </Elements>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/plan')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to pricing
          </Button>
        </div>
      </div>
    </div>
  );
}

// Payment success page component
export function PaymentSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to chat after showing success
    const timer = setTimeout(() => {
      setLocation('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-4">
          Your subscription has been activated. You'll be redirected to the chat in a moment.
        </p>
        <Button
          onClick={() => setLocation('/')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Go to Chat Now
        </Button>
      </div>
    </div>
  );
}