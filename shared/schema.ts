import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const vocabularyWords = pgTable("vocabulary_words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  character: text("character").notNull(),
  pinyin: text("pinyin").notNull(),
  english: text("english").notNull(),
  hskLevel: integer("hsk_level").default(1),
  difficulty: text("difficulty").default("new"), // new, learning, review, graduated
  nextReview: timestamp("next_review").defaultNow(),
  successRate: integer("success_rate").default(0),
  timesReviewed: integer("times_reviewed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  messages: jsonb("messages").notNull().default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedTexts = pgTable("generated_texts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  content: text("content").notNull(),
  segments: jsonb("segments").notNull().default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pdfDocuments = pgTable("pdf_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  segments: jsonb("segments").notNull().default('[]'),
  pageCount: integer("page_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVocabularyWordSchema = createInsertSchema(vocabularyWords).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedTextSchema = createInsertSchema(generatedTexts).omit({
  id: true,
  createdAt: true,
});

export const insertPdfDocumentSchema = createInsertSchema(pdfDocuments).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type InsertVocabularyWord = z.infer<typeof insertVocabularyWordSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type GeneratedText = typeof generatedTexts.$inferSelect;
export type InsertGeneratedText = z.infer<typeof insertGeneratedTextSchema>;
export type PdfDocument = typeof pdfDocuments.$inferSelect;
export type InsertPdfDocument = z.infer<typeof insertPdfDocumentSchema>;
