import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVocabularyWordSchema, insertConversationSchema, insertGeneratedTextSchema, insertPdfDocumentSchema } from "@shared/schema";
import OpenAI from "openai";

// Function to segment Chinese text into meaningful phrases
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
      
      // Break phrases at reasonable lengths (2-4 characters for common phrases)
      if (currentPhrase.length >= 2 && Math.random() > 0.7) {
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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for demo purposes
  const DEMO_USER_ID = "demo-user";

  // Text generation endpoint
  app.post("/api/generate-text", async (req, res) => {
    try {
      const { topic, difficulty, length } = req.body;
      
      const prompt = `Generate comprehensive, engaging Chinese text about "${topic}" at ${difficulty} level (HSK 1-2 for beginner, 3-4 for intermediate, 5-6 for advanced) with approximately ${length} characters. 

Requirements:
- Create rich, varied content with diverse vocabulary and sentence structures
- Include practical expressions, idioms, and colloquialisms used by native speakers
- Incorporate multiple grammatical patterns, tenses, and complex sentence structures
- Mix narrative, dialogue, and descriptive elements for engaging content
- Add cultural references, specific details (numbers, dates, places, names)
- Use advanced vocabulary appropriate for the difficulty level
- Include question forms, exclamations, and varied punctuation
- Make content contextually rich and educationally valuable
- Ensure natural flow and authentic Chinese expression patterns

Generate substantially more content than typical - create comprehensive, detailed text that provides extensive learning material.

Return only the Chinese text without any additional formatting or explanations.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      });

      const content = response.choices[0].message.content || "";
      
      // Split content into phrase segments for better translation
      const segments = segmentChineseText(content);

      const generatedText = await storage.createGeneratedText({
        userId: DEMO_USER_ID,
        topic,
        difficulty,
        content,
        segments
      });

      res.json(generatedText);
    } catch (error) {
      console.error("Text generation error:", error);
      res.status(500).json({ error: "Failed to generate text" });
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
      
      const systemPrompt = `You are Xiao Li (小李), a friendly and enthusiastic Chinese language tutor. Respond in comprehensive Chinese at ${difficulty} level (HSK 1-2 for beginner, 3-4 for intermediate, 5-6 for advanced).

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

      const updatedWord = await storage.updateVocabularyWord(id, {
        difficulty,
        successRate,
        timesReviewed,
        nextReview
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
