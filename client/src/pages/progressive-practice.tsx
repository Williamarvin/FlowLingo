import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: number;
  type: "multiple-choice" | "translation" | "matching" | "listening";
  question: string;
  chinese: string;
  english: string;
  pinyin: string;
  options?: string[];
  correctAnswer: string | number;
  audio?: string;
  image?: string;
  xp: number;
}

export default function ProgressivePractice() {
  const [, navigate] = useLocation();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showDifficultyOption, setShowDifficultyOption] = useState(false);
  
  // Calculate XP needed for next level (100 XP per level)
  const xpPerLevel = 100;
  const currentLevelXp = xp % xpPerLevel;
  const xpToNextLevel = xpPerLevel - currentLevelXp;
  
  // Calculate questions needed to reach next level (assuming 10 XP per question)
  const xpPerQuestion = 10;
  const questionsToNextLevel = Math.ceil(xpToNextLevel / xpPerQuestion);
  const [incorrectSound] = useState(new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE"));
  const [correctSound] = useState(new Audio("data:audio/wav;base64,UklGRiQGAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAGAAD/////AAECAgIBAAAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgICAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAP////7//wAAAAABAAEBAQEAAP///v7+/wAAAgABAAEBAQEBAP/////+/wEBAAEAAQABAAEBAQD//v7+//8AAAEBAQD/AAEBAQEAAP////7//wAAAQEBAAEAAQEBAQAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgIBAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAP////7//wAAAAABAAEBAQEAAP///v7+/wAAAgABAAEBAQEBAP/////+/wEBAAEAAQABAAEBAQD//v7+//8AAAEBAQD/AAEBAQEAAP////7//wAAAQEBAAEAAQEBAQAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgICAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAP////7//wAAAAABAAEBAQEAAP///v7+/wAAAgABAAEBAQEBAP/////+/wEBAAEAAQABAAEBAQD//v7+//8AAAEBAQD/AAEBAQEAAP////7//wAAAQEBAAEAAQEBAQAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgIBAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAP////7//wAAAAABAAEBAQEAAP///v7+/wAAAgABAAEBAQEBAP/////+/wEBAAEAAQABAAEBAQD//v7+//8AAAEBAQD/AAEBAQEAAP////7//wAAAQEBAAEAAQEBAQAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgICAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAP////7//wAAAAABAAEBAQEAAP///v7+/wAAAgABAAEBAQEBAP/////+/wEBAAEAAQABAAEBAQD//v7+//8AAAEBAQD/AAEBAQEAAP////7//wAAAQEBAAEAAQEBAQAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgIBAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAP////7//wAAAAABAAEBAQEAAP///v7+/wAAAgABAAEBAQEBAP/////+/wEBAAEAAQABAAEBAQD//v7+//8AAAEBAQD/AAEBAQEAAP////7//wAAAQEBAAEAAQEBAQAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgICAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAP////7//wAAAAABAAEBAQEAAP///v7+/wAAAgABAAEBAQEBAP/////+/wEBAAEAAQABAAEBAQD//v7+//8AAAEBAQD/AAEBAQEAAP////7//wAAAQEBAAEAAQEBAQAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgIBAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAA=="));

  // Get user profile to determine level
  const { data: userProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  useEffect(() => {
    if (userProfile) {
      setCurrentLevel(userProfile.level || 1);
      setXp(userProfile.xp || 0);
      setStreak(userProfile.streakDays || 0);
    }
  }, [userProfile]);

  // Generate lesson questions when component mounts or level changes
  useEffect(() => {
    generateLessonQuestions();
  }, [currentLevel]);

  // Audio feedback with error handling
  const playCorrectSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRiQGAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAGAAD/////AAECAgIBAAAA//7+/v8AAAEAAQACAQEAAP///v7//wAAAQACAgICAAD+/f39/v8AAAEAAQADAQEAAP/+/f3+/wEAAQABAAECAQEAAA==");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently ignore audio playback errors
      });
    } catch (error) {
      // Silently ignore audio creation errors
    }
  };

  const playIncorrectSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZERE");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently ignore audio playback errors
      });
    } catch (error) {
      // Silently ignore audio creation errors
    }
  };

  const generateLessonQuestions = () => {
    const lessonQuestions: Question[] = [];
    const lessonLength = 10;
    
    // Expanded level-based vocabulary with more words per level
    const vocabulary: Record<number, Array<{chinese: string, english: string, pinyin: string}>> = {
      1: [
        {chinese: "你好", english: "hello", pinyin: "nǐ hǎo"},
        {chinese: "谢谢", english: "thank you", pinyin: "xiè xiè"},
        {chinese: "再见", english: "goodbye", pinyin: "zài jiàn"},
        {chinese: "早上好", english: "good morning", pinyin: "zǎo shàng hǎo"},
        {chinese: "晚上好", english: "good evening", pinyin: "wǎn shàng hǎo"},
        {chinese: "请", english: "please", pinyin: "qǐng"},
        {chinese: "对不起", english: "sorry", pinyin: "duì bù qǐ"},
        {chinese: "没关系", english: "it's okay", pinyin: "méi guān xì"},
        {chinese: "是", english: "yes", pinyin: "shì"},
        {chinese: "不是", english: "no", pinyin: "bú shì"},
        {chinese: "我", english: "I/me", pinyin: "wǒ"},
        {chinese: "你", english: "you", pinyin: "nǐ"},
        {chinese: "他", english: "he/him", pinyin: "tā"},
        {chinese: "她", english: "she/her", pinyin: "tā"},
        {chinese: "很好", english: "very good", pinyin: "hěn hǎo"}
      ],
      2: [
        {chinese: "学习", english: "study", pinyin: "xué xí"},
        {chinese: "朋友", english: "friend", pinyin: "péng yǒu"},
        {chinese: "工作", english: "work", pinyin: "gōng zuò"},
        {chinese: "喜欢", english: "like", pinyin: "xǐ huān"},
        {chinese: "吃", english: "eat", pinyin: "chī"},
        {chinese: "喝", english: "drink", pinyin: "hē"},
        {chinese: "看", english: "watch/see", pinyin: "kàn"},
        {chinese: "听", english: "listen", pinyin: "tīng"},
        {chinese: "说", english: "speak", pinyin: "shuō"},
        {chinese: "读", english: "read", pinyin: "dú"},
        {chinese: "写", english: "write", pinyin: "xiě"},
        {chinese: "家", english: "home/family", pinyin: "jiā"},
        {chinese: "学校", english: "school", pinyin: "xué xiào"},
        {chinese: "老师", english: "teacher", pinyin: "lǎo shī"},
        {chinese: "学生", english: "student", pinyin: "xué shēng"}
      ],
      3: [
        {chinese: "电脑", english: "computer", pinyin: "diàn nǎo"},
        {chinese: "咖啡", english: "coffee", pinyin: "kā fēi"},
        {chinese: "办公室", english: "office", pinyin: "bàn gōng shì"},
        {chinese: "周末", english: "weekend", pinyin: "zhōu mò"},
        {chinese: "时间", english: "time", pinyin: "shí jiān"},
        {chinese: "地方", english: "place", pinyin: "dì fāng"},
        {chinese: "问题", english: "problem/question", pinyin: "wèn tí"},
        {chinese: "方法", english: "method", pinyin: "fāng fǎ"},
        {chinese: "机会", english: "opportunity", pinyin: "jī huì"},
        {chinese: "帮助", english: "help", pinyin: "bāng zhù"},
        {chinese: "重要", english: "important", pinyin: "zhòng yào"},
        {chinese: "容易", english: "easy", pinyin: "róng yì"},
        {chinese: "困难", english: "difficult", pinyin: "kùn nán"},
        {chinese: "有趣", english: "interesting", pinyin: "yǒu qù"},
        {chinese: "美丽", english: "beautiful", pinyin: "měi lì"}
      ],
      4: [
        {chinese: "会议", english: "meeting", pinyin: "huì yì"},
        {chinese: "项目", english: "project", pinyin: "xiàng mù"},
        {chinese: "经理", english: "manager", pinyin: "jīng lǐ"},
        {chinese: "客户", english: "customer", pinyin: "kè hù"},
        {chinese: "公司", english: "company", pinyin: "gōng sī"},
        {chinese: "市场", english: "market", pinyin: "shì chǎng"},
        {chinese: "产品", english: "product", pinyin: "chǎn pǐn"},
        {chinese: "服务", english: "service", pinyin: "fú wù"},
        {chinese: "质量", english: "quality", pinyin: "zhì liàng"},
        {chinese: "价格", english: "price", pinyin: "jià gé"},
        {chinese: "竞争", english: "competition", pinyin: "jìng zhēng"},
        {chinese: "成功", english: "success", pinyin: "chéng gōng"},
        {chinese: "失败", english: "failure", pinyin: "shī bài"},
        {chinese: "经验", english: "experience", pinyin: "jīng yàn"},
        {chinese: "技能", english: "skill", pinyin: "jì néng"}
      ],
      5: [
        {chinese: "发展", english: "development", pinyin: "fā zhǎn"},
        {chinese: "经济", english: "economy", pinyin: "jīng jì"},
        {chinese: "文化", english: "culture", pinyin: "wén huà"},
        {chinese: "社会", english: "society", pinyin: "shè huì"},
        {chinese: "政治", english: "politics", pinyin: "zhèng zhì"},
        {chinese: "历史", english: "history", pinyin: "lì shǐ"},
        {chinese: "科学", english: "science", pinyin: "kē xué"},
        {chinese: "技术", english: "technology", pinyin: "jì shù"},
        {chinese: "教育", english: "education", pinyin: "jiào yù"},
        {chinese: "环境", english: "environment", pinyin: "huán jìng"},
        {chinese: "健康", english: "health", pinyin: "jiàn kāng"},
        {chinese: "安全", english: "safety", pinyin: "ān quán"},
        {chinese: "自由", english: "freedom", pinyin: "zì yóu"},
        {chinese: "平等", english: "equality", pinyin: "píng děng"},
        {chinese: "责任", english: "responsibility", pinyin: "zé rèn"}
      ]
    };

    const levelVocab = vocabulary[Math.min(currentLevel, 5)] || vocabulary[1];
    
    // Get recently used words from localStorage to avoid repetition across sessions
    const recentlyUsedKey = `recentlyUsed_level_${currentLevel}`;
    const storedRecentlyUsed = localStorage.getItem(recentlyUsedKey);
    const recentlyUsedWords = storedRecentlyUsed ? JSON.parse(storedRecentlyUsed) : [];
    
    // Filter out recently used words and create a shuffled copy
    const availableVocab = levelVocab.filter(word => !recentlyUsedWords.includes(word.chinese));
    const shuffledVocab = [...availableVocab].sort(() => Math.random() - 0.5);
    const usedWords = new Set<string>();
    
    // If we don't have enough fresh words, mix in some recently used ones
    if (shuffledVocab.length < lessonLength) {
      const additionalWords = levelVocab
        .filter(word => !shuffledVocab.includes(word))
        .sort(() => Math.random() - 0.5)
        .slice(0, lessonLength - shuffledVocab.length);
      shuffledVocab.push(...additionalWords);
    }
    
    for (let i = 0; i < lessonLength && i < shuffledVocab.length; i++) {
      // Use a different vocabulary item for each question to ensure uniqueness
      const vocabItem = shuffledVocab[i];
      usedWords.add(vocabItem.chinese);
      
      const questionType = Math.random() > 0.5 ? "multiple-choice" : "translation";
      
      if (questionType === "multiple-choice") {
        // Generate wrong options, avoiding used words
        const wrongOptions = levelVocab
          .filter(v => v.english !== vocabItem.english && !usedWords.has(v.chinese))
          .map(v => v.english)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        const allOptions = [...wrongOptions, vocabItem.english].sort(() => Math.random() - 0.5);
        
        lessonQuestions.push({
          id: i + 1,
          type: "multiple-choice",
          question: "What does this mean?",
          chinese: vocabItem.chinese,
          english: vocabItem.english,
          pinyin: vocabItem.pinyin,
          options: allOptions,
          correctAnswer: vocabItem.english,
          xp: 10
        });
      } else {
        // Translation question, avoiding used words
        const wrongTranslations = levelVocab
          .filter(v => v.chinese !== vocabItem.chinese && !usedWords.has(v.chinese))
          .map(v => v.chinese)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        const allTranslations = [...wrongTranslations, vocabItem.chinese].sort(() => Math.random() - 0.5);
        
        lessonQuestions.push({
          id: i + 1,
          type: "translation",
          question: "Select the correct translation",
          chinese: vocabItem.chinese,
          english: vocabItem.english,
          pinyin: vocabItem.pinyin,
          options: allTranslations,
          correctAnswer: vocabItem.chinese,
          xp: 10
        });
      }
    }
    
    setQuestions(lessonQuestions);
    
    // Store used words for this session to avoid repetition in future sessions
    const currentUsedWords = lessonQuestions.map(q => q.chinese);
    const updatedRecentlyUsed = [...recentlyUsedWords, ...currentUsedWords]
      .slice(-20) // Keep only the last 20 words to avoid the list growing too large
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
    
    localStorage.setItem(recentlyUsedKey, JSON.stringify(updatedRecentlyUsed));
  };

  const handleAnswer = (answer: string | number) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    const correct = answer === questions[currentQuestionIndex]?.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      playCorrectSound();
      const earnedXp = questions[currentQuestionIndex].xp;
      setXp(xp + earnedXp);
      // Reset wrong attempts counter on correct answer
      setWrongAttempts(0);
      setShowDifficultyOption(false);
      // Save XP progress to backend immediately
      updateXpMutation.mutate(earnedXp);
      toast({
        title: "🎉 Correct!",
        description: `+${earnedXp} XP`,
        className: "bg-green-50 border-green-200"
      });
    } else {
      playIncorrectSound();
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      
      // Show difficulty option after 3 consecutive wrong attempts
      if (newWrongAttempts >= 3) {
        setShowDifficultyOption(true);
      }
    }
  };

  const handleContinue = () => {
    if (isCorrect) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setIsCorrect(false);
      } else {
        setLessonComplete(true);
      }
    } else {
      // For incorrect answers, just hide feedback and let them try again
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
    }
  };

  const handleGoToPreviousLevel = () => {
    if (currentLevel > 1) {
      const newLevel = currentLevel - 1;
      setCurrentLevel(newLevel);
      setWrongAttempts(0);
      setShowDifficultyOption(false);
      // Regenerate questions for the previous level
      setTimeout(() => {
        generateLessonQuestions();
      }, 100);
      // Reset current question
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
      
      toast({
        title: "Level Adjusted",
        description: `Moved to Level ${newLevel} for better practice`,
        className: "bg-blue-50 border-blue-200"
      });
    }
  };

  const savePracticeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/practice/answer", {
        userId: "demo-user",
        questionType: "vocabulary",
        level: currentLevel,
        correct: true,
        xpEarned: xp
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    }
  });

  const updateXpMutation = useMutation({
    mutationFn: async (earnedXp: number) => {
      await apiRequest("POST", "/api/practice/answer", {
        userId: "demo-user",
        questionType: "vocabulary",
        level: currentLevel,
        correct: true,
        xpEarned: earnedXp
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    }
  });

  const handleCompletedLesson = () => {
    savePracticeMutation.mutate();
    navigate("/");
  };

  if (profileLoading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (lessonComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Complete!</h1>
          <p className="text-xl text-gray-600 mb-6">You earned {xp} XP</p>
          
          <div className="space-y-4 mb-6">
            <div className="bg-green-100 rounded-2xl p-4">
              <div className="text-2xl font-bold text-green-700">Accuracy</div>
              <div className="text-4xl font-bold text-green-800">
                {Math.round((questions.filter((_, idx) => idx <= currentQuestionIndex).length / questions.length) * 100)}%
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleCompletedLesson}
            className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-4 text-lg rounded-2xl shadow-lg transform transition hover:scale-105"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex-1 mx-4">
              <Progress value={progressPercentage} className="h-3" />
              <div className="text-xs text-gray-500 mt-1 text-center">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Level with XP Progress */}
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="flex items-center bg-purple-100 rounded-full px-3 py-1 mb-2">
                  <span className="text-purple-600 text-sm font-bold">Level {currentLevel}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${(currentLevelXp / xpPerLevel) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-purple-600 font-medium mt-1">
                  {currentLevelXp}/{xpPerLevel} XP
                </div>
              </div>
              
              {/* Streak */}
              <div className="flex items-center">
                <span className="text-orange-500 text-xl">🔥</span>
                <span className="ml-1 font-bold text-gray-700">{streak}</span>
              </div>
              
              {/* XP */}
              <div className="flex items-center">
                <span className="text-blue-500 text-xl">⚡</span>
                <span className="ml-1 font-bold text-gray-700">{xp}</span>
              </div>
              
              {/* Hearts */}
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${i < hearts ? 'text-red-500' : 'text-gray-300'}`}>
                    {i < hearts ? '❤️' : '🤍'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQ.question}</h2>
          
          {currentQ.type === "multiple-choice" && (
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-gray-900 mb-4 p-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl inline-block">
                {currentQ.chinese}
              </div>
            </div>
          )}
          
          {currentQ.type === "translation" && (
            <div className="text-center mb-8">
              <div className="text-3xl font-semibold text-gray-700 p-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl">
                {currentQ.english}
              </div>
            </div>
          )}
          
          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {currentQ.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={showFeedback}
                className={`
                  p-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105
                  ${!showFeedback ? 'bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50' : ''}
                  ${showFeedback && selectedAnswer === option && isCorrect ? 'bg-green-100 border-2 border-green-500 scale-105' : ''}
                  ${showFeedback && selectedAnswer === option && !isCorrect ? 'bg-red-100 border-2 border-red-500 animate-shake' : ''}
                  ${showFeedback && option === currentQ.correctAnswer && selectedAnswer !== option ? 'bg-green-100 border-2 border-green-500' : ''}
                  ${showFeedback && option !== currentQ.correctAnswer && selectedAnswer !== option ? 'opacity-50' : ''}
                `}
              >
                {option}
              </button>
            ))}
          </div>
          
          {/* Feedback Section */}
          {showFeedback && (
            <div className={`p-6 rounded-2xl mb-6 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="text-center">
                <p className={`font-bold text-xl mb-4 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? '✅ Correct!' : '❌ Not quite!'}
                </p>
                
                {/* Always show the word details for learning */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="text-4xl font-bold text-gray-800 mb-2">{currentQ.chinese}</div>
                  <div className="text-lg text-blue-600 font-medium mb-1">{currentQ.pinyin}</div>
                  <div className="text-lg text-gray-700">{currentQ.english}</div>
                </div>
                
                {!isCorrect && (
                  <div className="mt-4 p-3 bg-red-100 rounded-lg">
                    <p className="text-red-700 font-medium">
                      The correct answer was: <span className="font-bold">{currentQ.correctAnswer}</span>
                    </p>
                    <p className="text-sm text-red-600 mt-1">Try again to continue!</p>
                  </div>
                )}
                
                {isCorrect && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <p className="text-green-700 font-medium">
                      Great job! You're learning fast! 🎉
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Continue Button */}
          {showFeedback && (
            <Button
              onClick={handleContinue}
              className={`
                w-full py-4 text-lg font-bold rounded-2xl shadow-lg transform transition hover:scale-105
                ${isCorrect 
                  ? 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white' 
                  : 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white'
                }
              `}
            >
              {isCorrect ? 'Continue' : 'Try Again'}
            </Button>
          )}
          
          {/* Difficulty Option - Show after 3 wrong attempts */}
          {showDifficultyOption && !isCorrect && showFeedback && currentLevel > 1 && (
            <div className="mt-4 text-center">
              <Button
                onClick={handleGoToPreviousLevel}
                variant="outline"
                className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 px-6 py-2 rounded-xl"
              >
                Too difficult? Go to Level {currentLevel - 1}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}