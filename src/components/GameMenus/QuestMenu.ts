// components/GameMenus/QuestMenu.ts
import { QUEST_DEFINITIONS } from '../../quests/questDefinitions';
import type { BaseMenuProps, GameState } from '../../types/game';
import { wrapAndDrawText } from '../../utils/gameLogic';

interface QuestMenuProps {
  ctx: CanvasRenderingContext2D;
  boxX: number;
  boxY: number;
  boxWidth: number;
  padding: number;
  lineHeight: number;
  currentY: number;
  gameState: GameState;
}

export const QuestMenu = ({
  currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
}: BaseMenuProps): number => {
  drawMenuTitleHelper('Quests');
  currentY += 10;

  if (gameState.player.quests.length === 0) {
    drawMenuTextHelper('No active quests', '#CBD5E1', '16px', 'center');
  } else {
    gameState.player.quests.forEach(questId => {
      const quest = QUEST_DEFINITIONS[questId];
      if (!quest) return;

      const isCompleted = gameState.player.completedQuests.includes(questId);
      const textColor = isCompleted ? '#9CA3AF' : '#CBD5E1';
      const titleColor = isCompleted ? '#6B7280' : '#CBD5E1';

      drawMenuTextHelper(quest.name, titleColor, '16px', 'left', true);
      drawMenuTextHelper(quest.description, textColor, '14px', 'left');

      if (quest.reward.money) {
        drawMenuTextHelper(`Reward: $${quest.reward.money}`, textColor, '14px', 'left');
      }
      if (quest.reward.reputation) {
        drawMenuTextHelper(`Rep: ${quest.reward.reputation}`, textColor, '14px', 'left');
      }
      if (quest.reward.exp) {
        drawMenuTextHelper(`EXP: ${quest.reward.exp}`, textColor, '14px', 'left');
      }

      if (isCompleted) {
        drawMenuTextHelper('✓ Completed', '#22C55E', '14px', 'left', true);
      }

      currentY += 10;
    });
  }

  return currentY;
};
