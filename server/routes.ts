import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupFirebaseAuth, isAuthenticated } from "./firebaseAuth";

// Middleware to check if user has selected a payment plan
const requiresPlan = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.subscriptionPlan) {
      return res.status(403).json({ 
        message: "Payment plan required", 
        redirectTo: "/plan" 
      });
    }

    next();
  } catch (error) {
    console.error("Error checking payment plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { isUnauthorizedError } from "../client/src/lib/authUtils";
import { generateTravelAdvisorResponse, generateConversationTitle } from "./openai";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found. Stripe functionality will be disabled.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
}) : null;

// Helper functions to determine plan from price ID
function determinePlanFromPriceId(priceId: string): string {
  if (priceId.includes('starter')) return 'starter';
  if (priceId.includes('pro')) return 'pro';
  if (priceId.includes('agency')) return 'agency';
  return 'starter'; // fallback
}

function determineBillingFromPriceId(priceId: string): string {
  if (priceId.includes('monthly')) return 'monthly';
  if (priceId.includes('yearly')) return 'yearly';
  return 'monthly'; // fallback
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupFirebaseAuth(app);

  // Auth routes are now handled in setupFirebaseAuth

  // Stripe payment routes
  if (stripe) {
    // Create subscription
    app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { priceId, planName, billing } = req.body;
        
        if (!priceId || !planName) {
          return res.status(400).json({ message: 'Price ID and plan name are required' });
        }

        let user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Check if user already has a subscription
        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
            expand: ['latest_invoice.payment_intent']
          });
          const latestInvoice = subscription.latest_invoice as any;
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: latestInvoice?.payment_intent?.client_secret,
          });
        }

        if (!user.email) {
          return res.status(400).json({ message: 'User email required for subscription' });
        }

        // Create Stripe customer if doesn't exist
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          });
          customerId = customer.id;
          
          // Update user with customer ID
          await storage.updateUserStripeInfo(userId, customerId, '');
        }

        // Create subscription requiring immediate payment
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            price: priceId,
          }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice'],
        });

        // Update user with subscription ID and plan information
        await storage.updateUserStripeInfo(userId, customerId, subscription.id);
        
        // Also update the subscription plan based on the checkout parameters
        const planFromPrice = determinePlanFromPriceId(priceId);
        const billingFromPrice = determineBillingFromPriceId(priceId);
        await storage.updateUserSubscription(userId, planFromPrice, 'active', billingFromPrice);

        const latestInvoice = subscription.latest_invoice as any;
        let clientSecret = latestInvoice?.payment_intent?.client_secret;
        
        console.log('Subscription created:', {
          subscriptionId: subscription.id,
          hasLatestInvoice: !!latestInvoice,
          invoiceId: latestInvoice?.id,
          invoiceStatus: latestInvoice?.status,
          hasPaymentIntent: !!latestInvoice?.payment_intent,
          hasClientSecret: !!clientSecret
        });
        
        // If no payment intent exists, create one for the invoice
        if (!clientSecret && latestInvoice && latestInvoice.status === 'open') {
          console.log('Creating payment intent for invoice:', latestInvoice.id);
          const paymentIntent = await stripe.paymentIntents.create({
            amount: latestInvoice.amount_due,
            currency: latestInvoice.currency,
            customer: customerId,
            metadata: {
              invoice_id: latestInvoice.id,
              subscription_id: subscription.id,
            },
            automatic_payment_methods: {
              enabled: true,
            },
          });
          clientSecret = paymentIntent.client_secret;
          console.log('Payment intent created:', paymentIntent.id, 'with client secret');
        }
        
        if (!clientSecret) {
          console.error('No client secret found after payment intent creation');
          return res.status(500).json({ message: 'Failed to create payment intent' });
        }
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: clientSecret,
        });
      } catch (error: any) {
        console.error('Subscription creation error:', error);
        res.status(500).json({ message: error.message });
      }
    });

    // Get subscription status
    app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({
          plan: user.subscriptionPlan || null,
          status: user.subscriptionStatus || null,
          hasStripeSubscription: !!user.stripeSubscriptionId,
          hasSelectedPlan: !!(user.subscriptionPlan && user.subscriptionPlan !== '' && user.subscriptionPlan !== null)
        });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Failed to fetch subscription' });
      }
    });

    // Stripe webhook to handle successful payments
    app.post('/api/webhook/stripe', async (req, res) => {
      if (!stripe) {
        return res.status(400).json({ message: 'Stripe not configured' });
      }

      try {
        const signature = req.headers['stripe-signature'] as string;
        let event;

        try {
          event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
        } catch (err: any) {
          console.error('Webhook signature verification failed:', err.message);
          return res.status(400).json({ message: 'Invalid signature' });
        }

        if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
          const session = event.data.object as any;
          const customerId = session.customer;
          
          // Find user by Stripe customer ID
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            // Update user subscription status to active
            await storage.updateUserSubscription(user.id, user.subscriptionPlan || 'starter', 'active', user.subscriptionBilling || 'monthly');
          }
        }

        res.json({ received: true });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook error' });
      }
    });

    // Plan selection route
    app.post('/api/select-plan', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { plan, billing } = req.body;

        if (!plan || !billing) {
          return res.status(400).json({ message: 'Plan and billing are required' });
        }

        // Update user subscription plan
        await storage.updateUserSubscription(userId, plan, 'active', billing);
        
        res.json({ success: true, plan, billing });
      } catch (error) {
        console.error('Error selecting plan:', error);
        res.status(500).json({ message: 'Failed to select plan' });
      }
    });
  }

  // Conversation routes (require payment plan)
  app.get('/api/conversations', isAuthenticated, requiresPlan, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/conversations', isAuthenticated, requiresPlan, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title } = req.body;
      
      const conversationData = {
        userId,
        title: title || 'New Conversation',
      };

      const result = insertConversationSchema.safeParse(conversationData);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid conversation data' });
      }

      const conversation = await storage.createConversation(result.data);
      res.json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  // Message routes (require payment plan)
  app.get('/api/conversations/:id/messages', isAuthenticated, requiresPlan, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, requiresPlan, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      const { content, role = 'user' } = req.body;
      
      const messageData = {
        conversationId,
        content,
        role,
      };

      const result = insertMessageSchema.safeParse(messageData);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid message data' });
      }

      const message = await storage.createMessage(result.data);

      // If it's a user message, generate an AI response
      if (role === 'user') {
        try {
          // Get conversation history for context
          const existingMessages = await storage.getMessages(conversationId);
          const conversationHistory = existingMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          // Generate AI response using OpenAI
          const aiResponse = await generateTravelAdvisorResponse(content, conversationHistory);
          const aiMessageData = {
            conversationId,
            content: aiResponse,
            role: 'assistant',
          };

          const aiMessage = await storage.createMessage(aiMessageData);
          
          // Auto-generate conversation title if this is the first user message
          if (conversationHistory.length <= 1) {
            try {
              const newTitle = await generateConversationTitle(content);
              await storage.updateConversationTitle(conversationId, newTitle);
            } catch (error) {
              console.error('Error generating conversation title:', error);
              // Continue without updating title if it fails
            }
          }
          
          res.json([message, aiMessage]);
        } catch (error) {
          console.error('Error generating AI response:', error);
          // Fallback response if AI fails
          const fallbackResponse = "I'm experiencing technical difficulties right now. Please try your question again in a moment.";
          const aiMessageData = {
            conversationId,
            content: fallbackResponse,
            role: 'assistant',
          };
          const aiMessage = await storage.createMessage(aiMessageData);
          res.json([message, aiMessage]);
        }
      } else {
        res.json([message]);
      }
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  // Get user's total message count (for starter plan limits)
  app.get("/api/user/message-count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const messageCount = await storage.getUserMessageCount(userId);
      res.json(messageCount);
    } catch (error) {
      console.error("Error fetching user message count:", error);
      res.status(500).json({ message: "Failed to fetch message count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
