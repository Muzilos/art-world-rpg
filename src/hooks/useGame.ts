import { useState, useCallback, useEffect, useMemo } from 'react';
import type { GameState, MenuType, BattleState } from '../types/game';
import { handleInteraction, updatePlayerPosition } from '../utils/gameLogic';
import { aStar } from '../utils/pathfinding';
import { MAPS } from '../constants/maps';
import { useQuests } from './useQuests';
import {
  calculateArtworkValue,
  updateMarketConditions,
  updateInventoryValues} from '../utils/marketLogic';
import { checkForMarketNotifications } from '../utils/marketNotifications';
import { createCloseDialogue } from '../logic/closeDialogueLogic';
import { handleBattleAction } from '../logic/battleLogic'; // Import the new logic

const getInitialState = (): GameState => {
  const savedPlayerJSON = localStorage.getItem('art-world-rpg-player-stats');
  const savedPlayer = savedPlayerJSON ? JSON.parse(savedPlayerJSON) : null;

  const initialState: GameState = {
    player: {
        x: 240,
        y: 240,
        facing: 'down',
        sprite: 0,
        money: 500,
        reputation: 0,
        inventory: {
          coffee: { id: 'coffee', name: 'Coffee', type: 'consumable', description: 'Restores 30 energy.', quantity: 2 },
          businessCards: { id: 'businessCards', name: 'Business Cards', type: 'consumable', description: 'Used for networking.', quantity: 0 },
          paintings: { id: 'paintings', name: 'Painting', type: 'art', description: 'A beautiful painting.', quantity: 3, value: 150 },
        },
        skills: {
          artistic: 1,
          networking: 1,
          business: 1,
          curating: 1
        },
        quests: ['first_sale'],
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
    time: 9 * 60,
    weather: 'Sunny',
    menu: null,
    dialogue: null,
    battle: null,
    music: true,
    events: [],
    unlockedMaps: ['studio', 'gallery'],
    marketMultiplier: 1.0,
    gameTick: 0,
    pendingInteraction: null,
    marketConditions: null
  };

  if (savedPlayer) {
    initialState.player = savedPlayer;
  }

  return initialState;
};


export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>(getInitialState());
  const { checkQuests } = useQuests(setGameState);
  const currentMap = MAPS[gameState.currentMap];
  const closeDialogue = createCloseDialogue(setGameState);

  // Add menuData to state for passing data to menus
  const [menuData, setMenuData] = useState<unknown>(null);

  useEffect(() => {
    localStorage.setItem('art-world-rpg-player-stats', JSON.stringify(gameState.player));
  }, [gameState.player]);

  // Create mapData using useMemo like in the original
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
        type: obj.type as 'npc' | 'npc_collector' | 'npc_critic' | 'shop' | 'quest',
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

  // Add missing handleCanvasClick function
  const handleCanvasClick = useCallback((x: number, y: number, menu?: MenuType) => {
    // Handle UI clicks
    if (x === -999 && y === -999) {
      return; // UI click indicator, no action needed
    }
    if (x === -1000 && y === -1000) {
      setGameState(prev => ({ ...prev, menu: null }));
      setMenuData(null); // Clear menu data when closing menu
      return;
    }
    if (x === -1001 && y === -1001 && menu) {
      // Set menu and menuData if needed
      let data = null;
      if (gameState.pendingInteraction) {
        console.log('Pending interaction:', gameState.pendingInteraction);
        const result = handleInteraction(gameState.pendingInteraction.type, gameState.pendingInteraction.data, gameState.player, mapData);
        console.log('Interaction result:', result);
        if (result) {
          data = result.data;
          setMenuData(data);
          setGameState(prev => ({ ...prev, menu: result.menu, pendingInteraction: null }));
          return;
        }
      }
      // If no result or no pending interaction, just set the menu
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
              data: {
                type: clickedObject.type,
                name: clickedObject.data.name,
                interaction: clickedObject.data.interaction,
                x: clickedObject.x,
                y: clickedObject.y
              },
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
  }, [mapData, gameState.player, gameState.pendingInteraction]);

  // Update createArt function to use market values
  const createArt = useCallback((artType: string) => {
    setGameState(prev => {
      const player = prev.player;
      let energyCost = 0;
      let skillReq = 0;
      let artKey = '';
      let baseQuality = player.skills.artistic;
      let time = prev.time;

      switch (artType) {
        case 'painting':
          energyCost = 25;
          skillReq = 1;
          artKey = 'paintings';
          time += Math.floor(Math.random() * 10);
          break;
        case 'sculpture':
          energyCost = 40;
          skillReq = 3;
          artKey = 'sculptures';
          baseQuality *= 0.8;
          time += Math.floor(Math.random() * 15);
          break;
        case 'digital':
          energyCost = 20;
          skillReq = 5;
          artKey = 'digitalArt';
          baseQuality *= 1.1;
          time += Math.floor(Math.random() * 5);
          break;
      }

      if (player.equipment.brush === 'Pro Brush Set') baseQuality += 1;
      if (player.energy < energyCost) {
        return {
          ...prev,
          dialogue: {
            title: "Too Tired",
            text: `Need ${energyCost} energy.`,
            options: [{ text: "OK", action: closeDialogue }]
          }
        };
      }
      if (player.skills.artistic < skillReq) {
        return {
          ...prev,
          dialogue: {
            title: "Skill Lacking",
            text: `Need Artistic skill ${skillReq}.`,
            options: [{ text: "OK", action: closeDialogue }]
          }
        };
      }

      const quality = Math.min(10, Math.max(1, Math.random() * 5 + baseQuality));
      const isMasterpiece = quality >= 8.5;

      const marketConditions = updateMarketConditions(prev.marketConditions, prev.gameTick);
      const artworkValue = calculateArtworkValue(
        artKey as 'paintings' | 'sculptures' | 'digitalArt',
        player,
        marketConditions,
        quality
      );

      let newAchievements = player.achievements;
      if (isMasterpiece && !newAchievements.includes('created_masterpiece')) {
        newAchievements = [...newAchievements, 'created_masterpiece'];
      }
      const expGain = 10 + Math.floor(quality * 2) + (isMasterpiece ? 50 : 0);

      const inv = { ...player.inventory };
      if (inv[artKey]) {
        inv[artKey] = {
          ...inv[artKey],
          quantity: inv[artKey].quantity + 1,
          value: artworkValue
        };
      } else {
        inv[artKey] = {
          id: artKey,
          name: artKey.charAt(0).toUpperCase() + artKey.slice(1),
          type: 'art',
          description: '',
          quantity: 1,
          value: artworkValue
        };
      }


      // Update time and day
      const newDay = time >= 24 * 60 ? prev.day + 1 : prev.day;
      const newTime = time % (24 * 60);

      return {
        ...prev,
        player: {
          ...player,
          energy: player.energy - energyCost,
          inventory: inv,
          skills: {
            ...player.skills,
            artistic: Math.min(10, player.skills.artistic + 0.1 + (isMasterpiece ? 0.2 : 0))
          },
          exp: player.exp + expGain,
          achievements: newAchievements
        },
        time: newTime,
        day: newDay,
        marketConditions,
        dialogue: {
          title: "Artwork Created!",
          text: `Created ${isMasterpiece ? '✨MASTERPIECE✨ ' : ''}${artType} (Q: ${quality.toFixed(1)}/10).\nMarket Value: $${artworkValue}\n+${expGain} EXP.`,
          options: [{ text: "Excellent!", action: closeDialogue }]
        }
      };
    });
  }, [closeDialogue]);
  
  const performBattleAction = useCallback((actionId: string) => {
    setGameState(currentState => {
      // Pass the current state to the battle logic handler
      const nextState = handleBattleAction(actionId, currentState);

      // If the battle ended, the dialogue's action needs to be hooked up to close it.
      if (nextState.dialogue && nextState.battle === null) {
        nextState.dialogue.options[0].action = () => setGameState(s => ({...s, dialogue: null}));
      }

      return nextState;
    });
  }, [setGameState]);

  // Update the main game loop
  useEffect(() => {
    const renderLoop = setInterval(() => {
      setGameState((prev: GameState) => {
        const { dialogue, battle, gameTick } = { ...prev };
        let { player, menu } = { ...prev };

        const previousMarketConditions = prev.marketConditions;
        const marketConditions = updateMarketConditions(prev.marketConditions, gameTick);
        
        if (gameTick % 500 === 0 && previousMarketConditions && marketConditions !== previousMarketConditions) {
          const notifications = checkForMarketNotifications(previousMarketConditions, marketConditions, player);
          
          if (notifications.length > 0 && !dialogue && !menu && !battle) {
            const priorityNotification = notifications.find(n => n.type === 'market_boom' || n.type === 'market_crash') || notifications[0];
            
            return {
              ...prev,
              player,
              marketConditions,
              dialogue: {
                title: priorityNotification.title,
                text: priorityNotification.message,
                options: [{ text: "Thanks for the update!", action: closeDialogue }]
              },
              gameTick: gameTick + 1
            };
          }
        }
        
        if (gameTick % 100 === 0) {
          player = updateInventoryValues(player, marketConditions);
        }

        if (dialogue || menu || battle) {
          player.sprite = 0;
          return { ...prev, player, marketConditions, gameTick: gameTick + 1 };
        }

        if (player.path && player.path.length > 0) {
          player = updatePlayerPosition(player, false); // No sprinting
        }

        if (prev.pendingInteraction) {
          const playerTileX = Math.floor(player.x / 32);
          const playerTileY = Math.floor(player.y / 32);
          const objTileX = Math.floor(prev.pendingInteraction.x / 32);
          const objTileY = Math.floor(prev.pendingInteraction.y / 32);

          if (Math.abs(objTileX - playerTileX) <= 1 && Math.abs(objTileY - playerTileY) <= 1) {
            if (prev.pendingInteraction.type === 'exit') {
              const exitKey = `${objTileX},${objTileY}`;
              const exitData = mapData.exits?.[exitKey];

              if (exitData) {
                return {
                  ...prev,
                  player: {
                    ...player,
                    x: exitData.x * 32,
                    y: exitData.y * 32,
                    path: []
                  },
                  currentMap: exitData.to,
                  pendingInteraction: null,
                  marketConditions
                };
              }
            } else {
              const result = handleInteraction(prev.pendingInteraction.type, prev.pendingInteraction.data, player, mapData);
              if (result) {
                menu = result.menu as MenuType;
                setMenuData(result.data);

                if (menu === 'battle') {
                  return {
                    ...prev,
                    player,
                    battle: {
                      ...(result.data as BattleState), // Assuming data is a valid BattleState partial
                      player: { hp: 100, maxHp: 100, energy: player.energy },
                      turn: 'player',
                      log: []
                    },
                    menu: null,
                    pendingInteraction: null,
                    marketConditions,
                    gameTick: gameTick + 1
                  };
                } else {
                  return {
                    ...prev,
                    player,
                    menu,
                    pendingInteraction: null,
                    marketConditions,
                    gameTick: gameTick + 1
                  };
                }
              }
            }
          }
        }
        
        player.sprite = 0;

        player.x = Math.max(0, Math.min(player.x, mapData.width * 32 - 32));
        player.y = Math.max(0, Math.min(player.y, mapData.height * 32 - 32));

        return { ...prev, player, menu, marketConditions, gameTick: gameTick + 1 };
      });
    }, 50);

    return () => {
      clearInterval(renderLoop);
    };
  }, [mapData, closeDialogue]);

  useEffect(() => {
    checkQuests(gameState);
  }, [gameState.player.money, gameState.player.reputation, gameState.player.achievements, gameState.player.relationships, gameState.unlockedMaps, gameState.player.quests, gameState.player.completedQuests, checkQuests, gameState]);

  return {
    gameState: { ...gameState, menuData },
    currentMap: mapData,
    handleCanvasClick,
    setGameState,
    createArt,
    closeDialogue,
    performBattleAction
  };
};