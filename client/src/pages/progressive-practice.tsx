import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

export default function ProgressivePractice() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    xpEarned: 0,
    startTime: Date.now(),
    consecutiveCorrect: 0,
    levelSkipped: false
  });

  // Get user profile to determine level
  const { data: userProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  useEffect(() => {
    if (userProfile?.level) {
      setCurrentLevel(userProfile.level);
      // Reset session stats when level changes
      setSessionStats({
        questionsAnswered: 0,
        correctAnswers: 0,
        xpEarned: 0,
        startTime: Date.now(),
        consecutiveCorrect: 0,
        levelSkipped: false
      });
    }
  }, [userProfile?.level]);

  // Generate practice questions based on level
  const generateQuestion = () => {
    const questionTypes = ["vocabulary", "grammar", "pronunciation", "sentence"];
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    // Level-based difficulty with more granular levels (1-10)
    const difficulties: Record<number, string[]> = {
      1: ["你好", "谢谢", "再见", "早上好"],
      2: ["学习", "朋友", "工作", "喜欢"],
      3: ["电脑", "咖啡", "办公室", "周末"],
      4: ["会议", "项目", "经理", "客户"],
      5: ["发展", "经济", "文化", "社会"],
      6: ["国际", "技术", "创新", "合作"],
      7: ["战略", "分析", "优化", "整合"],
      8: ["可持续", "全球化", "数字化", "人工智能"],
      9: ["区块链", "量子计算", "生态系统", "颠覆性"],
      10: ["范式转变", "协同效应", "价值链", "核心竞争力"]
    };

    const levelKey = Math.min(Math.max(Math.ceil(currentLevel / 2), 1), 10);
    const words = difficulties[levelKey] || difficulties[1];
    const word = words[Math.floor(Math.random() * words.length)];

    const questions: Record<string, any> = {
      vocabulary: {
        question: `What does "${word}" mean in English?`,
        answer: "friend", // This would be dynamic in production
        type: "translation",
        xp: 10 * currentLevel
      },
      grammar: {
        question: `Complete the sentence: 我___${word}。`,
        answer: "喜欢",
        type: "fill-blank",
        xp: 15 * currentLevel
      },
      pronunciation: {
        question: `What is the correct pinyin for "${word}"?`,
        answer: "péng yǒu",
        type: "pinyin",
        xp: 12 * currentLevel
      },
      sentence: {
        question: `Create a sentence using "${word}"`,
        answer: "open-ended",
        type: "sentence",
        xp: 20 * currentLevel
      }
    };

    return questions[type];
  };

  const [currentPracticeQuestion, setCurrentPracticeQuestion] = useState(generateQuestion());

  const submitAnswerMutation = useMutation({
    mutationFn: async (correct: boolean) => {
      const xpEarned = correct ? currentPracticeQuestion.xp : 5;
      
      // Update session stats
      const newStats = {
        ...sessionStats,
        questionsAnswered: sessionStats.questionsAnswered + 1,
        correctAnswers: sessionStats.correctAnswers + (correct ? 1 : 0),
        xpEarned: sessionStats.xpEarned + xpEarned
      };
      setSessionStats(newStats);

      // Save to database
      await apiRequest("POST", "/api/practice/answer", {
        userId: "demo-user",
        questionType: currentPracticeQuestion.type,
        level: currentLevel,
        correct,
        xpEarned
      });

      return { xpEarned, correct };
    },
    onSuccess: async (data) => {
      if (data.correct) {
        const newConsecutive = sessionStats.consecutiveCorrect + 1;
        
        // Auto-skip level if user demonstrates mastery
        // Skip after 5 consecutive correct answers with 100% accuracy in current session
        if (newConsecutive >= 5 && sessionStats.correctAnswers >= 5) {
          const accuracy = ((sessionStats.correctAnswers + 1) / (sessionStats.questionsAnswered + 1)) * 100;
          
          if (accuracy >= 90 && currentLevel < 10) {
            // Skip to next level
            const newLevel = Math.min(currentLevel + 1, 10);
            setCurrentLevel(newLevel);
            
            // Update user level in database
            await apiRequest("POST", "/api/user/level-up", {
              userId: "demo-user",
              newLevel,
              reason: "performance"
            });
            
            // Show level skip notification
            setSessionStats(prev => ({ ...prev, levelSkipped: true }));
            
            // Reset consecutive counter
            setSessionStats(prev => ({ ...prev, consecutiveCorrect: 0 }));
          }
        } else {
          setSessionStats(prev => ({ ...prev, consecutiveCorrect: newConsecutive }));
        }
      } else {
        // Reset consecutive on wrong answer
        setSessionStats(prev => ({ ...prev, consecutiveCorrect: 0 }));
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    }
  });

  const handleSubmit = () => {
    // Simple check - in production this would be more sophisticated
    const correct = userAnswer.toLowerCase().includes("friend") || 
                   userAnswer.includes("朋友") ||
                   userAnswer.includes("péng yǒu");
    
    setIsCorrect(correct);
    setShowFeedback(true);
    submitAnswerMutation.mutate(correct);
  };

  const handleNext = () => {
    setCurrentPracticeQuestion(generateQuestion());
    setUserAnswer("");
    setShowFeedback(false);
    setCurrentQuestion(prev => prev + 1);
  };

  const accuracy = sessionStats.questionsAnswered > 0 
    ? Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
    : 0;

  const getProgressMessage = () => {
    // Check for level skip eligibility
    if (sessionStats.consecutiveCorrect >= 3 && accuracy >= 90) {
      return `🚀 Amazing! ${5 - sessionStats.consecutiveCorrect} more correct answers to skip to Level ${currentLevel + 1}!`;
    }
    
    if (sessionStats.levelSkipped) {
      return `🎉 Level skipped! You've advanced to Level ${currentLevel}!`;
    }
    
    if (accuracy >= 80) return "Excellent! You're mastering this level!";
    if (accuracy >= 60) return "Good job! Keep practicing!";
    if (accuracy >= 40) return "You're learning! Don't give up!";
    return "Take your time, you'll get there!";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Progressive Practice</h2>
        <p className="text-gray-700">
          Practice adapts to your level and helps you improve step by step
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Practice Area */}
        <div className="lg:col-span-2">
          <div className="card-duo">
            {/* Level Indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">Level</span>
                <div className="flex space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-2 rounded-full ${
                        i < currentLevel 
                          ? "bg-brand-primary" 
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-brand-primary text-lg">{currentLevel}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                Question #{sessionStats.questionsAnswered + 1}
              </span>
            </div>

            {/* Question */}
            <div className="bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl p-8 text-white mb-6">
              <div className="text-sm opacity-75 mb-2">
                {currentPracticeQuestion.type.toUpperCase()} • {currentPracticeQuestion.xp} XP
              </div>
              <h3 className="text-2xl font-bold mb-6">
                {currentPracticeQuestion.question}
              </h3>
              
              {!showFeedback && (
                <div className="bg-white bg-opacity-20 rounded-xl p-4">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full bg-transparent placeholder-white placeholder-opacity-75 text-white text-lg outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              )}

              {showFeedback && (
                <div className={`rounded-xl p-4 ${
                  isCorrect ? "bg-green-500 bg-opacity-30" : "bg-red-500 bg-opacity-30"
                }`}>
                  <div className="flex items-center mb-2">
                    <i className={`fas ${isCorrect ? "fa-check-circle" : "fa-times-circle"} text-2xl mr-3`}></i>
                    <span className="text-xl font-semibold">
                      {isCorrect ? "Correct!" : "Not quite right"}
                    </span>
                  </div>
                  {!isCorrect && (
                    <p className="text-sm opacity-90">
                      Example answer: "friend" or "péng yǒu"
                    </p>
                  )}
                  <p className="text-sm mt-2 opacity-90">
                    +{isCorrect ? currentPracticeQuestion.xp : 5} XP earned
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              {!showFeedback ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPracticeQuestion(generateQuestion())}
                  >
                    <i className="fas fa-random mr-2"></i>
                    Skip
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    className="btn-primary"
                  >
                    Submit Answer
                    <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleNext}
                  className="btn-primary w-full"
                >
                  Next Question
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="lg:col-span-1">
          <div className="card-duo mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Session Stats</h3>
            
            <div className="space-y-4">
              {sessionStats.levelSkipped && (
                <div className="p-4 bg-gradient-to-r from-brand-secondary to-brand-secondary-light rounded-xl text-white text-center animate-fade-in">
                  <div className="text-xl font-bold mb-2">🎉 Level Skipped!</div>
                  <div className="text-sm">Outstanding performance! Advanced to Level {currentLevel}</div>
                </div>
              )}
              
              {sessionStats.consecutiveCorrect >= 3 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="text-sm font-medium text-green-800">
                    🔥 {sessionStats.consecutiveCorrect} correct in a row!
                  </div>
                </div>
              )}
              
              <div className="text-center p-4 bg-brand-primary bg-opacity-10 rounded-xl">
                <div className="text-3xl font-bold text-brand-primary mb-1">
                  {sessionStats.xpEarned}
                </div>
                <div className="text-sm font-medium text-gray-700">XP Earned</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sessionStats.correctAnswers}
                  </div>
                  <div className="text-xs font-medium text-gray-700">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {sessionStats.questionsAnswered}
                  </div>
                  <div className="text-xs font-medium text-gray-700">Total</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Accuracy</span>
                  <span className="font-bold text-brand-primary">{accuracy}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2 rounded-full transition-all"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-gray-800 text-center">
                  {getProgressMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card-duo">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <i className="fas fa-lightbulb text-brand-secondary mr-2 mt-1"></i>
                <span>Questions get harder as you level up</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-trophy text-brand-secondary mr-2 mt-1"></i>
                <span>Maintain 80% accuracy to level up faster</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-brain text-brand-secondary mr-2 mt-1"></i>
                <span>Take breaks to retain information better</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}