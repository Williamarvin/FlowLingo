import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ModernNav from "@/components/modern-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Lock, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  Star,
  TrendingUp,
  Book
} from "lucide-react";
import { cn } from "@/lib/utils";
import { levelStructure, getLevelsByHSK, getDifficultyColor, getLevelInfo } from "../../../shared/levelStructure";
import ProtectedRoute from "@/components/ProtectedRoute";

const hskInfo = [
  { level: 1, name: "HSK 1", description: "Beginner", words: 150, color: "from-green-400 to-emerald-500" },
  { level: 2, name: "HSK 2", description: "Elementary", words: 300, color: "from-blue-400 to-cyan-500" },
  { level: 3, name: "HSK 3", description: "Intermediate", words: 600, color: "from-purple-400 to-pink-500" },
  { level: 4, name: "HSK 4", description: "Upper Intermediate", words: 1200, color: "from-orange-400 to-red-500" },
  { level: 5, name: "HSK 5", description: "Advanced", words: 2500, color: "from-red-500 to-rose-600" },
];

function LevelSelectionContent() {
  const [, setLocation] = useLocation();
  const [selectedHSK, setSelectedHSK] = useState<number>(1);
  const [expandedHSK, setExpandedHSK] = useState<number>(1);

  // Get user profile data
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Get user's progress for all levels
  const { data: progressData = {} } = useQuery<any>({
    queryKey: ["/api/practice/all-progress"],
  });

  const userLevel = userProfile?.level || 1;
  const userHSK = Math.ceil(userLevel / 10);

  const handleLevelSelect = (level: number) => {
    // Navigate to practice page with specific level
    setLocation(`/practice?level=${level}`);
  };

  const getLevelStatus = (level: number) => {
    if (level === userLevel) return "current";
    if (level < userLevel) return "completed";
    if (level === userLevel + 1) return "available";
    return "locked";
  };

  const getLevelProgress = (level: number) => {
    return progressData[level] || { completed: false, stars: 0, accuracy: 0 };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <ModernNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Choose Your Learning Path
          </h1>
          <p className="text-gray-600">
            Select any topic you want to practice. Each level focuses on specific vocabulary and grammar patterns.
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Level</p>
                  <p className="text-2xl font-bold text-gray-900">Level {userLevel}</p>
                  <p className="text-xs text-gray-500">HSK {userHSK}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Topics Mastered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(progressData).filter((p: any) => p.completed).length}
                  </p>
                  <p className="text-xs text-gray-500">of 50 total</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total XP</p>
                  <p className="text-2xl font-bold text-gray-900">{userProfile?.xp || 0}</p>
                  <p className="text-xs text-gray-500">Experience Points</p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{userProfile?.streakDays || 0}</p>
                  <p className="text-xs text-gray-500">Days</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HSK Level Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {hskInfo.map((hsk) => (
            <Button
              key={hsk.level}
              variant={selectedHSK === hsk.level ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedHSK(hsk.level);
                setExpandedHSK(hsk.level);
              }}
              className={cn(
                selectedHSK === hsk.level && `bg-gradient-to-r ${hsk.color} text-white border-0`
              )}
            >
              <span className="font-semibold">{hsk.name}</span>
              <span className="ml-2 text-xs opacity-75">({hsk.words} words)</span>
            </Button>
          ))}
        </div>

        {/* Warning for advanced levels */}
        {selectedHSK > userHSK + 1 && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              This HSK level is significantly above your current level. We recommend completing earlier levels first for a better learning experience.
            </p>
          </div>
        )}

        {/* Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getLevelsByHSK(selectedHSK).map((level: any) => {
            const status = getLevelStatus(level.level);
            const progress = getLevelProgress(level.level);
            const isAccessible = status !== "locked" || selectedHSK <= userHSK + 1;

            return (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (level.level - (selectedHSK - 1) * 10) * 0.05 }}
              >
                <Card 
                  className={cn(
                    "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                    status === "current" && "ring-2 ring-green-500 shadow-green-100",
                    status === "completed" && "bg-green-50",
                    !isAccessible && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => isAccessible && handleLevelSelect(level.level)}
                >
                  {/* Level Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={status === "completed" ? "default" : "secondary"}
                      className={cn(
                        status === "current" && "bg-green-500",
                        status === "completed" && "bg-green-600"
                      )}
                    >
                      Level {level.level}
                    </Badge>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{level.topicEmoji}</div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {level.topic}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {level.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Progress Bar */}
                    {progress.completed && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Completed</span>
                          <span className="text-xs font-medium text-gray-900">
                            {progress.accuracy}% accuracy
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-4 h-4",
                                star <= progress.stars 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Vocabulary Preview */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Key vocabulary:</p>
                      <div className="flex flex-wrap gap-1">
                        {level.vocabularyFocus.slice(0, 5).map((word: string, idx: number) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-700"
                          >
                            {word}
                          </span>
                        ))}
                        {level.vocabularyFocus.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{level.vocabularyFocus.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Grammar Focus */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Grammar patterns:</p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {level.grammarFocus.join(", ")}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Book className="w-3 h-3" />
                        ~{level.estimatedWords} words
                      </span>
                      <span className={cn("font-medium", getDifficultyColor(level.hskLevel))}>
                        HSK {level.hskLevel}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className={cn(
                        "w-full mt-3",
                        status === "current" && "bg-green-600 hover:bg-green-700",
                        status === "completed" && "bg-gray-600 hover:bg-gray-700"
                      )}
                      disabled={!isAccessible}
                    >
                      {!isAccessible ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Locked
                        </>
                      ) : status === "completed" ? (
                        <>
                          Review Topic
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      ) : status === "current" ? (
                        <>
                          Continue Learning
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Start Topic
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Tips Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Learning Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Complete topics in order for the best learning progression</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Review completed topics regularly to maintain your knowledge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>If a topic is too difficult, practice earlier levels to build foundation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Focus on one HSK level at a time for optimal results</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LevelSelection() {
  return (
    <ProtectedRoute>
      <LevelSelectionContent />
    </ProtectedRoute>
  );
}