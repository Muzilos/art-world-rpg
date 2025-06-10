// components/GameMenus/StudyMenu.ts
import type { BaseMenuProps } from '../../types/game';
import { createCloseDialogue } from '../../logic/closeDialogueLogic';

export const StudyMenu = ({
  currentY,
  gameState,
  setGameState,
  drawMenuButtonHelper,
  drawMenuTextHelper,
  drawMenuTitleHelper
}: BaseMenuProps): number => {
  const closeDialogue = createCloseDialogue(setGameState);

  drawMenuTitleHelper('Study');
  currentY += 10;

  drawMenuTextHelper(`Energy: ${gameState.player.energy}/100`, '#CBD5E1', '15px', 'center');
  currentY += 30;

  drawMenuButtonHelper('Study (+Random Skill)', () => {
    if (gameState.player.energy < 20) {
      // Handle too tired (you can use showMessage externally)
      return;
    }

    const skillGain = 0.5 + Math.random() * 0.5;
    const skills = ['artistic', 'networking', 'business', 'curating'] as const;
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        energy: prev.player.energy - 20,
        skills: {
          ...prev.player.skills,
          [randomSkill]: Math.min(10, prev.player.skills[randomSkill] + skillGain)
        }
      },
      dialogue: {
        title: "Study Complete!",
        text: `You gained ${skillGain.toFixed(2)} ${randomSkill} skill!`,
        options: [{ text: "Great!", action: closeDialogue }]
      }
    }));
  });

  return currentY;
};
