import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import ModernNav from "@/components/modern-nav";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { Heart, Clock, Trophy, X, ArrowLeft, Gift, Sparkles } from "lucide-react";
import { audioManager } from "@/lib/audioManager";
import { levelStructure, getLevelInfo } from "../../../shared/levelStructure";
import { motion } from "framer-motion";

interface Question {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  options: string[];
  correctAnswer: string;
  type: "multiple-choice" | "translation";
  question: string;
}

function ProgressivePracticeContent() {
  const [location, navigate] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCompletedScreen, setShowCompletedScreen] = useState(false);
  const [showOutOfHeartsScreen, setShowOutOfHeartsScreen] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showDifficultyOption, setShowDifficultyOption] = useState(false);
  const [showStickerReward, setShowStickerReward] = useState(false);
  const [stickerRewards, setStickerRewards] = useState<any[]>([]);
  
  // Ref for continue button to scroll to
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  
  // Get level from URL params if provided, otherwise use user's current level
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const levelFromUrl = urlParams.get('level');
  const [currentLevel, setCurrentLevel] = useState(levelFromUrl ? parseInt(levelFromUrl) : 1);
  
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState<number | null>(null);
  const [sessionStartTime] = useState(Date.now());

  // Function to speak Chinese text using OpenAI TTS
  const speakChinese = async (text: string) => {
    try {
      // Use audioManager with slower speed for clearer pronunciation
      await audioManager.playTTS(text, 0.5);
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  // Fetch user profile to get current level and hearts
  const { data: userProfile, refetch: refetchProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Fetch practice questions
  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/practice/questions", currentLevel],
  });

  // Fetch practice progress for current level
  const { data: practiceProgress, refetch: refetchProgress } = useQuery<any>({
    queryKey: ["/api/practice/progress", currentLevel],
    enabled: !!currentLevel,
  });

  // Save practice progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (progress: any) => {
      return await apiRequest("POST", `/api/practice/progress/${currentLevel}`, progress);
    },
    onSuccess: () => {
      // Invalidate user profile to sync XP bar
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  const currentQ = questions[currentQuestionIndex] || null;

  // Update hearts mutation
  const updateHeartsMutation = useMutation({
    mutationFn: async (heartsChange: number) => {
      return await apiRequest("POST", "/api/user/hearts", { heartsChange });
    },
    onSuccess: () => {
      refetchProfile();
    },
  });

  // Mutation to save practice session and award XP
  const savePracticeMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return await apiRequest("POST", "/api/practice/save-session", sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  // Update current level and hearts when user profile loads
  useEffect(() => {
    if (userProfile) {
      setCurrentLevel(userProfile.level || 1);
      const currentHearts = userProfile.hearts !== undefined ? userProfile.hearts : 5;
      setHearts(currentHearts);
      
      // If hearts are 0, immediately show out of hearts screen
      if (currentHearts === 0) {
        setShowOutOfHeartsScreen(true);
      }
      
      // Calculate time until next heart
      if (userProfile.hearts < userProfile.maxHearts && userProfile.lastHeartLostAt) {
        const lastLost = new Date(userProfile.lastHeartLostAt).getTime();
        const now = Date.now();
        const hoursPassed = Math.floor((now - lastLost) / (1000 * 60 * 60));
        const heartsToRegenerate = Math.min(hoursPassed, userProfile.maxHearts - userProfile.hearts);
        
        if (heartsToRegenerate > 0) {
          // Regenerate hearts
          updateHeartsMutation.mutate(heartsToRegenerate);
          // If hearts were 0 and now regenerated, hide out of hearts screen
          if (currentHearts === 0) {
            setShowOutOfHeartsScreen(false);
          }
        } else {
          // Calculate time until next heart
          const nextHeartTime = lastLost + (1000 * 60 * 60); // 1 hour from last lost
          const timeRemaining = Math.max(0, nextHeartTime - now);
          setTimeUntilNextHeart(timeRemaining);
        }
      }
    }
  }, [userProfile]);

  // Load saved progress when it's fetched
  useEffect(() => {
    if (practiceProgress && practiceProgress.currentQuestion > 1) {
      setCurrentQuestionIndex(practiceProgress.currentQuestion - 1);
      setCorrectAnswers(practiceProgress.correctAnswers || 0);
      setWrongAnswers(practiceProgress.incorrectAnswers || 0);
    }
  }, [practiceProgress]);

  // Load voices for speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Timer for heart regeneration countdown
  useEffect(() => {
    if (timeUntilNextHeart && timeUntilNextHeart > 0) {
      const interval = setInterval(() => {
        setTimeUntilNextHeart(prev => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            refetchProfile();
            return null;
          }
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timeUntilNextHeart]);

  // Mutation to create flashcard
  const createFlashcardMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/flashcards", data);
    },
  });

  const handleAnswer = async (answer: string) => {
    if (showFeedback) return;
    
    // Don't allow answering if hearts are 0
    if (hearts === 0) {
      setShowOutOfHeartsScreen(true);
      return;
    }

    setSelectedAnswer(answer);
    const correct = answer === currentQ.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    // Scroll to continue button after a short delay
    setTimeout(() => {
      continueButtonRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);

    if (!correct) {
      setWrongAnswers(prev => prev + 1);
      setWrongAttempts(prev => prev + 1);
      
      // Save wrong answer as flashcard
      try {
        await createFlashcardMutation.mutateAsync({
          chinese: currentQ.chinese,
          pinyin: currentQ.pinyin,
          english: currentQ.english,
          source: "practice",
          level: currentLevel,
        });
      } catch (error) {
        console.error("Error creating flashcard:", error);
      }
      
      // Lose a heart for wrong answer
      const newHearts = Math.max(0, hearts - 1);
      setHearts(newHearts);
      updateHeartsMutation.mutate(-1);
      
      // Check if out of hearts
      if (newHearts === 0) {
        setTimeout(() => {
          setShowOutOfHeartsScreen(true);
        }, 1500);
      }
      
      if (wrongAttempts >= 2) { // After 3 wrong attempts
        setShowDifficultyOption(true);
      }
    } else {
      setCorrectAnswers(prev => prev + 1);
      setWrongAttempts(0);
      setShowDifficultyOption(false);
    }
  };

  const handleContinue = () => {
    if (isCorrect) {
      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setWrongAttempts(0);
        setShowDifficultyOption(false);
        
        // Save progress to database
        const answeredQuestions = questions.slice(0, nextIndex).map(q => q.id);
        saveProgressMutation.mutate({
          currentQuestion: nextIndex + 1,
          correctAnswers,
          incorrectAnswers: wrongAnswers,
          answeredQuestions
        });
      } else {
        // Complete the lesson
        setShowCompletedScreen(true);
        
        // Clear progress when lesson is completed
        saveProgressMutation.mutate({
          currentQuestion: 1,
          correctAnswers: 0,
          incorrectAnswers: 0,
          answeredQuestions: []
        });
      }
    } else {
      // Try again - reset for same question
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handleGoToPreviousLevel = () => {
    if (currentLevel > 1) {
      // Clear progress for current level
      saveProgressMutation.mutate({
        currentQuestion: 1,
        correctAnswers: 0,
        incorrectAnswers: 0,
        answeredQuestions: []
      });
      
      setCurrentLevel(currentLevel - 1);
      queryClient.invalidateQueries({ queryKey: ["/api/practice/questions", currentLevel - 1] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice/progress", currentLevel - 1] });
      setCurrentQuestionIndex(0);
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setWrongAttempts(0);
      setShowDifficultyOption(false);
    }
  };

  const handleCompletedLesson = async () => {
    const totalAttempts = correctAnswers + wrongAnswers;
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
    const xp = Math.round(accuracy * 10);
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000); // Time in seconds
    const passed = accuracy >= 80; // Pass if 80% or higher
    
    // Save practice session and get the result
    const result: any = await savePracticeMutation.mutateAsync({
      level: currentLevel,
      questionsAnswered: questions.length,
      correctAnswers: correctAnswers,
      wrongAnswers: wrongAnswers,
      accuracy: accuracy,
      xpEarned: xp,
      timeSpent: timeSpent,
    });

    // Refetch profile to update sidebar XP/level display
    await refetchProfile();
    
    // If user leveled up, show sticker animation and continue to next level
    if (result && result.leveledUp) {
      // Show sticker rewards if any
      if (result.newStickers && result.newStickers.length > 0) {
        setShowStickerReward(true);
        setStickerRewards(result.newStickers);
        
        // Auto-continue after showing stickers (give more time to enjoy the animation)
        setTimeout(() => {
          setShowStickerReward(false);
          // Reload to continue with the new level
          navigate("/practice");
          window.location.reload();
        }, 8000); // Extended to 8 seconds to enjoy the animation
      } else {
        toast({
          title: "Level Up! 🎉",
          description: `Congratulations! You've advanced to Level ${result.newLevel}!`,
        });
        // Continue to next level automatically
        setTimeout(() => {
          navigate("/practice");
          window.location.reload();
        }, 1500);
      }
    } else if (passed) {
      // If passed but didn't level up, still go to next level
      toast({
        title: "Great Job! ✨",
        description: `Level ${currentLevel} complete! Moving to Level ${currentLevel + 1}`,
      });
      // Clear current progress and move to next level
      setTimeout(() => {
        setCurrentLevel(currentLevel + 1);
        queryClient.invalidateQueries({ queryKey: ["/api/practice/questions", currentLevel + 1] });
        queryClient.invalidateQueries({ queryKey: ["/api/practice/progress", currentLevel + 1] });
        setCurrentQuestionIndex(0);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setShowCompletedScreen(false);
        setWrongAttempts(0);
        setShowDifficultyOption(false);
      }, 1500);
    } else {
      // Failed - go back to practice selection
      navigate("/practice");
    }
  };

  // Format time for display
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex">
        <ModernNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">{userProfile?.selectedMascot || "🐬"}</div>
            <div className="text-2xl font-bold text-green-700">Loading practice session...</div>
          </div>
        </div>
      </div>
    );
  }

  // Out of hearts screen
  // Sticker reward animation screen
  if (showStickerReward && stickerRewards.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex overflow-hidden relative">
        <ModernNav />
        
        {/* Animated confetti background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: -50,
                rotate: 0
              }}
              animate={{
                y: window.innerHeight + 50,
                rotate: 360,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear"
              }}
            >
              <div className={`w-3 h-3 ${
                ['bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-green-400'][Math.floor(Math.random() * 5)]
              } rounded-full`} />
            </motion.div>
          ))}
        </div>
        
        <div className="flex-1 flex items-center justify-center z-10">
          <motion.div 
            className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 text-center max-w-2xl w-full mx-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.7 }}
          >
            {/* Congratulations header with animation */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.h1 
                className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 bg-clip-text text-transparent mb-2"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                CONGRATULATIONS!
              </motion.h1>
              <p className="text-xl text-gray-600 mb-6">Level Complete! 🎉</p>
            </motion.div>
            
            {/* Animated gift box that opens */}
            <motion.div
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <motion.div
                className="inline-block"
                animate={{
                  rotate: [0, -5, 5, -5, 5, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: 1,
                  repeat: 2
                }}
              >
                <div className="relative">
                  <Gift className="w-24 h-24 text-purple-500 mx-auto" />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, repeat: 3, delay: 1 }}
                  >
                    <Sparkles className="w-24 h-24 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Sticker rewards display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">You earned new stickers!</h2>
              <div className="flex flex-wrap justify-center gap-6 mb-6">
                {stickerRewards.map((sticker: any, index: number) => (
                  <motion.div
                    key={sticker.id}
                    initial={{ scale: 0, rotate: -360, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ 
                      delay: 2.5 + index * 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative cursor-pointer"
                  >
                    {/* Glowing effect for rare stickers */}
                    {(sticker.rarity === 'epic' || sticker.rarity === 'legendary') && (
                      <motion.div
                        className={`absolute inset-0 rounded-2xl ${
                          sticker.rarity === 'legendary' ? 'bg-yellow-400' : 'bg-purple-400'
                        } opacity-30 blur-xl`}
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      />
                    )}
                    
                    <motion.div 
                      className={`w-32 h-32 rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden ${
                        sticker.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200' :
                        sticker.rarity === 'epic' ? 'bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200' :
                        sticker.rarity === 'rare' ? 'bg-gradient-to-br from-blue-200 via-cyan-200 to-teal-200' :
                        sticker.rarity === 'uncommon' ? 'bg-gradient-to-br from-green-200 via-emerald-200 to-lime-200' :
                        'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Animated sparkles for rare+ stickers */}
                      {(sticker.rarity === 'rare' || sticker.rarity === 'epic' || sticker.rarity === 'legendary') && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white rounded-full"
                              style={{
                                left: `${20 + i * 30}%`,
                                top: `${20 + i * 25}%`
                              }}
                              animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                      
                      <motion.span 
                        className="text-6xl mb-2"
                        animate={{
                          y: [0, -10, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.2
                        }}
                      >
                        {sticker.emoji || "🌟"}
                      </motion.span>
                      <p className="text-sm font-bold text-gray-700">{sticker.name}</p>
                      <p className="text-xs text-gray-500">{sticker.description}</p>
                    </motion.div>
                    
                    {/* Rarity badge */}
                    <motion.div 
                      className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                        sticker.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400' :
                        sticker.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500' :
                        sticker.rarity === 'rare' ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500' :
                        sticker.rarity === 'uncommon' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 3 + index * 0.3, type: "spring" }}
                    >
                      {sticker.rarity?.toUpperCase() || 'NEW'}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              
              <motion.p 
                className="text-lg text-gray-600 font-semibold mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 + stickerRewards.length * 0.3 }}
              >
                Amazing! You collected {stickerRewards.length} new sticker{stickerRewards.length > 1 ? 's' : ''}!
              </motion.p>
              
              {/* Continue button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5 + stickerRewards.length * 0.3 }}
              >
                <Button
                  onClick={() => {
                    setShowStickerReward(false);
                    navigate("/practice");
                    window.location.reload();
                  }}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 hover:from-purple-600 hover:via-pink-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg transform transition hover:scale-105"
                >
                  Continue to Next Level →
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showOutOfHeartsScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex">
        <ModernNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-lg">
            <div className="text-6xl mb-6">💔</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Out of Hearts!</h1>
            <p className="text-xl text-gray-600 mb-6">
              You've run out of hearts. Come back later or wait for them to regenerate.
            </p>
            
            {timeUntilNextHeart && (
              <div className="bg-green-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Next heart in: {formatTime(timeUntilNextHeart)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Hearts regenerate 1 per hour</p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 text-lg rounded-2xl shadow-lg"
              >
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex">
        <ModernNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-2xl font-bold text-green-700 mb-4">No questions available</div>
            <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showCompletedScreen) {
    const totalAttempts = correctAnswers + wrongAnswers;
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
    const xp = Math.round(accuracy * 10);
    const passed = accuracy >= 80; // Pass if 80% or higher

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex">
        <ModernNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-lg">
            <motion.div 
              className="text-6xl mb-6 inline-block"
              animate={{
                y: [0, -20, 0],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              {userProfile?.selectedMascot || "🐬"}
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {passed ? 'Lesson Passed!' : 'Lesson Complete'}
            </h1>
            
            {passed && (
              <div className="bg-green-50 rounded-2xl p-3 mb-4">
                <p className="text-green-700 font-semibold">Great job! You've mastered this level!</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-2xl p-4">
                <div className="text-sm text-gray-600 mb-1">Correct</div>
                <div className="text-3xl font-bold text-green-700">{correctAnswers}</div>
              </div>
              <div className="bg-red-50 rounded-2xl p-4">
                <div className="text-sm text-gray-600 mb-1">Wrong</div>
                <div className="text-3xl font-bold text-red-700">{wrongAnswers}</div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className={`${passed ? 'bg-green-100' : 'bg-yellow-100'} rounded-2xl p-4`}>
                <div className="text-xl font-bold text-gray-700">Accuracy</div>
                <div className={`text-4xl font-bold ${passed ? 'text-green-700' : 'text-yellow-700'}`}>
                  {Math.round(accuracy)}%
                </div>
              </div>
              
              <div className="bg-emerald-100 rounded-2xl p-4">
                <div className="text-xl font-bold text-gray-700">XP Earned</div>
                <div className="text-3xl font-bold text-emerald-700">+{xp} XP</div>
              </div>
            </div>
            
            <Button
              onClick={handleCompletedLesson}
              className={`w-full ${passed 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500' 
                : 'bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500'
              } text-white font-bold py-4 text-lg rounded-2xl shadow-lg transform transition hover:scale-105`}
            >
              {passed ? `Continue to Level ${currentLevel + 1}` : 'Back to Practice'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNav />
      
      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back to Levels Button and Topic Info */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              onClick={() => navigate("/levels")}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Levels
            </Button>
            
            {/* Topic Information */}
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800">
                Level {currentLevel}: {getLevelInfo(currentLevel)?.topic || "Practice"}
              </h2>
              <p className="text-sm text-gray-500">
                HSK {getLevelInfo(currentLevel)?.hskLevel || Math.ceil(currentLevel / 10)}
              </p>
            </div>
            
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
          

          
          {/* Top Header with Hearts and Progress */}
          <div className="bg-white rounded-2xl shadow-md p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 ${i < hearts ? 'text-red-500 fill-red-500' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              {hearts < 5 && timeUntilNextHeart && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeUntilNextHeart)}</span>
                </div>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="flex-1 max-w-xs mx-4">
              <div className="bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQ.question}</h2>
            
            {currentQ.type === "multiple-choice" && (
              <div className="text-center mb-8">
                <div 
                  className="text-6xl font-bold text-gray-900 mb-4 p-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl inline-block cursor-pointer hover:bg-gradient-to-br hover:from-green-200 hover:to-emerald-200 transition-all duration-200"
                  onMouseEnter={() => speakChinese(currentQ.chinese)}
                  title="Hover to hear pronunciation"
                >
                  {currentQ.chinese}
                </div>
              </div>
            )}
            
            {currentQ.type === "translation" && (
              <div className="text-center mb-8">
                <div className="text-3xl font-semibold text-gray-700 p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl">
                  {currentQ.english}
                </div>
              </div>
            )}
            
            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentQ.options?.map((option, index) => {
                // Determine what text to speak based on question type
                const getTextToSpeak = () => {
                  if (currentQ.type === "translation") {
                    // For translation questions (English to Chinese), options are Chinese
                    return option;
                  } else {
                    // For multiple-choice (Chinese to English), try to get Chinese text
                    const optionDetails = (currentQ as any).optionDetails;
                    if (optionDetails && optionDetails[index]) {
                      return optionDetails[index].chinese;
                    }
                    // If no Chinese available for this option, speak the Chinese question instead
                    return currentQ.chinese;
                  }
                };

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    onMouseEnter={() => speakChinese(getTextToSpeak())}
                    disabled={showFeedback}
                    className={`
                      p-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105
                      ${!showFeedback ? 'bg-white border-2 border-gray-200 hover:border-green-400 hover:bg-green-50' : ''}
                      ${showFeedback && selectedAnswer === option && isCorrect ? 'bg-green-100 border-2 border-green-500 scale-105' : ''}
                      ${showFeedback && selectedAnswer === option && !isCorrect ? 'bg-red-100 border-2 border-red-500 animate-shake' : ''}
                      ${showFeedback && option !== currentQ.correctAnswer && selectedAnswer !== option ? 'opacity-50' : ''}
                    `}
                    title="Hover to hear pronunciation"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            
            {/* Feedback Section */}
            {showFeedback && (
              <div className={`p-6 rounded-2xl mb-6 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                <div className="text-center">
                  <p className={`font-bold text-xl mb-4 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? '✅ Correct!' : '❌ Not quite!'}
                  </p>
                  
                  {!isCorrect && selectedAnswer && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Your answer:</p>
                        {/* Show the selected wrong answer's details */}
                        {(() => {
                          // For multiple-choice questions (Chinese to English)
                          if (currentQ.type === "multiple-choice") {
                            // selectedAnswer is the English translation
                            // Find the index of the selected answer
                            const selectedIndex = currentQ.options.indexOf(selectedAnswer);
                            // Get the hanzi and pinyin from the optionDetails (if available)
                            const optionDetails = (currentQ as any).optionDetails;
                            if (optionDetails && optionDetails[selectedIndex]) {
                              return (
                                <>
                                  <div className="text-3xl font-bold text-gray-800 mb-1">{optionDetails[selectedIndex].chinese}</div>
                                  <div className="text-lg text-green-600 font-medium mb-1">{optionDetails[selectedIndex].pinyin}</div>
                                  <div className="text-xl text-red-600">{selectedAnswer}</div>
                                </>
                              );
                            } else {
                              // Just show the English translation
                              return <div className="text-xl text-red-600">{selectedAnswer}</div>;
                            }
                          } else {
                            // For translation questions (English to Chinese)
                            // selectedAnswer is the Chinese character
                            // Find the index of the selected answer
                            const selectedIndex = currentQ.options.indexOf(selectedAnswer);
                            // Get the pinyin and english from the optionDetails (if available)
                            const optionDetails = (currentQ as any).optionDetails;
                            if (optionDetails && optionDetails[selectedIndex]) {
                              return (
                                <>
                                  <div className="text-3xl font-bold text-gray-800 mb-1">{selectedAnswer}</div>
                                  <div className="text-lg text-green-600 font-medium mb-1">{optionDetails[selectedIndex].pinyin}</div>
                                  <div className="text-xl text-red-600">{optionDetails[selectedIndex].english}</div>
                                </>
                              );
                            } else {
                              // Just show the Chinese character
                              return <div className="text-3xl font-bold text-red-600">{selectedAnswer}</div>;
                            }
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {isCorrect && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="text-4xl font-bold text-gray-800 mb-2">{currentQ.chinese}</div>
                      <div className="text-lg text-green-600 font-medium mb-1">{currentQ.pinyin}</div>
                      <div className="text-lg text-gray-700">{currentQ.english}</div>
                    </div>
                  )}
                  
                  {!isCorrect && (
                    <div className="mt-4 p-3 bg-red-100 rounded-lg">
                      <p className="text-red-700 font-medium">
                        That's not quite right. Try again!
                      </p>
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
                ref={continueButtonRef}
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
          
          {/* HSK Level Progress Bar - Moved to Bottom */}
          {userProfile && userProfile.level && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-sm border border-blue-200 p-4 mb-4 mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    HSK Level Progress
                  </h4>
                </div>
              </div>
              
              {(() => {
                const level = userProfile.level;
                const currentHSK = Math.ceil(level / 10);
                const nextHSK = currentHSK < 6 ? currentHSK + 1 : 6;
                const hskStartLevel = (currentHSK - 1) * 10 + 1;
                const hskEndLevel = currentHSK * 10;
                const levelsInHSK = level - hskStartLevel + 1;
                const progressPercent = (levelsInHSK / 10) * 100;
                const levelsToNextHSK = hskEndLevel - level;
                
                return (
                  <div className="space-y-3">
                    <div className="bg-white/80 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-700">HSK {currentHSK}</span>
                          {currentHSK < 6 && (
                            <>
                              <span className="text-xs text-gray-500">→</span>
                              <span className="text-sm font-medium text-blue-600">HSK {nextHSK}</span>
                            </>
                          )}
                        </div>
                        <div className="text-right">
                          {currentHSK < 6 ? (
                            <>
                              <span className="text-2xl font-bold text-blue-700">{levelsToNextHSK}</span>
                              <span className="text-xs font-medium text-blue-600 ml-1">
                                level{levelsToNextHSK > 1 ? 's' : ''} to HSK {nextHSK}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-green-600">Max HSK Level!</span>
                          )}
                        </div>
                      </div>
                      
                      {/* HSK Progress Bar */}
                      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(5, progressPercent)}%` }}
                        >
                          <div className="h-full flex items-center justify-end pr-2">
                            {progressPercent > 20 && (
                              <span className="text-xs text-white font-medium">
                                {Math.round(progressPercent)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Level markers */}
                        <div className="absolute inset-0 flex items-center justify-between px-2">
                          <span className="text-xs font-medium text-gray-600">Level {hskStartLevel}</span>
                          <span className="text-xs font-medium text-gray-600">Level {hskEndLevel}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        {currentHSK < 6 
                          ? `Complete ${10 - levelsInHSK + 1} more levels to reach HSK ${nextHSK}`
                          : "You've reached the highest HSK level!"}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-white px-2 py-1 rounded-full">HSK 1-2: Beginner</span>
                      <span className="bg-white px-2 py-1 rounded-full">HSK 3-4: Intermediate</span>
                      <span className="bg-blue-100 px-2 py-1 rounded-full">HSK 5-6: Advanced</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Sticker Rewards Progress Bar - Moved to Bottom */}
          {userProfile && userProfile.level && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Gift className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Earn Animal Stickers as You Learn!
                    </h4>
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                  </div>
                </div>
              </div>
              
              {(() => {
                const level = userProfile.level;
                const nextStickerLevel = Math.ceil((level + 1) / 3) * 3;
                const hskTransitions = [11, 21, 31, 41, 51];
                const nextHskTransition = hskTransitions.find(l => l > level);
                const majorMilestones = [25, 50, 75, 100];
                const nextMilestone = majorMilestones.find(l => l > level);
                
                let nextReward = nextStickerLevel;
                let rewardType = "a sticker";
                let rewardIcon = "🎁";
                
                // Check which reward comes first
                if (nextHskTransition && (!nextReward || nextHskTransition < nextReward)) {
                  nextReward = nextHskTransition;
                  rewardType = "Epic/Legendary sticker (HSK level up!)";
                  rewardIcon = "⭐";
                }
                if (level % 10 === 9) {
                  nextReward = level + 1;
                  rewardType = "2 stickers with better odds";
                  rewardIcon = "🎁🎁";
                }
                if (nextMilestone && nextMilestone - level <= 3) {
                  nextReward = nextMilestone;
                  rewardType = "3 rare+ stickers (milestone!)";
                  rewardIcon = "🏆";
                }
                
                const levelsToGo = nextReward - level;
                const startLevel = nextReward - 3; // Show progress for last 3 levels
                const progressPercent = ((level - startLevel) / 3) * 100;
                
                return (
                  <div className="space-y-3">
                    <div className="bg-white/80 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Level {level}</span>
                          <span className="text-xs text-gray-500">→</span>
                          <span className="text-sm font-medium text-purple-600">Level {nextReward}</span>
                          <span className="text-lg">{rewardIcon}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-purple-700">{levelsToGo}</span>
                          <span className="text-xs font-medium text-purple-600 ml-1">
                            level{levelsToGo > 1 ? 's' : ''} to go
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(5, progressPercent)}%` }}
                        >
                          <div className="h-full flex items-center justify-end pr-2">
                            {progressPercent > 20 && (
                              <span className="text-xs text-white font-medium">
                                {Math.round(progressPercent)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Level markers */}
                        <div className="absolute inset-0 flex items-center justify-between px-2">
                          <span className="text-xs font-medium text-gray-600">{startLevel}</span>
                          <span className="text-xs font-medium text-gray-600">{nextReward}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Next: {rewardType}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-white px-2 py-1 rounded-full">Every 3 levels: 1 sticker</span>
                      <span className="bg-white px-2 py-1 rounded-full">Every 10 levels: 2 bonus stickers</span>
                      <span className="bg-purple-100 px-2 py-1 rounded-full">HSK: Epic/Legendary!</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default function ProgressivePractice() {
  return (
    <ProtectedRoute>
      <ProgressivePracticeContent />
    </ProtectedRoute>
  );
}
