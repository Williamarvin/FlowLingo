import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  
  // Progress & Levels
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  xpToNextLevel: integer("xp_to_next_level").notNull().default(100),
  streakDays: integer("streak_days").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  totalStudyTime: integer("total_study_time").notNull().default(0), // minutes
  
  // Learning Statistics
  wordsLearned: integer("words_learned").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  conversationsHeld: integer("conversations_held").notNull().default(0),
  textsGenerated: integer("texts_generated").notNull().default(0),
  accuracyRate: decimal("accuracy_rate").notNull().default('0'),
  
  // Assessment & Personalization
  assessmentCompleted: boolean("assessment_completed").notNull().default(false),
  initialLevel: integer("initial_level"),
  learningGoal: text("learning_goal"), // "casual", "regular", "serious", "intense"
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(15),
  preferredDifficulty: text("preferred_difficulty"), // "beginner", "intermediate", "advanced"
  
  // Hearts System
  hearts: integer("hearts").notNull().default(5),
  maxHearts: integer("max_hearts").notNull().default(5),
  lastHeartLostAt: timestamp("last_heart_lost_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const mediaDocuments = pgTable("media_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  filename: text("filename").notNull(),
  fileType: varchar("file_type").notNull(), // pdf, jpg, png, gif, mp4, avi, doc, docx, txt, etc.
  mimeType: varchar("mime_type").notNull(),
  fileUrl: varchar("file_url"),
  fileSize: integer("file_size"), // in bytes
  content: text("content"), // extracted text content
  segments: jsonb("segments").notNull().default('[]'), // for text processing
  pageCount: integer("page_count").default(1),
  duration: integer("duration"), // for video/audio files in seconds
  thumbnailUrl: varchar("thumbnail_url"), // for videos and images
  processedContent: jsonb("processed_content"), // structured content for different file types
  createdAt: timestamp("created_at").defaultNow(),
});

// Keep the old table for backwards compatibility (can be migrated later)
export const pdfDocuments = pgTable("pdf_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  segments: jsonb("segments").notNull().default('[]'),
  pageCount: integer("page_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assessment Questions & Results
export const assessmentQuestions = pgTable("assessment_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionType: text("question_type").notNull(), // "vocabulary", "grammar", "reading", "listening"
  difficulty: integer("difficulty").notNull(), // 1-10
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of options
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  points: integer("points").notNull().default(10),
});

export const assessmentResults = pgTable("assessment_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  recommendedLevel: integer("recommended_level").notNull(),
  strengths: jsonb("strengths").notNull().default('[]'), // ["vocabulary", "grammar"]
  weaknesses: jsonb("weaknesses").notNull().default('[]'),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Practice Sessions & Progress
export const practiceSessions = pgTable("practice_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sessionType: text("session_type").notNull(), // "vocabulary", "pronunciation", "grammar", "mixed"
  level: integer("level").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  accuracy: decimal("accuracy").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  questionsAnswered: integer("questions_answered").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Practice Progress - tracks current progress within a level
export const practiceProgress = pgTable("practice_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  level: integer("level").notNull(),
  currentQuestion: integer("current_question").notNull().default(1), // Current question number (1-10)
  correctAnswers: integer("correct_answers").notNull().default(0),
  incorrectAnswers: integer("incorrect_answers").notNull().default(0),
  answeredQuestions: jsonb("answered_questions").notNull().default('[]'), // Array of answered question IDs
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Achievements & Badges
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Font Awesome icon class
  xpReward: integer("xp_reward").notNull().default(50),
  requirement: jsonb("requirement").notNull(), // {type: "streak", value: 7}
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
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

export const insertMediaDocumentSchema = createInsertSchema(mediaDocuments).omit({
  id: true,
  createdAt: true,
  userId: true,  // userId is added server-side for security
});

export const insertPdfDocumentSchema = createInsertSchema(pdfDocuments).omit({
  id: true,
  createdAt: true,
});

// New insert schemas
export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true,
});

export const insertAssessmentResultSchema = createInsertSchema(assessmentResults).omit({
  id: true,
  completedAt: true,
});

export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({
  id: true,
  completedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertPracticeProgressSchema = createInsertSchema(practiceProgress).omit({
  id: true,
  lastUpdated: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type InsertVocabularyWord = z.infer<typeof insertVocabularyWordSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type GeneratedText = typeof generatedTexts.$inferSelect;
export type InsertGeneratedText = z.infer<typeof insertGeneratedTextSchema>;
export type MediaDocument = typeof mediaDocuments.$inferSelect;
export type InsertMediaDocument = z.infer<typeof insertMediaDocumentSchema>;
export type PdfDocument = typeof pdfDocuments.$inferSelect;
export type InsertPdfDocument = z.infer<typeof insertPdfDocumentSchema>;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;
export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = z.infer<typeof insertAssessmentResultSchema>;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type PracticeProgress = typeof practiceProgress.$inferSelect;
export type InsertPracticeProgress = z.infer<typeof insertPracticeProgressSchema>;
