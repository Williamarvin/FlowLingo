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
  initializeUserStats(userId: string): Promise<void>;
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
  updateUserMascotName(userId: string, mascotName: string): Promise<User | undefined>;
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser & { id?: string }): Promise<User> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    
    // Generate a unique ID if not provided
    const userData: any = {
      ...insertUser,
      id: insertUser.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async initializeUserStats(userId: string): Promise<void> {
    // Initialize user stats with default values
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(users)
      .set({ 
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        hearts: 5,
        streakDays: 0,
        assessmentCompleted: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserProgress(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStreak(userId: string): Promise<User | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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

  async addXpToUser(userId: string, xp: number): Promise<{ user: User; leveledUp: boolean; newStickers: any[]; oldLevel: number; newLevel: number } | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    
    const newXp = user.xp + xp;
    let newLevel = user.level;
    let newXpToNextLevel = user.xpToNextLevel;
    const oldLevel = user.level;
    let leveledUp = false;
    let newStickers: any[] = [];
    
    // Check for level up
    if (newXp >= user.xpToNextLevel) {
      newLevel = user.level + 1;
      leveledUp = true;
      
      // Progressive XP requirement - easier early levels, exponentially harder later
      let xpRequiredForNextLevel;
      if (newLevel <= 5) {
        // Early levels: 100 XP each (10 questions)
        xpRequiredForNextLevel = 100;
      } else if (newLevel <= 15) {
        // Medium levels: grows by 50 XP per level
        xpRequiredForNextLevel = 100 + (newLevel - 5) * 50;
      } else {
        // Hard levels: exponential growth
        const baseXp = 600; // Level 15 requires 600 XP
        const exponentialFactor = Math.pow(1.3, newLevel - 15);
        xpRequiredForNextLevel = Math.floor(baseXp * exponentialFactor);
      }
      
      newXpToNextLevel = newXp + xpRequiredForNextLevel;
      
      // Award stickers for level milestones and get the stickers awarded
      newStickers = await this.awardLevelUpStickersAndReturn(userId, oldLevel, newLevel);
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
      
    return { 
      user: updatedUser, 
      leveledUp, 
      newStickers, 
      oldLevel, 
      newLevel 
    };
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { vocabularyWords } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(vocabularyWords).where(eq(vocabularyWords.userId, userId));
  }

  async getVocabularyWordsDue(userId: string): Promise<VocabularyWord[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { vocabularyWords } = await import("@shared/schema");
    const { eq, lte } = await import("drizzle-orm");
    
    return await db.select()
      .from(vocabularyWords)
      .where(eq(vocabularyWords.userId, userId));
  }

  async createVocabularyWord(word: InsertVocabularyWord): Promise<VocabularyWord> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { vocabularyWords } = await import("@shared/schema");
    
    const [newWord] = await db.insert(vocabularyWords).values(word).returning();
    return newWord;
  }

  async updateVocabularyWord(id: string, updates: Partial<VocabularyWord>): Promise<VocabularyWord | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { vocabularyWords } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(vocabularyWords)
      .set(updates)
      .where(eq(vocabularyWords.id, id))
      .returning();
    return updated;
  }

  async deleteVocabularyWord(id: string): Promise<boolean> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { vocabularyWords } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.delete(vocabularyWords).where(eq(vocabularyWords.id, id));
    return true;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { conversations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(conversations).where(eq(conversations.userId, userId));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { conversations } = await import("@shared/schema");
    
    const [newConv] = await db.insert(conversations).values(conversation).returning();
    return newConv;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { conversations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getGeneratedTexts(userId: string): Promise<GeneratedText[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { generatedTexts } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(generatedTexts).where(eq(generatedTexts.userId, userId));
  }

  async createGeneratedText(text: InsertGeneratedText): Promise<GeneratedText> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { generatedTexts } = await import("@shared/schema");
    
    const [newText] = await db.insert(generatedTexts).values(text).returning();
    return newText;
  }

  async getPdfDocuments(userId: string): Promise<PdfDocument[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { pdfDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(pdfDocuments).where(eq(pdfDocuments.userId, userId));
  }

  async getMediaDocuments(userId: string): Promise<MediaDocument[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(mediaDocuments).where(eq(mediaDocuments.userId, userId));
  }

  async createMediaDocument(document: InsertMediaDocument): Promise<MediaDocument> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { mediaDocuments } = await import("@shared/schema");
    
    const [newDoc] = await db.insert(mediaDocuments).values(document).returning();
    return newDoc;
  }

  async getMediaDocument(id: string): Promise<MediaDocument | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [doc] = await db.select().from(mediaDocuments).where(eq(mediaDocuments.id, id));
    return doc;
  }

  async updateMediaDocument(id: string, updates: Partial<MediaDocument>): Promise<MediaDocument | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(mediaDocuments)
      .set(updates)
      .where(eq(mediaDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteMediaDocument(id: string): Promise<boolean> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { mediaDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(mediaDocuments).where(eq(mediaDocuments.id, id));
    return true;
  }

  async createPdfDocument(document: InsertPdfDocument): Promise<PdfDocument> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { pdfDocuments } = await import("@shared/schema");
    
    const [newDoc] = await db.insert(pdfDocuments).values(document).returning();
    return newDoc;
  }

  async getAssessmentQuestions(difficulty?: number): Promise<any[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { assessmentQuestions } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    if (difficulty) {
      return await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.difficulty, difficulty));
    }
    return await db.select().from(assessmentQuestions);
  }

  async saveAssessmentResult(result: any): Promise<any> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { assessmentResults } = await import("@shared/schema");
    
    const [newResult] = await db.insert(assessmentResults).values(result).returning();
    return newResult;
  }

  async getAssessmentResult(userId: string): Promise<any | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { practiceSessions } = await import("@shared/schema");
    
    const [newSession] = await db.insert(practiceSessions).values(session).returning();
    return newSession;
  }

  async getPracticeSessions(userId: string): Promise<any[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { practiceSessions } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(practiceSessions).where(eq(practiceSessions.userId, userId));
  }

  async getAchievements(): Promise<any[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { achievements } = await import("@shared/schema");
    
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { userAchievements, achievements } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select()
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<any> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { userAchievements } = await import("@shared/schema");
    
    const [newAchievement] = await db.insert(userAchievements)
      .values({ userId, achievementId })
      .returning();
    return newAchievement;
  }

  async getPracticeProgress(userId: string, level: number): Promise<any | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { flashcards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    let query = db.select().from(flashcards).where(eq(flashcards.userId, userId));
    
    if (filter !== "all") {
      query = query.where(eq(flashcards.source, filter));
    }
    
    return await query;
  }

  async createFlashcard(flashcard: any): Promise<any> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { flashcards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(flashcards).where(eq(flashcards.id, id));
    return true;
  }
  
  // Sticker methods
  async getUserStickers(userId: string): Promise<any[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    
    // Check each level between old and new (in case of multiple level-ups)
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      // Every level gets a sticker box with 1-3 stickers based on random chance
      const numberOfStickers = this.rollNumberOfStickers(level);
      
      console.log(`Level ${level} reached! Opening sticker box with ${numberOfStickers} sticker(s)`);
      
      for (let i = 0; i < numberOfStickers; i++) {
        // Roll for rarity based on probability
        const roll = Math.random() * 100;
        let selectedRarity: string;
        
        // Standard probability distribution
        if (roll < 50) selectedRarity = 'common';        // 50% chance
        else if (roll < 80) selectedRarity = 'uncommon'; // 30% chance  
        else if (roll < 93) selectedRarity = 'rare';     // 13% chance
        else if (roll < 99) selectedRarity = 'epic';     // 6% chance
        else selectedRarity = 'legendary';               // 1% chance
        
        // Special bonus chances for milestone levels
        if (level % 25 === 0) { // Every 25 levels
          // Better odds for rare+ stickers
          const bonusRoll = Math.random() * 100;
          if (bonusRoll < 20) selectedRarity = 'uncommon';
          else if (bonusRoll < 50) selectedRarity = 'rare';
          else if (bonusRoll < 80) selectedRarity = 'epic';
          else selectedRarity = 'legendary';
        } else if (level % 10 === 0) { // Every 10 levels
          // Slightly better odds
          const bonusRoll = Math.random() * 100;
          if (bonusRoll < 40) selectedRarity = 'common';
          else if (bonusRoll < 70) selectedRarity = 'uncommon';
          else if (bonusRoll < 87) selectedRarity = 'rare';
          else if (bonusRoll < 96) selectedRarity = 'epic';
          else selectedRarity = 'legendary';
        }
        
        const stickersOfRarity = stickerCatalog.ANIMAL_STICKERS.filter(s => s.rarity === selectedRarity);
        const randomSticker = stickersOfRarity[Math.floor(Math.random() * stickersOfRarity.length)];
        stickersToAward.push(randomSticker.id);
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

  async awardLevelUpStickersAndReturn(userId: string, oldLevel: number, newLevel: number): Promise<any[]> {
    const stickerCatalog = await import("./stickerSystem");
    
    const stickersToAward: string[] = [];
    const awardedStickers: any[] = [];
    
    // Check each level between old and new (in case of multiple level-ups)
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      // Every level gets a sticker box with 1-3 stickers based on random chance
      const numberOfStickers = this.rollNumberOfStickers(level);
      
      console.log(`Level ${level} reached! Opening sticker box with ${numberOfStickers} sticker(s) for API response`);
      
      for (let i = 0; i < numberOfStickers; i++) {
        // Roll for rarity based on probability
        const roll = Math.random() * 100;
        let selectedRarity: string;
        
        // Standard probability distribution
        if (roll < 50) selectedRarity = 'common';        // 50% chance
        else if (roll < 80) selectedRarity = 'uncommon'; // 30% chance  
        else if (roll < 93) selectedRarity = 'rare';     // 13% chance
        else if (roll < 99) selectedRarity = 'epic';     // 6% chance
        else selectedRarity = 'legendary';               // 1% chance
        
        // Special bonus chances for milestone levels
        if (level % 25 === 0) { // Every 25 levels
          // Better odds for rare+ stickers
          const bonusRoll = Math.random() * 100;
          if (bonusRoll < 20) selectedRarity = 'uncommon';
          else if (bonusRoll < 50) selectedRarity = 'rare';
          else if (bonusRoll < 80) selectedRarity = 'epic';
          else selectedRarity = 'legendary';
        } else if (level % 10 === 0) { // Every 10 levels
          // Slightly better odds
          const bonusRoll = Math.random() * 100;
          if (bonusRoll < 40) selectedRarity = 'common';
          else if (bonusRoll < 70) selectedRarity = 'uncommon';
          else if (bonusRoll < 87) selectedRarity = 'rare';
          else if (bonusRoll < 96) selectedRarity = 'epic';
          else selectedRarity = 'legendary';
        }
        
        const stickersOfRarity = stickerCatalog.ANIMAL_STICKERS.filter(s => s.rarity === selectedRarity);
        const randomSticker = stickersOfRarity[Math.floor(Math.random() * stickersOfRarity.length)];
        stickersToAward.push(randomSticker.id);
      }
    }
    
    // Award all the stickers and collect the sticker info
    for (const stickerId of stickersToAward) {
      try {
        await this.awardSticker(userId, stickerId);
        const stickerInfo = stickerCatalog.ANIMAL_STICKERS.find(s => s.id === stickerId);
        if (stickerInfo) {
          awardedStickers.push(stickerInfo);
          console.log(`Awarded sticker: ${stickerInfo.name} (${stickerInfo.rarity})`);
        }
      } catch (error) {
        console.error(`Error awarding sticker ${stickerId}:`, error);
      }
    }
    
    return awardedStickers;
  }
  
  // Helper function to determine number of stickers in the box
  private rollNumberOfStickers(level: number): number {
    const roll = Math.random() * 100;
    
    // Special levels get more stickers
    if (level % 25 === 0) {
      // Milestone levels: 25, 50, 75, 100
      if (roll < 30) return 2;  // 30% chance for 2 stickers
      else if (roll < 80) return 3;  // 50% chance for 3 stickers
      else return 4;  // 20% chance for 4 stickers
    } else if (level % 10 === 0) {
      // Every 10 levels
      if (roll < 50) return 1;  // 50% chance for 1 sticker
      else if (roll < 85) return 2;  // 35% chance for 2 stickers
      else return 3;  // 15% chance for 3 stickers
    } else {
      // Regular levels
      if (roll < 70) return 1;  // 70% chance for 1 sticker
      else if (roll < 95) return 2;  // 25% chance for 2 stickers
      else return 3;  // 5% chance for 3 stickers
    }
  }
  
  // Rewards methods
  async getAllRewards(): Promise<any[]> {
    const stickerCatalog = await import("./stickerSystem");
    return stickerCatalog.ANIMAL_STICKERS;
  }
  
  async getUserRewards(userId: string): Promise<any[]> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { userRewards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(userRewards).where(eq(userRewards.userId, userId));
  }
  
  async getRewardsWithUserStatus(userId: string): Promise<any[]> {
    const allRewards = await this.getAllRewards();
    const userRewardsList = await this.getUserRewards(userId);
    const userRewardIds = userRewardsList.map(r => r.rewardId);
    
    return allRewards.map(reward => ({
      ...reward,
      earned: userRewardIds.includes(reward.id),
      isNew: userRewardsList.find(ur => ur.rewardId === reward.id)?.isNew || false
    }));
  }
  
  async grantReward(userId: string, rewardId: string): Promise<any> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { userRewards } = await import("@shared/schema");
    
    const [reward] = await db.insert(userRewards).values({
      userId,
      rewardId,
      isNew: true,
      equipped: false
    }).returning();
    
    return reward;
  }
  
  async markRewardsAsSeen(userId: string): Promise<void> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { userRewards } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(userRewards)
      .set({ isNew: false })
      .where(eq(userRewards.userId, userId));
  }
  
  // Mascot methods
  async getUserMascot(userId: string): Promise<any | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.selectedMascot;
  }
  
  async updateUserMascot(userId: string, mascot: string): Promise<User | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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

  async updateUserMascotName(userId: string, mascotName: string): Promise<User | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [user] = await db.update(users)
      .set({
        mascotName: mascotName,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async changeMascot(userId: string, rewardId: string): Promise<any> {
    const stickerCatalog = await import("./stickerSystem");
    const sticker = stickerCatalog.ANIMAL_STICKERS.find(s => s.id === rewardId);
    
    if (!sticker) {
      throw new Error("Invalid sticker ID");
    }
    
    return await this.updateUserMascot(userId, sticker.emoji);
  }
  
  // Practice level methods
  async getPracticeLevel(userId: string): Promise<any | undefined> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { practiceLevels } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [level] = await db.select().from(practiceLevels).where(eq(practiceLevels.userId, userId));
    return level;
  }
  
  async updatePracticeLevel(userId: string, xp: number, levelCompleted?: number): Promise<any> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
    const { practiceLevels } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const currentLevel = await this.getPracticeLevel(userId);
    
    if (!currentLevel) {
      const [newLevel] = await db.insert(practiceLevels).values({
        userId,
        practiceLevel: levelCompleted || 1,
        practiceXp: xp
      }).returning();
      return newLevel;
    }
    
    const updates: any = { practiceXp: xp };
    if (levelCompleted) {
      updates.practiceLevel = levelCompleted;
    }
    
    const [updated] = await db.update(practiceLevels)
      .set(updates)
      .where(eq(practiceLevels.userId, userId))
      .returning();
    
    return updated;
  }
  
  // XP transaction methods
  async addXpTransaction(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<any> {
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
    const { getDB } = await import("./db-helper");
    const { db } = await getDB();
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
}



// Switch to DatabaseStorage for production
export const storage: IStorageExtended = new DatabaseStorage();
