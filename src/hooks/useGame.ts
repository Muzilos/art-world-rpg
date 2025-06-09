import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { GameState, GameMap, MenuType, Player } from '../types/game';
import { checkInteraction, handleInteraction, updatePlayerPosition } from '../utils/gameLogic';
import { aStar } from '../utils/pathfinding';
import { MAPS } from '../constants/maps';

interface Keys {
  [key: string]: boolean;
}

const INITIAL_STATE: GameState = {
  player: {
    x: 240,
    y: 240,
    facing: 'down',
    sprite: 0,
    money: 500,
    reputation: 0,
    inventory: [],
    skills: {
      artistic: 1,
      networking: 1,
      business: 1,
      curating: 1
    },
    quests: [],
    energy: 100,
    level: 1,
    exp: 0,
    title: 'Aspiring Artist',
    equipment: {
      brush: 'basic',
      outfit: 'casual'
    },
    relationships: {},
    completedQuests: [],
    achievements: []
  },
  currentMap: 'studio',
  day: 1,
  time: 9,
  weather: 'Sunny',
  menu: null,
  dialogue: null,
  battle: null,
  music: true,
  events: [],
  unlockedMaps: ['studio', 'gallery'],
  marketMultiplier: 1.0,
  gameTick: 0,
  pendingInteraction: null
};

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const currentMap = MAPS[gameState.currentMap];
  const mapData = useMemo(() => ({
    id: gameState.currentMap,
    name: currentMap.name,
    width: currentMap.width,
    height: currentMap.height,
    bgm: currentMap.bgm,
    collision: currentMap.tiles.map(row => row.map(tile => tile === 1)),
    tiles: currentMap.tiles,
    objects: Object.entries(currentMap.objects as Record<string, { type: string; interaction: string; name: string }>).map(([posKey, obj]) => {
      const [x, y] = posKey.split(',').map((p: string): number => Number(p));
      return {
        id: posKey,
        type: obj.type as 'npc' | 'collector' | 'critic' | 'shop' | 'quest',
        x: x * 32,
        y: y * 32,
        data: {
          sprite: obj.type,
          interaction: obj.interaction,
          name: obj.name,
          x: x * 32,
          y: y * 32
        }
      };
    }),
    exits: currentMap.exits
  }), [currentMap, gameState.currentMap]);

  const keysRef = useRef<Keys>({});

  const handleCanvasClick = useCallback((x: number, y: number, menu?: MenuType) => {
    // Handle UI clicks
    if (x === -999 && y === -999) {
      return; // UI click indicator, no action needed
    }
    if (x === -1000 && y === -1000) {
      setGameState(prev => ({ ...prev, menu: null }));
      return;
    }
    if (x === -1001 && y === -1001 && menu) {
      setGameState(prev => ({ ...prev, menu }));
      return;
    }

    // Convert click coordinates to tile coordinates
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);

    // Check if clicked tile is walkable
    if (
      tileX >= 0 && tileX < mapData.width &&
      tileY >= 0 && tileY < mapData.height &&
      !mapData.collision[tileY][tileX]
    ) {
      // Check if there's an object at the clicked position
      const clickedObject = mapData.objects.find((obj: { id: string }) => {
        const [objX, objY] = obj.id.split(',').map((p: string): number => Number(p));
        return objX === tileX && objY === tileY;
      });

      if (clickedObject) {
        // Set pending interaction and move to the object
        setGameState(prev => {
          const startNode = { x: Math.floor(prev.player.x / 32), y: Math.floor(prev.player.y / 32) };
          const endNode = { x: tileX, y: tileY };
          const path = aStar(startNode, endNode, mapData.tiles);
          return {
            ...prev,
            player: {
              ...prev.player,
              targetX: tileX * 32,
              targetY: tileY * 32,
              path: path.map(p => ({ x: p.x * 32, y: p.y * 32 }))
            },
            pendingInteraction: {
              type: clickedObject.data.interaction,
              data: clickedObject.data,
              x: clickedObject.x,
              y: clickedObject.y
            }
          };
        });
      } else {
        // If no object, move to the clicked position and clear pending interaction
        const startNode = { x: Math.floor(gameState.player.x / 32), y: Math.floor(gameState.player.y / 32) };
        const endNode = { x: tileX, y: tileY };
        const path = aStar(startNode, endNode, mapData.tiles);
        
        if (path.length > 0) {
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              targetX: tileX * 32,
              targetY: tileY * 32,
              path: path.map(p => ({ x: p.x * 32, y: p.y * 32 }))
            },
            pendingInteraction: null
          }));
        }
      }
    }
  }, [mapData, gameState.player]);

  useEffect(() => {
    const renderLoop = setInterval(() => {
      setGameState(prev => {
        const keys = keysRef.current;
        const { currentMap, dialogue, battle, gameTick } = { ...prev };
        let { player, menu } = { ...prev };
        const { time, day } = { ...prev };

        if (dialogue || menu || battle) {
          // Pause game logic when UI is open, but allow sprite animation to reset
          player.sprite = 0;
          return { ...prev, player };
        }

        // Handle movement
        if (player.path && player.path.length > 0) {
          player = updatePlayerPosition(player, keys['shift'] || false);
        }
        // Handle pending interactions
        if (prev.pendingInteraction) {
          // Check if player is on the object tile
          const playerTileX = Math.floor(player.x / 32);
          const playerTileY = Math.floor(player.y / 32);
          const objTileX = Math.floor(prev.pendingInteraction.x / 32);
          const objTileY = Math.floor(prev.pendingInteraction.y / 32);
          
          // Check if player is within 1 tile of the object
          if (Math.abs(objTileX - playerTileX) <= 1 && Math.abs(objTileY - playerTileY) <= 1) {
            if (prev.pendingInteraction.type === 'exit') {
              // Get the exit data from the current map
              const exitKey = `${objTileX},${objTileY}`;
              const exitData = mapData.exits?.[exitKey];
              
              if (exitData) {
                return {
                  ...prev,
                  player: {
                    ...player,
                    x: exitData.x * 32,
                    y: exitData.y * 32,
                    path: [] // Clear any existing path
                  },
                  currentMap: exitData.to,
                  pendingInteraction: null
                };
              }
            } else {
              const result = handleInteraction(prev.pendingInteraction.type, prev.pendingInteraction.data, player, mapData, prev.currentMap);
              if (result) {
                menu = result.menu as MenuType;
                return { ...prev, player, menu, pendingInteraction: null, currentMap, dialogue, battle, time, day, gameTick: gameTick + 1 };
              }
            }
          }
        }

        // Handle keyboard movement
        let dx = 0, dy = 0;
        const moveSpeed = keys['shift'] ? 4 : 2;

        // Diagonal movement
        const up = keys['w'] || keys['arrowup'];
        const down = keys['s'] || keys['arrowdown'];
        const left = keys['a'] || keys['arrowleft'];
        const right = keys['d'] || keys['arrowright'];

        if (up && left) {
          dx = -moveSpeed / Math.SQRT2;
          dy = -moveSpeed / Math.SQRT2;
          player.facing = 'up';
        } else if (up && right) {
          dx = moveSpeed / Math.SQRT2;
          dy = -moveSpeed / Math.SQRT2;
          player.facing = 'up';
        } else if (down && left) {
          dx = -moveSpeed / Math.SQRT2;
          dy = moveSpeed / Math.SQRT2;
          player.facing = 'down';
        } else if (down && right) {
          dx = moveSpeed / Math.SQRT2;
          dy = moveSpeed / Math.SQRT2;
          player.facing = 'down';
        } else if (up) {
          dy = -moveSpeed;
          player.facing = 'up';
        } else if (down) {
          dy = moveSpeed;
          player.facing = 'down';
        } else if (left) {
          dx = -moveSpeed;
          player.facing = 'left';
        } else if (right) {
          dx = moveSpeed;
          player.facing = 'right';
        }

        if (dx !== 0 || dy !== 0) {
          const targetX = player.x + dx;
          const targetY = player.y + dy;
          const tileX = Math.floor(targetX / 32);
          const tileY = Math.floor(targetY / 32);

          if (
            tileX >= 0 && tileX < mapData.width &&
            tileY >= 0 && tileY < mapData.height &&
            !mapData.collision[tileY][tileX]
          ) {
            player.x = targetX;
            player.y = targetY;
            player.sprite = Math.floor(gameTick / 5) % 2;
          }
        } else {
          player.sprite = 0;
        }

        // Clamp player position
        player.x = Math.max(0, Math.min(player.x, mapData.width * 32 - 32));
        player.y = Math.max(0, Math.min(player.y, mapData.height * 32 - 32));

        // Interaction Check
        if (keys[' '] || keys['enter']) {
          const interaction = checkInteraction(player, mapData);
          if (interaction) {
            const result = handleInteraction(interaction.type, interaction.data, player);
            if (result) {
              menu = result.menu as MenuType;
              return { ...prev, player, menu, currentMap, dialogue, battle, time, day, gameTick: gameTick + 1 };
            }
          }
        }

        return { ...prev, player, menu, currentMap, dialogue, battle, time, day, gameTick: gameTick + 1 };
      });
    }, 50); // 20Hz

    return () => {
      clearInterval(renderLoop);
    };
  }, [mapData]);

  return {
    gameState,
    currentMap: mapData,
    handleCanvasClick,
    setGameState
  };
}; 