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
  Filter
} from "lucide-react";

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
    mutationFn: async (flashcard: Partial<Flashcard>) => {
      const response = await apiRequest("POST", "/api/flashcards", flashcard);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Flashcard Added",
        description: "New flashcard has been added to your deck",
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
    <div className="min-h-screen">
      <Sidebar currentPage="/flashcards" />
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Flashcards</h1>
            <p className="text-gray-600">
              Review words from assessments, practice mistakes, and new vocabulary
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Cards</p>
                    <p className="text-2xl font-bold">{flashcards.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">From Assessment</p>
                    <p className="text-2xl font-bold">
                      {flashcards.filter(f => f.source === "assessment").length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">From Practice</p>
                    <p className="text-2xl font-bold">
                      {flashcards.filter(f => f.source === "practice").length}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Session Score</p>
                    <p className="text-2xl font-bold">
                      {sessionCorrect}/{sessionCorrect + sessionWrong}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="all" className="mb-6" onValueChange={(v) => {
            setActiveTab(v as any);
            setCurrentIndex(0);
            setShowAnswer(false);
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Cards</TabsTrigger>
              <TabsTrigger value="assessment">Assessment Mistakes</TabsTrigger>
              <TabsTrigger value="practice">Practice Mistakes</TabsTrigger>
              <TabsTrigger value="new">New Words</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Main Flashcard Area */}
          {flashcards.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Flashcards Yet</h3>
                <p className="text-gray-500">
                  {activeTab === "assessment" && "Complete an assessment to add words you missed"}
                  {activeTab === "practice" && "Practice sessions will add words you get wrong"}
                  {activeTab === "new" && "New vocabulary words will appear here"}
                  {activeTab === "all" && "Start practicing or take an assessment to build your deck"}
                </p>
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

              {/* Flashcard */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>Review Card</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getSourceColor(currentCard.source)}>
                        <span className="flex items-center gap-1">
                          {getSourceIcon(currentCard.source)}
                          {currentCard.source}
                        </span>
                      </Badge>
                      <Badge variant="outline">Level {currentCard.level}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    {/* Chinese Character */}
                    <div className="mb-8">
                      <h2 className="text-5xl font-bold text-blue-600 mb-4">
                        {currentCard.chinese}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(currentCard.chinese)}
                        className="gap-2"
                      >
                        <Volume2 className="w-4 h-4" />
                        Play Sound
                      </Button>
                    </div>

                    {/* Answer Section */}
                    {!showAnswer ? (
                      <Button
                        size="lg"
                        onClick={() => setShowAnswer(true)}
                        className="gap-2"
                      >
                        Show Answer
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    ) : (
                      <div className="space-y-6">
                        {/* Pinyin */}
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Pinyin</p>
                          <p className="text-2xl text-purple-600">{currentCard.pinyin}</p>
                        </div>

                        {/* English */}
                        <div>
                          <p className="text-sm text-gray-500 mb-1">English</p>
                          <p className="text-xl text-gray-800">{currentCard.english}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center gap-4 text-sm text-gray-500">
                          <span>Reviewed: {currentCard.timesReviewed} times</span>
                          <span>Correct: {currentCard.timesCorrect}</span>
                          <span>Wrong: {currentCard.timesWrong}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-4">
                          <Button
                            size="lg"
                            variant="destructive"
                            onClick={() => handleAnswer(false)}
                            className="gap-2"
                          >
                            <X className="w-5 h-5" />
                            Wrong
                          </Button>
                          <Button
                            size="lg"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 gap-2"
                            onClick={() => handleAnswer(true)}
                          >
                            <Check className="w-5 h-5" />
                            Correct
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

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