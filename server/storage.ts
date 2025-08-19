import { type User, type InsertUser, type VocabularyWord, type InsertVocabularyWord, type Conversation, type InsertConversation, type GeneratedText, type InsertGeneratedText, type PdfDocument, type InsertPdfDocument } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  
  getPdfDocuments(userId: string): Promise<PdfDocument[]>;
  createPdfDocument(document: InsertPdfDocument): Promise<PdfDocument>;
}

export interface IStorageExtended extends IStorage {
  // User progress methods
  updateUserProgress(userId: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserStreak(userId: string): Promise<User | undefined>;
  addXpToUser(userId: string, xp: number): Promise<User | undefined>;
  
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    
    // Generate a unique ID if not provided
    const userData = {
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
    
    // Check for level up
    if (newXp >= user.xpToNextLevel) {
      newLevel = user.level + 1;
      newXpToNextLevel = user.xpToNextLevel + (50 * newLevel); // Progressive XP requirement
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
