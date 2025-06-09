export interface MapData {
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
  exits: {
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

export interface Maps {
  [key: string]: MapData;
} 