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

export const storage = new MemStorage();
