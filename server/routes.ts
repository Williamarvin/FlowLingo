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
function generatePracticeQuestions(level: number) {
  const questions = [];
  const questionTypes = ["multiple-choice", "translation"] as const;
  const usedWords = new Set<string>(); // Track words that have been used as correct answers
  
  // Level-based vocabulary
  const levelVocabulary: Record<number, Array<{chinese: string, pinyin: string, english: string}>> = {
    1: [
      { chinese: "你好", pinyin: "nǐ hǎo", english: "hello" },
      { chinese: "谢谢", pinyin: "xiè xiè", english: "thank you" },
      { chinese: "再见", pinyin: "zài jiàn", english: "goodbye" },
      { chinese: "是", pinyin: "shì", english: "yes/to be" },
      { chinese: "不", pinyin: "bù", english: "no/not" },
      { chinese: "我", pinyin: "wǒ", english: "I/me" },
      { chinese: "你", pinyin: "nǐ", english: "you" },
      { chinese: "他", pinyin: "tā", english: "he" },
      { chinese: "她", pinyin: "tā", english: "she" },
      { chinese: "们", pinyin: "men", english: "plural marker" }
    ],
    2: [
      { chinese: "吃", pinyin: "chī", english: "to eat" },
      { chinese: "喝", pinyin: "hē", english: "to drink" },
      { chinese: "看", pinyin: "kàn", english: "to look/watch" },
      { chinese: "听", pinyin: "tīng", english: "to listen" },
      { chinese: "说", pinyin: "shuō", english: "to speak" },
      { chinese: "读", pinyin: "dú", english: "to read" },
      { chinese: "写", pinyin: "xiě", english: "to write" },
      { chinese: "走", pinyin: "zǒu", english: "to walk" },
      { chinese: "来", pinyin: "lái", english: "to come" },
      { chinese: "去", pinyin: "qù", english: "to go" }
    ],
    3: [
      { chinese: "学习", pinyin: "xué xí", english: "to study" },
      { chinese: "工作", pinyin: "gōng zuò", english: "to work" },
      { chinese: "休息", pinyin: "xiū xi", english: "to rest" },
      { chinese: "旅行", pinyin: "lǚ xíng", english: "to travel" },
      { chinese: "购物", pinyin: "gòu wù", english: "to shop" },
      { chinese: "运动", pinyin: "yùn dòng", english: "to exercise" },
      { chinese: "游泳", pinyin: "yóu yǒng", english: "to swim" },
      { chinese: "跑步", pinyin: "pǎo bù", english: "to run" },
      { chinese: "唱歌", pinyin: "chàng gē", english: "to sing" },
      { chinese: "跳舞", pinyin: "tiào wǔ", english: "to dance" }
    ],
    4: [
      { chinese: "电脑", pinyin: "diàn nǎo", english: "computer" },
      { chinese: "手机", pinyin: "shǒu jī", english: "mobile phone" },
      { chinese: "朋友", pinyin: "péng yǒu", english: "friend" },
      { chinese: "家人", pinyin: "jiā rén", english: "family" },
      { chinese: "老师", pinyin: "lǎo shī", english: "teacher" },
      { chinese: "学生", pinyin: "xué shēng", english: "student" },
      { chinese: "医生", pinyin: "yī shēng", english: "doctor" },
      { chinese: "办公室", pinyin: "bàn gōng shì", english: "office" },
      { chinese: "公司", pinyin: "gōng sī", english: "company" },
      { chinese: "市场", pinyin: "shì chǎng", english: "market" }
    ],
    5: [
      { chinese: "发展", pinyin: "fā zhǎn", english: "develop" },
      { chinese: "经济", pinyin: "jīng jì", english: "economy" },
      { chinese: "文化", pinyin: "wén huà", english: "culture" },
      { chinese: "历史", pinyin: "lì shǐ", english: "history" },
      { chinese: "社会", pinyin: "shè huì", english: "society" },
      { chinese: "环境", pinyin: "huán jìng", english: "environment" },
      { chinese: "科技", pinyin: "kē jì", english: "technology" },
      { chinese: "教育", pinyin: "jiào yù", english: "education" },
      { chinese: "健康", pinyin: "jiàn kāng", english: "health" },
      { chinese: "安全", pinyin: "ān quán", english: "safety" }
    ],
    6: [
      { chinese: "国际", pinyin: "guó jì", english: "international" },
      { chinese: "政府", pinyin: "zhèng fǔ", english: "government" },
      { chinese: "管理", pinyin: "guǎn lǐ", english: "management" },
      { chinese: "投资", pinyin: "tóu zī", english: "investment" },
      { chinese: "市场营销", pinyin: "shì chǎng yíng xiāo", english: "marketing" },
      { chinese: "金融", pinyin: "jīn róng", english: "finance" },
      { chinese: "贸易", pinyin: "mào yì", english: "trade" },
      { chinese: "创新", pinyin: "chuàng xīn", english: "innovation" },
      { chinese: "合作", pinyin: "hé zuò", english: "cooperation" },
      { chinese: "竞争", pinyin: "jìng zhēng", english: "competition" }
    ],
    7: [
      { chinese: "全球化", pinyin: "quán qiú huà", english: "globalization" },
      { chinese: "可持续", pinyin: "kě chí xù", english: "sustainable" },
      { chinese: "数字化", pinyin: "shù zì huà", english: "digitalization" },
      { chinese: "人工智能", pinyin: "rén gōng zhì néng", english: "artificial intelligence" },
      { chinese: "大数据", pinyin: "dà shù jù", english: "big data" },
      { chinese: "云计算", pinyin: "yún jì suàn", english: "cloud computing" },
      { chinese: "物联网", pinyin: "wù lián wǎng", english: "Internet of Things" },
      { chinese: "区块链", pinyin: "qū kuài liàn", english: "blockchain" },
      { chinese: "自动化", pinyin: "zì dòng huà", english: "automation" },
      { chinese: "智能制造", pinyin: "zhì néng zhì zào", english: "smart manufacturing" }
    ],
    8: [
      { chinese: "战略规划", pinyin: "zhàn lüè guī huà", english: "strategic planning" },
      { chinese: "风险管理", pinyin: "fēng xiǎn guǎn lǐ", english: "risk management" },
      { chinese: "供应链", pinyin: "gōng yìng liàn", english: "supply chain" },
      { chinese: "品牌建设", pinyin: "pǐn pái jiàn shè", english: "brand building" },
      { chinese: "客户关系", pinyin: "kè hù guān xì", english: "customer relations" },
      { chinese: "市场研究", pinyin: "shì chǎng yán jiū", english: "market research" },
      { chinese: "产品开发", pinyin: "chǎn pǐn kāi fā", english: "product development" },
      { chinese: "质量控制", pinyin: "zhì liàng kòng zhì", english: "quality control" },
      { chinese: "成本效益", pinyin: "chéng běn xiào yì", english: "cost-effectiveness" },
      { chinese: "绩效评估", pinyin: "jì xiào píng gū", english: "performance evaluation" }
    ],
    9: [
      { chinese: "企业文化", pinyin: "qǐ yè wén huà", english: "corporate culture" },
      { chinese: "知识产权", pinyin: "zhī shí chǎn quán", english: "intellectual property" },
      { chinese: "跨文化交流", pinyin: "kuà wén huà jiāo liú", english: "cross-cultural communication" },
      { chinese: "社会责任", pinyin: "shè huì zé rèn", english: "social responsibility" },
      { chinese: "利益相关者", pinyin: "lì yì xiāng guān zhě", english: "stakeholder" },
      { chinese: "商业模式", pinyin: "shāng yè mó shì", english: "business model" },
      { chinese: "价值链", pinyin: "jià zhí liàn", english: "value chain" },
      { chinese: "竞争优势", pinyin: "jìng zhēng yōu shì", english: "competitive advantage" },
      { chinese: "市场细分", pinyin: "shì chǎng xì fēn", english: "market segmentation" },
      { chinese: "并购重组", pinyin: "bìng gòu chóng zǔ", english: "mergers and acquisitions" }
    ],
    10: [
      { chinese: "宏观经济政策", pinyin: "hóng guān jīng jì zhèng cè", english: "macroeconomic policy" },
      { chinese: "产业升级转型", pinyin: "chǎn yè shēng jí zhuǎn xíng", english: "industrial upgrading" },
      { chinese: "创新生态系统", pinyin: "chuàng xīn shēng tài xì tǒng", english: "innovation ecosystem" },
      { chinese: "数字化转型", pinyin: "shù zì huà zhuǎn xíng", english: "digital transformation" },
      { chinese: "可持续发展目标", pinyin: "kě chí xù fā zhǎn mù biāo", english: "sustainable development goals" },
      { chinese: "全球价值链", pinyin: "quán qiú jià zhí liàn", english: "global value chain" },
      { chinese: "风险评估框架", pinyin: "fēng xiǎn píng gū kuàng jià", english: "risk assessment framework" },
      { chinese: "企业社会责任报告", pinyin: "qǐ yè shè huì zé rèn bào gào", english: "CSR report" },
      { chinese: "人才培养战略", pinyin: "rén cái péi yǎng zhàn lüè", english: "talent development strategy" },
      { chinese: "技术创新驱动", pinyin: "jì shù chuàng xīn qū dòng", english: "technology innovation-driven" }
    ]
  };
  
  // Support all levels up to 10
  const maxLevel = Math.min(level, 10);
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
        authMethod: 'email',
        emailVerified: false,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        hearts: 5,
        maxHearts: 5,
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
    } catch (error) {
      console.error("Signup error:", error);
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
  
  // Google OAuth redirect endpoint
  app.get("/api/auth/google", (req, res) => {
    // For now, we'll use a simplified OAuth flow
    // In production, you'd use proper Google OAuth with redirect URLs
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Sign In - FlowLingo</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          h2 {
            color: #10b981;
            margin-bottom: 1rem;
          }
          .message {
            color: #666;
            margin: 1rem 0;
          }
          .btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 1rem;
          }
          .btn:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🐬 FlowLingo</h2>
          <div class="message">
            Google Sign-In is being set up.<br><br>
            For now, please use email and password to sign in.<br><br>
            If you're having trouble logging in after signing up, please try these steps:<br>
            1. Make sure you're using the exact email and password<br>
            2. Check for any typos or extra spaces<br>
            3. Try signing up with a different email if needed
          </div>
          <button class="btn" onclick="window.close()">Close Window</button>
        </div>
        <script>
          // Auto close after 5 seconds
          setTimeout(() => {
            window.close();
          }, 5000);
        </script>
      </body>
      </html>
    `;
    res.send(html);
  });
  
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ error: "Google token is required" });
      }
      
      // Verify Google token
      const googleUser = await verifyGoogleToken(idToken);
      if (!googleUser) {
        return res.status(401).json({ error: "Invalid Google token" });
      }
      
      // Get or create user
      const user = await getOrCreateGoogleUser(googleUser);
      
      // Create session
      const token = await createSession(user.id);
      
      // Set cookie and return user
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({ user: { id: user.id, email: user.email, username: user.username, profilePicture: user.profilePicture } });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ error: "Failed to authenticate with Google" });
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
  app.post("/api/generate-text", async (req, res) => {
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
        userId: DEMO_USER_ID,
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
            DEMO_USER_ID,
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
      const { text, speed = 0.8 } = req.body; // Default speed 0.8, can be overridden
      
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
      // Use OpenAI's TTS API
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // Nova is a natural-sounding voice good for language learning
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
  app.get("/api/flashcards", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const filter = req.query.filter as string || "all";
      
      const flashcards = await storage.getFlashcards(userId, filter);
      res.json(flashcards);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
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
  app.post("/api/conversation/voice", async (req, res) => {
    try {
      const { message, topic, difficulty, level, conversationHistory = [] } = req.body;
      
      // Build conversation context
      const contextMessages = conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Create system prompt for natural voice conversation
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
        userId: DEMO_USER_ID,
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
        chinese
      });
    } catch (error) {
      console.error("Voice conversation error:", error);
      res.status(500).json({ error: "Failed to generate voice response" });
    }
  });

  // AI conversation endpoint
  app.post("/api/conversation", async (req, res) => {
    try {
      const { message, conversationId, topic, difficulty } = req.body;
      
      let conversation;
      if (conversationId) {
        const conversations = await storage.getConversations(DEMO_USER_ID);
        conversation = conversations.find(c => c.id === conversationId);
      }
      
      if (!conversation) {
        conversation = await storage.createConversation({
          userId: DEMO_USER_ID,
          topic: topic || "Free Conversation",
          difficulty: difficulty || "beginner",
          messages: []
        });
      }

      const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
      
      // Get user level to adjust difficulty
      const user = await storage.getUser(DEMO_USER_ID);
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
  app.get("/api/vocabulary", async (req, res) => {
    try {
      const words = await storage.getVocabularyWords(DEMO_USER_ID);
      res.json(words);
    } catch (error) {
      console.error("Get vocabulary error:", error);
      res.status(500).json({ error: "Failed to get vocabulary" });
    }
  });

  app.get("/api/vocabulary/due", async (req, res) => {
    try {
      const words = await storage.getVocabularyWordsDue(DEMO_USER_ID);
      res.json(words);
    } catch (error) {
      console.error("Get due vocabulary error:", error);
      res.status(500).json({ error: "Failed to get due vocabulary" });
    }
  });

  app.post("/api/vocabulary", async (req, res) => {
    try {
      const wordData = insertVocabularyWordSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
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
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      let user = await storage.getUser(userId);
      
      if (!user) {
        // Create default user with the specific ID if doesn't exist
        user = await storage.createUser({
          id: userId,
          username: "demo",
          password: "demo"
        });
        console.log("Created new demo user with ID:", userId);
      }
      
      // Update streak if needed
      user = await storage.updateUserStreak(userId) || user;
      
      // Handle hearts regeneration
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
      }
      
      console.log("Returning user profile:", { 
        id: user.id, 
        level: user.level, 
        hearts: user.hearts,
        assessmentCompleted: user.assessmentCompleted 
      });
      res.json(user);
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });
  
  // Temporary endpoint to reset assessment status for testing
  app.post("/api/user/reset-assessment", async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
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
    // Return 10 assessment questions of varying difficulty
    const assessmentQuestions = [
      {
        id: "q1",
        type: "multiple-choice",
        question: "What does this character mean?",
        chinese: "你",
        pinyin: "nǐ",
        english: "you",
        options: ["hello", "you", "good", "thank you"],
        correctAnswer: "you",
        level: 1
      },
      {
        id: "q2", 
        type: "translation",
        question: "Choose the correct translation:",
        chinese: "你好",
        pinyin: "nǐ hǎo",
        english: "hello",
        options: ["你好", "再见", "谢谢", "对不起"],
        correctAnswer: "你好",
        level: 1
      },
      {
        id: "q3",
        type: "multiple-choice", 
        question: "What does this mean?",
        chinese: "学生",
        pinyin: "xuéshēng",
        english: "student",
        options: ["teacher", "student", "school", "book"],
        correctAnswer: "student",
        level: 2
      },
      {
        id: "q4",
        type: "translation",
        question: "How do you say 'thank you'?",
        chinese: "谢谢",
        pinyin: "xièxie", 
        english: "thank you",
        options: ["谢谢", "你好", "再见", "对不起"],
        correctAnswer: "谢谢",
        level: 2
      },
      {
        id: "q5",
        type: "multiple-choice",
        question: "What is the meaning?",
        chinese: "工作",
        pinyin: "gōngzuò",
        english: "work/job",
        options: ["home", "work", "food", "money"],
        correctAnswer: "work",
        level: 3
      },
      {
        id: "q6",
        type: "translation", 
        question: "Choose the correct Chinese:",
        chinese: "我很忙",
        pinyin: "wǒ hěn máng",
        english: "I am very busy",
        options: ["我很好", "我很忙", "我很累", "我很饿"],
        correctAnswer: "我很忙",
        level: 4
      },
      {
        id: "q7",
        type: "multiple-choice",
        question: "What does this phrase mean?",
        chinese: "经济发展",
        pinyin: "jīngjì fāzhǎn", 
        english: "economic development",
        options: ["social progress", "economic development", "cultural exchange", "political reform"],
        correctAnswer: "economic development",
        level: 6
      },
      {
        id: "q8",
        type: "translation",
        question: "Select the correct translation:",
        chinese: "环境保护",
        pinyin: "huánjìng bǎohù",
        english: "environmental protection", 
        options: ["环境保护", "经济发展", "社会进步", "文化交流"],
        correctAnswer: "环境保护",
        level: 7
      },
      {
        id: "q9",
        type: "multiple-choice",
        question: "What is the meaning of this idiom?",
        chinese: "画蛇添足",
        pinyin: "huà shé tiān zú",
        english: "to gild the lily (unnecessary addition)",
        options: ["to work hard", "to gild the lily", "to be careful", "to save money"],
        correctAnswer: "to gild the lily",
        level: 9
      },
      {
        id: "q10",
        type: "translation",
        question: "Choose the correct idiom:",
        chinese: "亡羊补牢",
        pinyin: "wáng yáng bǔ láo",
        english: "better late than never",
        options: ["亡羊补牢", "画蛇添足", "井底之蛙", "守株待兔"],
        correctAnswer: "亡羊补牢", 
        level: 10
      }
    ];

    res.json(assessmentQuestions);
  });

  // Submit assessment and calculate level placement
  app.post("/api/assessment/submit", async (req, res) => {
    try {
      const { answers } = req.body;
      
      // Get assessment questions with full data for flashcard creation
      const fullAssessmentQuestions = [
        { id: "q1", chinese: "你", pinyin: "nǐ", english: "you", correctAnswer: "you", level: 1 },
        { id: "q2", chinese: "你好", pinyin: "nǐ hǎo", english: "hello", correctAnswer: "你好", level: 1 },
        { id: "q3", chinese: "学生", pinyin: "xué shēng", english: "student", correctAnswer: "student", level: 2 },
        { id: "q4", chinese: "谢谢", pinyin: "xiè xiè", english: "thank you", correctAnswer: "谢谢", level: 2 },
        { id: "q5", chinese: "工作", pinyin: "gōng zuò", english: "work", correctAnswer: "work", level: 3 },
        { id: "q6", chinese: "我很忙", pinyin: "wǒ hěn máng", english: "I am very busy", correctAnswer: "我很忙", level: 4 },
        { id: "q7", chinese: "经济发展", pinyin: "jīng jì fā zhǎn", english: "economic development", correctAnswer: "economic development", level: 6 },
        { id: "q8", chinese: "环境保护", pinyin: "huán jìng bǎo hù", english: "environmental protection", correctAnswer: "环境保护", level: 7 },
        { id: "q9", chinese: "画蛇添足", pinyin: "huà shé tiān zú", english: "to gild the lily", correctAnswer: "to gild the lily", level: 9 },
        { id: "q10", chinese: "亡羊补牢", pinyin: "wáng yáng bǔ láo", english: "better late than never", correctAnswer: "亡羊补牢", level: 10 }
      ];

      // Calculate score and save wrong answers as flashcards
      let correctAnswers = 0;
      const userId = "demo-user"; // Replace with actual user ID from session
      
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
      const percentage = Math.round((score / 10) * 100);
      
      // Determine level based on score with skill-based placement
      let placementLevel = 1;
      if (score >= 10) {
        placementLevel = 10;
      } else if (score >= 9) {
        placementLevel = 9;
      } else if (score >= 8) {
        placementLevel = 7;
      } else if (score >= 7) {
        placementLevel = 5;
      } else if (score >= 6) {
        placementLevel = 3;
      } else if (score >= 4) {
        placementLevel = 2;
      } else {
        placementLevel = 1;
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

  app.post("/api/assessment/complete", async (req, res) => {
    try {
      const { userId, score, totalQuestions, correctAnswers, recommendedLevel, strengths, weaknesses } = req.body;
      
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
  app.get("/api/practice/progress/:level", async (req, res) => {
    try {
      const level = parseInt(req.params.level);
      const userId = DEMO_USER_ID;
      
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
  app.post("/api/practice/progress/:level", async (req, res) => {
    try {
      const level = parseInt(req.params.level);
      const userId = DEMO_USER_ID;
      const progress = req.body;
      
      const savedProgress = await storage.savePracticeProgress(userId, level, progress);
      
      res.json(savedProgress);
    } catch (error) {
      console.error("Error saving practice progress:", error);
      res.status(500).json({ error: "Failed to save practice progress" });
    }
  });

  // Hearts management endpoint
  app.post("/api/user/hearts", async (req, res) => {
    try {
      const { heartsChange } = req.body;
      const userId = DEMO_USER_ID;
      
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
  app.post("/api/user/level-up", async (req, res) => {
    try {
      const { userId, newLevel, reason } = req.body;
      
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

  app.post("/api/practice/answer", async (req, res) => {
    try {
      const { userId, questionType, level, correct, xpEarned } = req.body;
      
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
  app.post("/api/practice/save-session", async (req, res) => {
    try {
      const { level, questionsAnswered, correctAnswers, wrongAnswers, accuracy, xpEarned, timeSpent = 0 } = req.body;
      const userId = DEMO_USER_ID; // Using demo user for now
      
      // Award XP to user
      const updatedUser = await storage.addXpToUser(userId, xpEarned);
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      // Check if user completed the level with good accuracy (80% or higher)
      // and advance to next level if so
      let newLevel = updatedUser.level;
      let earnedReward = null;
      
      if (accuracy >= 80 && level === updatedUser.level) {
        // User completed their current level with good accuracy, advance to next level
        newLevel = level + 1;
        await storage.updateUserProgress(userId, {
          level: newLevel,
          lessonsCompleted: updatedUser.lessonsCompleted + 1
        });
        
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
      
      res.json({ 
        success: true, 
        xpEarned,
        newLevel,
        leveledUp: newLevel > level,
        earnedReward,
        userProfile: {
          level: newLevel,
          xp: updatedUser.xp,
          xpToNextLevel: updatedUser.xpToNextLevel
        }
      });
    } catch (error) {
      console.error("Error saving practice session:", error);
      res.status(500).json({ error: "Failed to save practice session" });
    }
  });

  // Register rewards routes
  registerRewardsRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
