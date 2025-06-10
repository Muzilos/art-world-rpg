// components/GameMenus/NPCDialogueMenu.ts
import type { BaseMenuProps, GameState } from '../../types/game';
import type { NPCData } from '../../types/game';
import { getNPCDialogue } from '../../logic/npcDialogueLogic';

interface NPCDialogueMenuProps extends BaseMenuProps {
  setGameState: (updater: (prev: GameState) => GameState) => void;
}

export const NPCDialogueMenu = ({
  currentY,
  gameState,
  setGameState,
  drawMenuButtonHelper,
  drawMenuTextHelper,
  drawMenuTitleHelper,
  showMessage
}: NPCDialogueMenuProps): number => {
  // Get NPC data from menuData
  const npcData = gameState.menuData as NPCData;
  if (!npcData) return currentY;

  // Draw NPC name as title
  drawMenuTitleHelper(npcData.name);

  // Get relationship level
  const relationshipLevel = gameState.player.relationships?.[npcData.name] || 0;

  // Get appropriate dialogue
  const dialogue = getNPCDialogue(npcData, gameState.player, relationshipLevel, {
    setGameState,
    showMessage: showMessage as (title: string, text: string, options?: DialogueOption[]) => void,
    network: () => {},
    openSellArtMenu: () => {},
    startCritiqueBattle: () => {}
  });

  // Draw main dialogue text
  drawMenuTextHelper(dialogue.text)

  // Add spacing before options
  currentY += 30;

  // Draw each dialogue option
  dialogue.options.forEach((option, index) => {
    // Skip rendering if option has a condition that isn't met
    if (option.condition && !option.condition(gameState.player)) return;

    drawMenuButtonHelper(option.text, () => {
      // Execute the option's action
      option.action();
      
      // If the option should close the dialogue, clear the menu
      if (option.closeDialogue) {
        setGameState(prev => ({ ...prev, menu: null }));
      }
    }, option.color || '#3B82F6', option.disabled);

    // Add spacing between buttons (40px button height + 10px spacing)
    currentY += index < dialogue.options.length - 1 ? 50 : 40;
  });

  return currentY;
};