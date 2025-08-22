import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ModernNav from "@/components/modern-nav";
import { 
  ChevronRight, 
  RotateCcw, 
  Check, 
  X, 
  Volume2,
  BookOpen,
  Target,
  AlertCircle,
  Trophy,
  Filter,
  Plus,
  Save,
  Gift,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Flashcard {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  source: string;
  level: number;
  difficulty: string;
  timesReviewed: number;
  timesCorrect: number;
  timesWrong: number;
}

function FlashcardsContent() {
  const { toast } = useToast();
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "assessment" | "practice" | "new">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState({
    chinese: "",
    pinyin: "",
    english: "",
    level: "1"
  });

  // Get user profile for level progress
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    refetchInterval: 10000,
  });

  // Fetch flashcards
  const { data: flashcards = [], isLoading, refetch } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/flashcards?filter=${activeTab}`);
      if (!response.ok) throw new Error("Failed to fetch flashcards");
      return response.json();
    },
  });

  // Update flashcard mutation
  const updateFlashcardMutation = useMutation({
    mutationFn: async ({ id, correct }: { id: string; correct: boolean }) => {
      const response = await apiRequest("POST", `/api/flashcards/${id}/review`, { correct });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
    },
  });

  // Add new flashcard mutation
  const addFlashcardMutation = useMutation({
    mutationFn: async (flashcard: any) => {
      const response = await apiRequest("POST", "/api/flashcards", flashcard);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Flashcard Added",
        description: "New flashcard has been added to your deck",
      });
      setIsAddDialogOpen(false);
      setNewWord({ chinese: "", pinyin: "", english: "", level: "1" });
    },
  });

  // Seed initial vocabulary mutation
  const seedVocabularyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/flashcards/seed", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Vocabulary Added!",
        description: "Essential Chinese words have been added to your deck",
      });
    },
  });

  // Delete flashcard mutation
  const deleteFlashcardMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/flashcards/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Flashcard Removed",
        description: "The flashcard has been mastered and removed from your deck",
      });
    },
  });

  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const handleAnswer = async (correct: boolean) => {
    if (!currentCard) return;

    if (correct) {
      setSessionCorrect(prev => prev + 1);
    } else {
      setSessionWrong(prev => prev + 1);
    }

    await updateFlashcardMutation.mutateAsync({ id: currentCard.id, correct });

    // If card is mastered (correct 5+ times with 80%+ accuracy), remove it
    const totalAttempts = currentCard.timesCorrect + currentCard.timesWrong + 1;
    const accuracy = correct 
      ? (currentCard.timesCorrect + 1) / totalAttempts 
      : currentCard.timesCorrect / totalAttempts;
    
    if (correct && currentCard.timesCorrect >= 4 && accuracy >= 0.8) {
      await deleteFlashcardMutation.mutateAsync(currentCard.id);
      toast({
        title: "Card Mastered! 🎉",
        description: "You've mastered this word and it's been removed from your deck",
      });
    }

    // Move to next card
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      toast({
        title: "Session Complete!",
        description: "Great job! You've reviewed all cards in this deck.",
      });
      setCurrentIndex(0);
      setSessionCorrect(0);
      setSessionWrong(0);
      setShowAnswer(false);
      refetch();
    }
  };

  const playAudio = async (text: string) => {
    try {
      const response = await apiRequest("POST", "/api/tts", { 
        text,
        speed: 0.65 
      });
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  const getSourceIcon = (source: string) => {
    switch(source) {
      case "assessment": return <AlertCircle className="w-4 h-4" />;
      case "practice": return <Target className="w-4 h-4" />;
      case "new": return <BookOpen className="w-4 h-4" />;
      default: return null;
    }
  };

  const getSourceColor = (source: string) => {
    switch(source) {
      case "assessment": return "bg-red-100 text-red-700";
      case "practice": return "bg-green-100 text-green-700";
      case "new": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <ModernNav />
        <div className="max-w-screen-xl mx-auto p-8">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-full animate-fade-in">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Flashcards</h1>
              <p className="text-gray-600">
                Review words from assessments, practice mistakes, and new vocabulary
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="modern-button-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Word
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Flashcard</DialogTitle>
                  <DialogDescription>
                    Add a new Chinese word to your flashcard deck
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="chinese">Chinese Character(s)</Label>
                    <Input
                      id="chinese"
                      value={newWord.chinese}
                      onChange={(e) => setNewWord({...newWord, chinese: e.target.value})}
                      placeholder="你好"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pinyin">Pinyin</Label>
                    <Input
                      id="pinyin"
                      value={newWord.pinyin}
                      onChange={(e) => setNewWord({...newWord, pinyin: e.target.value})}
                      placeholder="nǐ hǎo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="english">English Translation</Label>
                    <Input
                      id="english"
                      value={newWord.english}
                      onChange={(e) => setNewWord({...newWord, english: e.target.value})}
                      placeholder="hello"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Difficulty Level</Label>
                    <Select
                      value={newWord.level}
                      onValueChange={(value) => setNewWord({...newWord, level: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10].map(lvl => (
                          <SelectItem key={lvl} value={lvl.toString()}>
                            Level {lvl}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => {
                      if (newWord.chinese && newWord.pinyin && newWord.english) {
                        addFlashcardMutation.mutate({
                          chinese: newWord.chinese,
                          pinyin: newWord.pinyin,
                          english: newWord.english,
                          source: "new",
                          level: parseInt(newWord.level),
                        });
                      }
                    }}
                    className="w-full gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Flashcard
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sticker Progress Bar */}
          {userProfile && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Gift className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Sticker Progress
                    </h4>
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                  </div>
                </div>
              </div>
              
              {(() => {
                const level = userProfile.level || 1;
                const nextStickerLevel = Math.ceil((level + 1) / 3) * 3;
                const hskTransitions = [11, 21, 31, 41, 51];
                const nextHskTransition = hskTransitions.find(l => l > level);
                const majorMilestones = [25, 50, 75, 100];
                const nextMilestone = majorMilestones.find(l => l > level);
                
                let nextReward = nextStickerLevel;
                let rewardType = "New sticker";
                let rewardIcon = "🎁";
                
                // Check special rewards
                if (level === 10 || level === 20 || level === 30 || level === 40 || level === 50) {
                  nextReward = level + 1;
                  rewardType = "Epic/Legendary sticker!";
                  rewardIcon = "⭐";
                } else if (level % 10 === 9) {
                  nextReward = level + 1;
                  rewardType = "2 bonus stickers!";
                  rewardIcon = "🎁🎁";
                } else if (level === 24 || level === 49 || level === 74 || level === 99) {
                  nextReward = level + 1;
                  rewardType = "3 rare+ stickers!";
                  rewardIcon = "🏆";
                } else if ((level + 1) % 3 === 0) {
                  nextReward = level + 1;
                  rewardType = "New sticker!";
                }
                
                const levelsToGo = nextReward - level;
                const startLevel = nextReward - 3;
                const progressPercent = ((level - startLevel) / 3) * 100;
                
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
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
                    <div className="relative h-8 bg-white/60 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500"
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {rewardType}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Stats Bar - Modern Glass Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="modern-card p-4 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Cards</p>
                  <p className="text-2xl font-bold gradient-text">{flashcards.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="modern-card p-4 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">From Assessment</p>
                  <p className="text-2xl font-bold text-red-600">
                    {flashcards.filter(f => f.source === "assessment").length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            <div className="modern-card p-4 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">From Practice</p>
                  <p className="text-2xl font-bold text-green-600">
                    {flashcards.filter(f => f.source === "practice").length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs - Modern Style */}
          <Tabs defaultValue="all" className="mb-6" onValueChange={(v) => {
            setActiveTab(v as any);
            setCurrentIndex(0);
            setShowAnswer(false);
          }}>
            <TabsList className="grid w-full grid-cols-4 bg-green-100/50 p-1 rounded-xl">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all">All Cards</TabsTrigger>
              <TabsTrigger value="assessment" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all">Assessment Mistakes</TabsTrigger>
              <TabsTrigger value="practice" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all">Practice Mistakes</TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all">New Words</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Main Flashcard Area */}
          {flashcards.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Flashcards Yet</h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === "assessment" && "Complete an assessment to add words you missed"}
                  {activeTab === "practice" && "Practice sessions will add words you get wrong"}
                  {activeTab === "new" && "New vocabulary words will appear here"}
                  {activeTab === "all" && "Get started by adding some vocabulary or taking a practice session"}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => seedVocabularyMutation.mutate()}
                    disabled={seedVocabularyMutation.isPending}
                    className="gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    {seedVocabularyMutation.isPending ? "Adding..." : "Add Starter Vocabulary"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Word
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Card {currentIndex + 1} of {totalCards}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Flashcard - Modern Design */}
              <div className="modern-card mb-6 p-8 animate-slide-up">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-semibold text-gray-700">Review Card</h3>
                  <div className="flex gap-2">
                    <Badge className={`${getSourceColor(currentCard.source)} shadow-sm`}>
                      <span className="flex items-center gap-1">
                        {getSourceIcon(currentCard.source)}
                        {currentCard.source}
                      </span>
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 shadow-sm">Level {currentCard.level}</Badge>
                  </div>
                </div>
                
                <div className="text-center py-8">
                  {/* Chinese Character */}
                  <div className="mb-8">
                    <h2 className="text-6xl font-bold gradient-text mb-6">
                      {currentCard.chinese}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(currentCard.chinese)}
                      className="gap-2 hover:bg-green-100 rounded-xl"
                    >
                      <Volume2 className="w-4 h-4" />
                      Play Sound
                    </Button>
                  </div>

                    {/* Answer Section */}
                    {!showAnswer ? (
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="modern-button-primary px-8 py-4 text-lg font-semibold gap-2 inline-flex items-center"
                      >
                        Show Answer
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="space-y-6 animate-fade-in">
                        {/* Pinyin */}
                        <div className="p-4 bg-green-50 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">Pinyin</p>
                          <p className="text-2xl font-medium text-green-700">{currentCard.pinyin}</p>
                        </div>

                        {/* English */}
                        <div className="p-4 bg-green-50 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">English</p>
                          <p className="text-xl font-medium text-green-700">{currentCard.english}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center gap-4 text-sm text-gray-500">
                          <span className="px-3 py-1 bg-gray-100 rounded-full">Reviewed: {currentCard.timesReviewed}x</span>
                          <span className="px-3 py-1 bg-green-100 rounded-full text-green-700">Correct: {currentCard.timesCorrect}</span>
                          <span className="px-3 py-1 bg-red-100 rounded-full text-red-700">Wrong: {currentCard.timesWrong}</span>
                        </div>

                        {/* Next Card Button */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              if (currentIndex < totalCards - 1) {
                                setCurrentIndex(prev => prev + 1);
                                setShowAnswer(false);
                              } else {
                                // Reset to beginning
                                setCurrentIndex(0);
                                setShowAnswer(false);
                              }
                            }}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 gap-2 inline-flex items-center"
                          >
                            {currentIndex < totalCards - 1 ? (
                              <>
                                Next Card
                                <ChevronRight className="w-5 h-5" />
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                Start Over
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
              </div>

              {/* Controls */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(0);
                    setShowAnswer(false);
                    setSessionCorrect(0);
                    setSessionWrong(0);
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart Session
                </Button>
                
                {currentIndex < totalCards - 1 && !showAnswer && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentIndex(prev => prev + 1);
                      setShowAnswer(false);
                    }}
                  >
                    Skip Card
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default function Flashcards() {
  return (
    <ProtectedRoute>
      <FlashcardsContent />
    </ProtectedRoute>
  );
}
