import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimalSticker {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  probability: number;
  description: string;
}

interface LootBoxProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: AnimalSticker[];
  onStickerReceived?: (stickers: AnimalSticker[]) => void;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-emerald-500',
  rare: 'from-blue-400 to-cyan-500',
  epic: 'from-purple-400 to-pink-500',
  legendary: 'from-yellow-400 via-orange-400 to-red-500'
};

const rarityGlows = {
  common: 'shadow-gray-400/50',
  uncommon: 'shadow-green-400/50',
  rare: 'shadow-blue-400/50',
  epic: 'shadow-purple-400/50',
  legendary: 'shadow-orange-400/50'
};

export function LootBox({ isOpen, onClose, stickers, onStickerReceived }: LootBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [jumpingIndex, setJumpingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsOpening(false);
      setRevealed(false);
      setJumpingIndex(null);
    }
  }, [isOpen]);

  const openBox = () => {
    setIsOpening(true);
    setTimeout(() => {
      setRevealed(true);
      onStickerReceived?.(stickers);
    }, 1500);
  };

  const handleStickerClick = (index: number) => {
    setJumpingIndex(index);
    setTimeout(() => setJumpingIndex(null), 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={revealed ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full"
          >
            {!revealed ? (
              <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="text-center">
                  <motion.div
                    className="inline-block mb-4"
                    animate={isOpening ? {
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.1, 1, 1.1, 1, 1.2]
                    } : {}}
                    transition={{ duration: 1.5 }}
                  >
                    <div className="relative">
                      <Gift className="w-32 h-32 text-purple-500 mx-auto" />
                      {isOpening && (
                        <motion.div
                          className="absolute inset-0"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: 3, duration: 0.5 }}
                        >
                          <Sparkles className="w-32 h-32 text-yellow-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isOpening ? "Opening your loot box..." : "You earned a loot box!"}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {isOpening ? "Get ready for your reward!" : "Click to reveal your animal sticker!"}
                  </p>
                  
                  {!isOpening && (
                    <Button
                      size="lg"
                      onClick={openBox}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Open Loot Box
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-8 bg-white border-2 border-purple-200 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute top-4 right-4"
                >
                  <X className="w-5 h-5" />
                </Button>
                
                <div className="text-center">
                  <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900 mb-6"
                  >
                    🎉 Congratulations! 🎉
                  </motion.h2>
                  
                  <div className="flex flex-wrap gap-6 justify-center mb-6">
                    {stickers.map((sticker, index) => (
                      <motion.div
                        key={`${sticker.id}-${index}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.2, type: "spring" }}
                        onClick={() => handleStickerClick(index)}
                        className="cursor-pointer"
                      >
                        <motion.div
                          animate={jumpingIndex === index ? {
                            y: [-10, -30, -10],
                            rotate: [0, -15, 15, 0]
                          } : {}}
                          transition={{ duration: 0.6 }}
                          className={cn(
                            "relative p-6 rounded-2xl bg-gradient-to-br",
                            rarityColors[sticker.rarity],
                            "shadow-xl",
                            rarityGlows[sticker.rarity]
                          )}
                        >
                          <div className="absolute top-2 right-2">
                            <span className={cn(
                              "text-xs font-bold px-2 py-1 rounded-full",
                              "bg-white/90 backdrop-blur"
                            )}>
                              {sticker.rarity.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="text-6xl mb-2">{sticker.emoji}</div>
                          <h3 className="font-bold text-white text-lg">{sticker.name}</h3>
                          <p className="text-white/80 text-sm mt-1">{sticker.description}</p>
                          <p className="text-white/60 text-xs mt-2">
                            {sticker.probability}% chance
                          </p>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Click on your new sticker{stickers.length > 1 ? 's' : ''} to make {stickers.length > 1 ? 'them' : 'it'} jump!
                  </p>
                  
                  <Button onClick={onClose} variant="outline">
                    Continue
                  </Button>
                </div>
              </Card>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}