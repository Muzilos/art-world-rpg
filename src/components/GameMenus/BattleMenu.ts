// components/GameMenus/BattleMenu.ts
import { BATTLE_ACTIONS } from '../../constants/game';
import type { BaseMenuProps } from '../../types/game';

// Define a more specific props interface for the BattleMenu
interface BattleMenuProps extends BaseMenuProps {
  performBattleAction: (actionId: string) => void;
  // Add new props for direct drawing
  ctx: CanvasRenderingContext2D;
  boxX: number;
  boxWidth: number;
  padding: number;
  buttonMargin: number;
  addClickable: (x: number, y: number, width: number, height: number, action: () => void) => void;
  mousePos: { x: number; y: number } | null;
}

export const BattleMenu = ({
  currentY,
  gameState,
  setGameState,
  drawMenuTextHelper,
  drawMenuTitleHelper,
  drawMenuButtonHelper,
  performBattleAction,
  boxX,
  boxWidth,
  padding,
  buttonMargin,
}: BattleMenuProps): number => {
  drawMenuTitleHelper('Critique Battle');
  currentY += 10;

  const battle = gameState.battle;
  if (!battle) return currentY;

  // Display opponent and player stats
  drawMenuTextHelper(`Opponent: ${battle.opponent.name}`, '#CBD5E1', '16px', 'center', true);
  drawMenuTextHelper(`HP: ${battle.opponent.hp}/${battle.opponent.maxHp}`, '#EF4444', '15px', 'center');
  
  drawMenuTextHelper(`Player`, '#CBD5E1', '16px', 'center', true);
  drawMenuTextHelper(`HP: ${battle.player.hp}/${battle.player.maxHp}`, '#22C55E', '15px', 'center');
  drawMenuTextHelper(`Energy: ${gameState.player.energy}/100`, '#FACC15', '15px', 'center');

  // Display the last few log entries
  (battle.log || []).slice(-3).forEach(logEntry => {
    drawMenuTextHelper(logEntry, '#9CA3AF', '14px', 'center');
  });

  if (battle.turn === 'player') {
    const allActions = BATTLE_ACTIONS;
    const buttonHeight = 40;
    const twoButtonWidth = (boxWidth - padding * 2 - buttonMargin) / 2;

    // --- Draw Battle Actions in a 2x2 Grid ---
    for (let i = 0; i < allActions.length; i++) {
        const action = allActions[i];
        const canAfford = gameState.player.energy >= action.cost;
        
        const isLeftColumn = i % 2 === 0;
        const buttonX = isLeftColumn 
            ? boxX + padding 
            : boxX + padding + twoButtonWidth + buttonMargin;
        
        drawMenuButtonHelper(
            `${action.name} (${action.cost}⚡)`,
            () => performBattleAction(action.id),
            '#DC2626',
            !canAfford,
            i % 2 === 1,
            buttonX,
            twoButtonWidth
        );
    }
    currentY += Math.ceil(allActions.length / 2) * (buttonHeight + buttonMargin);


    // --- Draw Item and Flee buttons as full-width rows ---
    const hasCoffee = (gameState.player.inventory.coffee?.quantity || 0) > 0;
    drawMenuButtonHelper(
      `Use Coffee (+30⚡)`,
      () => {
        setGameState(prev => {
          if (!prev.battle || (prev.player.inventory.coffee?.quantity || 0) <= 0) {
            return prev;
          }
          const newState = { ...prev };
          newState.player.energy = Math.min(100, newState.player.energy + 30);
          newState.player.inventory.coffee.quantity -= 1;
          
          const opponentAction = BATTLE_ACTIONS[Math.floor(Math.random() * BATTLE_ACTIONS.length)];
          const opponentDamage = Math.floor(opponentAction.power * 0.5);
          newState.battle.player.hp -= opponentDamage;
          
          newState.battle.log = [
            ...newState.battle.log,
            "You drink a coffee, feeling re-energized!",
            `${newState.battle.opponent.name} attacks, dealing ${opponentDamage} damage!`,
          ].slice(-5);

           if (newState.battle.player.hp <= 0) {
              newState.player.reputation = Math.max(0, newState.player.reputation - 5);
              newState.dialogue = {
                title: "Defeat!",
                text: "Your argument was dismantled. Lost 5 Reputation.",
                options: [{ text: "Ouch.", action: () => setGameState(s => ({...s, dialogue: null}))}]
              };
              newState.battle = null;
           }
          return newState;
        });
      },
      '#16A34A',
      !hasCoffee,
      true,
      boxX + padding,
      boxWidth - padding * 2
    );
    currentY += buttonHeight + buttonMargin;

    drawMenuButtonHelper('Flee', () => {
      setGameState(prev => ({
        ...prev,
        battle: null,
        menu: null,
        dialogue: {
          title: "Fled",
          text: "You escape the scathing critique... for now.",
          options: [{ text: "Whew.", action: () => setGameState(s => ({...s, dialogue: null})) }]
        }
      }));
    }, '#6B7280');
    currentY += buttonHeight + buttonMargin;

  } else {
    drawMenuTextHelper(`${battle.opponent.name} is thinking...`, '#F59E0B', '16px', 'center', true);
  }

  return currentY;
};