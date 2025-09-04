import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trophy, ArrowRight, Home } from "lucide-react";
import { useLocation } from "wouter";
import ModernNav from "@/components/modern-nav";
import { audioManager } from "@/lib/audioManager";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LootBox } from "@/components/loot-box";

interface AssessmentQuestion {
  id: string;
  type: "multiple-choice" | "translation";
  question: string;
  chinese: string;
  pinyin: string;
  english: string;
  options: string[];
  correctAnswer: string;
  level: number;
}

interface AssessmentResult {
  score: number;
  level: number;
  placementLevel?: number;
  levelMaintained?: boolean;
  percentage: number;
  recommendations: string[];
}

function AssessmentContent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLootBox, setShowLootBox] = useState(false);
  const [earnedStickers, setEarnedStickers] = useState<any[]>([]);

  // Function to speak Chinese text using OpenAI TTS
  const speakChinese = async (text: string) => {
    try {
      await audioManager.playTTS(text, 0.5);
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  // Fetch assessment questions
  const { data: questions = [], isLoading } = useQuery<AssessmentQuestion[]>({
    queryKey: ["/api/assessment/questions"],
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      const response = await apiRequest("POST", "/api/assessment/submit", { answers });
      return response.json();
    },
    onSuccess: async (result) => {
      setAssessmentResult(result);
      setShowResult(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      
      // Award a loot box for completing the assessment
      try {
        const lootBoxResponse = await apiRequest("POST", "/api/stickers/open-lootbox", {
          event: 'assessment_complete'
        });
        const lootBoxData = await lootBoxResponse.json();
        if (lootBoxData.success && lootBoxData.stickers) {
          setEarnedStickers(lootBoxData.stickers);
          setShowLootBox(true);
        }
      } catch (error) {
        console.error("Failed to award loot box:", error);
      }
      
      toast({
        title: "Assessment Complete!",
        description: `You scored ${result.score}/10 and have been placed at Level ${result.level}`,
      });
    },
    onError: (error) => {
      console.error("Assessment submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    // Move to next question or finish
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 500);
    } else {
      // Submit assessment
      setIsSubmitting(true);
      submitAssessmentMutation.mutate(newAnswers);
    }
  };

  const getSelectedAnswer = () => {
    return answers[currentQuestion?.id] || "";
  };

  const getLevelDescription = (level: number) => {
    if (level <= 2) return "Beginner - Start with basic characters and simple phrases";
    if (level <= 4) return "Elementary - Build vocabulary and basic sentence structures";
    if (level <= 6) return "Intermediate - Develop conversational skills and grammar";
    if (level <= 8) return "Upper Intermediate - Practice complex expressions and reading";
    return "Advanced - Master nuanced communication and cultural understanding";
  };

  const getRecommendations = (score: number) => {
    if (score >= 9) return [
      "Practice advanced reading comprehension",
      "Focus on idiomatic expressions and cultural nuances",
      "Engage in complex conversation practice"
    ];
    if (score >= 7) return [
      "Strengthen intermediate grammar patterns",
      "Expand vocabulary through reading practice",
      "Practice speaking and pronunciation"
    ];
    if (score >= 5) return [
      "Review fundamental grammar structures", 
      "Build core vocabulary systematically",
      "Practice basic conversation skills"
    ];
    return [
      "Start with character recognition and basic vocabulary",
      "Learn essential phrases for daily communication",
      "Focus on pronunciation and tones"
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <ModernNav />
        <div className="max-w-screen-xl mx-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assessment questions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResult && assessmentResult) {
    return (
      <div className="min-h-screen">
        <ModernNav />
        <div className="max-w-screen-xl mx-auto p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-green-800">Assessment Complete!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-3xl font-bold text-green-600">{assessmentResult.score}/10</div>
                    <div className="text-sm text-gray-600">Final Score</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-3xl font-bold text-purple-600">Level {assessmentResult.level}</div>
                    <div className="text-sm text-gray-600">
                      {assessmentResult.levelMaintained 
                        ? "Current Level (Maintained)" 
                        : "Your Level"}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-3xl font-bold text-green-600">{assessmentResult.percentage}%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                </div>

                {assessmentResult.levelMaintained && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-start">
                      <Trophy className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-semibold">Level Maintained!</p>
                        <p className="text-green-700 text-sm mt-1">
                          Your assessment score would place you at Level {assessmentResult.placementLevel}, 
                          but you're already at Level {assessmentResult.level}. Great job maintaining your progress!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-lg border text-left">
                  <h3 className="font-semibold text-lg mb-3">Level Description</h3>
                  <p className="text-gray-700 mb-4">{getLevelDescription(assessmentResult.level)}</p>
                  
                  <h3 className="font-semibold text-lg mb-3">Recommended Focus Areas</h3>
                  <ul className="space-y-2">
                    {getRecommendations(assessmentResult.score).map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button onClick={() => navigate("/practice")} className="bg-green-600 hover:bg-green-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Start Practice
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    <Home className="w-4 h-4 mr-2" />
                    Go to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chinese Proficiency Assessment</h1>
            <p className="text-gray-600">
              Complete this 10-question assessment to determine your optimal starting level
            </p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {currentQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
                {currentQuestion.type === "multiple-choice" && (
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-green-600 mb-2">{currentQuestion.chinese}</div>
                    <div className="text-lg text-gray-600">{currentQuestion.pinyin}</div>
                  </div>
                )}
                {currentQuestion.type === "translation" && (
                  <div className="text-center py-4">
                    <div className="text-xl font-semibold text-gray-800 mb-2">"{currentQuestion.english}"</div>
                    <div className="text-sm text-gray-600">Choose the correct Chinese translation</div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = getSelectedAnswer() === option;
                    
                    // Determine what text to speak based on question type
                    const getTextToSpeak = () => {
                      if (currentQuestion.type === "translation") {
                        // For translation questions, options are Chinese
                        return option;
                      } else {
                        // For multiple-choice, speak the Chinese from the question
                        return currentQuestion.chinese;
                      }
                    };
                    
                    return (
                      <Button
                        key={index}
                        variant={isSelected ? "default" : "outline"}
                        className={`p-4 h-auto text-left justify-start ${
                          isSelected 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleAnswer(option)}
                        onMouseEnter={() => speakChinese(getTextToSpeak())}
                        disabled={isSubmitting}
                        title="Hover to hear pronunciation"
                      >
                        <span className="text-lg">{option}</span>
                      </Button>
                    );
                  })}
                </div>
                
                {isSubmitting && (
                  <div className="text-center mt-6">
                    <div className="animate-spin w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-600">Calculating your level...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Loot Box Modal */}
      <LootBox
        isOpen={showLootBox}
        onClose={() => setShowLootBox(false)}
        stickers={earnedStickers}
        onStickerReceived={(stickers) => {
          console.log("Stickers received:", stickers);
        }}
      />
    </div>
  );
}

export default function Assessment() {
  return <AssessmentContent />;
}
