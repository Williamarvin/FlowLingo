import type { Express } from "express";
import { storage } from "./storage";

export function registerRewardsRoutes(app: Express) {
  // Get user's reward profile (stats and current mascot)
  app.get("/api/rewards/profile", async (req, res) => {
    const userId = req.session?.userId || "demo-user";
    
    try {
      const profile = await storage.getUserRewardProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching reward profile:", error);
      res.status(500).json({ error: "Failed to fetch reward profile" });
    }
  });
  
  // Get all rewards with user's earned status
  app.get("/api/rewards", async (req, res) => {
    const userId = req.session?.userId || "demo-user";
    
    try {
      const rewards = await storage.getRewardsWithUserStatus(userId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });
  
  // Change user's mascot
  app.post("/api/rewards/change-mascot", async (req, res) => {
    const userId = req.session?.userId || "demo-user";
    const { rewardId } = req.body;
    
    if (!rewardId) {
      return res.status(400).json({ error: "Reward ID is required" });
    }
    
    try {
      const result = await storage.changeMascot(userId, rewardId);
      res.json(result);
    } catch (error) {
      console.error("Error changing mascot:", error);
      res.status(500).json({ error: "Failed to change mascot" });
    }
  });
  
  // Mark rewards as seen (remove NEW badge)
  app.post("/api/rewards/mark-seen", async (req, res) => {
    const userId = req.session?.userId || "demo-user";
    
    try {
      await storage.markRewardsAsSeen(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking rewards as seen:", error);
      res.status(500).json({ error: "Failed to mark rewards as seen" });
    }
  });
  
  // Grant reward to user (internal use for when level is completed)
  app.post("/api/rewards/grant", async (req, res) => {
    const userId = req.session?.userId || "demo-user";
    const { rewardId } = req.body;
    
    if (!rewardId) {
      return res.status(400).json({ error: "Reward ID is required" });
    }
    
    try {
      const result = await storage.grantReward(userId, rewardId);
      res.json(result);
    } catch (error) {
      console.error("Error granting reward:", error);
      res.status(500).json({ error: "Failed to grant reward" });
    }
  });
  
  // Add XP to user from various activities
  app.post("/api/xp/add", async (req, res) => {
    const userId = req.session?.userId || "demo-user";
    const { amount, source, sourceId, description } = req.body;
    
    if (!amount || !source) {
      return res.status(400).json({ error: "Amount and source are required" });
    }
    
    try {
      const result = await storage.addXpTransaction(userId, amount, source, sourceId, description);
      res.json(result);
    } catch (error) {
      console.error("Error adding XP:", error);
      res.status(500).json({ error: "Failed to add XP" });
    }
  });
}