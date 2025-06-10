
import type { GameState } from '../types/game';

export const createCloseDialogue = (
  setGameState: (updater: (prev: GameState) => GameState) => void
) => {
  return () => {
    setGameState(prev => ({
      ...prev,
      dialogue: null
    }));
  };
};
