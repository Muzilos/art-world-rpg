// components/GameMenus/BattleMenu.ts
import type { BaseMenuProps } from '../../types/game';

export const BattleMenu = ({
  currentY,
  gameState,
  drawMenuButtonHelper,
  drawMenuTextHelper,
  drawMenuTitleHelper,
}: BaseMenuProps): number => {
  drawMenuTitleHelper('Critique Battle');
  currentY += 10;

  const battle = gameState.battle;
  if (!battle) return currentY;

  drawMenuTextHelper(`Opponent: ${battle.opponent.name} | HP: ${battle.opponent.hp}/${battle.opponent.maxHp}`, '#CBD5E1', '15px', 'center');
  drawMenuTextHelper(`Player HP: ${battle.player.hp}/${battle.player.maxHp} | Energy: ${battle.player.energy}`, '#CBD5E1', '15px', 'center');
  currentY += 20;

  battle.log.slice(-5).forEach(logEntry => {
    drawMenuTextHelper(logEntry, '#9CA3AF', '14px', 'left');
  });

  if (battle.turn === 'player') {
    drawMenuButtonHelper('Attack', () => {
      // You can hook up battle attack logic here
    });

    drawMenuButtonHelper('Defend', () => {
      // Hook up defend logic here
    });

    drawMenuButtonHelper('Flee', () => {
      // Hook up flee logic here
    });
  }

  return currentY;
};
