import type { BattleAction, PlayerTitle, QuestDefinition, SpriteData } from '../types/game';

export const SPRITES: SpriteData = {
  player: {
    up: ['👨‍🎨', '👨‍🎨'],
    down: ['👨‍🎨', '👨‍🎨'],
    left: ['👨‍🎨', '👨‍🎨'],
    right: ['👨‍🎨', '👨‍🎨']
  },
  easel: '🎨',
  computer: '💻',
  bed: '🛏️',
  bookshelf: '📚',
  gallery_door: '🚪',
  studio_door: '🚪',
  brooklyn_door: '🚪',
  soho_door: '🚪',
  info_board: '📋',
  npc_collector: '👔',
  npc_artist: '🧑‍🎨',
  npc_critic: '👓',
  npc_gallerist: '👩‍🎨',
  painting_wall: '🖼️',
  warehouse_studio: '🏭',
  coffee_shop: '☕',
  street_vendor: '🏪',
  thrift_store: '🧥',
  npc_hipster: '🧔',
  npc_muralist: '👩‍🎨',
  luxury_gallery: '🏛️',
  art_supply_pro: '🛍️',
  fashion_boutique: '👚',
  wine_bar: '🍷',
  npc_influencer: '🤳',
  npc_dealer: '💼'
};

export const TILE_COLORS = {
  0: '#1a1a1a', // Empty/void
  1: '#4a4a4a', // Wall
  2: '#8B4513', // Floor
  3: '#A0522D', // Decoration 1
  4: '#CD853F', // Decoration 2
  5: '#DEB887', // Decoration 3
  6: '#D2691E', // Decoration 4
  7: '#8B0000', // Special tile 1
  8: '#B22222', // Special tile 2
  9: '#DC143C', // Special tile 3
  10: '#FF4500', // Special tile 4
  11: '#FF6347', // Special tile 5
  12: '#FF7F50', // Special tile 6
  13: '#696969', // Dark wall
  14: '#808080', // Dark floor
  15: '#A9A9A9', // Dark decoration 1
  16: '#C0C0C0', // Dark decoration 2
  17: '#D3D3D3', // Dark decoration 3
  18: '#DCDCDC', // Dark decoration 4
  19: '#2F4F4F', // Dark special 1
  20: '#3CB371', // Dark special 2
  21: '#20B2AA', // Dark special 3
  22: '#48D1CC', // Dark special 4
  23: '#40E0D0', // Dark special 5
  24: '#7FFFD4', // Dark special 6
  25: '#66CDAA'  // Dark special 7
};

export const PLAYER_TITLES: PlayerTitle[] = [
  { rep: 0, level: 1, title: 'Aspiring Artist' },
  { rep: 20, level: 3, title: 'Emerging Talent' },
  { rep: 50, level: 5, title: 'Studio Regular' },
  { rep: 100, level: 8, title: 'Noticed Artist' },
  { rep: 250, level: 12, title: 'Chelsea Contender' },
  { rep: 500, level: 16, title: 'Brooklyn Star' },
  { rep: 1000, level: 20, title: 'SoHo Sensation' },
  { rep: 2000, level: 25, title: 'Living Legend' }
];

export const BATTLE_ACTIONS: BattleAction[] = [
  {
    id: 'defend_concept',
    name: 'Defend Concept',
    power: 25,
    accuracy: 0.9,
    cost: 10,
    skill: 'artistic',
    description: 'Explain your artistic vision.'
  },
  {
    id: 'cite_history',
    name: 'Cite Art History',
    power: 20,
    accuracy: 1.0,
    cost: 15,
    skill: 'curating',
    description: 'Reference masters.'
  },
  {
    id: 'charm_offensive',
    name: 'Charm Offensive',
    power: 15,
    accuracy: 0.8,
    cost: 10,
    skill: 'networking',
    description: 'Use charisma.'
  },
  {
    id: 'technical_breakdown',
    name: 'Technical Breakdown',
    power: 30,
    accuracy: 0.7,
    cost: 20,
    skill: 'artistic',
    description: 'Detail skill.'
  }
]; 