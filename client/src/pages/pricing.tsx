import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const plans = {
  starter: {
    name: "Starter",
    description: "Limited conversations",
    price: 0,
    priceId: "free",
    popular: false,
    features: [
      "Limited chats",
      "Basic travel planning",
      "Host agency finder", 
      "Basic itinerary creation",
      "Commission calculator",
      "Basic support"
    ]
  },
  pro: {
    name: "Pro",
    description: "Advanced features & integrations", 
    price: 25,
    priceId: "price_1RmU9FKIbCEIs9dF607ZGjiQ",
    popular: true,
    features: [
      "Everything in Starter plan",
      "Unlimited chats",
      "Advanced travel planning",
      "Premium AI models",
      "Lead generation tools",
      "Custom itinerary templates",
      "Priority support"
    ]
  },
  agency: {
    name: "Agency",
    description: "Accelerate your entire team",
    price: 49,
    priceId: "price_agency_monthly",
    popular: false,
    features: [
      "Everything in Pro plan",
      "Team collaboration",
      "Centralized billing",
      "Team workspace",
      "Shared templates",
      "Custom integrations",
      "Dedicated support"
    ]
  }
};

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const handlePlanSelect = async (planKey: keyof typeof plans) => {
    console.log("Plan select clicked:", planKey, "isAuthenticated:", isAuthenticated);
    
    // If user is not authenticated, redirect to signup
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to signup");
      setLocation("/sign-up");
      return;
    }

    const plan = plans[planKey];
    
    // Handle different plan types
    if (planKey === 'starter') {
      // For free starter plan, set plan but show upgrade message
      try {
        console.log("Selecting starter plan...");
        await apiRequest("POST", "/api/select-plan", {
          plan: "starter",
          billing: "free"
        });
        console.log("Starter plan selected successfully");
        
        // Invalidate subscription cache to update UI immediately
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        
        // Show success message and redirect to chat
        toast({
          title: "Starter Plan Activated",
          description: "You have 2 free messages to try TravelLoom. Enjoy!",
          variant: "default",
        });
        
        // Redirect to chat to start using the service
        setTimeout(() => {
          setLocation('/chat');
        }, 1500);
      } catch (error) {
        console.error("Error selecting free plan:", error);
        toast({
          title: "Error",
          description: "Failed to start free plan. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // For pro plan, go to checkout
      setLocation(`/checkout?priceId=${plan.priceId}&plan=${planKey}&billing=monthly`);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pick your plan</h1>
          <p className="text-lg text-gray-600 mb-8">
            Choose the plan that works best for you.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative bg-white rounded-2xl p-8 shadow-lg ${
                plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <div className="flex items-baseline justify-center">
                    {key === 'starter' ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">$0</span>
                        <span className="text-gray-600 ml-1">/mo</span>
                      </>
                    ) : key === 'agency' ? (
                      <>
                        <span className="text-lg text-gray-600">From </span>
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600 ml-1">/mo</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600 ml-1">/mo</span>
                      </>
                    )}
                  </div>
                </div>

                {key === 'agency' ? (
                  <a href="mailto:vadim@turtlehotels.com?subject=Agency Plan Inquiry">
                    <Button
                      className={`w-full py-2 px-4 rounded-lg font-medium ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      Contact Us
                    </Button>
                  </a>
                ) : (
                  <Button
                    onClick={() => handlePlanSelect(key as keyof typeof plans)}
                    className={`w-full py-2 px-4 rounded-lg font-medium ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {key === 'starter' 
                      ? 'Get Started Free' 
                      : `Get ${plan.name}`
                    }
                  </Button>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">What's included</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}