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

export interface Quest {
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

export interface DialogueNode {
  text: string;
  options: {
    text: string;
    nextNode?: string;
    action?: () => void;
  }[];
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

export interface InteractionData {
  type: string;
  data: ObjectData;
  x: number;
  y: number;
}

export interface MapObject {
  id: string;
  type: string;
  x: number;
  y: number;
  data: {
    sprite: string;
    interaction: string;
    name: string;
    x: number;
    y: number;
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
  turn: number;
  log: string[];
}

export interface DialogueState {
  title: string;
  text: string;
  options: {
    text: string;
    action: () => void;
  }[];
  scroll?: number;
}

export type MenuType = 
  | 'status' 
  | 'inventory' 
  | 'quests' 
  | 'market' 
  | 'create_art' 
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
}

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

export interface BattleAction {
  id: string;
  name: string;
  power: number;
  accuracy: number;
  cost: number;
  skill: keyof Player['skills'];
  description: string;
}

export interface PlayerTitle {
  rep: number;
  level: number;
  title: string;
}

export interface SpriteData {
  player: {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
  };
  [key: string]: string | { [key: string]: string[] };
}

export interface NPCOption {
  text: string;
  cost: number;
  reward: {
    reputation?: number;
    exp?: number;
    money?: number;
    artistic?: number;
    networking?: number;
    business?: number;
    curating?: number;
  };
}

export interface NPCData {
  name: string;
  type?: string;
  dialogue?: string;
  options?: NPCOption[];
  reputationChange?: number;
  sale?: {
    id: string;
    name: string;
    type: 'art' | 'equipment' | 'consumable';
    description: string;
    price: number;
  };
}

export interface PendingInteraction {
  x: number;
  y: number;
  type: string;
  data: ObjectData;
} 