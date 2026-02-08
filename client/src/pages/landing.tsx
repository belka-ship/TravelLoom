import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Sparkles, Handshake, Users, MapPin, TrendingUp, ArrowRight, Play } from "lucide-react";

export default function Landing() {
  const [isAnnualBilling, setIsAnnualBilling] = useState(true);
  const [, setLocation] = useLocation();

  const handleSignUp = () => {
    setLocation("/login");
  };

  const handleLogin = () => {
    setLocation("/login");
  };

  const toggleBilling = () => {
    setIsAnnualBilling(!isAnnualBilling);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="text-2xl text-[hsl(var(--brand-indigo))] mr-3" />
              <span className="text-xl font-bold text-gray-900">TravelLoom</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#product" className="text-gray-600 hover:text-gray-900 transition-colors">Product</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#resources" className="text-gray-600 hover:text-gray-900 transition-colors">Resources</a>
              <a href="#company" className="text-gray-600 hover:text-gray-900 transition-colors">Company</a>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin}>
                Log in
              </Button>
              <Button className="gradient-button text-white" onClick={handleSignUp}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="inline-flex items-center bg-white/70 backdrop-blur-sm border border-indigo-200 text-gray-700 mb-8">
              <Sparkles className="w-4 h-4 text-yellow-500 mr-2" />
              Boost your productivity 10x with AI
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              It's a new day for
              <span className="gradient-text block">
                travel advisors
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              TravelLoom is the #1 AI tool for travel advisors & their teams.
              Choose the right host agency, find leads, create amazing itineraries, and get paid higher commissions.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="gradient-button text-white px-8 py-3 text-lg" onClick={handleSignUp}>
                Try It For Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" className="px-8 py-3 text-lg">
                <Play className="mr-2 w-5 h-5" /> See it in action
              </Button>
            </div>
          </div>
          
          {/* Mock Chat Interface Preview */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <div className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10"></div>
                <div className="relative">
                  <Card className="bg-white shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-[hsl(var(--brand-indigo))] rounded-full flex items-center justify-center text-white mr-3">
                          🤖
                        </div>
                        <span className="text-lg font-semibold text-gray-900">How can I help you today?</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Handshake className="text-[hsl(var(--brand-indigo))] mr-3 w-5 h-5" />
                          <span className="text-gray-700">Help me find the right host agency</span>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Users className="text-[hsl(var(--brand-indigo))] mr-3 w-5 h-5" />
                          <span className="text-gray-700">Generate leads for luxury travel clients</span>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <MapPin className="text-[hsl(var(--brand-indigo))] mr-3 w-5 h-5" />
                          <span className="text-gray-700">Create a 10-day European itinerary</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed as a travel advisor
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From finding the perfect host agency to closing more deals, TravelLoom AI handles the complex work so you can focus on what matters most.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Handshake className="text-[hsl(var(--brand-indigo))] w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Host Agency</h3>
              <p className="text-gray-600">Find the perfect host agency match based on your niche, commission structure, and support needs.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-[hsl(var(--brand-emerald))] w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Find New Leads</h3>
              <p className="text-gray-600">Discover high-value prospects and generate qualified leads that match your expertise and target market.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gradient-to-br from-purple-100 to-violet-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-[hsl(var(--brand-violet))] w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Itineraries</h3>
              <p className="text-gray-600">Build stunning, detailed itineraries that wow your clients and showcase your expertise and attention to detail.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-orange-500 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Higher Commissions</h3>
              <p className="text-gray-600">Optimize your pricing strategy and increase your commission rates through data-driven insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose the plan that's right for you
            </h2>
            <p className="text-xl text-gray-600">Start free, scale as you grow</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-8">
              <span className="text-sm font-medium text-gray-900 mr-3">Monthly</span>
              <button 
                onClick={toggleBilling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))] focus:ring-offset-2 ${
                  isAnnualBilling ? 'bg-[hsl(var(--brand-indigo))]' : 'bg-gray-200'
                }`}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnualBilling ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-900 ml-3">Annual</span>
              <Badge className="bg-[hsl(var(--brand-emerald))] text-white ml-2">Save 20%</Badge>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="shadow-lg border border-gray-200">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
                  <p className="text-gray-600 mb-6">Perfect for getting started</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleSignUp}>
                    Get Started
                  </Button>
                </div>
                <ul className="mt-8 space-y-3">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">5 AI conversations per month</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Basic itinerary creation</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Host agency recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="shadow-xl border-2 border-[hsl(var(--brand-indigo))] relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="gradient-button text-white">Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                  <p className="text-gray-600 mb-6">For serious travel advisors</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${isAnnualBilling ? '19' : '25'}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <Button className="w-full gradient-button text-white" onClick={handleSignUp}>
                    Start Pro Plan
                  </Button>
                </div>
                <ul className="mt-8 space-y-3">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Unlimited AI conversations</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Advanced itinerary builder</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Lead generation tools</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Commission optimization</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Agency Plan */}
            <Card className="shadow-lg border border-gray-200">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Agency</h3>
                  <p className="text-gray-600 mb-6">For teams and agencies</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${isAnnualBilling ? '49' : '79'}
                    </span>
                    <span className="text-gray-600">/month</span>
                    <div className="text-sm text-gray-500 mt-1">
                      + ${isAnnualBilling ? '15' : '19'}/seat
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleSignUp}>
                    Start Agency Plan
                  </Button>
                </div>
                <ul className="mt-8 space-y-3">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Everything in Pro</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Team collaboration tools</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">White-label options</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[hsl(var(--brand-emerald))] rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Dedicated account manager</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
