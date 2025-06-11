export interface Position {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  path?: { x: number; y: number }[];
  facing: 'up' | 'right' | 'down' | 'left';
  sprite: number;
  money: number;
  reputation: number;
  energy: number;
  level: number;
  exp: number;
  title: string;
  inventory: Record<string, InventoryItem>;
  skills: Record<string, number>;
  equipment: {
    brush: string;
    outfit: string;
  };
  relationships: { [key: string]: number };
  quests: string[];
  completedQuests: string[];
  achievements: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'art' | 'equipment' | 'consumable';
  value?: number;
  description: string;
  quantity: number;
}

export interface ArtworkValue {
  baseValue: number;
  currentValue: number;
  qualityMultiplier: number;
  marketTrend: 'rising' | 'stable' | 'falling';
  demandLevel: 'low' | 'medium' | 'high';
}

export interface MarketConditions {
  paintings: ArtworkValue;
  sculptures: ArtworkValue;
  digitalArt: ArtworkValue;
  lastUpdate: number;
}

export interface MarketNotification {
  id: string;
  title: string;
  message: string;
  type: 'market_boom' | 'market_crash' | 'trend_change' | 'demand_shift';
  artType: 'paintings' | 'sculptures' | 'digitalArt';
  timestamp: number;
}

export interface ObjectData {
  type: string;
  name: string;
  interaction: string;
  x: number;
  y: number;
  data?: {
    type: string;
    name: string;
    interaction: string;
  };
}

export interface GameMap {
  name: string;
  width: number;
  height: number;
  bgm: string;
  tiles: number[][];
  objects: {
    [key: string]: {
      type: string;
      interaction: string;
      name: string;
    };
  };
  exits?: {
    [key: string]: {
      to: string;
      x: number;
      y: number;
    };
  };
  locked?: boolean;
  unlockReq?: {
    reputation?: number;
    money?: number;
  };
}

// Added floating text for battle animations
export interface FloatingText {
    id: number;
    text: string;
    color: string;
    x: number;
    y: number;
}

export interface BattleState {
  type: 'critic' | 'gallerist';
  player: {
    hp: number;
    maxHp: number;
    energy: number;
  };
  opponent: {
    name: string;
    hp: number;
    maxHp: number;
    type: string;
  };
  turn: 'player' | 'opponent';
  log: string[];
  floatingTexts: FloatingText[];
}

export interface DialogueState {
  title: string;
  text: string;
  options: {
    text: string;
    action: () => void;
    disabled?: boolean;
  }[];
}

export type MenuType =
  | 'status'
  | 'inventory'
  | 'quests'
  | 'market'
  | 'create_art'
  | 'talk_npc'
  | 'rest'
  | 'study'
  | 'dialogue'
  | 'exit'
  | 'teach_artist'
  | 'judge_gallerist'
  | 'battle'
  | 'buy_coffee'
  | 'buy_supplies'
  | 'influencer'
  | 'dealer'
  | 'historian'
  | 'curator'
  | 'shop'
  | null;

export interface GameState {
  player: Player;
  currentMap: string;
  day: number;
  time: number;
  weather: string;
  menu: MenuType;
  menuData?: NPCData | Record<string, unknown>;
  dialogue: DialogueState | null;
  battle: BattleState | null;
  music: boolean;
  events: string[];
  unlockedMaps: string[];
  marketMultiplier: number;
  gameTick: number;
  pendingInteraction: PendingInteraction | null;
  marketConditions: MarketConditions | null;
}

export interface BattleAction {
  id: string;
  name: string;
  power: number;
  accuracy: number;
  cost: number;
  skill: keyof Player['skills'];
  description: string;
}

export interface NPCData {
  name: string;
  type?: string;
  dialogue?: string;
  reputationChange?: number;
  sale?: {
    id: string;
    name: string;
    type: 'art' | 'equipment' | 'consumable';
    description: string;
    price: number;
    value?: number;
  };
  x?: number;
  y?: number;
}

export interface PendingInteraction {
  x: number;
  y: number;
  type: string;
  data: ObjectData;
}