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
    return Array.from(this.vocabularyWords.values()).filter(
      word => word.userId === userId
    );
  }

  async getVocabularyWordsDue(userId: string): Promise<VocabularyWord[]> {
    const now = new Date();
    return Array.from(this.vocabularyWords.values()).filter(
      word => word.userId === userId && word.nextReview && new Date(word.nextReview) <= now
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
