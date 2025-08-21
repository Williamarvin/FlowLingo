import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { Heart, Clock, Trophy, X } from "lucide-react";

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

export default function ProgressivePractice() {
  const [, navigate] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCompletedScreen, setShowCompletedScreen] = useState(false);
  const [showOutOfHeartsScreen, setShowOutOfHeartsScreen] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showDifficultyOption, setShowDifficultyOption] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState<number | null>(null);
  const [sessionStartTime] = useState(Date.now());

  // Function to speak Chinese text using browser TTS
  const speakChinese = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a Chinese voice
      const voices = window.speechSynthesis.getVoices();
      const chineseVoice = voices.find(voice => 
        voice.lang.includes('zh') || voice.lang.includes('cmn')
      );
      
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }
      
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
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
      setHearts(userProfile.hearts !== undefined ? userProfile.hearts : 5);
      
      // Calculate time until next heart
      if (userProfile.hearts < userProfile.maxHearts && userProfile.lastHeartLostAt) {
        const lastLost = new Date(userProfile.lastHeartLostAt).getTime();
        const now = Date.now();
        const hoursPassed = Math.floor((now - lastLost) / (1000 * 60 * 60));
        const heartsToRegenerate = Math.min(hoursPassed, userProfile.maxHearts - userProfile.hearts);
        
        if (heartsToRegenerate > 0) {
          // Regenerate hearts
          updateHeartsMutation.mutate(heartsToRegenerate);
        } else {
          // Calculate time until next heart
          const nextHeartTime = lastLost + (1000 * 60 * 60); // 1 hour from last lost
          const timeRemaining = Math.max(0, nextHeartTime - now);
          setTimeUntilNextHeart(timeRemaining);
        }
      }
    }
  }, [userProfile]);

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

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQ.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (!correct) {
      setWrongAnswers(prev => prev + 1);
      setWrongAttempts(prev => prev + 1);
      
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
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setWrongAttempts(0);
        setShowDifficultyOption(false);
      } else {
        // Complete the lesson
        setShowCompletedScreen(true);
      }
    } else {
      // Try again - reset for same question
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handleGoToPreviousLevel = () => {
    if (currentLevel > 1) {
      setCurrentLevel(currentLevel - 1);
      queryClient.invalidateQueries({ queryKey: ["/api/practice/questions", currentLevel - 1] });
      setCurrentQuestionIndex(0);
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
    
    // Save practice session and get the result
    const result = await savePracticeMutation.mutateAsync({
      level: currentLevel,
      questionsAnswered: questions.length,
      correctAnswers: correctAnswers,
      wrongAnswers: wrongAnswers,
      accuracy: accuracy,
      xpEarned: xp,
      timeSpent: timeSpent,
    });

    // If user leveled up, navigate to the next level's practice page
    if (result && result.leveledUp) {
      toast({
        title: "Level Up! 🎉",
        description: `Congratulations! You've advanced to Level ${result.newLevel}!`,
      });
      // Navigate to the practice page to start the new level
      setTimeout(() => {
        navigate("/practice");
        window.location.reload(); // Reload to get the new level from profile
      }, 1500);
    } else {
      // Navigate home if they didn't level up
      navigate("/");
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex">
        <Sidebar currentPage="/practice" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-2xl font-bold text-gray-700">Loading practice session...</div>
          </div>
        </div>
      </div>
    );
  }

  // Out of hearts screen
  if (showOutOfHeartsScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-pink-50 flex">
        <Sidebar currentPage="/practice" />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-lg">
            <div className="text-6xl mb-6">💔</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Out of Hearts!</h1>
            <p className="text-xl text-gray-600 mb-6">
              You've run out of hearts. Come back later or wait for them to regenerate.
            </p>
            
            {timeUntilNextHeart && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Next heart in: {formatTime(timeUntilNextHeart)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Hearts regenerate 1 per hour</p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white font-bold py-4 text-lg rounded-2xl shadow-lg"
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex">
        <Sidebar currentPage="/practice" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-2xl font-bold text-gray-700 mb-4">No questions available</div>
            <Button onClick={() => navigate("/")} className="bg-blue-500 hover:bg-blue-600 text-white">
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex">
        <Sidebar currentPage="/practice" />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-lg">
            <div className="text-6xl mb-6">{passed ? '🏆' : '📊'}</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {passed ? 'Lesson Passed!' : 'Lesson Complete'}
            </h1>
            
            {passed && (
              <div className="bg-green-50 rounded-2xl p-3 mb-4">
                <p className="text-green-700 font-semibold">Great job! You've mastered this level!</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="text-sm text-gray-600 mb-1">Correct</div>
                <div className="text-3xl font-bold text-blue-700">{correctAnswers}</div>
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
              
              <div className="bg-purple-100 rounded-2xl p-4">
                <div className="text-xl font-bold text-gray-700">XP Earned</div>
                <div className="text-3xl font-bold text-purple-700">+{xp} XP</div>
              </div>
            </div>
            
            <Button
              onClick={handleCompletedLesson}
              className={`w-full ${passed 
                ? 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600' 
                : 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600'
              } text-white font-bold py-4 text-lg rounded-2xl shadow-lg transform transition hover:scale-105`}
            >
              {passed ? `Continue to Level ${currentLevel + 1}` : 'Return Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <Sidebar currentPage="/practice" />
      
      {/* Main Content Area */}
      <div className="ml-64 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Top Header with Hearts and Progress */}
          <div className="bg-white rounded-2xl shadow-md p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">Level {currentLevel}</span>
              <div className="w-px h-6 bg-gray-300"></div>
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
                  className="text-6xl font-bold text-gray-900 mb-4 p-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl inline-block cursor-pointer hover:bg-gradient-to-br hover:from-blue-200 hover:to-purple-200 transition-all duration-200"
                  onMouseEnter={() => speakChinese(currentQ.chinese)}
                  title="Hover to hear pronunciation"
                >
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
                                  <div className="text-lg text-blue-600 font-medium mb-1">{optionDetails[selectedIndex].pinyin}</div>
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
                                  <div className="text-lg text-blue-600 font-medium mb-1">{optionDetails[selectedIndex].pinyin}</div>
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
                      <div className="text-lg text-blue-600 font-medium mb-1">{currentQ.pinyin}</div>
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
    </div>
  );
}