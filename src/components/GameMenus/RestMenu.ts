// components/GameMenus/RestMenu.ts
import type { BaseMenuProps } from '../../types/game';

export const RestMenu = ({
  currentY,
  gameState,
  setGameState,
  drawMenuButtonHelper,
  drawMenuTextHelper,
  drawMenuTitleHelper,
}: BaseMenuProps): number => {
  drawMenuTitleHelper('Rest');

  drawMenuTextHelper('Rest', '#A78BFA', '24px', 'center', true);
  currentY += 45;

  drawMenuTextHelper(`🕐 ${(Math.floor(gameState.time / 60)).toString().padStart(2, '0')}:${(gameState.time % 60).toString().padStart(2, '0')}, Day ${gameState.day} | Energy: ${gameState.player.energy}/100`, '#CBD5E1', '15px', 'center');
  currentY += 30;

  const energyFull = gameState.player.energy >= 100;

  drawMenuButtonHelper(
    energyFull ? 'Energy Full!' : 'Rest (+40 Energy)',
    () => {
      if (energyFull) return;

      setGameState(prev => {
        const newEnergy = Math.min(100, prev.player.energy + 40);
        const newTime = (prev.time + 4 * 60) % (24 * 60);
        const newDay = newTime < prev.time ? prev.day + 1 : prev.day;
        return {
          ...prev,
          player: { ...prev.player, energy: newEnergy },
          time: newTime,
          day: newDay
        };
      });
    },
    '#22C55E',
    energyFull
  );

  return currentY;
};
