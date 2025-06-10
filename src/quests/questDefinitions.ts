import type { GameState } from '../types/game';

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  checkComplete: (gameState: GameState) => boolean;
  reward: {
    exp?: number;
    money?: number;
    reputation?: number;
    item?: {
      [key: string]: number;
    };
  };
  unlocksQuests?: string[];
}

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  first_sale: {
    id: 'first_sale',
    name: 'First Sale',
    description: 'Create and sell your first artwork to a collector.',
    checkComplete: (gs) => gs.player.achievements.includes('first_artwork_sold'),
    reward: { exp: 50, money: 100, reputation: 5 },
    unlocksQuests: ['network_intro', 'brooklyn_scout']
  },
  network_intro: {
    id: 'network_intro',
    name: 'Social Butterfly Basics',
    description: 'Meet 3 different people in the art world.',
    checkComplete: (gs) => Object.keys(gs.player.relationships).length >= 3,
    reward: { exp: 75, reputation: 10, item: { businessCards: 5 } }
  },
  brooklyn_scout: {
    id: 'brooklyn_scout',
    name: 'Brooklyn Bound',
    description: 'Unlock and visit the Brooklyn Art Scene district.',
    checkComplete: (gs) => gs.unlockedMaps.includes('brooklyn'),
    reward: { exp: 100, item: { coffee: 3 } },
    unlocksQuests: ['soho_aspirations']
  },
  masterpiece_quest: {
    id: 'masterpiece_quest',
    name: 'Create a Masterpiece',
    description: 'Create an artwork with a quality rating over 8.',
    checkComplete: (gs) => gs.player.achievements.includes('created_masterpiece'),
    reward: { exp: 200, reputation: 25, money: 500 }
  },
  gallery_show_prep: {
    id: 'gallery_show_prep',
    name: 'Road to Exhibition',
    description: 'Gain 50 reputation and speak to Marcus Chen in Chelsea.',
    checkComplete: (gs) => gs.player.reputation >= 50,
    reward: { exp: 150 },
    unlocksQuests: ['first_exhibition']
  },
  first_exhibition: {
    id: 'first_exhibition',
    name: 'My First Show!',
    description: 'Successfully host your first gallery exhibition (offered by Marcus Chen).',
    checkComplete: (gs) => gs.player.achievements.includes('hosted_gallery_show'),
    reward: { exp: 500, reputation: 100, money: 2000 }
  },
  soho_aspirations: {
    id: 'soho_aspirations',
    name: 'SoHo Dreams',
    description: 'Earn $2000 to unlock the SoHo district.',
    checkComplete: (gs) => gs.player.money >= 2000 && gs.unlockedMaps.includes('soho'),
    reward: { exp: 250, reputation: 20 }
  }
}; 