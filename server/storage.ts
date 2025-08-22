import { type User, type InsertUser, type VocabularyWord, type InsertVocabularyWord, type Conversation, type InsertConversation, type GeneratedText, type InsertGeneratedText, type MediaDocument, type InsertMediaDocument, type PdfDocument, type InsertPdfDocument } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id?: string }): Promise<User>;
  
  getVocabularyWords(userId: string): Promise<VocabularyWord[]>;
  getVocabularyWordsDue(userId: string): Promise<VocabularyWord[]>;
  createVocabularyWord(word: InsertVocabularyWord): Promise<VocabularyWord>;
  updateVocabularyWord(id: string, updates: Partial<VocabularyWord>): Promise<VocabularyWord | undefined>;
  deleteVocabularyWord(id: string): Promise<boolean>;
  
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  
  getGeneratedTexts(userId: string): Promise<GeneratedText[]>;
  createGeneratedText(text: InsertGeneratedText): Promise<GeneratedText>;
  
  // Media document methods
  getMediaDocuments(userId: string): Promise<MediaDocument[]>;
  createMediaDocument(document: InsertMediaDocument): Promise<MediaDocument>;
  getMediaDocument(id: string): Promise<MediaDocument | undefined>;
  updateMediaDocument(id: string, updates: Partial<MediaDocument>): Promise<MediaDocument | undefined>;
  deleteMediaDocument(id: string): Promise<boolean>;
  
  // Legacy PDF methods (for backward compatibility)
  getPdfDocuments(userId: string): Promise<PdfDocument[]>;
  createPdfDocument(document: InsertPdfDocument): Promise<PdfDocument>;
}

export interface IStorageExtended extends IStorage {
  // User progress methods
  updateUserProgress(userId: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserStreak(userId: string): Promise<User | undefined>;
  addXpToUser(userId: string, xp: number): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  
  // Assessment methods
  getAssessmentQuestions(difficulty?: number): Promise<any[]>;
  saveAssessmentResult(result: any): Promise<any>;
  getAssessmentResult(userId: string): Promise<any | undefined>;
  
  // Practice session methods
  createPracticeSession(session: any): Promise<any>;
  getPracticeSessions(userId: string): Promise<any[]>;
  
  // Achievement methods
  getAchievements(): Promise<any[]>;
  getUserAchievements(userId: string): Promise<any[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<any>;
  
  // Practice progress methods
  getPracticeProgress(userId: string, level: number): Promise<any | undefined>;
  savePracticeProgress(userId: string, level: number, progress: any): Promise<any>;
  clearPracticeProgress(userId: string, level: number): Promise<boolean>;
  
  // Flashcard methods
  getFlashcards(userId: string, filter: string): Promise<any[]>;
  createFlashcard(flashcard: any): Promise<any>;
  updateFlashcardReview(id: string, correct: boolean): Promise<any>;
  deleteFlashcard(id: string): Promise<boolean>;
  
  // Rewards methods
  getAllRewards(): Promise<any[]>;
  getUserRewards(userId: string): Promise<any[]>;
  getRewardsWithUserStatus(userId: string): Promise<any[]>;
  grantReward(userId: string, rewardId: string): Promise<any>;
  markRewardsAsSeen(userId: string): Promise<void>;
  
  // Mascot methods
  getUserMascot(userId: string): Promise<any | undefined>;
  updateUserMascot(userId: string, mascot: string): Promise<User | undefined>;
  changeMascot(userId: string, rewardId: string): Promise<any>;
  
  // Practice level methods
  getPracticeLevel(userId: string): Promise<any | undefined>;
  updatePracticeLevel(userId: string, xp: number, levelCompleted?: number): Promise<any>;
  
  // XP transaction methods
  addXpTransaction(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<any>;
  getUserRewardProfile(userId: string): Promise<any>;
  
  // Sticker methods
  getUserStickers(userId: string): Promise<any[]>;
  awardSticker(userId: string, stickerId: string): Promise<any>;
  awardLevelUpStickers(userId: string, oldLevel: number, newLevel: number): Promise<void>;
}

export class DatabaseStorage implements IStorageExtended {
  async getUser(id: string): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser & { id?: string }): Promise<User> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    
    // Generate a unique ID if not provided
    const userData: any = {
      ...insertUser,
      id: insertUser.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserProgress(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStreak(userId: string): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    
    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate?.toString();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = user.streakDays;
    if (lastActive === yesterday) {
      newStreak = user.streakDays + 1;
    } else if (lastActive !== today) {
      newStreak = 1;
    }
    
    const [updatedUser] = await db.update(users)
      .set({ 
        streakDays: newStreak,
        lastActiveDate: sql`CURRENT_DATE`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  async addXpToUser(userId: string, xp: number): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    
    const newXp = user.xp + xp;
    let newLevel = user.level;
    let newXpToNextLevel = user.xpToNextLevel;
    const oldLevel = user.level;
    
    // Check for level up
    if (newXp >= user.xpToNextLevel) {
      newLevel = user.level + 1;
      newXpToNextLevel = user.xpToNextLevel + (50 * newLevel); // Progressive XP requirement
      
      // Award stickers for level milestones
      await this.awardLevelUpStickers(userId, oldLevel, newLevel);
    }
    
    const [updatedUser] = await db.update(users)
      .set({ 
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNextLevel,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updatedUser] = await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  async getVocabularyWords(userId: string): Promise<VocabularyWord[]> {
    const { db } = await import("./db");
    const { vocabularyWords } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(vocabularyWords).where(eq(vocabularyWords.userId, userId));
  }

  async getVocabularyWordsDue(userId: string): Promise<VocabularyWord[]> {
    const { db } = await import("./db");
    const { vocabularyWords } = await import("@shared/schema");
    const { eq, lte } = await import("drizzle-orm");
    
    return await db.select()
      .from(vocabularyWords)
      .where(eq(vocabularyWords.userId, userId));
  }

  async createVocabularyWord(word: InsertVocabularyWord): Promise<VocabularyWord> {
    const { db } = await import("./db");
    const { vocabularyWords } = await import("@shared/schema");
    
    const [newWord] = await db.insert(vocabularyWords).values(word).returning();
    return newWord;
  }

  async updateVocabularyWord(id: string, updates: Partial<VocabularyWord>): Promise<VocabularyWord | undefined> {
    const { db } = await import("./db");
    const { vocabularyWords } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(vocabularyWords)
      .set(updates)
      .where(eq(vocabularyWords.id, id))
      .returning();
    return updated;
  }

  async deleteVocabularyWord(id: string): Promise<boolean> {
    const { db } = await import("./db");
    const { vocabularyWords } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.delete(vocabularyWords).where(eq(vocabularyWords.id, id));
    return true;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const { db } = await import("./db");
    const { conversations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(conversations).where(eq(conversations.userId, userId));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const { db } = await import("./db");
    const { conversations } = await import("@shared/schema");
    
    const [newConv] = await db.insert(conversations).values(conversation).returning();
    return newConv;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const { db } = await import("./db");
    const { conversations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getGeneratedTexts(userId: string): Promise<GeneratedText[]> {
    const { db } = await import("./db");
    const { generatedTexts } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(generatedTexts).where(eq(generatedTexts.userId, userId));
  }

  async createGeneratedText(text: InsertGeneratedText): Promise<GeneratedText> {
    const { db } = await import("./db");
    const { generatedTexts } = await import("@shared/schema");
    
    const [newText] = await db.insert(generatedTexts).values(text).returning();
    return newText;
  }

  async getPdfDocuments(userId: string): Promise<PdfDocument[]> {
    const { db } = await import("./db");
    const { pdfDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(pdfDocuments).where(eq(pdfDocuments.userId, userId));
  }

  async getMediaDocuments(userId: string): Promise<MediaDocument[]> {
    const { db } = await import("./db");
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(mediaDocuments).where(eq(mediaDocuments.userId, userId));
  }

  async createMediaDocument(document: InsertMediaDocument): Promise<MediaDocument> {
    const { db } = await import("./db");
    const { mediaDocuments } = await import("@shared/schema");
    
    const [newDoc] = await db.insert(mediaDocuments).values(document).returning();
    return newDoc;
  }

  async getMediaDocument(id: string): Promise<MediaDocument | undefined> {
    const { db } = await import("./db");
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [doc] = await db.select().from(mediaDocuments).where(eq(mediaDocuments.id, id));
    return doc;
  }

  async updateMediaDocument(id: string, updates: Partial<MediaDocument>): Promise<MediaDocument | undefined> {
    const { db } = await import("./db");
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(mediaDocuments)
      .set(updates)
      .where(eq(mediaDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteMediaDocument(id: string): Promise<boolean> {
    const { db } = await import("./db");
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(mediaDocuments).where(eq(mediaDocuments.id, id));
    return true;
  }

  async createPdfDocument(document: InsertPdfDocument): Promise<PdfDocument> {
    const { db } = await import("./db");
    const { pdfDocuments } = await import("@shared/schema");
    
    const [newDoc] = await db.insert(pdfDocuments).values(document).returning();
    return newDoc;
  }

  async getAssessmentQuestions(difficulty?: number): Promise<any[]> {
    const { db } = await import("./db");
    const { assessmentQuestions } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    if (difficulty) {
      return await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.difficulty, difficulty));
    }
    return await db.select().from(assessmentQuestions);
  }

  async saveAssessmentResult(result: any): Promise<any> {
    const { db } = await import("./db");
    const { assessmentResults } = await import("@shared/schema");
    
    const [newResult] = await db.insert(assessmentResults).values(result).returning();
    return newResult;
  }

  async getAssessmentResult(userId: string): Promise<any | undefined> {
    const { db } = await import("./db");
    const { assessmentResults } = await import("@shared/schema");
    const { eq, desc } = await import("drizzle-orm");
    
    const [result] = await db.select()
      .from(assessmentResults)
      .where(eq(assessmentResults.userId, userId))
      .orderBy(desc(assessmentResults.completedAt))
      .limit(1);
    return result;
  }

  async createPracticeSession(session: any): Promise<any> {
    const { db } = await import("./db");
    const { practiceSessions } = await import("@shared/schema");
    
    const [newSession] = await db.insert(practiceSessions).values(session).returning();
    return newSession;
  }

  async getPracticeSessions(userId: string): Promise<any[]> {
    const { db } = await import("./db");
    const { practiceSessions } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(practiceSessions).where(eq(practiceSessions.userId, userId));
  }

  async getAchievements(): Promise<any[]> {
    const { db } = await import("./db");
    const { achievements } = await import("@shared/schema");
    
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const { db } = await import("./db");
    const { userAchievements, achievements } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select()
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<any> {
    const { db } = await import("./db");
    const { userAchievements } = await import("@shared/schema");
    
    const [newAchievement] = await db.insert(userAchievements)
      .values({ userId, achievementId })
      .returning();
    return newAchievement;
  }

  async getPracticeProgress(userId: string, level: number): Promise<any | undefined> {
    const { db } = await import("./db");
    const { practiceProgress } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [progress] = await db.select()
      .from(practiceProgress)
      .where(and(
        eq(practiceProgress.userId, userId),
        eq(practiceProgress.level, level)
      ));
    return progress;
  }

  async savePracticeProgress(userId: string, level: number, progress: any): Promise<any> {
    const { db } = await import("./db");
    const { practiceProgress } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    // Check if progress exists
    const existing = await this.getPracticeProgress(userId, level);
    
    if (existing) {
      // Update existing progress
      const [updated] = await db.update(practiceProgress)
        .set({
          currentQuestion: progress.currentQuestion,
          correctAnswers: progress.correctAnswers,
          incorrectAnswers: progress.incorrectAnswers,
          answeredQuestions: progress.answeredQuestions,
          lastUpdated: new Date()
        })
        .where(and(
          eq(practiceProgress.userId, userId),
          eq(practiceProgress.level, level)
        ))
        .returning();
      return updated;
    } else {
      // Create new progress
      const [created] = await db.insert(practiceProgress)
        .values({
          userId,
          level,
          currentQuestion: progress.currentQuestion,
          correctAnswers: progress.correctAnswers,
          incorrectAnswers: progress.incorrectAnswers,
          answeredQuestions: progress.answeredQuestions
        })
        .returning();
      return created;
    }
  }

  async clearPracticeProgress(userId: string, level: number): Promise<boolean> {
    const { db } = await import("./db");
    const { practiceProgress } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    await db.delete(practiceProgress)
      .where(and(
        eq(practiceProgress.userId, userId),
        eq(practiceProgress.level, level)
      ));
    return true;
  }

  async getFlashcards(userId: string, filter: string): Promise<any[]> {
    const { db } = await import("./db");
    const { flashcards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    let query = db.select().from(flashcards).where(eq(flashcards.userId, userId));
    
    if (filter !== "all") {
      query = query.where(eq(flashcards.source, filter));
    }
    
    return await query;
  }

  async createFlashcard(flashcard: any): Promise<any> {
    const { db } = await import("./db");
    const { flashcards } = await import("@shared/schema");
    
    // Check if flashcard already exists for this user and word
    const { eq, and } = await import("drizzle-orm");
    const existing = await db.select()
      .from(flashcards)
      .where(and(
        eq(flashcards.userId, flashcard.userId),
        eq(flashcards.chinese, flashcard.chinese)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [created] = await db.insert(flashcards)
      .values({
        ...flashcard,
        timesReviewed: 0,
        timesCorrect: 0,
        timesWrong: 0,
      })
      .returning();
    return created;
  }

  async updateFlashcardReview(id: string, correct: boolean): Promise<any> {
    const { db } = await import("./db");
    const { flashcards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    if (!card) return null;
    
    const updates = {
      timesReviewed: card.timesReviewed + 1,
      timesCorrect: correct ? card.timesCorrect + 1 : card.timesCorrect,
      timesWrong: correct ? card.timesWrong : card.timesWrong + 1,
      lastReviewed: new Date(),
    };
    
    const [updated] = await db.update(flashcards)
      .set(updates)
      .where(eq(flashcards.id, id))
      .returning();
    return updated;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    const { db } = await import("./db");
    const { flashcards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(flashcards).where(eq(flashcards.id, id));
    return true;
  }
  
  // Sticker methods
  async getUserStickers(userId: string): Promise<any[]> {
    const { db } = await import("./db");
    const { userRewards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const stickers = await db.select().from(userRewards)
      .where(eq(userRewards.userId, userId));
    
    const stickerArray = stickers.map(s => ({
      stickerId: s.rewardId,
      earnedAt: s.earnedAt,
      isNew: s.isNew
    }));
    
    // Everyone gets the dolphin sticker by default
    const hasDolphin = stickerArray.some(s => s.stickerId === 'dolphin');
    if (!hasDolphin) {
      stickerArray.push({
        stickerId: 'dolphin',
        earnedAt: new Date(),
        isNew: false
      });
    }
    
    return stickerArray;
  }
  
  async awardSticker(userId: string, stickerId: string): Promise<any> {
    const { db } = await import("./db");
    const { userRewards } = await import("@shared/schema");
    
    // Award the sticker (can have duplicates)
    const [newSticker] = await db.insert(userRewards).values({
      userId,
      rewardId: stickerId,
      isNew: true,
      equipped: false
    }).returning();
    
    return newSticker;
  }
  
  async awardLevelUpStickers(userId: string, oldLevel: number, newLevel: number): Promise<void> {
    const stickerCatalog = await import("./stickerSystem");
    
    const stickersToAward: string[] = [];
    
    // HSK level transitions (every 10 levels marks a new HSK level)
    const hskTransitions = [11, 21, 31, 41, 51]; // Moving from HSK1→2, HSK2→3, etc.
    
    // Check each level between old and new (in case of multiple level-ups)
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      // Major milestones: 25, 50, 75, 100 - Get 3 stickers with guaranteed rare or better
      if (level === 25 || level === 50 || level === 75 || level === 100) {
        for (let i = 0; i < 3; i++) {
          const rareStickers = stickerCatalog.ANIMAL_STICKERS.filter(s => 
            s.rarity === 'rare' || s.rarity === 'epic' || s.rarity === 'legendary'
          );
          const randomSticker = rareStickers[Math.floor(Math.random() * rareStickers.length)];
          stickersToAward.push(randomSticker.id);
        }
        console.log(`Level ${level} major milestone reached! Awarding 3 rare+ stickers`);
      }
      // HSK level transitions - Get guaranteed epic or legendary
      else if (hskTransitions.includes(level)) {
        const epicOrLegendary = stickerCatalog.ANIMAL_STICKERS.filter(s => 
          s.rarity === 'epic' || s.rarity === 'legendary'
        );
        const randomSticker = epicOrLegendary[Math.floor(Math.random() * epicOrLegendary.length)];
        stickersToAward.push(randomSticker.id);
        const hskLevel = Math.floor(level / 10) + 1;
        console.log(`HSK ${hskLevel - 1} → HSK ${hskLevel} transition! Awarding epic+ sticker`);
      }
      // Every 10 levels - Get 2 stickers with better odds
      else if (level % 10 === 0) {
        for (let i = 0; i < 2; i++) {
          const roll = Math.random() * 100;
          let selectedRarity: string;
          if (roll < 30) selectedRarity = 'uncommon';
          else if (roll < 60) selectedRarity = 'rare';
          else if (roll < 85) selectedRarity = 'epic';
          else selectedRarity = 'legendary';
          
          const stickersOfRarity = stickerCatalog.ANIMAL_STICKERS.filter(s => s.rarity === selectedRarity);
          const randomSticker = stickersOfRarity[Math.floor(Math.random() * stickersOfRarity.length)];
          stickersToAward.push(randomSticker.id);
        }
        console.log(`Level ${level} (multiple of 10) reached! Awarding 2 stickers with better odds`);
      }
      // Every 3 levels - Get 1 random sticker
      else if (level % 3 === 0) {
        const roll = Math.random() * 100;
        let selectedRarity: string;
        if (roll < 60) selectedRarity = 'common';
        else if (roll < 85) selectedRarity = 'uncommon';
        else if (roll < 95) selectedRarity = 'rare';
        else if (roll < 99) selectedRarity = 'epic';
        else selectedRarity = 'legendary';
        
        const stickersOfRarity = stickerCatalog.ANIMAL_STICKERS.filter(s => s.rarity === selectedRarity);
        const randomSticker = stickersOfRarity[Math.floor(Math.random() * stickersOfRarity.length)];
        stickersToAward.push(randomSticker.id);
        console.log(`Level ${level} (multiple of 3) reached! Awarding 1 sticker`);
      }
    }
    
    // Award all the stickers
    for (const stickerId of stickersToAward) {
      try {
        await this.awardSticker(userId, stickerId);
      } catch (error) {
        console.error(`Error awarding sticker ${stickerId}:`, error);
      }
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vocabularyWords: Map<string, VocabularyWord>;
  private conversations: Map<string, Conversation>;
  private generatedTexts: Map<string, GeneratedText>;
  private pdfDocuments: Map<string, PdfDocument>;

  constructor() {
    this.users = new Map();
    this.vocabularyWords = new Map();
    this.conversations = new Map();
    this.generatedTexts = new Map();
    this.pdfDocuments = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getVocabularyWords(userId: string): Promise<VocabularyWord[]> {
    const words = Array.from(this.vocabularyWords.values()).filter(
      word => word.userId === userId
    );
    
    // Add sample words if empty for demonstration
    if (words.length === 0) {
      const sampleWords = [
        {
          id: "1",
          userId: userId,
          character: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
          hskLevel: 1,
          difficulty: "new",
          successRate: 0,
          timesReviewed: 0,
          nextReview: new Date(),
          createdAt: new Date()
        },
        {
          id: "2",
          userId: userId,
          character: "谢谢",
          pinyin: "xiè xiè",
          english: "thank you",
          hskLevel: 1,
          difficulty: "new",
          successRate: 0,
          timesReviewed: 0,
          nextReview: new Date(),
          createdAt: new Date()
        },
        {
          id: "3",
          userId: userId,
          character: "学习",
          pinyin: "xué xí",
          english: "to study, to learn",
          hskLevel: 2,
          difficulty: "new",
          successRate: 0,
          timesReviewed: 0,
          nextReview: new Date(),
          createdAt: new Date()
        },
        {
          id: "4",
          userId: userId,
          character: "朋友",
          pinyin: "péng yǒu",
          english: "friend",
          hskLevel: 2,
          difficulty: "new",
          successRate: 0,
          timesReviewed: 0,
          nextReview: new Date(),
          createdAt: new Date()
        },
        {
          id: "5",
          userId: userId,
          character: "中国",
          pinyin: "zhōng guó",
          english: "China",
          hskLevel: 1,
          difficulty: "new",
          successRate: 0,
          timesReviewed: 0,
          nextReview: new Date(),
          createdAt: new Date()
        }
      ];
      
      // Add to storage
      sampleWords.forEach(word => {
        this.vocabularyWords.set(word.id, word);
      });
      
      return sampleWords;
    }
    
    return words;
  }

  async getVocabularyWordsDue(userId: string): Promise<VocabularyWord[]> {
    const allWords = await this.getVocabularyWords(userId);
    const now = new Date();
    return allWords.filter(word => 
      word.nextReview && new Date(word.nextReview) <= now
    );
  }

  async createVocabularyWord(insertWord: InsertVocabularyWord): Promise<VocabularyWord> {
    const id = randomUUID();
    const word: VocabularyWord = {
      ...insertWord,
      id,
      createdAt: new Date(),
      nextReview: new Date(),
      difficulty: insertWord.difficulty || "new",
      hskLevel: insertWord.hskLevel || 1,
      successRate: insertWord.successRate || 0,
      timesReviewed: insertWord.timesReviewed || 0,
    };
    this.vocabularyWords.set(id, word);
    return word;
  }

  async updateVocabularyWord(id: string, updates: Partial<VocabularyWord>): Promise<VocabularyWord | undefined> {
    const existing = this.vocabularyWords.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.vocabularyWords.set(id, updated);
    return updated;
  }

  async deleteVocabularyWord(id: string): Promise<boolean> {
    return this.vocabularyWords.delete(id);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      conv => conv.userId === userId
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: new Date(),
      messages: insertConversation.messages || [],
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const existing = this.conversations.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.conversations.set(id, updated);
    return updated;
  }

  async getGeneratedTexts(userId: string): Promise<GeneratedText[]> {
    return Array.from(this.generatedTexts.values()).filter(
      text => text.userId === userId
    );
  }

  async createGeneratedText(insertText: InsertGeneratedText): Promise<GeneratedText> {
    const id = randomUUID();
    const text: GeneratedText = {
      ...insertText,
      id,
      createdAt: new Date(),
      segments: insertText.segments || [],
    };
    this.generatedTexts.set(id, text);
    return text;
  }

  async getPdfDocuments(userId: string): Promise<PdfDocument[]> {
    return Array.from(this.pdfDocuments.values()).filter(
      doc => doc.userId === userId
    );
  }

  async createPdfDocument(insertDocument: InsertPdfDocument): Promise<PdfDocument> {
    const id = randomUUID();
    const document: PdfDocument = {
      ...insertDocument,
      id,
      createdAt: new Date(),
      segments: insertDocument.segments || [],
      pageCount: insertDocument.pageCount || 1,
    };
    this.pdfDocuments.set(id, document);
    return document;
  }
  
  // Rewards methods
  async getAllRewards(): Promise<any[]> {
    const { db } = await import("./db");
    const { rewards } = await import("@shared/schema");
    
    return await db.select().from(rewards);
  }
  
  async getUserRewards(userId: string): Promise<any[]> {
    const { db } = await import("./db");
    const { userRewards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(userRewards).where(eq(userRewards.userId, userId));
  }
  
  async getRewardsWithUserStatus(userId: string): Promise<any[]> {
    const { db } = await import("./db");
    const { rewards, userRewards } = await import("@shared/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    const allRewards = await db.select().from(rewards);
    const userRewardsList = await db.select().from(userRewards).where(eq(userRewards.userId, userId));
    
    // Map user rewards for easy lookup
    const userRewardsMap = new Map(userRewardsList.map(ur => [ur.rewardId, ur]));
    
    // Combine rewards with user status
    return allRewards.map(reward => ({
      ...reward,
      isEarned: userRewardsMap.has(reward.id),
      isNew: userRewardsMap.get(reward.id)?.isNew || false,
      equipped: userRewardsMap.get(reward.id)?.equipped || false
    }));
  }
  
  async grantReward(userId: string, rewardId: string): Promise<any> {
    const { db } = await import("./db");
    const { userRewards } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    // Check if user already has this reward
    const existing = await db.select().from(userRewards)
      .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Grant the reward
    const [newReward] = await db.insert(userRewards).values({
      userId,
      rewardId,
      isNew: true,
      equipped: false
    }).returning();
    
    return newReward;
  }
  
  async markRewardsAsSeen(userId: string): Promise<void> {
    const { db } = await import("./db");
    const { userRewards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(userRewards)
      .set({ isNew: false })
      .where(eq(userRewards.userId, userId));
  }
  
  // Mascot methods
  async getUserMascot(userId: string): Promise<any | undefined> {
    const { db } = await import("./db");
    const { userMascots } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [mascot] = await db.select().from(userMascots).where(eq(userMascots.userId, userId));
    return mascot;
  }
  
  async changeMascot(userId: string, rewardId: string): Promise<any> {
    const { db } = await import("./db");
    const { userMascots, rewards, userRewards } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    // First, get the reward details
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (!reward || reward.type !== 'mascot') {
      throw new Error("Invalid mascot reward");
    }
    
    // Check if user owns this mascot
    const [userReward] = await db.select().from(userRewards)
      .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));
    
    if (!userReward) {
      throw new Error("User does not own this mascot");
    }
    
    // Unequip all mascots for this user
    await db.update(userRewards)
      .set({ equipped: false })
      .where(eq(userRewards.userId, userId));
    
    // Equip the selected mascot
    await db.update(userRewards)
      .set({ equipped: true })
      .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));
    
    // Update or create user mascot
    const existing = await this.getUserMascot(userId);
    if (existing) {
      const [updated] = await db.update(userMascots)
        .set({ 
          currentMascotId: rewardId,
          currentMascotEmoji: reward.emoji,
          updatedAt: new Date()
        })
        .where(eq(userMascots.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userMascots).values({
        userId,
        currentMascotId: rewardId,
        currentMascotEmoji: reward.emoji
      }).returning();
      return created;
    }
  }
  
  // Practice level methods
  async getPracticeLevel(userId: string): Promise<any | undefined> {
    const { db } = await import("./db");
    const { practiceLevels } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [level] = await db.select().from(practiceLevels).where(eq(practiceLevels.userId, userId));
    return level;
  }
  
  async updatePracticeLevel(userId: string, xp: number, levelCompleted?: number): Promise<any> {
    const { db } = await import("./db");
    const { practiceLevels } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const existing = await this.getPracticeLevel(userId);
    
    if (existing) {
      const newXp = existing.practiceXp + xp;
      const newLevel = Math.floor(newXp / 100) + 1;
      const lastCompleted = levelCompleted || existing.lastCompletedLevel;
      
      const [updated] = await db.update(practiceLevels)
        .set({
          practiceXp: newXp,
          practiceLevel: newLevel,
          lastCompletedLevel: lastCompleted,
          updatedAt: new Date()
        })
        .where(eq(practiceLevels.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(practiceLevels).values({
        userId,
        practiceXp: xp,
        practiceLevel: 1,
        lastCompletedLevel: levelCompleted || 0
      }).returning();
      return created;
    }
  }
  
  // XP transaction methods
  async addXpTransaction(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<any> {
    const { db } = await import("./db");
    const { xpTransactions, users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    // Add XP transaction
    const [transaction] = await db.insert(xpTransactions).values({
      userId,
      amount,
      source,
      sourceId,
      description,
      appliedToGlobal: true,
      appliedToPractice: source === 'practice'
    }).returning();
    
    // Update user's global XP
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      const newXp = user.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      
      await db.update(users)
        .set({
          xp: newXp,
          level: newLevel,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }
    
    // If it's practice, also update practice level
    if (source === 'practice') {
      await this.updatePracticeLevel(userId, amount);
    }
    
    return transaction;
  }
  
  async getUserRewardProfile(userId: string): Promise<any> {
    const { db } = await import("./db");
    const { users, practiceLevels, userMascots, userRewards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [practiceLevel] = await db.select().from(practiceLevels).where(eq(practiceLevels.userId, userId));
    const [mascot] = await db.select().from(userMascots).where(eq(userMascots.userId, userId));
    const userRewardsList = await db.select().from(userRewards).where(eq(userRewards.userId, userId));
    
    const stickers = userRewardsList.filter(r => r.rewardId); // We'd need to join with rewards to get type
    const badges = userRewardsList.filter(r => r.rewardId); // We'd need to join with rewards to get type
    
    return {
      id: user?.id,
      username: user?.username,
      email: user?.email,
      level: user?.level || 1,
      xp: user?.xp || 0,
      practiceLevel: practiceLevel?.practiceLevel || 1,
      practiceXp: practiceLevel?.practiceXp || 0,
      totalStickers: stickers.length,
      totalBadges: badges.length,
      currentMascot: mascot?.currentMascotEmoji || '🐬',
      streakDays: user?.streakDays || 0,
      wordsLearned: user?.wordsLearned || 0,
      lessonsCompleted: user?.lessonsCompleted || 0
    };
  }
  
  async updateUserMascot(userId: string, mascot: string): Promise<User | undefined> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.update(users)
      .set({
        selectedMascot: mascot,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  

  
}

// Switch to DatabaseStorage for production
export const storage: IStorageExtended = new DatabaseStorage();
