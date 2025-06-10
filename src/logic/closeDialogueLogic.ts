
import type { GameState } from '../types/game';

export const createCloseDialogue = (
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  return () => {
    setGameState(prev => ({
      ...prev,
      dialogue: null
    }));
  };
};
