import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import ModernNav from "@/components/modern-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Trophy, Star, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LootBox } from "@/components/loot-box";
import ProtectedRoute from "@/components/ProtectedRoute";

interface AnimalSticker {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  probability: number;
  description: string;
  collected: boolean;
  count: number;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-emerald-500',
  rare: 'from-blue-400 to-cyan-500',
  epic: 'from-purple-400 to-pink-500',
  legendary: 'from-yellow-400 via-orange-400 to-red-500'
};

const rarityBorders = {
  common: 'border-gray-300',
  uncommon: 'border-green-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-orange-400'
};

function RewardsContent() {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [jumpingId, setJumpingId] = useState<string | null>(null);
  const [showLootBox, setShowLootBox] = useState(false);
  const [earnedStickers, setEarnedStickers] = useState<any[]>([]);

  // Fetch sticker catalog with user's collection status
  const { data: stickers = [], isLoading } = useQuery<AnimalSticker[]>({
    queryKey: ["/api/stickers/catalog"],
  });

  // Fetch user profile for stats
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  const handleStickerClick = (stickerId: string) => {
    setJumpingId(stickerId);
    setTimeout(() => setJumpingId(null), 600);
  };

  const openTestLootBox = async () => {
    try {
      const response = await apiRequest("POST", "/api/stickers/open-lootbox", {
        event: 'manual_open'
      });
      const data = await response.json();
      if (data.success && data.stickers) {
        setEarnedStickers(data.stickers);
        setShowLootBox(true);
      }
    } catch (error) {
      console.error("Failed to open loot box:", error);
    }
  };

  const filteredStickers = selectedRarity === 'all' 
    ? stickers 
    : stickers.filter(s => s.rarity === selectedRarity);

  const collectedCount = stickers.filter(s => s.collected).length;
  const totalCount = stickers.length;
  const collectionProgress = totalCount > 0 ? (collectedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <ModernNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Animal Sticker Collection
          </h1>
          <p className="text-gray-600">
            Collect adorable animal stickers as you complete lessons and assessments!
          </p>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Collection Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {collectedCount}/{totalCount}
                </span>
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${collectionProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Rarest Sticker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {stickers.filter(s => s.collected && s.rarity === 'legendary').length > 0 ? (
                  <>
                    <span className="text-3xl">🐉</span>
                    <div>
                      <p className="font-semibold text-gray-900">Golden Dragon</p>
                      <p className="text-xs text-orange-500">LEGENDARY</p>
                    </div>
                  </>
                ) : stickers.filter(s => s.collected && s.rarity === 'epic').length > 0 ? (
                  <>
                    <span className="text-3xl">🦄</span>
                    <div>
                      <p className="font-semibold text-gray-900">Magical Unicorn</p>
                      <p className="text-xs text-purple-500">EPIC</p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Keep collecting!</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Test Your Luck
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={openTestLootBox}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Gift className="w-4 h-4 mr-2" />
                Open Test Loot Box
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Try your luck for free!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rarity Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedRarity === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity('all')}
          >
            All
          </Button>
          <Button
            variant={selectedRarity === 'common' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity('common')}
            className={selectedRarity === 'common' ? 'bg-gray-500' : ''}
          >
            Common (60%)
          </Button>
          <Button
            variant={selectedRarity === 'uncommon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity('uncommon')}
            className={selectedRarity === 'uncommon' ? 'bg-green-500' : ''}
          >
            Uncommon (25%)
          </Button>
          <Button
            variant={selectedRarity === 'rare' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity('rare')}
            className={selectedRarity === 'rare' ? 'bg-blue-500' : ''}
          >
            Rare (10%)
          </Button>
          <Button
            variant={selectedRarity === 'epic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity('epic')}
            className={selectedRarity === 'epic' ? 'bg-purple-500' : ''}
          >
            Epic (4%)
          </Button>
          <Button
            variant={selectedRarity === 'legendary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity('legendary')}
            className={selectedRarity === 'legendary' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : ''}
          >
            Legendary (1%)
          </Button>
        </div>

        {/* Sticker Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredStickers.map((sticker) => (
            <motion.div
              key={sticker.id}
              whileHover={{ scale: 1.05 }}
              animate={jumpingId === sticker.id ? {
                y: [-5, -25, -5],
                rotate: [0, -10, 10, 0]
              } : {}}
              transition={{ duration: 0.6 }}
              onClick={() => sticker.collected && handleStickerClick(sticker.id)}
              className={cn(
                "relative cursor-pointer",
                !sticker.collected && "opacity-50"
              )}
            >
              <Card className={cn(
                "border-2 overflow-hidden",
                rarityBorders[sticker.rarity],
                sticker.collected && "hover:shadow-lg transition-shadow"
              )}>
                <div className={cn(
                  "h-2 bg-gradient-to-r",
                  rarityColors[sticker.rarity]
                )} />
                
                <CardContent className="p-4 text-center">
                  {sticker.collected ? (
                    <>
                      <div className="text-5xl mb-2">{sticker.emoji}</div>
                      {sticker.count > 1 && (
                        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {sticker.count}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-5xl mb-2 relative">
                      <span className="opacity-30">{sticker.emoji}</span>
                      <Lock className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-600" />
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">
                    {sticker.name}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-2">
                    {sticker.description}
                  </p>
                  
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      sticker.rarity === 'common' && "bg-gray-100 text-gray-700",
                      sticker.rarity === 'uncommon' && "bg-green-100 text-green-700",
                      sticker.rarity === 'rare' && "bg-blue-100 text-blue-700",
                      sticker.rarity === 'epic' && "bg-purple-100 text-purple-700",
                      sticker.rarity === 'legendary' && "bg-orange-100 text-orange-700"
                    )}>
                      {sticker.rarity.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1">
                    {sticker.probability}% chance
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              How to Earn Stickers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>Complete the assessment to earn your first loot box!</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>Finish practice levels with high accuracy for bonus stickers</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>Achieve perfect scores for a chance at rare stickers</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>Maintain daily streaks for milestone rewards</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Loot Box Modal */}
      <LootBox
        isOpen={showLootBox}
        onClose={() => {
          setShowLootBox(false);
          // Refresh catalog after getting new stickers
          window.location.reload();
        }}
        stickers={earnedStickers}
        onStickerReceived={(stickers) => {
          console.log("New stickers received:", stickers);
        }}
      />
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