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
  inventory: InventoryItem[];
  skills: Record<string, number>;
  equipment: {
    brush: string;
    outfit: string;
  };
  relationships: { [key: string]: number };
  quests: Quest[];
  completedQuests: string[];
  achievements: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'art' | 'equipment' | 'consumable';
  value: number;
  description: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: {
    money: number;
    reputation: number;
    items?: InventoryItem[];
  };
  completed: boolean;
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
  sprite: string;
  interaction: string;
  name: string;
  x: number;
  y: number;
  targetMap?: string;
  targetPosition?: { x: number; y: number };
  npcId?: string;
  dialogueTree?: Record<string, DialogueNode>;
  inventory?: InventoryItem[];
  prices?: Record<string, number>;
}

export interface InteractionData {
  type: string;
  data: ObjectData;
  x: number;
  y: number;
}

export interface MapObject {
  id: string;
  type: 'npc' | 'collector' | 'critic' | 'shop' | 'quest';
  x: number;
  y: number;
  data: ObjectData;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  bgm: string;
  collision: boolean[][];
  tiles: number[][];
  objects: MapObject[];
  exits?: {
    [key: string]: {
      to: string;
      x: number;
      y: number;
    };
  };
}

export interface BattleState {
  type: string;
  opponent: {
    name: string;
    hp: number;
    maxHp: number;
    type: string;
  };
  player: {
    hp: number;
    maxHp: number;
  };
  turn: string;
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
  | null;

export interface GameState {
  player: Player;
  currentMap: string;
  day: number;
  time: number;
  weather: string;
  menu: MenuType;
  dialogue: DialogueState | null;
  battle: BattleState | null;
  music: boolean;
  events: string[];
  unlockedMaps: string[];
  marketMultiplier: number;
  gameTick: number;
  pendingInteraction: InteractionData | null;
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