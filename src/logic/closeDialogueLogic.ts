// src/logic/closeDialogueLogic.ts
// This helper function remains useful for creating dialogue options that simply close the dialog.
import type { GameState } from '../types/game';

export const createCloseDialogue = (
  setGameState: (updater: (prev: GameState) => GameState) => void
) => {
  return () => {
    setGameState(prev => ({
      ...prev,
      dialogue: null,
      // Also good practice to clear the menu when a dialogue interaction is fully complete
      menu: prev.dialogue ? null : prev.menu 
    }));
  };
};
