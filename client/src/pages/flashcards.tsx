import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
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
  Save
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

export default function Flashcards() {
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
        description: `Correct: ${sessionCorrect + (correct ? 1 : 0)}, Wrong: ${sessionWrong + (correct ? 0 : 1)}`,
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
        speed: 0.8 
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
      case "practice": return "bg-blue-100 text-blue-700";
      case "new": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Sidebar currentPage="/flashcards" />
        <div className="ml-64 p-8">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Sidebar currentPage="/flashcards" />
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
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

          {/* Stats Bar - Modern Glass Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
                  <p className="text-2xl font-bold text-blue-600">
                    {flashcards.filter(f => f.source === "practice").length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="modern-card p-4 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Session Score</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {sessionCorrect}/{sessionCorrect + sessionWrong}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Trophy className="w-6 h-6 text-yellow-600" />
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
            <TabsList className="grid w-full grid-cols-4 bg-purple-100/50 p-1 rounded-xl">
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
                    <Badge className="bg-purple-100 text-purple-700 shadow-sm">Level {currentCard.level}</Badge>
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
                      className="gap-2 hover:bg-purple-100 rounded-xl"
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
                        <div className="p-4 bg-purple-50 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">Pinyin</p>
                          <p className="text-2xl font-medium text-purple-700">{currentCard.pinyin}</p>
                        </div>

                        {/* English */}
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">English</p>
                          <p className="text-xl font-medium text-blue-700">{currentCard.english}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center gap-4 text-sm text-gray-500">
                          <span className="px-3 py-1 bg-gray-100 rounded-full">Reviewed: {currentCard.timesReviewed}x</span>
                          <span className="px-3 py-1 bg-green-100 rounded-full text-green-700">Correct: {currentCard.timesCorrect}</span>
                          <span className="px-3 py-1 bg-red-100 rounded-full text-red-700">Wrong: {currentCard.timesWrong}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => handleAnswer(false)}
                            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 gap-2 inline-flex items-center"
                          >
                            <X className="w-5 h-5" />
                            Wrong
                          </button>
                          <button
                            onClick={() => handleAnswer(true)}
                            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 gap-2 inline-flex items-center"
                          >
                            <Check className="w-5 h-5" />
                            Correct
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