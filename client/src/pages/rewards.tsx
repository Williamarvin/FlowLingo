import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Trophy, Star, Award, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Reward {
  id: string;
  type: string;
  name: string;
  description: string;
  emoji: string;
  levelRequired: number;
  rarity: string;
  category: string;
  isEarned?: boolean;
  isNew?: boolean;
  equipped?: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  practiceLevel: number;
  practiceXp: number;
  totalStickers: number;
  totalBadges: number;
  currentMascot: string;
  streakDays: number;
  wordsLearned: number;
  lessonsCompleted: number;
}

function RewardsContent() {
  const { toast } = useToast();
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);

  // Fetch user profile with rewards stats
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/rewards/profile"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/rewards/profile");
    },
  });

  // Fetch all rewards with user's earned status
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/rewards") || [];
    },
  });

  // Change mascot mutation
  const changeMascotMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      return await apiRequest("POST", "/api/rewards/change-mascot", { rewardId });
    },
    onSuccess: () => {
      toast({
        title: "Mascot Changed!",
        description: "Your new mascot has been set",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change mascot",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Mark rewards as seen
  const markRewardsSeenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/rewards/mark-seen");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
    },
  });

  useEffect(() => {
    // Mark new rewards as seen when user views them
    const hasNewRewards = rewards.some((r: Reward) => r.isNew);
    if (hasNewRewards) {
      const timer = setTimeout(() => {
        markRewardsSeenMutation.mutate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [rewards]);

  const stickers = rewards.filter((r: Reward) => r.type === "sticker");
  const badges = rewards.filter((r: Reward) => r.type === "badge");
  const mascots = rewards.filter((r: Reward) => r.type === "mascot");

  const earnedStickers = stickers.filter((s: Reward) => s.isEarned);
  const lockedStickers = stickers.filter((s: Reward) => !s.isEarned);
  const earnedBadges = badges.filter((b: Reward) => b.isEarned);
  const lockedBadges = badges.filter((b: Reward) => !b.isEarned);
  const earnedMascots = mascots.filter((m: Reward) => m.isEarned);
  const lockedMascots = mascots.filter((m: Reward) => !m.isEarned);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-100 text-gray-800";
      case "rare": return "bg-blue-100 text-blue-800";
      case "epic": return "bg-purple-100 text-purple-800";
      case "legendary": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-gray-300";
      case "rare": return "border-blue-400";
      case "epic": return "border-purple-500";
      case "legendary": return "border-yellow-500 shadow-lg shadow-yellow-200";
      default: return "border-gray-300";
    }
  };

  const loading = profileLoading || rewardsLoading;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Sidebar currentPage="/rewards" />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header with user profile */}
        <div className="mb-8">
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                    {userProfile?.currentMascot || "🐬"}
                  </div>
                  <div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {userProfile?.username || userProfile?.email?.split('@')[0] || "Learner"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Global Level {userProfile?.level || 1} • Practice Level {userProfile?.practiceLevel || 1}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{earnedStickers.length}</div>
                    <div className="text-sm text-gray-500">Stickers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{earnedBadges.length}</div>
                    <div className="text-sm text-gray-500">Badges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{userProfile?.streakDays || 0}</div>
                    <div className="text-sm text-gray-500">Day Streak</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* XP Progress Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Global Level Progress</span>
                    <span className="text-gray-500">{userProfile?.xp || 0} / {((userProfile?.level || 1) * 100)} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((userProfile?.xp || 0) % 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Practice Level Progress</span>
                    <span className="text-gray-500">{userProfile?.practiceXp || 0} / {((userProfile?.practiceLevel || 1) * 100)} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((userProfile?.practiceXp || 0) % 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different collectibles */}
        <Tabs defaultValue="stickers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="stickers" className="data-[state=active]:bg-green-100">
              <span className="mr-2">🎨</span> Stickers ({earnedStickers.length}/{stickers.length})
            </TabsTrigger>
            <TabsTrigger value="mascots" className="data-[state=active]:bg-green-100">
              <span className="mr-2">🦸</span> Mascots ({earnedMascots.length}/{mascots.length})
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-green-100">
              <span className="mr-2">🏅</span> Badges ({earnedBadges.length}/{badges.length})
            </TabsTrigger>
          </TabsList>

          {/* Stickers Tab */}
          <TabsContent value="stickers" className="space-y-6">
            {earnedStickers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Earned Stickers</h3>
                <div className="grid grid-cols-6 gap-4">
                  {earnedStickers.map((sticker: Reward) => (
                    <TooltipProvider key={sticker.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Card className={`relative p-4 text-center hover:scale-105 transition-transform cursor-pointer ${getRarityBorder(sticker.rarity)}`}>
                            {sticker.isNew && (
                              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">NEW</Badge>
                            )}
                            <div className="text-4xl mb-2">{sticker.emoji}</div>
                            <p className="text-xs font-medium">{sticker.name}</p>
                            <Badge variant="outline" className={`mt-1 text-xs ${getRarityColor(sticker.rarity)}`}>
                              {sticker.rarity}
                            </Badge>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{sticker.name}</p>
                          <p className="text-sm text-gray-600">{sticker.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
            
            {lockedStickers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-500">Locked Stickers</h3>
                <div className="grid grid-cols-6 gap-4">
                  {lockedStickers.map((sticker: Reward) => (
                    <TooltipProvider key={sticker.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Card className="relative p-4 text-center opacity-50 grayscale">
                            <div className="text-4xl mb-2">❓</div>
                            <p className="text-xs font-medium text-gray-500">Level {sticker.levelRequired}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              Locked
                            </Badge>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{sticker.name}</p>
                          <p className="text-sm text-gray-600">{sticker.description}</p>
                          <p className="text-sm text-red-600 mt-1">Requires Level {sticker.levelRequired}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Mascots Tab */}
          <TabsContent value="mascots" className="space-y-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Select a mascot to change your app companion!</p>
            </div>
            
            {earnedMascots.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Available Mascots</h3>
                <div className="grid grid-cols-4 gap-4">
                  {earnedMascots.map((mascot: Reward) => (
                    <Card 
                      key={mascot.id}
                      className={`relative p-6 text-center cursor-pointer transition-all hover:scale-105 ${
                        mascot.equipped ? 'ring-2 ring-green-500 bg-green-50' : ''
                      } ${getRarityBorder(mascot.rarity)}`}
                      onClick={() => {
                        if (!mascot.equipped) {
                          changeMascotMutation.mutate(mascot.id);
                        }
                      }}
                    >
                      {mascot.equipped && (
                        <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <div className="text-5xl mb-3">{mascot.emoji}</div>
                      <p className="font-medium text-sm mb-1">{mascot.name}</p>
                      <p className="text-xs text-gray-600 mb-2">{mascot.description}</p>
                      <Badge variant="outline" className={`text-xs ${getRarityColor(mascot.rarity)}`}>
                        {mascot.rarity}
                      </Badge>
                      {!mascot.equipped && (
                        <Button 
                          size="sm" 
                          className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          disabled={changeMascotMutation.isPending}
                        >
                          Select
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {lockedMascots.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-500">Locked Mascots</h3>
                <div className="grid grid-cols-4 gap-4">
                  {lockedMascots.map((mascot: Reward) => (
                    <Card key={mascot.id} className="relative p-6 text-center opacity-50 grayscale">
                      <div className="text-5xl mb-3">❓</div>
                      <p className="font-medium text-sm mb-1">???</p>
                      <p className="text-xs text-gray-500 mb-2">Unlock at Level {mascot.levelRequired}</p>
                      <Badge variant="outline" className="text-xs">
                        Locked
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            {earnedBadges.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Earned Badges</h3>
                <div className="grid grid-cols-4 gap-4">
                  {earnedBadges.map((badge: Reward) => (
                    <Card key={badge.id} className={`p-6 text-center ${getRarityBorder(badge.rarity)}`}>
                      <div className="text-5xl mb-3">{badge.emoji}</div>
                      <p className="font-medium text-sm mb-1">{badge.name}</p>
                      <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                      <Badge variant="outline" className={`text-xs ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {lockedBadges.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-500">Locked Badges</h3>
                <div className="grid grid-cols-4 gap-4">
                  {lockedBadges.map((badge: Reward) => (
                    <Card key={badge.id} className="relative p-6 text-center opacity-50 grayscale">
                      <div className="text-5xl mb-3">🔒</div>
                      <p className="font-medium text-sm mb-1">???</p>
                      <p className="text-xs text-gray-500 mb-2">Complete requirements to unlock</p>
                      <Badge variant="outline" className="text-xs">
                        Locked
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
export default function Rewards() {
  return (
    <ProtectedRoute>
      <RewardsContent />
    </ProtectedRoute>
  );
}
