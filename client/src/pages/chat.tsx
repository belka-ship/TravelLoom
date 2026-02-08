import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plane, 
  Plus, 
  Send, 
  Bell, 
  ChevronDown, 
  User, 
  CreditCard, 
  Settings, 
  LogOut,
  Bot,
  Handshake,
  Users,
  MapPin,
  TrendingUp
} from "lucide-react";
import type { Conversation, Message } from "@shared/schema";
import { signOutUser } from "@/lib/firebase";

export default function Chat() {
  const { id } = useParams();
  const currentConversationId = id ? parseInt(id) : null;
  const [inputValue, setInputValue] = useState("");
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: authLoading, subscription } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is on starter plan and has reached message limit
  const isStarterPlan = subscription?.plan === 'starter';

  // Fetch user's total message count for starter plan limits
  const { data: userMessageCount = 0 } = useQuery({
    queryKey: ["/api/user/message-count"],
    enabled: !!user && isStarterPlan,
  });
  const hasReachedLimit = isStarterPlan && userMessageCount >= 2;
  const remainingMessages = isStarterPlan ? Math.max(0, 2 - userMessageCount) : Infinity;

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Fetch messages for current conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/conversations", { title });
      return response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      window.history.pushState({}, "", `/chat/${conversation.id}`);
      setCurrentConversation(conversation);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content,
        role: "user",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", currentConversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/message-count"] });
      setInputValue("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Set current conversation based on URL
  useEffect(() => {
    if (currentConversationId && conversations.length > 0) {
      const conversation = conversations.find((c: Conversation) => c.id === currentConversationId);
      setCurrentConversation(conversation || null);
    }
  }, [currentConversationId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartNewChat = () => {
    createConversationMutation.mutate("New Conversation");
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Check if starter plan user has reached message limit
    if (hasReachedLimit) {
      toast({
        title: "Message Limit Reached",
        description: "You've used your 2 free messages. Upgrade to Pro for unlimited chat!",
        variant: "destructive",
      });
      
      // Redirect to pricing page after a moment
      setTimeout(() => {
        window.location.href = '/plan';
      }, 2000);
      return;
    }
    
    // If no conversation exists, create one first
    if (!currentConversationId) {
      createConversationMutation.mutate("New Conversation", {
        onSuccess: (conversation) => {
          // Send the message after conversation is created
          sendMessageMutation.mutate({
            conversationId: conversation.id,
            content: inputValue.trim(),
          });
        }
      });
      return;
    }
    
    // Send message to existing conversation
    sendMessageMutation.mutate({
      conversationId: currentConversationId,
      content: inputValue.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSampleMessage = (type: string) => {
    const sampleMessages = {
      'host-agency': 'Help me find the right host agency for luxury travel specialists',
      'generate-leads': 'What are the best strategies to generate leads for high-end travel clients?',
      'create-itinerary': 'Create a 10-day romantic European itinerary for a couple celebrating their anniversary',
      'optimize-commission': 'How can I optimize my commission structure to earn more per booking?'
    };

    const message = sampleMessages[type as keyof typeof sampleMessages];
    if (message) {
      setInputValue(message);
      // Use the same logic as handleSendMessage to auto-create conversation if needed
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      // Also clear backend session
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Plane className="text-xl text-[hsl(var(--brand-indigo))] mr-3" />
          <span className="text-lg font-semibold text-gray-900">TravelLoom</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.profileImageUrl || ''} />
                  <AvatarFallback>
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user?.firstName || user?.email || 'User'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white flex flex-col">
          {/* New Chat Button */}
          <div className="p-4">
            <Button 
              onClick={handleStartNewChat}
              disabled={createConversationMutation.isPending}
              className="w-full bg-white text-gray-900 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createConversationMutation.isPending ? 'Creating...' : 'New Chat'}
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-4">
            <h3 className="text-xs uppercase text-gray-400 font-semibold mb-3">Recent Chats</h3>
            {conversationsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation: Conversation) => (
                  <Card 
                    key={conversation.id}
                    className={`cursor-pointer transition-colors ${
                      currentConversationId === conversation.id 
                        ? 'bg-gray-800' 
                        : 'bg-transparent hover:bg-gray-800'
                    }`}
                    onClick={() => window.history.pushState({}, "", `/chat/${conversation.id}`)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate text-white">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(conversation.createdAt!).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl || ''} />
                <AvatarFallback>
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {user?.firstName || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.subscriptionPlan || 'Starter'} Plan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {!currentConversationId || messages.length === 0 ? (
              /* Welcome Message */
              <div className="text-center py-12 space-y-8">
                <div className="space-y-4">
                  <Bot className="w-16 h-16 text-[hsl(var(--brand-indigo))] mx-auto" />
                  <h2 className="text-2xl font-bold text-gray-900">How can I help you today?</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    I can help you find host agencies, generate leads, create itineraries, and optimize your commissions.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    className="p-6 h-auto text-left flex-col items-start space-y-2 hover:border-[hsl(var(--brand-indigo))] hover:bg-indigo-50 overflow-hidden w-full"
                    onClick={() => handleSampleMessage('host-agency')}
                  >
                    <Handshake className="text-[hsl(var(--brand-indigo))] w-6 h-6 flex-shrink-0" />
                    <div className="w-full overflow-hidden">
                      <h3 className="font-semibold text-gray-900 truncate">Find Host Agency</h3>
                      <p className="text-sm text-gray-600 whitespace-normal break-words">Get personalized recommendations for the perfect host agency match</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="p-6 h-auto text-left flex-col items-start space-y-2 hover:border-[hsl(var(--brand-indigo))] hover:bg-indigo-50 overflow-hidden w-full"
                    onClick={() => handleSampleMessage('generate-leads')}
                  >
                    <Users className="text-[hsl(var(--brand-indigo))] w-6 h-6 flex-shrink-0" />
                    <div className="w-full overflow-hidden">
                      <h3 className="font-semibold text-gray-900 truncate">Generate Leads</h3>
                      <p className="text-sm text-gray-600 whitespace-normal break-words">Discover strategies to find high-value travel clients</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="p-6 h-auto text-left flex-col items-start space-y-2 hover:border-[hsl(var(--brand-indigo))] hover:bg-indigo-50 overflow-hidden w-full"
                    onClick={() => handleSampleMessage('create-itinerary')}
                  >
                    <MapPin className="text-[hsl(var(--brand-indigo))] w-6 h-6 flex-shrink-0" />
                    <div className="w-full overflow-hidden">
                      <h3 className="font-semibold text-gray-900 truncate">Create Itinerary</h3>
                      <p className="text-sm text-gray-600 whitespace-normal break-words">Build detailed, impressive travel itineraries</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="p-6 h-auto text-left flex-col items-start space-y-2 hover:border-[hsl(var(--brand-indigo))] hover:bg-indigo-50 overflow-hidden w-full"
                    onClick={() => handleSampleMessage('optimize-commission')}
                  >
                    <TrendingUp className="text-[hsl(var(--brand-indigo))] w-6 h-6 flex-shrink-0" />
                    <div className="w-full overflow-hidden">
                      <h3 className="font-semibold text-gray-900 truncate">Optimize Commission</h3>
                      <p className="text-sm text-gray-600 whitespace-normal break-words">Learn strategies to increase your commission rates</p>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="space-y-6">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-start space-x-3 max-w-3xl">
                          <div className="w-8 h-8 bg-[hsl(var(--brand-indigo))] rounded-full flex items-center justify-center text-white text-sm">
                            🤖
                          </div>
                          <Card className="bg-white border border-gray-200">
                            <CardContent className="p-4">
                              <div className="prose prose-sm max-w-none chat-message">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mb-1 mt-2 first:mt-0">{children}</h3>,
                                    p: ({ children }) => <p className="text-gray-700 mb-2 leading-normal last:mb-0">{children}</p>,
                                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-gray-700">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal mb-2 ml-4 space-y-0.5 text-gray-700">{children}</ol>,
                                    li: ({ children }) => <li className="leading-normal">{children}</li>,
                                    code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>,
                                    pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 my-2 text-gray-600 italic">{children}</blockquote>,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                      
                      {message.role === 'user' && (
                        <Card className="gradient-button text-white max-w-md">
                          <CardContent className="p-4">
                            <p className="chat-message">{message.content}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 bg-white p-4">
            {/* Starter plan message limit indicator */}
            {isStarterPlan && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-800">
                      Starter Plan: {remainingMessages} message{remainingMessages !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                  {remainingMessages === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/plan'}
                      className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                    >
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
                {remainingMessages === 1 && (
                  <p className="text-xs text-yellow-700 mt-1">
                    Upgrade to Pro for unlimited messages and advanced features!
                  </p>
                )}
              </div>
            )}

            <div className="max-w-4xl mx-auto relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={hasReachedLimit ? "Upgrade to Pro to continue chatting..." : "Ask me anything about travel advising..."}
                className="resize-none pr-12 min-h-[60px]"
                disabled={sendMessageMutation.isPending || createConversationMutation.isPending || hasReachedLimit}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || sendMessageMutation.isPending || createConversationMutation.isPending || hasReachedLimit}
                size="sm"
                className="absolute right-3 bottom-3 gradient-button text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              TravelLoom can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
