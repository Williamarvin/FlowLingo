// Animal Sticker Reward System
export interface AnimalSticker {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  probability: number; // Percentage chance
  description: string;
  unlockRequirement?: string;
}

// Define all animal stickers with their probabilities
export const ANIMAL_STICKERS: AnimalSticker[] = [
  // Common (60% total)
  { id: 'dog', name: 'Loyal Dog', emoji: '🐕', rarity: 'common', probability: 15, description: 'A faithful companion on your learning journey' },
  { id: 'cat', name: 'Curious Cat', emoji: '🐈', rarity: 'common', probability: 15, description: 'Always curious and ready to explore' },
  { id: 'bird', name: 'Free Bird', emoji: '🐦', rarity: 'common', probability: 10, description: 'Soaring high with knowledge' },
  { id: 'fish', name: 'Swimming Fish', emoji: '🐟', rarity: 'common', probability: 10, description: 'Going with the flow of learning' },
  { id: 'turtle', name: 'Wise Turtle', emoji: '🐢', rarity: 'common', probability: 10, description: 'Slow and steady wins the race' },
  
  // Uncommon (25% total)
  { id: 'rabbit', name: 'Quick Rabbit', emoji: '🐰', rarity: 'uncommon', probability: 8, description: 'Hopping through lessons with speed' },
  { id: 'fox', name: 'Clever Fox', emoji: '🦊', rarity: 'uncommon', probability: 7, description: 'Smart and witty problem solver' },
  { id: 'owl', name: 'Night Owl', emoji: '🦉', rarity: 'uncommon', probability: 5, description: 'Studying late into the night' },
  { id: 'butterfly', name: 'Graceful Butterfly', emoji: '🦋', rarity: 'uncommon', probability: 5, description: 'Transforming through learning' },
  
  // Rare (10% total)
  { id: 'panda', name: 'Peaceful Panda', emoji: '🐼', rarity: 'rare', probability: 4, description: 'A symbol of China and harmony' },
  { id: 'koala', name: 'Cuddly Koala', emoji: '🐨', rarity: 'rare', probability: 3, description: 'Taking it easy but learning lots' },
  { id: 'penguin', name: 'Cool Penguin', emoji: '🐧', rarity: 'rare', probability: 3, description: 'Staying cool under pressure' },
  
  // Epic (4% total)
  { id: 'unicorn', name: 'Magical Unicorn', emoji: '🦄', rarity: 'epic', probability: 2, description: 'Making the impossible possible' },
  { id: 'dragon', name: 'Mighty Dragon', emoji: '🐲', rarity: 'epic', probability: 2, description: 'Master of Chinese culture' },
  
  // Legendary (1% total)
  { id: 'phoenix', name: 'Phoenix', emoji: '🔥🦅', rarity: 'legendary', probability: 0.5, description: 'Rising from challenges stronger than ever' },
  { id: 'golden_dragon', name: 'Golden Dragon', emoji: '🐉', rarity: 'legendary', probability: 0.5, description: 'The ultimate Chinese learning master' },
];

// Get rarity color for display
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#6B7280'; // Gray
    case 'uncommon': return '#10B981'; // Green
    case 'rare': return '#3B82F6'; // Blue
    case 'epic': return '#A855F7'; // Purple
    case 'legendary': return '#F59E0B'; // Gold
    default: return '#6B7280';
  }
}

// Get rarity gradient for backgrounds
export function getRarityGradient(rarity: string): string {
  switch (rarity) {
    case 'common': return 'from-gray-400 to-gray-500';
    case 'uncommon': return 'from-green-400 to-emerald-500';
    case 'rare': return 'from-blue-400 to-cyan-500';
    case 'epic': return 'from-purple-400 to-pink-500';
    case 'legendary': return 'from-yellow-400 via-orange-400 to-red-500';
    default: return 'from-gray-400 to-gray-500';
  }
}

// Roll for a random sticker based on probabilities
export function rollRandomSticker(): AnimalSticker {
  const totalProbability = ANIMAL_STICKERS.reduce((sum, sticker) => sum + sticker.probability, 0);
  let random = Math.random() * totalProbability;
  
  for (const sticker of ANIMAL_STICKERS) {
    random -= sticker.probability;
    if (random <= 0) {
      return sticker;
    }
  }
  
  // Fallback to first sticker (should never happen)
  return ANIMAL_STICKERS[0];
}

// Check if user should get a loot box
export function shouldAwardLootBox(event: string): boolean {
  const lootBoxEvents = [
    'assessment_complete',
    'level_complete',
    'perfect_score',
    'streak_milestone',
    'daily_goal_complete'
  ];
  
  return lootBoxEvents.includes(event);
}

// Generate loot box contents (can contain multiple stickers for special events)
export function generateLootBoxContents(event: string): AnimalSticker[] {
  const stickers: AnimalSticker[] = [];
  
  // Always get at least one sticker
  stickers.push(rollRandomSticker());
  
  // Special events can give bonus stickers
  if (event === 'assessment_complete') {
    // 30% chance for a second sticker on assessment completion
    if (Math.random() < 0.3) {
      stickers.push(rollRandomSticker());
    }
  } else if (event === 'perfect_score') {
    // 50% chance for a second sticker on perfect score
    if (Math.random() < 0.5) {
      stickers.push(rollRandomSticker());
    }
  }
  
  return stickers;
}