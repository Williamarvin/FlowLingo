import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

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
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showDifficultyOption, setShowDifficultyOption] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);

  // Fetch user profile to get current level
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Fetch practice questions
  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/practice/questions", currentLevel],
  });

  const currentQ = questions[currentQuestionIndex] || null;

  // Mutation to save practice session and award XP
  const savePracticeMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return await apiRequest("/api/practice/save-session", {
        method: "POST",
        body: sessionData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  // Update current level when user profile loads
  useEffect(() => {
    if (userProfile?.level) {
      setCurrentLevel(userProfile.level);
    }
  }, [userProfile]);

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQ.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (!correct) {
      setWrongAttempts(prev => prev + 1);
      if (wrongAttempts >= 2) { // After 3 wrong attempts
        setShowDifficultyOption(true);
      }
    } else {
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

  const handleCompletedLesson = () => {
    const accuracy = questions.length > 0 ? (questions.filter((_, idx) => idx <= currentQuestionIndex).length / questions.length) * 100 : 0;
    const xp = Math.round(accuracy * 10);
    
    savePracticeMutation.mutate({
      level: currentLevel,
      questionsAnswered: questions.length,
      accuracy: accuracy,
      xpEarned: xp,
    });

    navigate("/");
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
    const accuracy = questions.length > 0 ? (questions.filter((_, idx) => idx <= currentQuestionIndex).length / questions.length) * 100 : 0;
    const xp = Math.round(accuracy * 10);

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex">
        <Sidebar currentPage="/practice" />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-lg">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Lesson Complete!</h1>
            <p className="text-xl text-gray-600 mb-6">You earned {xp} XP</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-green-100 rounded-2xl p-4">
                <div className="text-2xl font-bold text-green-700">Accuracy</div>
                <div className="text-4xl font-bold text-green-800">
                  {Math.round(accuracy)}%
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex">
      <Sidebar currentPage="/practice" />
      
      {/* Main Content Area */}
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
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
                        {/* Parse the selected answer to show hanzi, pinyin, and meaning */}
                        {(() => {
                          // For answers in format "hanzi (pinyin) - meaning"
                          const match = selectedAnswer.match(/^(.+?)\s*\((.+?)\)\s*-\s*(.+)$/);
                          if (match) {
                            return (
                              <>
                                <div className="text-4xl font-bold text-gray-800 mb-2">{match[1]}</div>
                                <div className="text-lg text-blue-600 font-medium mb-2">{match[2]}</div>
                                <div className="text-xl text-gray-600">{match[3]}</div>
                              </>
                            );
                          }
                          // Fallback for simple text answers
                          return <div className="text-xl text-gray-600">{selectedAnswer}</div>;
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