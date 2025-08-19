import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Vocabulary() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const { data: dueWords = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/vocabulary/due"],
  });

  const { data: allWords = [] } = useQuery<any[]>({
    queryKey: ["/api/vocabulary"],
  });

  const updateWordMutation = useMutation({
    mutationFn: async (params: { id: string; difficulty: string; successRate: number; timesReviewed: number }) => {
      const response = await apiRequest("PATCH", `/api/vocabulary/${params.id}`, params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/due"] });
      handleNextCard();
    },
  });

  const currentCard = dueWords[currentCardIndex];
  const totalWords = allWords.length;
  const learnedWords = allWords.filter((word: any) => word.difficulty !== "new").length;
  const streakDays = 15; // Mock data

  const handleAnswer = (difficulty: string) => {
    if (!currentCard) return;

    const newTimesReviewed = currentCard.timesReviewed + 1;
    let newSuccessRate = currentCard.successRate;

    // Update success rate based on difficulty
    if (difficulty === "easy" || difficulty === "good") {
      newSuccessRate = Math.min(100, currentCard.successRate + 10);
    } else if (difficulty === "hard") {
      newSuccessRate = Math.max(0, currentCard.successRate - 5);
    } else if (difficulty === "again") {
      newSuccessRate = Math.max(0, currentCard.successRate - 15);
    }

    updateWordMutation.mutate({
      id: currentCard.id,
      difficulty,
      successRate: newSuccessRate,
      timesReviewed: newTimesReviewed,
    });
  };

  const handleNextCard = () => {
    setShowAnswer(false);
    if (currentCardIndex < dueWords.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  const handleCardClick = () => {
    setShowAnswer(!showAnswer);
  };

  const [activeStudyMode, setActiveStudyMode] = useState(0);
  
  const studyModes = [
    { 
      icon: "fas fa-brain", 
      title: "Smart Review", 
      subtitle: `${dueWords.length} words`,
      onClick: () => setActiveStudyMode(0)
    },
    { 
      icon: "fas fa-plus", 
      title: "Learn New Words", 
      subtitle: "Expand vocabulary",
      onClick: () => setActiveStudyMode(1)
    },
    { 
      icon: "fas fa-gamepad", 
      title: "Vocabulary Games", 
      subtitle: "Fun practice",
      onClick: () => setActiveStudyMode(2)
    },
    { 
      icon: "fas fa-chart-line", 
      title: "Progress Stats", 
      subtitle: "View analytics",
      onClick: () => setActiveStudyMode(3)
    }
  ];

  const answerButtons = [
    { key: "again", label: "Again", icon: "fas fa-times", color: "bg-red-500 hover:bg-red-600" },
    { key: "hard", label: "Hard", icon: "fas fa-exclamation", color: "bg-orange-500 hover:bg-orange-600" },
    { key: "good", label: "Good", icon: "fas fa-check", color: "bg-blue-500 hover:bg-blue-600" },
    { key: "easy", label: "Easy", icon: "fas fa-check-double", color: "bg-green-500 hover:bg-green-600" }
  ];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <i className="fas fa-spinner fa-spin text-4xl text-brand-blue mb-4"></i>
          <p className="text-text-secondary">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-4">Smart Vocabulary Builder</h2>
        <p className="text-text-secondary">Build your Chinese vocabulary with spaced repetition and intelligent review scheduling.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Progress Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-brand-blue border-2 border-brand-blue-dark rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-2xl font-bold text-white">{learnedWords}</span>
                </div>
                <p className="text-text-secondary">Words Learned</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Today's Goal</span>
                  <span className="font-semibold text-brand-blue">{Math.max(0, 10 - currentCardIndex)}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 border border-gray-300">
                  <div 
                    className="bg-brand-blue h-2 rounded-full transition-all mx-0.5 mt-0.5 shadow-sm" 
                    style={{width: `${Math.min(100, (currentCardIndex / 10) * 100)}%`}}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{streakDays}</div>
                    <div className="text-xs text-text-secondary">Streak Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-yellow">{dueWords.length}</div>
                    <div className="text-xs text-text-secondary">Review Due</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Options */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Study Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studyModes.map((mode, index) => (
                  <button
                    key={index}
                    onClick={mode.onClick}
                    className={`w-full text-left p-3 rounded-lg font-medium transition-all duration-200 border hover:scale-105 active:scale-95 ${
                      activeStudyMode === index
                        ? "bg-brand-blue text-white border-brand-blue-dark shadow-md" 
                        : "bg-gray-50 text-text-secondary hover:bg-gray-100 border-gray-200 hover:border-gray-300 hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center">
                      <i className={`${mode.icon} mr-3`}></i>
                      <div>
                        <div className="font-semibold">{mode.title}</div>
                        <div className="text-xs opacity-75">{mode.subtitle}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flashcard Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Vocabulary Review</CardTitle>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-text-secondary">
                    Card {currentCardIndex + 1} of {dueWords.length}
                  </span>
                  <Button variant="ghost" size="sm" title="Settings" className="text-text-secondary hover:text-text-primary hover:bg-gray-100">
                    <i className="fas fa-cog"></i>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dueWords.length === 0 ? (
                <div className="text-center py-20">
                  <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">All caught up!</h3>
                  <p className="text-text-secondary">No vocabulary words due for review right now.</p>
                </div>
              ) : currentCard ? (
                <>
                  {/* Flashcard */}
                  <div 
                    className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-8 text-center text-white mb-6 min-h-64 flex flex-col justify-center cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={handleCardClick}
                  >
                    <div className="text-6xl font-bold mb-4">{currentCard.character}</div>
                    {showAnswer ? (
                      <>
                        <div className="text-xl mb-2">{currentCard.pinyin}</div>
                        <div className="text-lg opacity-90">{currentCard.english}</div>
                      </>
                    ) : (
                      <div className="mt-6 text-sm opacity-75">Click to reveal translation</div>
                    )}
                  </div>
                  
                  {/* Answer Buttons */}
                  {showAnswer && (
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {answerButtons.map((button) => (
                        <Button
                          key={button.key}
                          onClick={() => handleAnswer(button.key)}
                          className={`p-3 ${button.color} text-white font-medium transition-colors`}
                          disabled={updateWordMutation.isPending}
                        >
                          <div className="text-center">
                            <i className={`${button.icon} mb-1 block`}></i>
                            <div className="text-xs">{button.label}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* Word Details */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-medium text-text-primary mb-2">Word Details</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">HSK Level:</span>
                        <span className="ml-2 font-medium text-brand-blue">Level {currentCard.hskLevel}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Last Reviewed:</span>
                        <span className="ml-2 font-medium text-text-primary">
                          {currentCard.timesReviewed === 0 ? "Never" : "3 days ago"}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Success Rate:</span>
                        <span className="ml-2 font-medium text-green-600">{currentCard.successRate}%</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Times Reviewed:</span>
                        <span className="ml-2 font-medium text-text-primary">{currentCard.timesReviewed}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <i className="fas fa-book text-4xl text-text-secondary mb-4 opacity-50"></i>
                  <p className="text-text-secondary">No vocabulary words available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
