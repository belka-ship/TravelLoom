import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.VITE_FIREBASE_PROJECT_ID) {
    console.error("Missing Firebase Admin SDK environment variables:", {
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasProjectId: !!process.env.VITE_FIREBASE_PROJECT_ID
    });
    throw new Error("Missing Firebase Admin SDK environment variables");
  }

  console.log("Initializing Firebase Admin SDK...");
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  console.log("Firebase Admin SDK initialized successfully");
}

export async function setupFirebaseAuth(app: Express) {
  // Sync user with backend after Firebase authentication
  app.post("/api/auth/sync", async (req, res) => {
    try {
      console.log("Auth sync request received:", req.body);
      const { idToken, uid, email, displayName, photoURL } = req.body;
      
      if (!idToken) {
        console.error("Missing ID token in sync request");
        return res.status(400).json({ error: "Missing ID token" });
      }

      // Verify Firebase ID token
      try {
        console.log("Verifying Firebase ID token...");
        const decodedToken = await getAuth().verifyIdToken(idToken);
        console.log("Token verified successfully for user:", decodedToken.uid);
        
        if (decodedToken.uid !== uid) {
          console.error("UID mismatch in token verification");
          return res.status(401).json({ error: "Invalid token" });
        }
      } catch (error) {
        console.error("Firebase token verification failed:", error);
        return res.status(401).json({ error: "Invalid token" });
      }

      console.log("Upserting user:", { uid, email, displayName });

      // Upsert user in database
      const user = await storage.upsertUser({
        id: uid,
        email: email || null,
        firstName: displayName?.split(" ")[0] || null,
        lastName: displayName?.split(" ").slice(1).join(" ") || null,
        profileImageUrl: photoURL || null,
      });

      // Store user ID in session for backend route protection
      req.session.userId = uid;
      console.log("User synced successfully, session created for:", uid);

      // Check if this is a new user (created within the last minute) to determine if we should redirect to pricing
      const isNewUser = user.createdAt && 
        (new Date().getTime() - new Date(user.createdAt).getTime()) < 60000; // Less than 1 minute old

      res.json({ success: true, user, isNewUser });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Add user to request object for use in routes
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};