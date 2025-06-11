import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { GameState, MenuType, ObjectData } from '../types/game';
import { updatePlayerPosition } from '../utils/gameLogic';
import { aStar } from '../utils/pathfinding';
import { MAPS } from '../constants/maps';
import { useQuests } from './useQuests';
import {
  calculateArtworkValue,
  updateMarketConditions,
  updateInventoryValues
} from '../utils/marketLogic';
import { checkForMarketNotifications } from '../utils/marketNotifications';
import { createCloseDialogue } from '../logic/closeDialogueLogic';
import { handleBattleAction } from '../logic/battleLogic';
import { getNPCDialogue } from '../logic/npcDialogueLogic';
import { INTERACTION_TYPES } from '../constants/game';


const getInitialState = (): GameState => {
  // const savedGameJSON = localStorage.getItem('art-world-rpg-game-state');
  // const savedGame = savedGameJSON ? JSON.parse(savedGameJSON) : null;

  return {
    player: {
      x: 240, y: 240, facing: 'down', sprite: 0,
      money: 500, reputation: 0, energy: 100,
      level: 1, exp: 0, title: 'Aspiring Artist',
      inventory: {
        coffee: { id: 'coffee', name: 'Coffee', type: 'consumable', description: 'Restores 30 energy.', quantity: 2 },
        paintings: { id: 'paintings', name: 'Painting', type: 'art', description: 'A beautiful painting.', quantity: 3, value: 150 },
      },
      skills: { artistic: 1, networking: 1, business: 1, curating: 1 },
      quests: ['first_sale'],
      equipment: { brush: 'basic', outfit: 'casual' },
      relationships: {},
      completedQuests: [],
      achievements: []
    },
    currentMap: 'studio',
    day: 1,
    time: 9 * 60, // 9:00 AM
    menu: null,
    dialogue: null,
    battle: null,
    unlockedMaps: ['studio', 'gallery'],
    pendingInteraction: null,
    marketConditions: null,
    gameTick: 0,
    music: true,
    events: [],
    marketMultiplier: 1.0,
  };
};

export const useGame = () => {

  const [gameState, setGameState] = useState<GameState>(getInitialState());
  const { checkQuests } = useQuests(setGameState);
  const currentMap = MAPS[gameState.currentMap];
  const closeDialogue = useMemo(() => createCloseDialogue(setGameState), [setGameState]);

  // Refs to store the latest state and callbacks for the game loop
  const requestRef = useRef<number>(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    localStorage.setItem('art-world-rpg-game-state', JSON.stringify(gameState));
  }, [gameState]);

  const mapData = useMemo(() => ({
    width: currentMap.width,
    height: currentMap.height,
    tiles: currentMap.tiles,
    objects: currentMap.objects,
    exits: currentMap.exits
  }), [currentMap]);

  const showMessage = useCallback((title: string, text: string, options?: { text: string, action: () => void }[]) => {
    setGameState(prev => ({ ...prev, dialogue: { title, text, options: options || [{ text: 'OK', action: closeDialogue }] } }))
  }, [setGameState, closeDialogue]);

  // This function will be called from the UI components
  const handleInteraction = useCallback((obj: ObjectData) => {
    const { interaction, type, name } = obj;
    console.log('interaction', interaction);
    console.log('type', type);
    console.log('name', name);

    if (interaction === INTERACTION_TYPES.EXIT) {
      const currentMapData = MAPS[gameStateRef.current.currentMap];
      const exitKey = `${Math.floor(obj.x / 32)},${Math.floor(obj.y / 32)}`;
      const exitData = currentMapData.exits?.[exitKey];
      console.log('exitData', exitData);
      console.log('currentMapData', currentMapData);
      console.log('exitKey', exitKey);

      if (exitData) {
        setGameState(prev => {
          if (!prev.player) return prev;
          // Check for locked maps
          const nextMap = MAPS[exitData.to];
          if (nextMap.locked && !prev.unlockedMaps.includes(exitData.to)) {
            showMessage("Locked", "You don't have access to this area yet.");
            return prev;
          }

          return {
            ...prev,
            currentMap: exitData.to,
            player: {
              ...prev.player,
              x: exitData.x * 32,
              y: exitData.y * 32,
              path: [],
            },
            pendingInteraction: null,
          };
        });
      }
      return;
    }


    // Handle NPC talk interactions by generating dialogue data and setting it in the state
    if (type.startsWith('npc_')) {
      const npcData: NPCData = { name: name || '', type: type || '', x: obj.x, y: obj.y };
      const relationshipLevel = gameState.player.relationships?.[npcData.name] || 0;

      const dialogue = getNPCDialogue(npcData, gameState.player, relationshipLevel, {
        setGameState,
        showMessage,
        network: (npcName, npcType) => { /* Your networking logic here */ },
        openSellArtMenu: (collectorData) => { /* Your sell art menu logic here */ },
        startCritiqueBattle: (criticData) => {
          setGameState(prev => ({
            ...prev,
            menu: 'battle',
            dialogue: null,
            battle: {
              floatingTexts: [],
              type: 'critic',
              player: { hp: 100, maxHp: 100, energy: prev.player.energy },
              opponent: { name: criticData.name, hp: 100, maxHp: 100, type: 'critic' },
              turn: 'player',
              log: [`${criticData.name} challenges you to a critique battle!`]
            }
          }));
        }
      });

      setGameState(prev => ({
        ...prev,
        dialogue: {
          title: npcData.name,
          text: dialogue.text,
          options: dialogue.options,
        }
      }));
      return;
    }

    // For other interactions, just open the corresponding menu
    setGameState(prev => ({ ...prev, menu: interaction as MenuType, menuData: obj }));

  }, [gameState.player, setGameState, showMessage]);


  const handleCanvasClick = useCallback((x: number, y: number) => {
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);

    if (tileX < 0 || tileX >= mapData.width || tileY < 0 || tileY >= mapData.height) return;

    const objKey = `${tileX},${tileY}`;
    const clickedObject = mapData.objects[objKey];

    // If clicking an object, move player to an adjacent tile and set pending interaction
    if (clickedObject) {
      setGameState(prev => {
        const startNode = { x: Math.floor(prev.player.x / 32), y: Math.floor(prev.player.y / 32) };
        // Find a valid, walkable neighbor to the object to pathfind to
        let endNode = { x: tileX, y: tileY - 1 }; // Simplification: target tile above object
        const neighbors = [
          { x: tileX, y: tileY - 1 }, // Top
          { x: tileX, y: tileY + 1 }, // Bottom
          { x: tileX - 1, y: tileY }, // Left
          { x: tileX + 1, y: tileY }  // Right
      ];

      for (const neighbor of neighbors) {
          if (
              neighbor.y >= 0 && neighbor.y < currentMap.height &&
              neighbor.x >= 0 && neighbor.x < currentMap.width &&
              currentMap.tiles[neighbor.y][neighbor.x] !== 1 // 1 is a wall
          ) {
              endNode = neighbor; // Found a valid walkable spot
              break;
          }
      }


        const path = aStar(startNode, endNode, mapData.tiles);
        return {
          ...prev,
          player: { ...prev.player, path: path.map(p => ({ x: p.x * 32, y: p.y * 32 })) },
          pendingInteraction: {
            type: clickedObject.interaction,
            data: { ...clickedObject, name: clickedObject.name, type: clickedObject.type, interaction: clickedObject.interaction, x: tileX * 32, y: tileY * 32 },
            x: tileX * 32,
            y: tileY * 32
          }
        };
      });
    } else if (mapData.tiles[tileY][tileX] !== 1) { // If clicking on empty, walkable ground
      setGameState(prev => {
        const startNode = { x: Math.floor(prev.player.x / 32), y: Math.floor(prev.player.y / 32) };
        const endNode = { x: tileX, y: tileY };
        const path = aStar(startNode, endNode, mapData.tiles);
        return {
          ...prev,
          player: { ...prev.player, path: path.map(p => ({ x: p.x * 32, y: p.y * 32 })) },
          pendingInteraction: null // Clear any pending interaction if moving elsewhere
        };
      });
    }
  }, [mapData]);

  const createArt = useCallback((artType: string) => {
    setGameState(prev => {
      // ... (existing createArt logic is fine)
      const player = prev.player;
      let energyCost = 0;
      let artKey = '';

      if (artType === 'painting') { energyCost = 25; artKey = 'paintings'; }
      if (artType === 'sculpture') { energyCost = 40; artKey = 'sculptures'; }
      if (artType === 'digital') { energyCost = 20; artKey = 'digitalArt'; }

      if (player.energy < energyCost) {
        showMessage("Too Tired", `Need ${energyCost} energy.`);
        return prev;
      }

      const quality = Math.min(10, Math.max(1, Math.random() * 5 + player.skills.artistic));
      const artworkValue = calculateArtworkValue(artKey as any, player, prev.marketConditions || updateMarketConditions(null, 0), quality);
      const expGain = 10 + Math.floor(quality * 2);

      const newPlayer = JSON.parse(JSON.stringify(player));
      newPlayer.energy -= energyCost;
      newPlayer.exp += expGain;
      if (!newPlayer.inventory[artKey]) {
        newPlayer.inventory[artKey] = { id: artKey, name: artKey, type: 'art', quantity: 0, description: `A piece of ${artKey}` };
      }
      newPlayer.inventory[artKey].quantity++;
      newPlayer.inventory[artKey].value = artworkValue;

      showMessage("Artwork Created!", `You made a ${artType} of quality ${quality.toFixed(1)}/10.\nValue: $${artworkValue}\n+${expGain} EXP.`);

      return { ...prev, player: newPlayer };
    });
  }, [showMessage, setGameState]);

  const performBattleAction = useCallback((actionId: string) => {
    setGameState(currentState => {
      const nextState = handleBattleAction(actionId, currentState);
      if (nextState.dialogue && nextState.battle === null) {
        nextState.dialogue.options[0].action = closeDialogue;
      }
      return nextState;
    });
  }, [setGameState, closeDialogue]);

  useEffect(() => {
    const gameTick = () => {
      const currentState = gameStateRef.current;

      // If a menu is open, we pause the game logic but continue the loop for animations.
      if (currentState.menu || currentState.dialogue || currentState.battle) {
        requestRef.current = requestAnimationFrame(gameTick);
        return;
      }

      let newPlayer = currentState.player;
      let pathJustFinished = false;

      // Update player position
      if (newPlayer.path && newPlayer.path.length > 0) {
        const oldPathLength = newPlayer.path.length;
        newPlayer = updatePlayerPosition(newPlayer, false);
        if (oldPathLength > 0 && newPlayer.path && newPlayer.path.length === 0) {
          pathJustFinished = true;
        }
      }

      // Set the new player state
      setGameState(prev => ({
        ...prev,
        player: newPlayer,
        gameTick: prev.gameTick + 1
      }));

      // Handle interactions AFTER the state has been updated
      if (pathJustFinished && currentState.pendingInteraction) {
        handleInteraction(currentState.pendingInteraction.data);
        setGameState(prev => ({ ...prev, pendingInteraction: null }));
      }

      requestRef.current = requestAnimationFrame(gameTick);
    };

    requestRef.current = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(requestRef.current as number);
  }, [handleInteraction, gameState]);
  // Quest checking useEffect...
  useEffect(() => {
    checkQuests(gameState);
  }, [gameState, checkQuests]);

  return { gameState, setGameState, handleCanvasClick, createArt, performBattleAction, closeDialogue, showMessage };
};
