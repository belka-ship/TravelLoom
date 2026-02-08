import {
  users,
  conversations,
  messages,
  type User,
  type UpsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserSubscription(userId: string, plan: string, status: string, billing?: string): Promise<User>;
  hasSelectedPlan(userId: string): Promise<boolean>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversationTitle(id: number, title: string): Promise<Conversation>;
  
  // Message operations
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getUserMessageCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to find existing user by ID
      const existingUser = await this.getUser(userData.id);
      
      if (existingUser) {
        console.log(`User ${userData.id} exists, updating...`);
        // User exists with this ID, update it
        const [user] = await db
          .update(users)
          .set({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return user;
      }
      
      console.log(`Creating new user ${userData.id}...`);
      // User doesn't exist with this ID, try to insert
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          subscriptionPlan: null, // Ensure new users don't have a plan
          subscriptionStatus: null,
          subscriptionBilling: null,
        })
        .returning();
      return user;
    } catch (error: any) {
      // If email constraint violation, find user with same email and update their ID
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        console.log(`Email ${userData.email} already exists, updating user ID...`);
        
        // Find user with this email
        const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email || ''));
        
        if (existingUser) {
          // Update the existing user's ID and other fields, but preserve subscription info
          const [user] = await db
            .update(users)
            .set({
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              profileImageUrl: userData.profileImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.email, userData.email || ''))
            .returning();
          return user;
        }
      }
      
      // If it's a primary key constraint violation, this is a different user with the same ID
      // This shouldn't happen with proper Firebase UIDs, but let's handle it gracefully
      if (error.code === '23505' && error.constraint === 'users_pkey') {
        console.log(`User ID ${userData.id} already exists but with different email. This is unexpected.`);
        throw new Error('User ID conflict - please try signing in again');
      }
      
      throw error;
    }
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, plan: string, status: string, billing?: string): Promise<User> {
    const updateData: any = {
      subscriptionPlan: plan,
      subscriptionStatus: status,
      updatedAt: new Date(),
    };
    
    if (billing) {
      updateData.subscriptionBilling = billing;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async hasSelectedPlan(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    // Only consider Pro and Agency plans as "selected plans" for chat access
    // Starter plan users need to go through additional verification
    return !!(user && user.subscriptionPlan && user.subscriptionPlan !== '' && user.subscriptionPlan !== 'starter');
  }

  // Conversation operations
  async getConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversationTitle(id: number, title: string): Promise<Conversation> {
    const [conversation] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  // Message operations
  async getMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getUserMessageCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(conversations.userId, userId), eq(messages.role, 'user')));
    
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
