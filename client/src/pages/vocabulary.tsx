import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";

export default function Vocabulary() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [activeStudyMode, setActiveStudyMode] = useState(0);

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
    <div className="min-h-screen">
      <Sidebar currentPage="/vocabulary" />
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Smart Vocabulary Builder</h2>
            <p className="text-text-secondary">Build your Chinese vocabulary with spaced repetition and intelligent review scheduling.</p>
          </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Progress Overview */}
        <div className="lg:col-span-1">
          <div className="card-duo">
            <h3 className="text-xl font-bold text-text-primary mb-6">Learning Progress</h3>
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-brand-primary border-2 border-brand-primary-dark rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-2xl font-bold text-white">{learnedWords}</span>
              </div>
              <p className="text-text-secondary">Words Learned</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Today's Goal</span>
                <span className="font-semibold text-brand-primary">{Math.max(0, 10 - currentCardIndex)}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 border border-gray-300">
                <div 
                  className="bg-brand-primary h-2 rounded-full transition-all mx-0.5 mt-0.5 shadow-sm" 
                  style={{width: `${Math.min(100, (currentCardIndex / 10) * 100)}%`}}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{streakDays}</div>
                  <div className="text-xs text-text-secondary">Streak Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-secondary">{dueWords.length}</div>
                  <div className="text-xs text-text-secondary">Review Due</div>
                </div>
              </div>
            </div>
          </div>

          {/* Study Options */}
          <div className="card-duo mt-6">
            <h3 className="text-xl font-bold text-text-primary mb-6">Study Mode</h3>
            <div className="space-y-3">
              {studyModes.map((mode, index) => (
                <button
                  key={index}
                  onClick={mode.onClick}
                  className={`w-full text-left p-3 rounded-lg font-medium transition-all duration-200 border hover:scale-105 active:scale-95 ${
                    activeStudyMode === index
                      ? "bg-brand-primary text-white border-brand-primary-dark shadow-md" 
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
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-2">
          <div className="card-duo">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">
                {studyModes[activeStudyMode].title}
              </h3>
              <div className="flex items-center space-x-4">
                {activeStudyMode === 0 && dueWords.length > 0 && (
                  <span className="text-sm text-text-secondary">
                    Card {currentCardIndex + 1} of {dueWords.length}
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    // Toggle between different review modes
                    const modes = ['standard', 'speed', 'typing'];
                    const currentMode = localStorage.getItem('reviewMode') || 'standard';
                    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
                    localStorage.setItem('reviewMode', modes[nextIndex]);
                    window.location.reload();
                  }}
                  title="Settings" 
                  className="text-text-secondary hover:text-text-primary hover:bg-gray-100"
                >
                  <i className="fas fa-cog"></i>
                </Button>
              </div>
            </div>

            {/* Smart Review Mode */}
            {activeStudyMode === 0 && (
              <>
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
                      className="bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl p-8 text-center text-white mb-6 min-h-64 flex flex-col justify-center cursor-pointer hover:shadow-lg transition-shadow"
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
                          <span className="ml-2 font-medium text-brand-primary">Level {currentCard.hskLevel}</span>
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
              </>
            )}

            {/* Learn New Words Mode */}
            {activeStudyMode === 1 && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <i className="fas fa-plus-circle text-4xl text-brand-primary mb-4"></i>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">Add New Vocabulary</h3>
                  <p className="text-text-secondary mb-6">
                    Create custom vocabulary cards to expand your Chinese learning experience.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input 
                        type="text" 
                        placeholder="Chinese character (e.g., 你好)"
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                      />
                      <input 
                        type="text" 
                        placeholder="Pinyin (e.g., nǐ hǎo)"
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                      />
                      <input 
                        type="text" 
                        placeholder="English meaning (e.g., hello)"
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                      />
                      <select className="w-full p-3 border border-gray-300 rounded-lg mb-4">
                        <option value="1">HSK Level 1</option>
                        <option value="2">HSK Level 2</option>
                        <option value="3">HSK Level 3</option>
                        <option value="4">HSK Level 4</option>
                        <option value="5">HSK Level 5</option>
                        <option value="6">HSK Level 6</option>
                      </select>
                      <Button className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white">
                        <i className="fas fa-plus mr-2"></i>
                        Add Word
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vocabulary Games Mode */}
            {activeStudyMode === 2 && (
              <div className="text-center py-12">
                <div className="max-w-2xl mx-auto">
                  <i className="fas fa-gamepad text-4xl text-brand-secondary mb-4"></i>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">Vocabulary Games</h3>
                  <p className="text-text-secondary mb-8">
                    Make learning fun with interactive vocabulary games!
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
                      <i className="fas fa-bolt text-3xl text-blue-500 mb-3"></i>
                      <h4 className="font-semibold text-gray-800 mb-2">Speed Match</h4>
                      <p className="text-sm text-gray-600 mb-4">Match characters to meanings as fast as you can!</p>
                      <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        Play Now
                      </Button>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg transition-shadow cursor-pointer">
                      <i className="fas fa-crosshairs text-3xl text-green-500 mb-3"></i>
                      <h4 className="font-semibold text-gray-800 mb-2">Character Hunt</h4>
                      <p className="text-sm text-gray-600 mb-4">Find and select the correct Chinese characters!</p>
                      <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                        Play Now
                      </Button>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg transition-shadow cursor-pointer">
                      <i className="fas fa-puzzle-piece text-3xl text-purple-500 mb-3"></i>
                      <h4 className="font-semibold text-gray-800 mb-2">Word Builder</h4>
                      <p className="text-sm text-gray-600 mb-4">Build complete words from character parts!</p>
                      <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                        Play Now
                      </Button>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-lg transition-shadow cursor-pointer">
                      <i className="fas fa-headphones text-3xl text-orange-500 mb-3"></i>
                      <h4 className="font-semibold text-gray-800 mb-2">Listen & Match</h4>
                      <p className="text-sm text-gray-600 mb-4">Match audio pronunciation to characters!</p>
                      <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                        Play Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Stats Mode */}
            {activeStudyMode === 3 && (
              <div className="py-8">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Learning Analytics</h3>
                  
                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">{totalWords}</div>
                      <div className="text-sm text-blue-800 font-medium">Total Words</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="text-3xl font-bold text-green-600">{learnedWords}</div>
                      <div className="text-sm text-green-800 font-medium">Words Learned</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                      <div className="text-3xl font-bold text-orange-600">{dueWords.length}</div>
                      <div className="text-sm text-orange-800 font-medium">Due for Review</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600">{Math.round((learnedWords / Math.max(totalWords, 1)) * 100)}%</div>
                      <div className="text-sm text-purple-800 font-medium">Mastery Rate</div>
                    </div>
                  </div>

                  {/* Learning Streak */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                      <h4 className="font-semibold text-gray-800 mb-4">Study Streak</h4>
                      <div className="flex items-center">
                        <div className="text-4xl font-bold text-yellow-600 mr-4">{streakDays}</div>
                        <div>
                          <div className="text-sm text-gray-700 font-medium">Days in a row</div>
                          <div className="text-xs text-gray-600">Keep it up!</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                      <h4 className="font-semibold text-gray-800 mb-4">Weekly Goal</h4>
                      <div className="flex items-center">
                        <div className="text-4xl font-bold text-teal-600 mr-4">85%</div>
                        <div>
                          <div className="text-sm text-gray-700 font-medium">Goal Progress</div>
                          <div className="text-xs text-gray-600">5/7 days this week</div>
                        </div>
                      </div>
                      <div className="w-full bg-teal-200 rounded-full h-2 mt-3">
                        <div className="bg-teal-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}