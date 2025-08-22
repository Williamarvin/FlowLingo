import type { Express } from "express";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import { 
  ANIMAL_STICKERS, 
  rollRandomSticker, 
  shouldAwardLootBox, 
  generateLootBoxContents 
} from "./stickerSystem";

export function registerRewardsRoutes(app: Express) {
  // Get user's reward profile (stats and current mascot)
  app.get("/api/rewards/profile", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    
    try {
      const profile = await storage.getUserRewardProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching reward profile:", error);
      res.status(500).json({ error: "Failed to fetch reward profile" });
    }
  });
  
  // Get all rewards with user's earned status
  app.get("/api/rewards", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    
    try {
      const rewards = await storage.getRewardsWithUserStatus(userId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });
  
  // Change user's mascot
  app.post("/api/rewards/change-mascot", requireAuth, async (req: any, res) => {
    const userId = req.userId;
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
  app.post("/api/rewards/mark-seen", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    
    try {
      await storage.markRewardsAsSeen(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking rewards as seen:", error);
      res.status(500).json({ error: "Failed to mark rewards as seen" });
    }
  });
  
  // Grant reward to user (internal use for when level is completed)
  app.post("/api/rewards/grant", requireAuth, async (req: any, res) => {
    const userId = req.userId;
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
  app.post("/api/xp/add", requireAuth, async (req: any, res) => {
    const userId = req.userId;
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

  // Get all available animal stickers with probabilities
  app.get("/api/stickers/catalog", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const userStickers = await storage.getUserStickers(userId);
      
      const catalog = ANIMAL_STICKERS.map(sticker => ({
        ...sticker,
        collected: userStickers.some(us => us.stickerId === sticker.id),
        count: userStickers.filter(us => us.stickerId === sticker.id).length
      }));
      
      res.json(catalog);
    } catch (error) {
      console.error("Error fetching sticker catalog:", error);
      res.status(500).json({ error: "Failed to fetch sticker catalog" });
    }
  });

  // Open a loot box and get random stickers
  app.post("/api/stickers/open-lootbox", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    const { event = 'manual_open' } = req.body;
    
    try {
      // Generate loot box contents
      const stickers = generateLootBoxContents(event);
      
      // Award stickers to user
      const awarded = [];
      for (const sticker of stickers) {
        await storage.awardSticker(userId, sticker.id);
        awarded.push(sticker);
      }
      
      res.json({ 
        success: true, 
        stickers: awarded,
        message: `You received ${awarded.length} sticker${awarded.length > 1 ? 's' : ''}!`
      });
    } catch (error) {
      console.error("Error opening loot box:", error);
      res.status(500).json({ error: "Failed to open loot box" });
    }
  });

  // Check if user should get a loot box for an event
  app.post("/api/stickers/check-lootbox", async (req, res) => {
    const { event } = req.body;
    
    if (!event) {
      return res.status(400).json({ error: "Event is required" });
    }
    
    const shouldAward = shouldAwardLootBox(event);
    res.json({ shouldAward, event });
  });

  // Get user's collected stickers
  app.get("/api/stickers/collection", async (req, res) => {
    const userId = req.session?.userId || "demo-user";
    
    try {
      const stickers = await storage.getUserStickers(userId);
      res.json(stickers);
    } catch (error) {
      console.error("Error fetching user stickers:", error);
      res.status(500).json({ error: "Failed to fetch user stickers" });
    }
  });
}