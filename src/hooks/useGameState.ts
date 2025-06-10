import { useState, useCallback } from 'react';
import type { GameState, MenuType } from '../types/game';

const INITIAL_GAME_STATE: GameState = {
  player: {
    x: 0,
    y: 0,
    facing: 'down',
    sprite: 0,
    money: 500,
    reputation: 0,
    energy: 100,
    level: 1,
    exp: 0,
    title: 'Aspiring Artist',
    inventory: {
      paintings: 0,
      sculptures: 0,
      digitalArt: 0,
      coffee: 0,
      businessCards: 0
    },
    skills: {
      artistic: 1,
      networking: 1,
      business: 1,
      curating: 1
    },
    equipment: {
      brush: 'basic',
      outfit: 'casual'
    },
    relationships: {},
    quests: ['first_sale'],
    completedQuests: [],
    achievements: []
  },
  currentMap: 'studio',
  dialogue: null,
  menu: null,
  battle: null,
  time: 9 * 60,
  day: 1,
  weather: 'sunny',
  music: true,
  events: [],
  unlockedMaps: ['studio', 'gallery'],
  marketMultiplier: 1,
  gameTick: 0
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  const updateGameState = useCallback((updater: (prev: GameState) => Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updater(prev) }));
  }, []);

  const setMenu = useCallback((menu: MenuType) => {
    setGameState(prev => ({ ...prev, menu }));
  }, []);

  const closeMenu = useCallback(() => {
    setGameState(prev => ({ ...prev, menu: null }));
  }, []);

  const setDialogue = useCallback((dialogue: GameState['dialogue']) => {
    setGameState(prev => ({ ...prev, dialogue }));
  }, []);

  const closeDialogue = useCallback(() => {
    setGameState(prev => ({ ...prev, dialogue: null }));
  }, []);

  return {
    gameState,
    updateGameState,
    setMenu,
    closeMenu,
    setDialogue,
    closeDialogue
  };
}; 