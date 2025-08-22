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

// Define all animal stickers with their probabilities (100+ animals)
export const ANIMAL_STICKERS: AnimalSticker[] = [
  // Special Default Sticker (everyone has this)
  { id: 'dolphin', name: 'Flow Dolphin', emoji: '🐬', rarity: 'legendary', probability: 0, description: 'The FlowLingo mascot - smart and playful!' },
  
  // Common Animals (60% total - 40 animals)
  { id: 'dog', name: 'Loyal Dog', emoji: '🐕', rarity: 'common', probability: 2, description: 'A faithful companion' },
  { id: 'cat', name: 'Curious Cat', emoji: '🐈', rarity: 'common', probability: 2, description: 'Always curious' },
  { id: 'bird', name: 'Free Bird', emoji: '🐦', rarity: 'common', probability: 2, description: 'Soaring high' },
  { id: 'fish', name: 'Swimming Fish', emoji: '🐟', rarity: 'common', probability: 2, description: 'Going with the flow' },
  { id: 'turtle', name: 'Wise Turtle', emoji: '🐢', rarity: 'common', probability: 2, description: 'Slow and steady' },
  { id: 'chicken', name: 'Early Chicken', emoji: '🐔', rarity: 'common', probability: 2, description: 'Early bird gets the worm' },
  { id: 'pig', name: 'Happy Pig', emoji: '🐷', rarity: 'common', probability: 2, description: 'Living the good life' },
  { id: 'cow', name: 'Gentle Cow', emoji: '🐄', rarity: 'common', probability: 2, description: 'Peaceful and calm' },
  { id: 'horse', name: 'Swift Horse', emoji: '🐴', rarity: 'common', probability: 2, description: 'Running towards goals' },
  { id: 'sheep', name: 'Fluffy Sheep', emoji: '🐑', rarity: 'common', probability: 2, description: 'Soft and gentle' },
  { id: 'mouse', name: 'Quick Mouse', emoji: '🐭', rarity: 'common', probability: 1.5, description: 'Small but mighty' },
  { id: 'hamster', name: 'Busy Hamster', emoji: '🐹', rarity: 'common', probability: 1.5, description: 'Always working hard' },
  { id: 'frog', name: 'Jumping Frog', emoji: '🐸', rarity: 'common', probability: 1.5, description: 'Leaping forward' },
  { id: 'duck', name: 'Swimming Duck', emoji: '🦆', rarity: 'common', probability: 1.5, description: 'Graceful in water' },
  { id: 'snail', name: 'Patient Snail', emoji: '🐌', rarity: 'common', probability: 1.5, description: 'Taking it slow' },
  { id: 'ant', name: 'Hardworking Ant', emoji: '🐜', rarity: 'common', probability: 1.5, description: 'Teamwork makes the dream work' },
  { id: 'bee', name: 'Busy Bee', emoji: '🐝', rarity: 'common', probability: 1.5, description: 'Always productive' },
  { id: 'ladybug', name: 'Lucky Ladybug', emoji: '🐞', rarity: 'common', probability: 1.5, description: 'Bringing good luck' },
  { id: 'spider', name: 'Creative Spider', emoji: '🕷️', rarity: 'common', probability: 1.5, description: 'Weaving knowledge' },
  { id: 'crab', name: 'Sideways Crab', emoji: '🦀', rarity: 'common', probability: 1.5, description: 'Different perspective' },
  { id: 'shrimp', name: 'Tiny Shrimp', emoji: '🦐', rarity: 'common', probability: 1.5, description: 'Small but important' },
  { id: 'squid', name: 'Ink Squid', emoji: '🦑', rarity: 'common', probability: 1.5, description: 'Writing wisdom' },
  { id: 'tropical_fish', name: 'Tropical Fish', emoji: '🐠', rarity: 'common', probability: 1.5, description: 'Colorful personality' },
  { id: 'blowfish', name: 'Puffer Fish', emoji: '🐡', rarity: 'common', probability: 1.5, description: 'Full of surprises' },
  { id: 'seal', name: 'Playful Seal', emoji: '🦭', rarity: 'common', probability: 1.5, description: 'Fun and friendly' },
  { id: 'goat', name: 'Mountain Goat', emoji: '🐐', rarity: 'common', probability: 1.5, description: 'Climbing high' },
  { id: 'ram', name: 'Strong Ram', emoji: '🐏', rarity: 'common', probability: 1.5, description: 'Breaking barriers' },
  { id: 'rooster', name: 'Morning Rooster', emoji: '🐓', rarity: 'common', probability: 1.5, description: 'Wake up call' },
  { id: 'turkey', name: 'Proud Turkey', emoji: '🦃', rarity: 'common', probability: 1.5, description: 'Standing tall' },
  { id: 'dove', name: 'Peace Dove', emoji: '🕊️', rarity: 'common', probability: 1.5, description: 'Spreading peace' },
  { id: 'parrot', name: 'Talking Parrot', emoji: '🦜', rarity: 'common', probability: 1.5, description: 'Speaking fluently' },
  { id: 'swan', name: 'Elegant Swan', emoji: '🦢', rarity: 'common', probability: 1.5, description: 'Grace and beauty' },
  { id: 'peacock', name: 'Proud Peacock', emoji: '🦚', rarity: 'common', probability: 1.5, description: 'Showing off skills' },
  { id: 'flamingo', name: 'Pink Flamingo', emoji: '🦩', rarity: 'common', probability: 1.5, description: 'Standing out' },
  { id: 'chipmunk', name: 'Cheery Chipmunk', emoji: '🐿️', rarity: 'common', probability: 1, description: 'Storing knowledge' },
  { id: 'hedgehog', name: 'Spiky Hedgehog', emoji: '🦔', rarity: 'common', probability: 1, description: 'Protected and safe' },
  { id: 'bat', name: 'Night Bat', emoji: '🦇', rarity: 'common', probability: 1, description: 'Different view' },
  { id: 'otter', name: 'Playful Otter', emoji: '🦦', rarity: 'common', probability: 1, description: 'Learning is fun' },
  { id: 'beaver', name: 'Building Beaver', emoji: '🦫', rarity: 'common', probability: 1, description: 'Building knowledge' },
  { id: 'skunk', name: 'Unique Skunk', emoji: '🦨', rarity: 'common', probability: 1, description: 'Stand your ground' },
  
  // Uncommon Animals (25% total - 30 animals)
  { id: 'rabbit', name: 'Quick Rabbit', emoji: '🐰', rarity: 'uncommon', probability: 1.2, description: 'Hopping fast' },
  { id: 'fox', name: 'Clever Fox', emoji: '🦊', rarity: 'uncommon', probability: 1.2, description: 'Smart solver' },
  { id: 'owl', name: 'Night Owl', emoji: '🦉', rarity: 'uncommon', probability: 1.2, description: 'Late studying' },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', rarity: 'uncommon', probability: 1.2, description: 'Transforming' },
  { id: 'bear', name: 'Strong Bear', emoji: '🐻', rarity: 'uncommon', probability: 1, description: 'Powerful learner' },
  { id: 'wolf', name: 'Pack Wolf', emoji: '🐺', rarity: 'uncommon', probability: 1, description: 'Team leader' },
  { id: 'monkey', name: 'Playful Monkey', emoji: '🐵', rarity: 'uncommon', probability: 1, description: 'Learning is play' },
  { id: 'gorilla', name: 'Mighty Gorilla', emoji: '🦍', rarity: 'uncommon', probability: 1, description: 'Strong mind' },
  { id: 'raccoon', name: 'Clever Raccoon', emoji: '🦝', rarity: 'uncommon', probability: 1, description: 'Finding treasures' },
  { id: 'deer', name: 'Graceful Deer', emoji: '🦌', rarity: 'uncommon', probability: 1, description: 'Moving forward' },
  { id: 'zebra', name: 'Unique Zebra', emoji: '🦓', rarity: 'uncommon', probability: 1, description: 'Standing out' },
  { id: 'giraffe', name: 'Tall Giraffe', emoji: '🦒', rarity: 'uncommon', probability: 1, description: 'Reaching high' },
  { id: 'elephant', name: 'Memory Elephant', emoji: '🐘', rarity: 'uncommon', probability: 1, description: 'Never forgets' },
  { id: 'rhino', name: 'Tough Rhino', emoji: '🦏', rarity: 'uncommon', probability: 1, description: 'Breaking through' },
  { id: 'hippo', name: 'Happy Hippo', emoji: '🦛', rarity: 'uncommon', probability: 1, description: 'Big dreams' },
  { id: 'kangaroo', name: 'Jumping Kangaroo', emoji: '🦘', rarity: 'uncommon', probability: 0.8, description: 'Big leaps' },
  { id: 'llama', name: 'Calm Llama', emoji: '🦙', rarity: 'uncommon', probability: 0.8, description: 'No drama' },
  { id: 'camel', name: 'Desert Camel', emoji: '🐫', rarity: 'uncommon', probability: 0.8, description: 'Long journey' },
  { id: 'bison', name: 'Strong Bison', emoji: '🦬', rarity: 'uncommon', probability: 0.8, description: 'Moving forward' },
  { id: 'boar', name: 'Wild Boar', emoji: '🐗', rarity: 'uncommon', probability: 0.8, description: 'Charging ahead' },
  { id: 'leopard', name: 'Fast Leopard', emoji: '🐆', rarity: 'uncommon', probability: 0.8, description: 'Quick learner' },
  { id: 'tiger', name: 'Brave Tiger', emoji: '🐅', rarity: 'uncommon', probability: 0.8, description: 'Fearless' },
  { id: 'lion', name: 'King Lion', emoji: '🦁', rarity: 'uncommon', probability: 0.8, description: 'Leader' },
  { id: 'orangutan', name: 'Wise Orangutan', emoji: '🦧', rarity: 'uncommon', probability: 0.8, description: 'Tool user' },
  { id: 'sloth', name: 'Chill Sloth', emoji: '🦥', rarity: 'uncommon', probability: 0.6, description: 'Taking it easy' },
  { id: 'badger', name: 'Determined Badger', emoji: '🦡', rarity: 'uncommon', probability: 0.6, description: 'Never giving up' },
  { id: 'weasel', name: 'Quick Weasel', emoji: '🪼', rarity: 'uncommon', probability: 0.6, description: 'Fast thinker' },
  { id: 'mole', name: 'Digging Mole', emoji: '🐀', rarity: 'uncommon', probability: 0.6, description: 'Deep knowledge' },
  { id: 'possum', name: 'Smart Possum', emoji: '🐁', rarity: 'uncommon', probability: 0.6, description: 'Playing smart' },
  { id: 'dodo', name: 'Rare Dodo', emoji: '🦤', rarity: 'uncommon', probability: 0.6, description: 'Unique approach' },
  
  // Rare Animals (10% total - 20 animals)
  { id: 'panda', name: 'Panda', emoji: '🐼', rarity: 'rare', probability: 0.8, description: 'China symbol' },
  { id: 'koala', name: 'Koala', emoji: '🐨', rarity: 'rare', probability: 0.8, description: 'Taking it easy' },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', rarity: 'rare', probability: 0.8, description: 'Cool headed' },
  { id: 'polar_bear', name: 'Polar Bear', emoji: '🐻‍❄️', rarity: 'rare', probability: 0.6, description: 'Arctic strong' },
  { id: 'whale', name: 'Blue Whale', emoji: '🐋', rarity: 'rare', probability: 0.6, description: 'Deep thinker' },
  { id: 'shark', name: 'Smart Shark', emoji: '🦈', rarity: 'rare', probability: 0.6, description: 'Always moving' },
  { id: 'octopus', name: 'Clever Octopus', emoji: '🐙', rarity: 'rare', probability: 0.6, description: 'Multi-tasker' },
  { id: 'jellyfish', name: 'Floating Jellyfish', emoji: '🪼', rarity: 'rare', probability: 0.5, description: 'Going with flow' },
  { id: 'lobster', name: 'Strong Lobster', emoji: '🦞', rarity: 'rare', probability: 0.5, description: 'Hard shell' },
  { id: 'scorpion', name: 'Fierce Scorpion', emoji: '🦂', rarity: 'rare', probability: 0.5, description: 'Determined' },
  { id: 'crocodile', name: 'Ancient Crocodile', emoji: '🐊', rarity: 'rare', probability: 0.5, description: 'Timeless wisdom' },
  { id: 'snake', name: 'Wise Snake', emoji: '🐍', rarity: 'rare', probability: 0.5, description: 'Shedding old habits' },
  { id: 'lizard', name: 'Quick Lizard', emoji: '🦎', rarity: 'rare', probability: 0.5, description: 'Adapting fast' },
  { id: 'chameleon', name: 'Chameleon', emoji: '🦎', rarity: 'rare', probability: 0.4, description: 'Blending in' },
  { id: 'eagle', name: 'Soaring Eagle', emoji: '🦅', rarity: 'rare', probability: 0.4, description: 'Vision clear' },
  { id: 'hawk', name: 'Sharp Hawk', emoji: '🪶', rarity: 'rare', probability: 0.4, description: 'Focused' },
  { id: 'vulture', name: 'Patient Vulture', emoji: '🦅', rarity: 'rare', probability: 0.4, description: 'Waiting wisely' },
  { id: 'ostrich', name: 'Fast Ostrich', emoji: '🪶', rarity: 'rare', probability: 0.4, description: 'Running fast' },
  { id: 'platypus', name: 'Unique Platypus', emoji: '🦫', rarity: 'rare', probability: 0.4, description: 'One of a kind' },
  { id: 'mammoth', name: 'Ancient Mammoth', emoji: '🦣', rarity: 'rare', probability: 0.4, description: 'Old wisdom' },
  
  // Epic Animals (4% total - 8 animals)
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', rarity: 'epic', probability: 0.6, description: 'Making magic' },
  { id: 'dragon', name: 'Dragon', emoji: '🐲', rarity: 'epic', probability: 0.6, description: 'Chinese master' },
  { id: 'phoenix', name: 'Phoenix', emoji: '🔥', rarity: 'epic', probability: 0.5, description: 'Rising up' },
  { id: 'pegasus', name: 'Flying Pegasus', emoji: '🌟', rarity: 'epic', probability: 0.5, description: 'Soaring dreams' },
  { id: 'griffin', name: 'Mighty Griffin', emoji: '🦅', rarity: 'epic', probability: 0.5, description: 'Legendary power' },
  { id: 'kraken', name: 'Deep Kraken', emoji: '🐙', rarity: 'epic', probability: 0.5, description: 'Ocean master' },
  { id: 'hydra', name: 'Many-Headed Hydra', emoji: '🐍', rarity: 'epic', probability: 0.5, description: 'Multiple skills' },
  { id: 'sphinx', name: 'Wise Sphinx', emoji: '🦁', rarity: 'epic', probability: 0.8, description: 'Riddle master' },
  
  // Legendary Animals (1% total - 2 animals)
  { id: 'golden_dragon', name: 'Golden Dragon', emoji: '🐉', rarity: 'legendary', probability: 0.5, description: 'Ultimate master' },
  { id: 'cosmic_phoenix', name: 'Cosmic Phoenix', emoji: '🐦‍🔥', rarity: 'legendary', probability: 0.5, description: 'Transcendent' },
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