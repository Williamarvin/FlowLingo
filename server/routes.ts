import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { insertVocabularyWordSchema, insertConversationSchema, insertGeneratedTextSchema, insertPdfDocumentSchema, insertMediaDocumentSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import OpenAI from "openai";
import { requireAuth, hashPassword, verifyPassword, createSession, verifyGoogleToken, getOrCreateGoogleUser } from "./auth";
import cookieParser from "cookie-parser";
import { registerRewardsRoutes } from "./rewardsRoutes";

// In-memory storage for uploaded files (in production, use cloud storage)
const uploadedFiles = new Map<string, {
  id: string;
  buffer: Buffer;
  size: number;
  contentType: string;
  uploadedAt: Date;
}>();

// Function to segment Chinese text into meaningful phrases (2-3 character compounds)
function segmentChineseText(text: string) {
  const segments = [];
  const chars = text.split('');
  let currentPhrase = '';
  let index = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    
    // Check if character is punctuation or whitespace
    if (/[。！？，、；：""''（）《》【】\s]/.test(char)) {
      if (currentPhrase.trim()) {
        segments.push({
          text: currentPhrase.trim(),
          index: index,
          translation: null,
          pinyin: null
        });
        index++;
      }
      
      // Add punctuation as separate segment if not whitespace
      if (char.trim()) {
        segments.push({
          text: char,
          index: index,
          translation: null,
          pinyin: null
        });
        index++;
      }
      currentPhrase = '';
    } else {
      currentPhrase += char;
      
      // Break into 2-3 character meaningful phrases
      if (currentPhrase.length === 2) {
        // Most Chinese words are 2 characters, so break here
        segments.push({
          text: currentPhrase.trim(),
          index: index,
          translation: null,
          pinyin: null
        });
        index++;
        currentPhrase = '';
      } else if (currentPhrase.length === 3) {
        // Some compounds are 3 characters, break here too
        segments.push({
          text: currentPhrase.trim(),
          index: index,
          translation: null,
          pinyin: null
        });
        index++;
        currentPhrase = '';
      }
    }
  }
  
  // Add final phrase if exists
  if (currentPhrase.trim()) {
    segments.push({
      text: currentPhrase.trim(),
      index: index,
      translation: null,
      pinyin: null
    });
  }
  
  return segments;
}

// Optimized version for faster segmentation
function segmentChineseTextOptimized(text: string) {
  const segments = [];
  let index = 0;
  
  // Use regex to split by punctuation more efficiently
  const parts = text.split(/([。！？，、；：""''（）《》【】\s])/);
  
  for (const part of parts) {
    if (!part) continue;
    
    // If it's punctuation
    if (/[。！？，、；：""''（）《》【】\s]/.test(part)) {
      if (part.trim()) {
        segments.push({
          text: part,
          index: index++,
          translation: null,
          pinyin: null
        });
      }
    } else {
      // Process Chinese text - optimal chunking
      let i = 0;
      while (i < part.length) {
        // Prefer 2-character words (most common in Chinese)
        const remainingLength = part.length - i;
        const chunkSize = remainingLength >= 2 ? 2 : 1;
        
        segments.push({
          text: part.substr(i, chunkSize),
          index: index++,
          translation: null,
          pinyin: null
        });
        
        i += chunkSize;
      }
    }
  }
  
  return segments;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple cache for text generation to improve speed
const textGenerationCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(topic: string, difficulty: string, length: string) {
  return `${topic}-${difficulty}-${length}`;
}

function getCachedText(key: string) {
  const cached = textGenerationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  textGenerationCache.delete(key);
  return null;
}

function setCachedText(key: string, data: any) {
  // Limit cache size
  if (textGenerationCache.size > 20) {
    const firstKey = textGenerationCache.keys().next().value;
    if (firstKey) {
      textGenerationCache.delete(firstKey);
    }
  }
  textGenerationCache.set(key, { data, timestamp: Date.now() });
}

// Helper function to generate practice questions
// Helper to get level by ID from the levelStructure
const getLevelById = (level: number) => {
  // Simplified level structure for practice questions
  const levels = [
    { level: 1, topic: "Greetings & Introductions", hskLevel: 1 },
    { level: 2, topic: "Family & Relationships", hskLevel: 1 },
    { level: 3, topic: "Numbers & Counting", hskLevel: 1 },
    { level: 4, topic: "Time & Dates", hskLevel: 1 },
    { level: 5, topic: "Daily Activities", hskLevel: 1 },
    { level: 6, topic: "Food & Dining", hskLevel: 1 },
    { level: 7, topic: "Shopping & Money", hskLevel: 1 },
    { level: 8, topic: "Colors & Shapes", hskLevel: 1 },
    { level: 9, topic: "Body Parts & Health", hskLevel: 1 },
    { level: 10, topic: "Basic Directions", hskLevel: 1 },
    // Add more levels as needed
  ];
  
  return levels.find(l => l.level === level);
};

function generatePracticeQuestions(level: number) {
  const questions = [];
  const questionTypes = ["multiple-choice", "translation"] as const;
  const usedWords = new Set<string>(); // Track words that have been used as correct answers
  
  // Get the level data from the new structure
  const levelData = getLevelById(level);
  if (!levelData) {
    // Fallback to default vocabulary if level not found
    console.error(`Level ${level} not found in structure`);
    level = 1;
  }
  
  // Generate topic-specific vocabulary based on level
  const generateTopicVocabulary = (levelNum: number) => {
    const levelInfo = getLevelById(levelNum);
    if (!levelInfo) return [];
    
    // Create vocabulary based on the level's topic focus
    // This is a simplified version - in production, you'd want a proper HSK vocabulary database
    const topicVocab = [];
    
    // For now, use placeholder vocabulary that matches the topic
    // This would be replaced with actual HSK vocabulary database
    switch(levelInfo.topic) {
      case "Greetings & Introductions":
        return [
          { chinese: "你好", pinyin: "nǐ hǎo", english: "hello" },
          { chinese: "谢谢", pinyin: "xiè xiè", english: "thank you" },
          { chinese: "再见", pinyin: "zài jiàn", english: "goodbye" },
          { chinese: "请", pinyin: "qǐng", english: "please" },
          { chinese: "对不起", pinyin: "duì bù qǐ", english: "sorry" },
          { chinese: "没关系", pinyin: "méi guān xi", english: "it's okay" },
          { chinese: "我", pinyin: "wǒ", english: "I/me" },
          { chinese: "你", pinyin: "nǐ", english: "you" },
          { chinese: "他", pinyin: "tā", english: "he" },
          { chinese: "她", pinyin: "tā", english: "she" }
        ];
      case "Family & Relationships":
        return [
          { chinese: "家", pinyin: "jiā", english: "home/family" },
          { chinese: "爸爸", pinyin: "bà ba", english: "father" },
          { chinese: "妈妈", pinyin: "mā ma", english: "mother" },
          { chinese: "哥哥", pinyin: "gē ge", english: "older brother" },
          { chinese: "姐姐", pinyin: "jiě jie", english: "older sister" },
          { chinese: "弟弟", pinyin: "dì di", english: "younger brother" },
          { chinese: "妹妹", pinyin: "mèi mei", english: "younger sister" },
          { chinese: "朋友", pinyin: "péng yǒu", english: "friend" },
          { chinese: "同学", pinyin: "tóng xué", english: "classmate" },
          { chinese: "老师", pinyin: "lǎo shī", english: "teacher" }
        ];
      case "Numbers & Counting":
        return [
          { chinese: "一", pinyin: "yī", english: "one" },
          { chinese: "二", pinyin: "èr", english: "two" },
          { chinese: "三", pinyin: "sān", english: "three" },
          { chinese: "四", pinyin: "sì", english: "four" },
          { chinese: "五", pinyin: "wǔ", english: "five" },
          { chinese: "六", pinyin: "liù", english: "six" },
          { chinese: "七", pinyin: "qī", english: "seven" },
          { chinese: "八", pinyin: "bā", english: "eight" },
          { chinese: "九", pinyin: "jiǔ", english: "nine" },
          { chinese: "十", pinyin: "shí", english: "ten" }
        ];
      default:
        // For other topics, use existing vocabulary
        break;
    }
    
    return topicVocab;
  };
  
  // Level-based vocabulary - now using topic-specific vocabulary  
  const levelVocabulary: Record<number, Array<{chinese: string, pinyin: string, english: string}>> = {};
  
  // Generate vocabulary for levels 1-50 based on topics
  for (let i = 1; i <= 50; i++) {
    const vocab = generateTopicVocabulary(i);
    if (vocab && vocab.length > 0) {
      levelVocabulary[i] = vocab;
    } else {
      // Fallback to basic vocabulary if no specific topic vocabulary
      levelVocabulary[i] = [
        { chinese: "学习", pinyin: "xué xí", english: "to study" },
        { chinese: "练习", pinyin: "liàn xí", english: "to practice" },
        { chinese: "中文", pinyin: "zhōng wén", english: "Chinese" },
        { chinese: "汉语", pinyin: "hàn yǔ", english: "Chinese language" },
        { chinese: "词汇", pinyin: "cí huì", english: "vocabulary" },
        { chinese: "语法", pinyin: "yǔ fǎ", english: "grammar" },
        { chinese: "发音", pinyin: "fā yīn", english: "pronunciation" },
        { chinese: "理解", pinyin: "lǐ jiě", english: "to understand" },
        { chinese: "记住", pinyin: "jì zhù", english: "to remember" },
        { chinese: "复习", pinyin: "fù xí", english: "to review" }
      ];
    }
  }
  
  // Support all levels up to 50
  const maxLevel = Math.min(level, 50);
  const availableVocab: Array<{chinese: string, pinyin: string, english: string}> = [];
  
  // Get vocabulary for current level and below
  for (let i = 1; i <= maxLevel; i++) {
    availableVocab.push(...(levelVocabulary[i] || []));
  }
  
  // If no vocabulary available, use level 1
  if (availableVocab.length === 0) {
    availableVocab.push(...levelVocabulary[1]);
  }
  
  // Generate 10 questions
  for (let i = 0; i < 10; i++) {
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    // Find a word that hasn't been used yet
    let correctWord = null;
    let attempts = 0;
    const maxAttempts = availableVocab.length * 2;
    
    while (!correctWord && attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * availableVocab.length);
      const candidate = availableVocab[randomIndex];
      const wordKey = `${candidate.chinese}-${candidate.english}`;
      
      if (!usedWords.has(wordKey)) {
        correctWord = candidate;
        usedWords.add(wordKey);
        break;
      }
      attempts++;
    }
    
    // If all words have been used (shouldn't happen with our vocab size), pick a random one
    if (!correctWord) {
      const randomIndex = Math.floor(Math.random() * availableVocab.length);
      correctWord = availableVocab[randomIndex];
    }
    
    if (type === "multiple-choice") {
      // Chinese to English
      const optionWords = [correctWord];
      const usedOptionIndices = new Set<number>();
      
      // Find the index of the correct word
      const correctWordIndex = availableVocab.findIndex(w => 
        w.chinese === correctWord.chinese && w.english === correctWord.english
      );
      if (correctWordIndex !== -1) {
        usedOptionIndices.add(correctWordIndex);
      }
      
      while (optionWords.length < 4 && optionWords.length < availableVocab.length) {
        const randomIndex = Math.floor(Math.random() * availableVocab.length);
        if (!usedOptionIndices.has(randomIndex)) {
          optionWords.push(availableVocab[randomIndex]);
          usedOptionIndices.add(randomIndex);
        }
      }
      
      // Shuffle option words
      const shuffledWords = [...optionWords].sort(() => Math.random() - 0.5);
      const options = shuffledWords.map(word => word.english);
      const optionDetails = shuffledWords.map(word => ({
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english
      }));
      
      questions.push({
        id: `q${i + 1}`,
        type: "multiple-choice",
        question: "What does this character mean?",
        chinese: correctWord.chinese,
        pinyin: correctWord.pinyin,
        english: correctWord.english,
        options: options,
        optionDetails: optionDetails,
        correctAnswer: correctWord.english
      });
    } else {
      // English to Chinese
      const optionWords = [correctWord];
      const usedOptionIndices = new Set<number>();
      
      // Find the index of the correct word
      const correctWordIndex = availableVocab.findIndex(w => 
        w.chinese === correctWord.chinese && w.english === correctWord.english
      );
      if (correctWordIndex !== -1) {
        usedOptionIndices.add(correctWordIndex);
      }
      
      while (optionWords.length < 4 && optionWords.length < availableVocab.length) {
        const randomIndex = Math.floor(Math.random() * availableVocab.length);
        if (!usedOptionIndices.has(randomIndex)) {
          optionWords.push(availableVocab[randomIndex]);
          usedOptionIndices.add(randomIndex);
        }
      }
      
      // Shuffle option words
      const shuffledWords = [...optionWords].sort(() => Math.random() - 0.5);
      const options = shuffledWords.map(word => word.chinese);
      const optionDetails = shuffledWords.map(word => ({
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english
      }));
      
      questions.push({
        id: `q${i + 1}`,
        type: "translation",
        question: "How do you say this in Chinese?",
        chinese: correctWord.chinese,
        pinyin: correctWord.pinyin,
        english: correctWord.english,
        options: options,
        optionDetails: optionDetails,
        correctAnswer: correctWord.chinese
      });
    }
  }
  
  return questions;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());
  
  // Mock user ID for demo purposes (will be replaced with real auth)
  const DEMO_USER_ID = "demo-user";
  
  // Authentication Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username: username || email.split('@')[0],
        authMethod: 'email'
      });
      
      // Create session
      const token = await createSession(user.id);
      
      // Set cookie and return user
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.status(201).json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error: any) {
      console.error("Signup error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      
      // Provide more specific error messages for debugging in production
      if (process.env.NODE_ENV === 'production') {
        // Check for common database errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          return res.status(500).json({ error: "Database connection failed. Please check DATABASE_URL configuration." });
        }
        if (error.code === '42P01') {
          return res.status(500).json({ error: "Database tables not found. Run database migration: npm run db:push" });
        }
        if (error.message?.includes('JWT_SECRET')) {
          return res.status(500).json({ error: "JWT_SECRET not configured. Add it to environment variables." });
        }
      }
      
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Check password
      if (!user.password) {
        return res.status(401).json({ error: "Please sign in with Google" });
      }
      
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Create session
      const token = await createSession(user.id);
      
      // Set cookie and return user
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to sign in" });
    }
  });
  
  // Google OAuth simulation endpoint
  app.get("/api/auth/google", (req, res) => {
    // Simulated Google OAuth flow for demonstration
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sign in with Google - FlowLingo</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            width: 100%;
            max-width: 400px;
            padding: 40px;
          }
          .google-header {
            text-align: center;
            margin-bottom: 32px;
          }
          .google-logo {
            font-size: 24px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 8px;
          }
          .signin-text {
            font-size: 16px;
            color: #5f6368;
          }
          .form-container {
            margin-top: 24px;
          }
          .input-group {
            margin-bottom: 24px;
          }
          .input-field {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 16px;
            outline: none;
            transition: border 0.2s;
          }
          .input-field:focus {
            border-color: #1a73e8;
          }
          .label {
            display: block;
            margin-bottom: 8px;
            color: #5f6368;
            font-size: 14px;
          }
          .button-container {
            display: flex;
            justify-content: space-between;
            margin-top: 32px;
          }
          .btn {
            padding: 10px 24px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }
          .btn-cancel {
            background: #fff;
            color: #1a73e8;
            border: 1px solid #dadce0;
          }
          .btn-cancel:hover {
            background: #f8f9fa;
          }
          .btn-next {
            background: #1a73e8;
            color: white;
            min-width: 88px;
          }
          .btn-next:hover {
            background: #1557b0;
            box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
          }
          .btn-next:disabled {
            background: #dadce0;
            cursor: not-allowed;
          }
          .google-account-option {
            padding: 12px;
            border: 1px solid #dadce0;
            border-radius: 8px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .google-account-option:hover {
            background: #f8f9fa;
            border-color: #1a73e8;
          }
          .account-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4285f4, #34a853);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 500;
          }
          .account-info {
            flex: 1;
          }
          .account-name {
            font-weight: 500;
            color: #202124;
          }
          .account-email {
            font-size: 14px;
            color: #5f6368;
          }
          .loading {
            display: none;
            text-align: center;
            padding: 20px;
          }
          .loading.active {
            display: block;
          }
          .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #1a73e8;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="google-header">
            <div style="display: flex; justify-content: center; margin-bottom: 16px;">
              <svg width="74" height="24" viewBox="0 0 74 24">
                <path fill="#4285F4" d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z"/>
                <path fill="#EA4335" d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
                <path fill="#FBBC04" d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52 0-2.05 1.34-3.52 3.1-3.52 1.74 0 3.1 1.5 3.1 3.54.01 2.03-1.36 3.5-3.1 3.5z"/>
                <path fill="#34A853" d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
                <path fill="#EA4335" d="M58 .24h2.51v17.57H58z"/>
                <path fill="#FBBC04" d="M68.26 15.52c-1.3 0-2.22-.59-2.82-1.76l7.77-3.21-.26-.66c-.48-1.3-1.96-3.7-4.97-3.7-2.99 0-5.48 2.35-5.48 5.81 0 3.26 2.46 5.81 5.76 5.81 2.66 0 4.2-1.63 4.84-2.57l-1.98-1.32c-.66.96-1.56 1.6-2.86 1.6zm-.18-7.15c1.03 0 1.91.53 2.2 1.28l-5.25 2.17c0-2.44 1.73-3.45 3.05-3.45z"/>
              </svg>
            </div>
            <div class="signin-text">Sign in</div>
            <div style="margin-top: 8px; font-size: 14px; color: #5f6368;">Use your Google Account</div>
          </div>
          
          <div id="step1" class="form-container">
            <div class="input-group">
              <label class="label">Email or phone</label>
              <input type="email" id="email" class="input-field" placeholder="Enter your email">
            </div>
            
            <div style="margin: 16px 0; text-align: center; color: #5f6368; font-size: 14px;">OR</div>
            
            <div style="margin-bottom: 24px;">
              <div class="google-account-option" onclick="quickSignIn('demo@gmail.com', 'Demo User')">
                <div class="account-avatar">D</div>
                <div class="account-info">
                  <div class="account-name">Demo User</div>
                  <div class="account-email">demo@gmail.com</div>
                </div>
              </div>
              <div class="google-account-option" onclick="quickSignIn('test@gmail.com', 'Test Account')">
                <div class="account-avatar">T</div>
                <div class="account-info">
                  <div class="account-name">Test Account</div>
                  <div class="account-email">test@gmail.com</div>
                </div>
              </div>
            </div>
            
            <div class="button-container">
              <button class="btn btn-cancel" onclick="window.close()">Cancel</button>
              <button class="btn btn-next" onclick="proceedToPassword()">Next</button>
            </div>
          </div>
          
          <div id="step2" class="form-container" style="display: none;">
            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                <div class="account-avatar" id="userAvatar">U</div>
                <div id="userEmail" style="color: #5f6368;"></div>
              </div>
            </div>
            
            <div class="input-group">
              <label class="label">Enter your password</label>
              <input type="password" id="password" class="input-field" placeholder="Password">
            </div>
            
            <div class="button-container">
              <button class="btn btn-cancel" onclick="backToEmail()">Back</button>
              <button class="btn btn-next" onclick="signIn()">Sign in</button>
            </div>
          </div>
          
          <div id="loading" class="loading">
            <div class="spinner"></div>
            <div style="margin-top: 16px; color: #5f6368;">Signing in...</div>
          </div>
        </div>
        
        <script>
          let currentEmail = '';
          let currentName = '';
          
          function quickSignIn(email, name) {
            currentEmail = email;
            currentName = name;
            completeSignIn();
          }
          
          function proceedToPassword() {
            const email = document.getElementById('email').value;
            if (!email) {
              alert('Please enter your email');
              return;
            }
            currentEmail = email;
            currentName = email.split('@')[0];
            
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            document.getElementById('userEmail').textContent = currentEmail;
            document.getElementById('userAvatar').textContent = currentName[0].toUpperCase();
          }
          
          function backToEmail() {
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step1').style.display = 'block';
          }
          
          function signIn() {
            const password = document.getElementById('password').value;
            if (!password) {
              alert('Please enter your password');
              return;
            }
            completeSignIn();
          }
          
          async function completeSignIn() {
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'none';
            document.getElementById('loading').classList.add('active');
            
            try {
              // Call the Google auth endpoint
              const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: currentEmail,
                  name: currentName
                })
              });
              
              if (response.ok) {
                // Send success message to parent window
                if (window.opener) {
                  window.opener.postMessage({ type: 'auth-success' }, '*');
                }
                setTimeout(() => {
                  window.close();
                }, 500);
              } else {
                alert('Sign in failed. Please try again.');
                window.location.reload();
              }
            } catch (error) {
              alert('An error occurred. Please try again.');
              window.location.reload();
            }
          }
          
          // Handle Enter key
          document.getElementById('email').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') proceedToPassword();
          });
          
          document.getElementById('password').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') signIn();
          });
        </script>
      </body>
      </html>
    `;
    res.send(html);
  });
  
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with Google sign-in
        const username = name || email.split('@')[0];
        user = await storage.createUser({
          email,
          username,
          password: null, // No password for Google users
          authMethod: 'google'
        });
        
        // Initialize user stats
        await storage.initializeUserStats(user.id);
      }
      
      // Create session
      const token = await createSession(user.id);
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ error: "Failed to authenticate with Google" });
    }
  });
  
  // Temporary password reset endpoint for testing
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
  });
  
  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: { id: user.id, email: user.email, username: user.username, profilePicture: user.profilePicture } });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Text generation endpoint - optimized for speed
  app.post("/api/generate-text", requireAuth, async (req: any, res) => {
    try {
      const { topic, difficulty, length } = req.body;
      
      // Check cache first
      const cacheKey = getCacheKey(topic, difficulty, length);
      const cachedResponse = getCachedText(cacheKey);
      
      if (cachedResponse) {
        console.log("Returning cached text for:", cacheKey);
        return res.json(cachedResponse);
      }
      
      // Log start time for performance monitoring
      const startTime = Date.now();
      
      // Simplified, more focused prompt for faster generation
      const hskLevel = difficulty === 'beginner' ? '1-2' : difficulty === 'intermediate' ? '3-4' : '5-6';
      const targetLength = length === 'short' ? 100 : length === 'medium' ? 200 : 300;
      
      const prompt = `Generate ${targetLength} characters of Chinese text about "${topic}" for HSK ${hskLevel} level.
Include: varied vocabulary, practical expressions, natural dialogue.
Focus on: educational value and authentic Chinese patterns.
Output: Only Chinese text, no explanations.`;

      // Use lower temperature for faster, more predictable generation
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400, // Reduced from 800 for faster response
        temperature: 0.7, // Lower temperature for more predictable output
        top_p: 0.9, // Nucleus sampling for better quality
      });

      const content = response.choices[0].message.content || "";
      
      // Optimized segmentation - process only what's needed
      const segments = segmentChineseTextOptimized(content);

      const generatedText = await storage.createGeneratedText({
        userId: req.userId,
        topic,
        difficulty,
        content,
        segments
      });

      // Cache the response
      setCachedText(cacheKey, generatedText);
      
      // Award XP for generating text (5 XP per generation)
      if (storage.addXpTransaction) {
        try {
          await storage.addXpTransaction(
            req.userId,
            5,
            'text_generation',
            generatedText.id,
            `Generated ${difficulty} text about ${topic}`
          );
        } catch (error) {
          console.error("Error awarding XP for text generation:", error);
        }
      }
      
      // Log generation time
      const generationTime = Date.now() - startTime;
      console.log(`Text generated in ${generationTime}ms for: ${topic}`);

      res.json(generatedText);
    } catch (error) {
      console.error("Text generation error:", error);
      res.status(500).json({ error: "Failed to generate text" });
    }
  });

  // OCR endpoint for extracting text from images
  app.post("/api/ocr/extract-chinese", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      // Fetch the image data
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image");
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      // Use OpenAI's vision API to extract Chinese text
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an OCR expert specialized in extracting Chinese text from images. Extract all Chinese characters and text you can see in the image. Return the extracted text maintaining the original layout as much as possible. If no Chinese text is found, return an empty string."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all Chinese text from this image:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const extractedText = completion.choices[0].message.content || "";
      
      res.json({ 
        success: true,
        extractedText,
        hasChineseText: extractedText.length > 0
      });
    } catch (error) {
      console.error("OCR extraction error:", error);
      res.status(500).json({ error: "Failed to extract text from image" });
    }
  });

  // Translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text } = req.body;
      
      const prompt = `Translate this Chinese text/phrase to English and provide pinyin pronunciation. For phrases, provide the complete meaning and context. Return as JSON: {"character": "${text}", "pinyin": "pronunciation with tone marks", "english": "complete translation with context"}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const translation = JSON.parse(response.choices[0].message.content || "{}");
      res.json(translation);
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate text" });
    }
  });

  // Text-to-Speech endpoint using OpenAI
  // Server-side TTS cache (in-memory)
  const ttsCache = new Map<string, Buffer>();
  const TTS_CACHE_MAX_SIZE = 100; // Limit cache size

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, speed = 0.75 } = req.body; // Default speed 0.75 for natural yet clear pronunciation
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Create cache key based on text and speed
      const cacheKey = `${text}_${speed}`;
      
      // Check cache first
      const cachedBuffer = ttsCache.get(cacheKey);
      if (cachedBuffer) {
        // Return cached audio
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': cachedBuffer.length.toString(),
          'X-TTS-Cache': 'hit' // Debug header to show cache hit
        });
        return res.send(cachedBuffer);
      }

      // Not in cache, generate new audio
      // Use OpenAI's TTS API with HD quality for more natural sound
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd", // HD model for higher quality, more natural sound
        voice: "shimmer", // Shimmer has warm, natural tone perfect for Chinese language learning
        input: text,
        speed: speed // Use the provided speed or default
      });

      // Convert the response to a buffer
      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      // Add to cache (with size limit)
      if (ttsCache.size >= TTS_CACHE_MAX_SIZE) {
        // Remove oldest entry (first item in Map)
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) {
          ttsCache.delete(firstKey);
        }
      }
      ttsCache.set(cacheKey, buffer);
      
      // Send the audio buffer as response
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'X-TTS-Cache': 'miss' // Debug header to show cache miss
      });
      res.send(buffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // Flashcards endpoints
  app.get("/api/flashcards", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const filter = req.query.filter as string || "all";
      
      const flashcards = await storage.getFlashcards(userId, filter);
      res.json(flashcards);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcards", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { chinese, pinyin, english, source, level } = req.body;
      
      const flashcard = await storage.createFlashcard({
        userId,
        chinese,
        pinyin,
        english,
        source: source || "new",
        level: level || 1,
      });
      
      res.json(flashcard);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      res.status(500).json({ error: "Failed to create flashcard" });
    }
  });

  // Award XP for conversation practice
  app.post("/api/conversation/award-xp", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { messagesCount, duration, quality } = req.body;
      
      // Calculate XP based on conversation quality and length
      // Base XP: 5 per message exchange, bonus for quality
      const baseXP = Math.min(messagesCount * 5, 100); // Cap at 100
      const qualityBonus = quality === 'excellent' ? 20 : quality === 'good' ? 10 : 0;
      const xpEarned = baseXP + qualityBonus;
      
      const user = await storage.getUserProfile(userId);
      const newXP = (user.xp || 0) + xpEarned;
      
      // Update user XP
      await storage.updateUserProfile(userId, { xp: newXP });
      
      res.json({ xpEarned, newXP });
    } catch (error) {
      console.error("Error awarding conversation XP:", error);
      res.status(500).json({ error: "Failed to award XP" });
    }
  });
  
  // Award XP for flashcard practice
  app.post("/api/flashcards/award-xp", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { cardsReviewed, correctCount } = req.body;
      
      // Calculate XP: 2 per card reviewed + 3 bonus per correct
      const baseXP = cardsReviewed * 2;
      const correctBonus = correctCount * 3;
      const xpEarned = Math.min(baseXP + correctBonus, 50); // Cap at 50 per session
      
      const user = await storage.getUserProfile(userId);
      const newXP = (user.xp || 0) + xpEarned;
      
      // Update user XP
      await storage.updateUserProfile(userId, { xp: newXP });
      
      res.json({ xpEarned, newXP });
    } catch (error) {
      console.error("Error awarding flashcard XP:", error);
      res.status(500).json({ error: "Failed to award XP" });
    }
  });
  
  // Award XP for text generation interaction
  app.post("/api/text-generator/award-xp", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { charactersTranslated, interactionTime } = req.body;
      
      // Calculate XP: 1 per 10 characters translated, bonus for engagement time
      const baseXP = Math.floor(charactersTranslated / 10);
      const timeBonus = Math.floor(interactionTime / 60) * 2; // 2 XP per minute
      const xpEarned = Math.min(baseXP + timeBonus, 30); // Cap at 30 per session
      
      const user = await storage.getUserProfile(userId);
      const newXP = (user.xp || 0) + xpEarned;
      
      // Update user XP
      await storage.updateUserProfile(userId, { xp: newXP });
      
      res.json({ xpEarned, newXP });
    } catch (error) {
      console.error("Error awarding text generator XP:", error);
      res.status(500).json({ error: "Failed to award XP" });
    }
  });

  app.post("/api/flashcards/:id/review", async (req, res) => {
    try {
      const { id } = req.params;
      const { correct } = req.body;
      
      const updated = await storage.updateFlashcardReview(id, correct);
      res.json(updated);
    } catch (error) {
      console.error("Error updating flashcard:", error);
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFlashcard(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      res.status(500).json({ error: "Failed to delete flashcard" });
    }
  });

  // Seed initial vocabulary
  app.post("/api/flashcards/seed", async (req, res) => {
    try {
      
      // Essential Chinese vocabulary for beginners
      const starterVocabulary = [
        // Level 1 - Basic Greetings and Common Words
        { chinese: "你好", pinyin: "nǐ hǎo", english: "hello", level: 1 },
        { chinese: "谢谢", pinyin: "xiè xiè", english: "thank you", level: 1 },
        { chinese: "再见", pinyin: "zài jiàn", english: "goodbye", level: 1 },
        { chinese: "是", pinyin: "shì", english: "yes/to be", level: 1 },
        { chinese: "不", pinyin: "bù", english: "no/not", level: 1 },
        { chinese: "我", pinyin: "wǒ", english: "I/me", level: 1 },
        { chinese: "你", pinyin: "nǐ", english: "you", level: 1 },
        { chinese: "他", pinyin: "tā", english: "he/him", level: 1 },
        { chinese: "她", pinyin: "tā", english: "she/her", level: 1 },
        { chinese: "好", pinyin: "hǎo", english: "good", level: 1 },
        
        // Level 2 - Family and Numbers
        { chinese: "爸爸", pinyin: "bà ba", english: "father", level: 2 },
        { chinese: "妈妈", pinyin: "mā ma", english: "mother", level: 2 },
        { chinese: "朋友", pinyin: "péng yǒu", english: "friend", level: 2 },
        { chinese: "老师", pinyin: "lǎo shī", english: "teacher", level: 2 },
        { chinese: "学生", pinyin: "xué shēng", english: "student", level: 2 },
        { chinese: "一", pinyin: "yī", english: "one", level: 2 },
        { chinese: "二", pinyin: "èr", english: "two", level: 2 },
        { chinese: "三", pinyin: "sān", english: "three", level: 2 },
        { chinese: "十", pinyin: "shí", english: "ten", level: 2 },
        { chinese: "人", pinyin: "rén", english: "person/people", level: 2 },
        
        // Level 3 - Common Verbs and Places
        { chinese: "吃", pinyin: "chī", english: "to eat", level: 3 },
        { chinese: "喝", pinyin: "hē", english: "to drink", level: 3 },
        { chinese: "去", pinyin: "qù", english: "to go", level: 3 },
        { chinese: "来", pinyin: "lái", english: "to come", level: 3 },
        { chinese: "学习", pinyin: "xué xí", english: "to study", level: 3 },
        { chinese: "工作", pinyin: "gōng zuò", english: "to work", level: 3 },
        { chinese: "家", pinyin: "jiā", english: "home/family", level: 3 },
        { chinese: "学校", pinyin: "xué xiào", english: "school", level: 3 },
        { chinese: "中国", pinyin: "zhōng guó", english: "China", level: 3 },
        { chinese: "美国", pinyin: "měi guó", english: "America", level: 3 },
      ];
      
      const created = [];
      for (const word of starterVocabulary) {
        try {
          const flashcard = await storage.createFlashcard({
            userId: DEMO_USER_ID,
            chinese: word.chinese,
            pinyin: word.pinyin,
            english: word.english,
            source: "new",
            level: word.level,
          });
          created.push(flashcard);
        } catch (error) {
          // Skip if already exists
          console.log(`Flashcard already exists: ${word.chinese}`);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Added ${created.length} flashcards to your deck`,
        count: created.length 
      });
    } catch (error) {
      console.error("Error seeding flashcards:", error);
      res.status(500).json({ error: "Failed to seed flashcards" });
    }
  });

  // Voice Translation endpoint
  app.post("/api/translate/voice", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      // Use OpenAI to translate and get pinyin
      const prompt = `Translate the following Chinese text to English and provide pinyin. 
      Return ONLY a JSON object with this exact format:
      {
        "chinese": "the original Chinese text",
        "pinyin": "pinyin with tone marks",
        "english": "English translation"
      }
      
      Chinese text: ${text}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a Chinese language translator. Always return valid JSON in the exact format requested."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      res.json({
        chinese: result.chinese || text,
        pinyin: result.pinyin || "",
        english: result.english || ""
      });
    } catch (error) {
      console.error("Voice translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Voice Conversation endpoint for natural dialogue
  app.post("/api/conversation/voice", requireAuth, async (req: any, res) => {
    try {
      const { message, topic, difficulty, level, conversationHistory = [] } = req.body;
      
      // First, translate the user's message to get pinyin and English
      let userPinyin = "";
      let userEnglish = "";
      let pronunciationFeedback = {};
      
      try {
        const translationPrompt = `Translate this Chinese text and provide pinyin. Return JSON with exactly these fields:
{
  "pinyin": "pinyin with tones",
  "english": "English translation"
}

Text: ${message}`;

        const translationResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "You are a Chinese language translator. Always return valid JSON in the exact format requested."
            },
            { role: "user", content: translationPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        const translationResult = JSON.parse(translationResponse.choices[0].message.content || "{}");
        userPinyin = translationResult.pinyin || "";
        userEnglish = translationResult.english || "";
        
        // Analyze pronunciation and word choice
        const feedbackPrompt = `Analyze this Chinese sentence from a level ${level} learner:
"${message}" (${userPinyin})

Provide encouraging feedback in JSON:
{
  "pronunciationTips": ["1-2 specific tips for hard tones/sounds"],
  "wordChoiceSuggestions": ["1-2 suggestions for more natural phrasing"],
  "overallFeedback": "brief encouraging comment",
  "alternativePhrase": "more natural way to say it (if needed, else null)"
}`;

        const feedbackResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a supportive Chinese tutor. Be constructive and encouraging." },
            { role: "user", content: feedbackPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
        });

        pronunciationFeedback = JSON.parse(feedbackResponse.choices[0].message.content || "{}");
      } catch (e) {
        console.error("Failed to translate user message:", e);
      }
      
      // Build conversation context
      const contextMessages = conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Create system prompt for natural voice conversation with feedback
      const systemPrompt = `You are a native Mandarin Chinese teacher having a natural voice conversation with a student. 
Your personality: Friendly, patient, encouraging, and conversational.
Student level: ${level} (${difficulty})
Topic preference: ${topic}

IMPORTANT RULES FOR VOICE CONVERSATION:
1. Respond ONLY in Chinese characters (no pinyin or English in main response)
2. Keep responses natural and conversational, like real speech
3. Use short, clear sentences appropriate for ${difficulty} level
4. Be encouraging and supportive
5. Occasionally ask questions to keep conversation flowing
6. React naturally to what the student says
7. Use appropriate level vocabulary (HSK ${level <= 3 ? '1-2' : level <= 6 ? '3-4' : '5-6'})
8. Sound like a real person, not a textbook

After your Chinese response, provide a JSON block with this format:
\`\`\`json
{
  "pinyin": "pinyin transcription",
  "english": "English translation"
}
\`\`\``;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          { role: "system", content: systemPrompt },
          ...contextMessages,
          { role: "user", content: message }
        ],
        temperature: 0.8, // More natural conversation
        max_tokens: 200 // Keep responses concise for voice
      });

      const aiResponse = response.choices[0].message.content || "";
      
      // Parse the response to extract Chinese, pinyin, and English
      let chinese = aiResponse;
      let pinyin = "";
      let english = "";
      
      // Extract JSON block if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          pinyin = jsonData.pinyin || "";
          english = jsonData.english || "";
          // Remove JSON block from main message
          chinese = aiResponse.replace(/```json[\s\S]*?```/, "").trim();
        } catch (e) {
          console.error("Failed to parse JSON from response:", e);
        }
      }
      
      // Save conversation to storage
      await storage.createConversation({
        userId: req.userId,
        topic,
        difficulty,
        messages: [
          { role: "user", content: message, timestamp: new Date() },
          { role: "assistant", content: chinese, timestamp: new Date() }
        ]
      });
      
      res.json({ 
        message: chinese,
        pinyin,
        english,
        chinese,
        userMessage: {
          chinese: message,
          pinyin: userPinyin,
          english: userEnglish
        },
        feedback: pronunciationFeedback // Include pronunciation and word choice feedback
      });
    } catch (error) {
      console.error("Voice conversation error:", error);
      res.status(500).json({ error: "Failed to generate voice response" });
    }
  });

  // AI conversation endpoint
  app.post("/api/conversation", requireAuth, async (req: any, res) => {
    try {
      const { message, conversationId, topic, difficulty } = req.body;
      
      let conversation;
      if (conversationId) {
        const conversations = await storage.getConversations(req.userId);
        conversation = conversations.find(c => c.id === conversationId);
      }
      
      if (!conversation) {
        conversation = await storage.createConversation({
          userId: req.userId,
          topic: topic || "Free Conversation",
          difficulty: difficulty || "beginner",
          messages: []
        });
      }

      const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
      
      // Get user level to adjust difficulty
      const user = await storage.getUser(req.userId);
      const userLevel = user?.level || 1;
      
      // Adjust difficulty based on user level
      let adjustedDifficulty = difficulty;
      if (userLevel <= 3) adjustedDifficulty = "beginner";
      else if (userLevel <= 6) adjustedDifficulty = "intermediate";
      else adjustedDifficulty = "advanced";
      
      const systemPrompt = `You are Xiao Li (小李), a friendly and enthusiastic Chinese language tutor. Respond in comprehensive Chinese at ${adjustedDifficulty} level (HSK 1-2 for beginner, 3-4 for intermediate, 5-6 for advanced). The user is at level ${userLevel}.

Guidelines:
- Use rich, varied vocabulary appropriate for the ${difficulty} level
- Incorporate diverse sentence structures, idioms, and natural expressions  
- Include cultural context and practical, real-world phrases
- Ask engaging follow-up questions to encourage conversation
- Use descriptive language and varied grammatical patterns
- Make responses longer and more detailed than typical chatbot responses
- Include emotional expressions and conversational fillers for authenticity
- Provide educational value while maintaining natural conversation flow

Topic focus: ${topic || "Free Conversation"}
Create substantially more comprehensive responses with extensive vocabulary practice.`;

      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: message }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: chatMessages,
        max_tokens: 400,
      });

      const aiResponse = response.choices[0].message.content || "";
      
      // Add both user and AI messages to conversation
      const updatedMessages = [
        ...messages,
        { role: "user", content: message, timestamp: new Date() },
        { role: "assistant", content: aiResponse, timestamp: new Date() }
      ];

      await storage.updateConversation(conversation.id, { messages: updatedMessages });

      res.json({
        conversationId: conversation.id,
        response: aiResponse,
        messages: updatedMessages
      });
    } catch (error) {
      console.error("Conversation error:", error);
      res.status(500).json({ error: "Failed to process conversation" });
    }
  });

  // Vocabulary endpoints
  app.get("/api/vocabulary", requireAuth, async (req: any, res) => {
    try {
      const words = await storage.getVocabularyWords(req.userId);
      res.json(words);
    } catch (error) {
      console.error("Get vocabulary error:", error);
      res.status(500).json({ error: "Failed to get vocabulary" });
    }
  });

  app.get("/api/vocabulary/due", requireAuth, async (req: any, res) => {
    try {
      const words = await storage.getVocabularyWordsDue(req.userId);
      res.json(words);
    } catch (error) {
      console.error("Get due vocabulary error:", error);
      res.status(500).json({ error: "Failed to get due vocabulary" });
    }
  });

  app.post("/api/vocabulary", requireAuth, async (req: any, res) => {
    try {
      const wordData = insertVocabularyWordSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const word = await storage.createVocabularyWord(wordData);
      res.json(word);
    } catch (error) {
      console.error("Create vocabulary error:", error);
      res.status(500).json({ error: "Failed to create vocabulary word" });
    }
  });

  app.patch("/api/vocabulary/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { difficulty, successRate, timesReviewed } = req.body;
      
      // Calculate next review date based on difficulty
      const now = new Date();
      let nextReview = new Date(now);
      
      switch (difficulty) {
        case 'again':
          nextReview.setMinutes(now.getMinutes() + 1);
          break;
        case 'hard':
          nextReview.setHours(now.getHours() + 6);
          break;
        case 'good':
          nextReview.setDate(now.getDate() + 1);
          break;
        case 'easy':
          nextReview.setDate(now.getDate() + 4);
          break;
      }

      const updates = { 
        difficulty, 
        successRate, 
        timesReviewed, 
        nextReview: nextReview
      };
      
      const updatedWord = await storage.updateVocabularyWord(id, updates);
      
      // Award XP for reviewing flashcards (2 XP per review, 3 for easy, 1 for again)
      if (storage.addXpTransaction) {
        try {
          let xpAwarded = 2; // Base XP
          if (difficulty === 'easy') xpAwarded = 3;
          else if (difficulty === 'again') xpAwarded = 1;
          
          await storage.addXpTransaction(
            DEMO_USER_ID,
            xpAwarded,
            'flashcard_review',
            id,
            `Reviewed flashcard with ${difficulty} difficulty`
          );
        } catch (error) {
          console.error("Error awarding XP for flashcard review:", error);
        }
      }

      res.json(updatedWord);
    } catch (error) {
      console.error("Update vocabulary error:", error);
      res.status(500).json({ error: "Failed to update vocabulary word" });
    }
  });

  // PDF processing endpoint
  app.post("/api/pdf/process", async (req, res) => {
    try {
      const { filename, content } = req.body;
      
      // Split content into segments for highlighting
      const segments = content.split('').map((char: string, index: number) => ({
        character: char,
        index,
        translation: null,
        pinyin: null
      }));

      const document = await storage.createPdfDocument({
        userId: DEMO_USER_ID,
        filename,
        content,
        segments,
        pageCount: 1
      });

      res.json(document);
    } catch (error) {
      console.error("PDF processing error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  app.get("/api/pdf", async (req, res) => {
    try {
      const documents = await storage.getPdfDocuments(DEMO_USER_ID);
      res.json(documents);
    } catch (error) {
      console.error("Get PDF documents error:", error);
      res.status(500).json({ error: "Failed to get PDF documents" });
    }
  });

  // Media document routes for supporting multiple file types
  app.get("/api/media", async (req, res) => {
    try {
      const documents = await storage.getMediaDocuments(DEMO_USER_ID);
      res.json(documents);
    } catch (error) {
      console.error("Error getting media documents:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  app.post("/api/media/upload", async (req, res) => {
    try {
      // For now, return a simple upload URL that points back to our server
      // This avoids CORS issues with direct Google Cloud Storage uploads
      const uploadId = randomUUID();
      const uploadURL = `${req.protocol}://${req.get('host')}/api/media/upload/${uploadId}`;
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  
  // Handle actual file upload - properly handle CORS
  app.options("/api/media/upload/:uploadId", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
  });
  
  app.put("/api/media/upload/:uploadId", async (req, res) => {
    try {
      // Set CORS headers
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "PUT, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      
      const { uploadId } = req.params;
      
      // Collect the raw body data
      const chunks: Buffer[] = [];
      let totalSize = 0;
      
      req.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });
      
      req.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || 'application/octet-stream';
        
        // Store the uploaded file in memory
        const fileData = {
          id: uploadId,
          buffer: buffer,
          size: buffer.length,
          contentType: contentType,
          uploadedAt: new Date()
        };
        
        uploadedFiles.set(uploadId, fileData);
        
        // Log successful upload
        console.log(`File upload successful - ID: ${uploadId}, Size: ${buffer.length} bytes, Type: ${contentType}`);
        
        // Return success response with upload details
        const fileUrl = `${req.protocol}://${req.get('host')}/api/media/files/${uploadId}`;
        res.json({ 
          success: true, 
          uploadId,
          fileUrl,
          size: buffer.length,
          contentType
        });
      });
      
      req.on('error', (error) => {
        console.error("Upload stream error:", error);
        res.status(500).json({ error: "Upload failed" });
      });
    } catch (error) {
      console.error("Error handling file upload:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Direct file upload endpoint using multipart form data
  app.post("/api/media/upload-direct", async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      let boundary: string | null = null;
      
      // Extract boundary from content-type
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (boundaryMatch) {
        boundary = boundaryMatch[1];
      }
      
      // Collect all data
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      req.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        if (!boundary) {
          return res.status(400).json({ error: "No boundary found in multipart data" });
        }
        
        // Parse multipart form data
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const parts: Buffer[] = [];
        let start = 0;
        
        while (start < buffer.length) {
          const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
          if (boundaryIndex === -1) break;
          
          const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
          if (nextBoundaryIndex === -1) {
            // Last part
            const part = buffer.slice(boundaryIndex + boundaryBuffer.length);
            if (part.length > 4) { // Has content
              parts.push(part);
            }
            break;
          }
          
          const part = buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex);
          parts.push(part);
          start = nextBoundaryIndex;
        }
        
        if (parts.length === 0) {
          return res.status(400).json({ error: "No file data found" });
        }
        
        // Process the first file part
        const filePart = parts[0];
        const headerEnd = filePart.indexOf(Buffer.from('\r\n\r\n'));
        
        if (headerEnd === -1) {
          return res.status(400).json({ error: "Invalid multipart data" });
        }
        
        const headers = filePart.slice(0, headerEnd).toString();
        const fileData = filePart.slice(headerEnd + 4, -2); // Remove trailing \r\n
        
        // Extract content type
        const contentTypeMatch = headers.match(/Content-Type: (.*)/i);
        const fileContentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
        
        // Extract filename
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'upload';
        
        // Generate unique ID
        const uploadId = randomUUID();
        
        // Store file in memory
        const fileInfo = {
          id: uploadId,
          buffer: fileData,
          size: fileData.length,
          contentType: fileContentType,
          uploadedAt: new Date()
        };
        
        uploadedFiles.set(uploadId, fileInfo);
        
        console.log(`Direct file upload successful - ID: ${uploadId}, Size: ${fileData.length} bytes, Type: ${fileContentType}`);
        
        // Return success response
        res.json({
          success: true,
          uploadId,
          fileUrl: `${req.protocol}://${req.get('host')}/api/media/files/${uploadId}`,
          size: fileData.length,
          contentType: fileContentType,
          filename
        });
      });
      
      req.on('error', (error) => {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
      });
    } catch (error) {
      console.error("Error handling direct upload:", error);
      res.status(500).json({ error: "Failed to handle upload" });
    }
  });

  // Serve uploaded files from memory
  app.get("/api/media/files/:uploadId", (req, res) => {
    const { uploadId } = req.params;
    const fileData = uploadedFiles.get(uploadId);
    
    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', fileData.contentType);
    res.setHeader('Content-Length', fileData.size.toString());
    
    // Send the file buffer
    res.send(fileData.buffer);
  });

  app.post("/api/media", async (req, res) => {
    try {
      const result = insertMediaDocumentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid media document data", details: result.error.issues });
      }

      const mediaDoc = await storage.createMediaDocument(
        DEMO_USER_ID,
        {
          filename: result.data.filename,
          fileType: result.data.fileType,
          mimeType: result.data.mimeType,
          fileUrl: result.data.fileUrl,
          fileSize: result.data.fileSize,
          content: result.data.content,
          segments: result.data.segments,
          pageCount: result.data.pageCount,
          duration: result.data.duration,
          thumbnailUrl: result.data.thumbnailUrl,
          processedContent: result.data.processedContent
        }
      );

      res.status(201).json(mediaDoc);
    } catch (error) {
      console.error("Error creating media document:", error);
      res.status(500).json({ error: "Failed to create media document" });
    }
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const document = await storage.getMediaDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error getting media document:", error);
      res.status(500).json({ error: "Failed to get document" });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const success = await storage.deleteMediaDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Object storage routes for file serving
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // User profile endpoints
  app.get("/api/user/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId; // Get actual authenticated user ID
      let user = await storage.getUser(userId);
      
      if (!user) {
        // This shouldn't happen since user was created during signup
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update streak if needed
      user = await storage.updateUserStreak(userId) || user;
      
      // Handle hearts regeneration
      let nextHeartInSeconds: number | null = null;
      
      if (user.hearts < (user.maxHearts || 5) && user.lastHeartLostAt) {
        const lastLost = new Date(user.lastHeartLostAt).getTime();
        const now = Date.now();
        const hoursPassed = Math.floor((now - lastLost) / (1000 * 60 * 60)); // Hours since last heart lost
        
        if (hoursPassed > 0) {
          const heartsToRegenerate = Math.min(hoursPassed, (user.maxHearts || 5) - user.hearts);
          const newHearts = user.hearts + heartsToRegenerate;
          
          user = await storage.updateUserProgress(userId, { 
            hearts: newHearts,
            // Update lastHeartLostAt to track remaining regeneration time
            lastHeartLostAt: heartsToRegenerate === (user.maxHearts || 5) - user.hearts 
              ? null // All hearts regenerated
              : new Date(lastLost + (heartsToRegenerate * 60 * 60 * 1000))
          }) || user;
        }
        
        // Calculate time until next heart (if still regenerating)
        if (user.lastHeartLostAt && user.hearts < (user.maxHearts || 5)) {
          const timeSinceLastHeart = now - new Date(user.lastHeartLostAt).getTime();
          const timeUntilNextHeart = (60 * 60 * 1000) - (timeSinceLastHeart % (60 * 60 * 1000)); // Time until next hour
          nextHeartInSeconds = Math.ceil(timeUntilNextHeart / 1000); // Convert to seconds
        }
      }
      
      console.log("Returning user profile:", { 
        id: user.id, 
        email: user.email,
        level: user.level, 
        hearts: user.hearts,
        assessmentCompleted: user.assessmentCompleted,
        nextHeartIn: nextHeartInSeconds,
        lastHeartLostAt: user.lastHeartLostAt
      });
      
      // Include nextHeartIn in the response
      const profileResponse = {
        ...user,
        nextHeartIn: nextHeartInSeconds
      };
      
      res.json(profileResponse);
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });
  
  // Temporary endpoint to reset assessment status for testing
  app.post("/api/user/reset-assessment", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.updateUserProgress(userId, { 
        assessmentCompleted: false,
        initialLevel: null,
        level: 1,
        xp: 0
      });
      res.json({ message: "Assessment status reset", user });
    } catch (error) {
      console.error("Error resetting assessment:", error);
      res.status(500).json({ error: "Failed to reset assessment" });
    }
  });

  // Assessment endpoints
  // Get assessment questions
  app.get("/api/assessment/questions", (req, res) => {
    // Return 12 harder assessment questions with varied types including pronunciation and sentence building
    const assessmentQuestions = [
      {
        id: "q1",
        type: "pronunciation",
        question: "Which character has the 3rd tone?",
        chinese: "",
        pinyin: "",
        english: "",
        options: ["好 (hǎo)", "吗 (ma)", "是 (shì)", "去 (qù)"],
        correctAnswer: "好 (hǎo)",
        level: 1
      },
      {
        id: "q2", 
        type: "sentence-building",
        question: "Put these words in the correct order to make: 'I am a student'",
        chinese: "我是学生",
        pinyin: "wǒ shì xuéshēng",
        english: "I am a student",
        options: ["学生/是/我", "我/是/学生", "是/我/学生", "我/学生/是"],
        correctAnswer: "我/是/学生",
        level: 2
      },
      {
        id: "q3",
        type: "tone-pair", 
        question: "Which word has the 4th tone followed by 1st tone?",
        chinese: "",
        pinyin: "",
        english: "",
        options: ["北京 (běijīng)", "上海 (shànghǎi)", "中国 (zhōngguó)", "美国 (měiguó)"],
        correctAnswer: "上海 (shànghǎi)",
        level: 3
      },
      {
        id: "q4",
        type: "sentence-building",
        question: "Complete the sentence: 我___中文 (I ___ Chinese)",
        chinese: "学",
        pinyin: "xué", 
        english: "study",
        options: ["学", "说", "写", "看"],
        correctAnswer: "学",
        level: 4
      },
      {
        id: "q5",
        type: "multiple-choice",
        question: "What is the meaning of this idiom?",
        chinese: "马马虎虎",
        pinyin: "mǎmǎhūhū",
        english: "so-so/careless",
        options: ["excellent", "so-so", "terrible", "quick"],
        correctAnswer: "so-so",
        level: 5
      },
      {
        id: "q6",
        type: "grammar", 
        question: "Choose the correct measure word: 一___书 (one book)",
        chinese: "本",
        pinyin: "běn",
        english: "measure word for books",
        options: ["个", "本", "张", "支"],
        correctAnswer: "本",
        level: 6
      },
      {
        id: "q7",
        type: "sentence-building",
        question: "Arrange to form: 'Although it's raining, I still want to go out'",
        chinese: "虽然下雨，我还是想出去",
        pinyin: "suīrán xiàyǔ, wǒ háishì xiǎng chūqù", 
        english: "Although it's raining, I still want to go out",
        options: ["虽然/下雨/我/还是/想/出去", "下雨/虽然/我/想/还是/出去", "我/虽然/下雨/还是/想/出去", "虽然/我/下雨/还是/想/出去"],
        correctAnswer: "虽然/下雨/我/还是/想/出去",
        level: 8
      },
      {
        id: "q8",
        type: "classical",
        question: "What does this classical Chinese phrase mean?",
        chinese: "学而时习之",
        pinyin: "xué ér shí xí zhī",
        english: "to learn and practice repeatedly", 
        options: ["to learn and practice repeatedly", "to teach others", "to forget quickly", "to study hard"],
        correctAnswer: "to learn and practice repeatedly",
        level: 10
      },
      {
        id: "q9",
        type: "complex-grammar",
        question: "Choose the sentence with correct 把 structure:",
        chinese: "把",
        pinyin: "bǎ",
        english: "ba structure",
        options: ["我把书看完了", "我看把书完了", "我看完把书了", "把我书看完了"],
        correctAnswer: "我把书看完了",
        level: 12
      },
      {
        id: "q10",
        type: "idiom",
        question: "Complete the chengyu: 一石___鸟 (kill two birds with one stone)",
        chinese: "二",
        pinyin: "èr",
        english: "two",
        options: ["一", "二", "三", "四"],
        correctAnswer: "二", 
        level: 15
      },
      {
        id: "q11",
        type: "formal-register",
        question: "Which is the most formal way to say 'thank you'?",
        chinese: "感谢您",
        pinyin: "gǎnxiè nín",
        english: "thank you (formal)",
        options: ["谢谢", "多谢", "感谢您", "谢了"],
        correctAnswer: "感谢您",
        level: 20
      },
      {
        id: "q12",
        type: "advanced-grammar",
        question: "Select the sentence using 不但...而且 correctly:",
        chinese: "不但...而且",
        pinyin: "bùdàn...érqiě",
        english: "not only...but also",
        options: [
          "他不但聪明而且努力",
          "他不但聪明而且也努力", 
          "不但他聪明而且努力",
          "他聪明不但而且努力"
        ],
        correctAnswer: "他不但聪明而且努力",
        level: 25
      }
    ];

    res.json(assessmentQuestions);
  });

  // Submit assessment and calculate level placement
  app.post("/api/assessment/submit", requireAuth, async (req: any, res) => {
    try {
      const { answers } = req.body;
      
      // Get assessment questions with full data for flashcard creation (updated to match new harder questions)
      const fullAssessmentQuestions = [
        { id: "q1", chinese: "好", pinyin: "hǎo", english: "good", correctAnswer: "好 (hǎo)", level: 1 },
        { id: "q2", chinese: "我是学生", pinyin: "wǒ shì xuéshēng", english: "I am a student", correctAnswer: "我/是/学生", level: 2 },
        { id: "q3", chinese: "上海", pinyin: "shànghǎi", english: "Shanghai", correctAnswer: "上海 (shànghǎi)", level: 3 },
        { id: "q4", chinese: "学", pinyin: "xué", english: "study", correctAnswer: "学", level: 4 },
        { id: "q5", chinese: "马马虎虎", pinyin: "mǎmǎhūhū", english: "so-so", correctAnswer: "so-so", level: 5 },
        { id: "q6", chinese: "本", pinyin: "běn", english: "measure word for books", correctAnswer: "本", level: 6 },
        { id: "q7", chinese: "虽然下雨，我还是想出去", pinyin: "suīrán xiàyǔ, wǒ háishì xiǎng chūqù", english: "Although it's raining, I still want to go out", correctAnswer: "虽然/下雨/我/还是/想/出去", level: 8 },
        { id: "q8", chinese: "学而时习之", pinyin: "xué ér shí xí zhī", english: "to learn and practice repeatedly", correctAnswer: "to learn and practice repeatedly", level: 10 },
        { id: "q9", chinese: "我把书看完了", pinyin: "wǒ bǎ shū kàn wán le", english: "I finished reading the book", correctAnswer: "我把书看完了", level: 12 },
        { id: "q10", chinese: "一石二鸟", pinyin: "yī shí èr niǎo", english: "kill two birds with one stone", correctAnswer: "二", level: 15 },
        { id: "q11", chinese: "感谢您", pinyin: "gǎnxiè nín", english: "thank you (formal)", correctAnswer: "感谢您", level: 20 },
        { id: "q12", chinese: "不但...而且", pinyin: "bùdàn...érqiě", english: "not only...but also", correctAnswer: "他不但聪明而且努力", level: 25 }
      ];

      // Calculate score and save wrong answers as flashcards
      let correctAnswers = 0;
      const userId = req.userId; // Get authenticated user ID from session
      
      for (const question of fullAssessmentQuestions) {
        if (answers[question.id] === question.correctAnswer) {
          correctAnswers++;
        } else {
          // Save wrong answer as flashcard
          try {
            await storage.createFlashcard({
              userId,
              chinese: question.chinese,
              pinyin: question.pinyin,
              english: question.english,
              source: "assessment",
              level: question.level,
            });
          } catch (error) {
            console.error("Error creating flashcard for wrong answer:", error);
          }
        }
      }

      const score = correctAnswers;
      const percentage = Math.round((score / 12) * 100); // Now 12 questions instead of 10
      
      // Determine level based on score with skill-based placement - capped at HSK 5 (level 50)
      let placementLevel = 1;
      if (score >= 12) {
        placementLevel = 50; // Perfect score = HSK 5 (max)
      } else if (score >= 11) {
        placementLevel = 45; // HSK 5 intermediate
      } else if (score >= 10) {
        placementLevel = 40; // HSK 4 advanced
      } else if (score >= 9) {
        placementLevel = 35; // HSK 4 intermediate
      } else if (score >= 8) {
        placementLevel = 30; // HSK 3 advanced
      } else if (score >= 7) {
        placementLevel = 25; // HSK 3 intermediate
      } else if (score >= 6) {
        placementLevel = 20; // HSK 2 advanced
      } else if (score >= 5) {
        placementLevel = 15; // HSK 2 intermediate
      } else if (score >= 4) {
        placementLevel = 10; // HSK 1 advanced
      } else if (score >= 3) {
        placementLevel = 7; // HSK 1 intermediate
      } else if (score >= 2) {
        placementLevel = 5; // HSK 1 beginner
      } else if (score >= 1) {
        placementLevel = 3; // HSK 1 entry
      } else {
        placementLevel = 1; // Absolute beginner
      }

      // Update user profile with new level and mark assessment as completed
      const currentProfile = await storage.getUser(userId);
      
      // Only update level if placement level is higher than current level
      const finalLevel = Math.max(currentProfile?.level || 1, placementLevel);
      
      await storage.updateUserProgress(userId, {
        level: finalLevel,
        assessmentCompleted: true,
        xp: finalLevel * 100, // Give starting XP based on level
        xpToNextLevel: (finalLevel + 1) * 100
      });

      // Generate recommendations based on score
      let recommendations = [];
      if (score >= 9) {
        recommendations = [
          "Practice advanced reading comprehension",
          "Focus on idiomatic expressions and cultural nuances", 
          "Engage in complex conversation practice"
        ];
      } else if (score >= 7) {
        recommendations = [
          "Strengthen intermediate grammar patterns",
          "Expand vocabulary through reading practice",
          "Practice speaking and pronunciation"
        ];
      } else if (score >= 5) {
        recommendations = [
          "Review fundamental grammar structures",
          "Build core vocabulary systematically", 
          "Practice basic conversation skills"
        ];
      } else {
        recommendations = [
          "Start with character recognition and basic vocabulary",
          "Learn essential phrases for daily communication",
          "Focus on pronunciation and tones"
        ];
      }

      const result = {
        score,
        level: finalLevel, // Use the final level (which could be higher than placement)
        placementLevel, // Include the placement level from assessment
        levelMaintained: finalLevel > placementLevel, // True if we kept their higher level
        percentage,
        recommendations
      };

      res.json(result);
    } catch (error) {
      console.error("Assessment submission error:", error);
      res.status(500).json({ error: "Failed to process assessment" });
    }
  });

  app.post("/api/assessment/complete", requireAuth, async (req: any, res) => {
    try {
      const { score, totalQuestions, correctAnswers, recommendedLevel, strengths, weaknesses } = req.body;
      const userId = req.userId;
      
      console.log("Assessment complete request:", { userId, recommendedLevel });
      
      // Save assessment result
      const result = await storage.saveAssessmentResult({
        userId,
        score,
        totalQuestions,
        correctAnswers,
        recommendedLevel,
        strengths,
        weaknesses
      });
      
      // Update user profile with assessment results
      // Always set the level from assessment (trust the assessment result)
      const currentUser = await storage.getUser(userId);
      console.log("Current user before update:", currentUser);
      
      const updatedUser = await storage.updateUserProgress(userId, {
        assessmentCompleted: true,
        initialLevel: recommendedLevel,
        level: recommendedLevel, // Always use assessment result
        xp: recommendedLevel * 100, // Give bonus XP based on level
        xpToNextLevel: 500 + (recommendedLevel * 100)
      });
      
      console.log("Updated user after assessment:", updatedUser);
      
      res.json({ ...result, updatedUser });
    } catch (error) {
      console.error("Error saving assessment:", error);
      res.status(500).json({ error: "Failed to save assessment" });
    }
  });
  
  // Get all practice progress for level selection
  app.get("/api/practice/all-progress", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // For now, return empty progress (would be fetched from database in production)
      const progressByLevel: Record<number, any> = {};
      
      res.json(progressByLevel);
    } catch (error) {
      console.error("Error fetching all practice progress:", error);
      res.status(500).json({ error: "Failed to fetch practice progress" });
    }
  });

  // Practice endpoints
  app.get("/api/practice/questions/:level", async (req, res) => {
    try {
      const level = parseInt(req.params.level);
      
      // Generate practice questions based on level
      const questions = generatePracticeQuestions(level);
      
      res.json(questions);
    } catch (error) {
      console.error("Error getting practice questions:", error);
      res.status(500).json({ error: "Failed to get practice questions" });
    }
  });

  // Get practice progress for a specific level
  app.get("/api/practice/progress/:level", requireAuth, async (req: any, res) => {
    try {
      const level = parseInt(req.params.level);
      const userId = req.userId;
      
      const progress = await storage.getPracticeProgress(userId, level);
      
      res.json(progress || {
        currentQuestion: 1,
        correctAnswers: 0,
        incorrectAnswers: 0,
        answeredQuestions: []
      });
    } catch (error) {
      console.error("Error getting practice progress:", error);
      res.status(500).json({ error: "Failed to get practice progress" });
    }
  });

  // Save practice progress after each question
  app.post("/api/practice/progress/:level", requireAuth, async (req: any, res) => {
    try {
      const level = parseInt(req.params.level);
      const userId = req.userId;
      const progress = req.body;
      
      const savedProgress = await storage.savePracticeProgress(userId, level, progress);
      
      res.json(savedProgress);
    } catch (error) {
      console.error("Error saving practice progress:", error);
      res.status(500).json({ error: "Failed to save practice progress" });
    }
  });

  // Dev-only refill hearts endpoint
  app.post("/api/user/refill-hearts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Only allow for development account (specific user ID)
      if (user.id !== "user_1755801899558_2ufl5w4mb") {
        return res.status(403).json({ error: "Not authorized - dev only" });
      }
      
      // Refill hearts to 5
      const updatedUser = await storage.updateUserProgress(userId, { hearts: 5 });
      
      console.log("Hearts refilled for dev account:", user.email);
      res.json({ 
        success: true, 
        hearts: 5,
        message: "Hearts refilled successfully"
      });
    } catch (error) {
      console.error("Error refilling hearts:", error);
      res.status(500).json({ error: "Failed to refill hearts" });
    }
  });

  // Hearts management endpoint
  app.post("/api/user/hearts", requireAuth, async (req: any, res) => {
    try {
      const { heartsChange } = req.body;
      const userId = req.userId;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const newHearts = Math.max(0, Math.min(user.maxHearts || 5, (user.hearts || 5) + heartsChange));
      
      // Update hearts and track when lost
      const updates: any = { hearts: newHearts };
      if (heartsChange < 0) {
        updates.lastHeartLostAt = new Date();
      }
      
      await storage.updateUserProgress(userId, updates);
      
      res.json({ hearts: newHearts });
    } catch (error) {
      console.error("Error updating hearts:", error);
      res.status(500).json({ error: "Failed to update hearts" });
    }
  });

  // Level up endpoint for auto-advancement
  app.post("/api/user/level-up", requireAuth, async (req: any, res) => {
    try {
      const { newLevel, reason } = req.body;
      const userId = req.userId;
      
      // Update user level
      await storage.updateUserProgress(userId, {
        level: newLevel
      });
      
      res.json({ success: true, newLevel, reason });
    } catch (error) {
      console.error("Level up error:", error);
      res.status(500).json({ error: "Failed to update level" });
    }
  });

  app.post("/api/practice/answer", requireAuth, async (req: any, res) => {
    try {
      const { questionType, level, correct, xpEarned } = req.body;
      const userId = req.userId;
      
      // Add XP to user
      await storage.addXpToUser(userId, xpEarned);
      
      // Update statistics
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUserProgress(userId, {
          lessonsCompleted: user.lessonsCompleted + 1
        });
      }
      
      res.json({ success: true, xpEarned });
    } catch (error) {
      console.error("Error recording practice answer:", error);
      res.status(500).json({ error: "Failed to record answer" });
    }
  });

  // Save practice session and handle level progression
  app.post("/api/practice/save-session", requireAuth, async (req: any, res) => {
    try {
      const { level, questionsAnswered, correctAnswers, wrongAnswers, accuracy, xpEarned, timeSpent = 0 } = req.body;
      const userId = req.userId; // Get authenticated user ID
      
      // Import sticker system functions
      const { generateLootBoxContents, ANIMAL_STICKERS } = await import("./stickerSystem");
      
      // Get user's level before awarding XP
      const userBeforeXP = await storage.getUser(userId);
      const levelBefore = userBeforeXP?.level || 1;
      
      // Award XP to user
      const updatedUser = await storage.addXpToUser(userId, xpEarned);
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      // Check if user leveled up from the XP gain (regardless of which practice level they're on)
      let newLevel = updatedUser.level;
      let earnedReward = null;
      let newStickers: any[] = [];
      
      // User leveled up if their new level is higher than before
      const leveledUp = newLevel > levelBefore;
      
      if (leveledUp) {
        // User reached a new global level!
        console.log(`User leveled up from ${levelBefore} to ${newLevel}!`);
        
        // Update lessons completed count
        await storage.updateUserProgress(userId, {
          lessonsCompleted: updatedUser.lessonsCompleted + 1
        });
        
        // Check if this is a debug level up (should get legendary sticker)
        const globalWithDebug = global as any;
        const isDebugLevelUp = globalWithDebug.debugLevelUpUsers && globalWithDebug.debugLevelUpUsers.has(userId);
        
        // Award sticker box for leveling up
        let lootBoxContents;
        if (isDebugLevelUp) {
          // For debug level ups, guarantee a legendary sticker (excluding 0 probability ones like Flow Dolphin)
          const legendaryStickers = ANIMAL_STICKERS.filter(s => 
            s.rarity === 'legendary' && s.probability > 0
          );
          const randomLegendary = legendaryStickers[Math.floor(Math.random() * legendaryStickers.length)];
          lootBoxContents = [randomLegendary.id];
          console.log(`DEBUG Level ${newLevel} reached! Awarding legendary sticker: ${randomLegendary.name}`);
          
          // Clear the debug flag
          globalWithDebug.debugLevelUpUsers.delete(userId);
        } else {
          // Normal level up sticker generation
          lootBoxContents = generateLootBoxContents(newLevel);
          console.log(`Level ${newLevel} reached! Opening sticker box with ${lootBoxContents.length} sticker(s)`);
        }
        
        // Grant each sticker to the user
        for (const stickerId of lootBoxContents) {
          try {
            await storage.awardSticker(userId, stickerId);
            const stickerInfo = ANIMAL_STICKERS.find(s => s.id === stickerId);
            if (stickerInfo) {
              newStickers.push(stickerInfo);
            }
          } catch (error) {
            console.error(`Error granting sticker ${stickerId}:`, error);
          }
        }
        
        // Check if there's a reward for completing this level
        if (storage.getAllRewards && storage.grantReward) {
          const allRewards = await storage.getAllRewards();
          const levelReward = allRewards.find((r: any) => 
            r.requiredLevel === level && r.requiredAction === 'complete_level'
          );
          
          if (levelReward) {
            try {
              earnedReward = await storage.grantReward(userId, levelReward.id);
              console.log(`Granted reward ${levelReward.name} to user ${userId} for completing level ${level}`);
            } catch (error) {
              console.error("Error granting reward:", error);
            }
          }
        }
      } else {
        // Just update lessons completed
        await storage.updateUserProgress(userId, {
          lessonsCompleted: updatedUser.lessonsCompleted + 1
        });
      }
      
      // Save practice session (if storage supports it)
      if (storage.createPracticeSession) {
        await storage.createPracticeSession({
          userId,
          sessionType: 'practice', // Add the required session_type field
          level,
          timeSpent: timeSpent, // Use the actual time spent from the frontend
          accuracy,
          questionsAnswered,
          correctAnswers,
          wrongAnswers,
          xpEarned,
          completedAt: new Date()
        });
      }
      
      const response = { 
        success: true, 
        xpEarned,
        newLevel,
        leveledUp: leveledUp, // Use the actual leveledUp flag based on global level change
        newStickers: newStickers, // Include the new stickers
        earnedReward,
        userProfile: {
          level: newLevel,
          xp: updatedUser.xp,
          xpToNextLevel: updatedUser.xpToNextLevel
        }
      };
      
      console.log(`Save-session response: leveledUp=${leveledUp}, newStickers=${newStickers.length}, stickers=`, newStickers.map(s => s.name));
      
      res.json(response);
    } catch (error) {
      console.error("Error saving practice session:", error);
      res.status(500).json({ error: "Failed to save practice session" });
    }
  });

  // Middleware to check if user is developer
  const requireDeveloper = async (req: any, res: any, next: any) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.email !== 'williamarvin111@gmail.com') {
        return res.status(403).json({ error: "Developer access only" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: "Failed to verify developer access" });
    }
  };

  // DEBUG ENDPOINT - Developer only instant level up
  app.post("/api/debug/instant-levelup", requireAuth, requireDeveloper, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Calculate XP needed to be just before next level
      // Give 99 XP into the current level so next practice triggers level up
      const currentLevel = currentUser.level;
      const targetXP = (currentLevel * 100) + 99; // 99 XP into current level
      
      // Update XP to be just before level up
      await storage.updateUserProgress(userId, {
        xp: targetXP,
        hearts: 5 // Also ensure hearts are full for testing
      });
      
      // Set a flag that next level up should include legendary sticker
      // Store in session or temporary memory
      const globalWithDebug = global as any;
      globalWithDebug.debugLevelUpUsers = globalWithDebug.debugLevelUpUsers || new Set();
      globalWithDebug.debugLevelUpUsers.add(userId);
      
      console.log(`DEBUG: Set user ${userId} to receive legendary sticker on next level up`);
      
      res.json({
        success: true,
        newLevel: currentLevel + 1,
        currentXP: 99,
        message: "Ready to level up! Complete ANY practice question to trigger the legendary loot box animation."
      });
    } catch (error) {
      console.error("Debug level up error:", error);
      res.status(500).json({ error: "Failed to prepare level up" });
    }
  });
  
  // DEBUG ENDPOINT - Developer only heart refill
  app.post("/api/debug/refill-hearts", requireAuth, requireDeveloper, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Refill hearts directly through storage
      const updatedUser = await storage.updateUserProgress(userId, {
        hearts: 5,
        lastHeartLostAt: null
      });
      
      console.log(`DEBUG: Refilled hearts for developer user ${userId} - now has 5 hearts`);
      
      res.json({
        success: true,
        hearts: 5,
        message: "Hearts refilled successfully!"
      });
    } catch (error) {
      console.error("Debug heart refill error:", error);
      res.status(500).json({ error: "Failed to refill hearts" });
    }
  });
  
  // DEBUG ENDPOINT - Developer only legendary loot box
  app.post("/api/debug/legendary-lootbox", requireAuth, requireDeveloper, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Import sticker system functions
      const { ANIMAL_STICKERS } = await import("./stickerSystem");
      
      // Get all legendary stickers EXCEPT those with 0 probability (like Flow Dolphin)
      const legendaryStickers = ANIMAL_STICKERS.filter(s => 
        s.rarity === 'legendary' && s.probability > 0
      );
      
      // Pick 1-2 random legendary stickers
      const numStickers = Math.random() > 0.5 ? 2 : 1;
      const selectedStickers: any[] = [];
      
      for (let i = 0; i < numStickers; i++) {
        const randomLegendary = legendaryStickers[Math.floor(Math.random() * legendaryStickers.length)];
        if (randomLegendary && !selectedStickers.find(s => s.id === randomLegendary.id)) {
          selectedStickers.push(randomLegendary);
          // Award the sticker to the user
          await storage.awardSticker(userId, randomLegendary.id);
        }
      }
      
      console.log(`DEBUG: Opened legendary loot box for user ${userId}, awarding ${selectedStickers.map(s => s.name).join(', ')}`);
      
      res.json({
        success: true,
        stickers: selectedStickers,
        message: "Legendary loot box opened!"
      });
    } catch (error) {
      console.error("Debug legendary loot box error:", error);
      res.status(500).json({ error: "Failed to open legendary loot box" });
    }
  });

  // Register rewards routes
  registerRewardsRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
