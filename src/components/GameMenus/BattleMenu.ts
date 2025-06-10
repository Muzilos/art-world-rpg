// components/GameMenus/BattleMenu.ts
import { BATTLE_ACTIONS } from '../../constants/game';
import type { BaseMenuProps } from '../../types/game';

interface BattleMenuProps extends BaseMenuProps {
  performBattleAction: (actionId: string) => void;
}

export const BattleMenu = ({
  currentY,
  gameState,
  setGameState,
  drawMenuButtonHelper,
  drawMenuTextHelper,
  drawMenuTitleHelper,
  performBattleAction,
}: BattleMenuProps): number => {
  drawMenuTitleHelper('Critique Battle');
  currentY += 10;

  const battle = gameState.battle;
  if (!battle) return currentY;

  // Display opponent and player stats
  drawMenuTextHelper(`Opponent: ${battle.opponent.name}`, '#CBD5E1', '16px', 'center', true);
  drawMenuTextHelper(`HP: ${battle.opponent.hp}/${battle.opponent.maxHp}`, '#EF4444', '15px', 'center');
  currentY += 20;
  
  drawMenuTextHelper(`Player`, '#CBD5E1', '16px', 'center', true);
  drawMenuTextHelper(`HP: ${battle.player.hp}/${battle.player.maxHp}`, '#22C55E', '15px', 'center');
  drawMenuTextHelper(`Energy: ${gameState.player.energy}/100`, '#FACC15', '15px', 'center');
  currentY += 20;

  // Display the last few log entries
  (battle.log || []).slice(-3).forEach(logEntry => {
    drawMenuTextHelper(logEntry, '#9CA3AF', '14px', 'center');
    currentY += 5;
  });
  currentY += 15;

  if (battle.turn === 'player') {
    const allActions = BATTLE_ACTIONS;
    const buttonMargin = 10;
    const twoButtonWidth = (480 * 0.9 - 40 - buttonMargin) / 2; // (boxWidth - padding*2 - margin) / 2
    const boxX = (480 - 480 * 0.9) / 2;
    const padding = 20;

    // --- Draw Battle Actions in a 2x2 Grid ---
    for (let i = 0; i < allActions.length; i++) {
        const action = allActions[i];
        const canAfford = gameState.player.energy >= action.cost;
        
        // Calculate position for a 2-column layout
        const isLeftColumn = i % 2 === 0;
        const buttonX = isLeftColumn 
            ? boxX + padding 
            : boxX + padding + twoButtonWidth + buttonMargin;
        
        // Use a temporary Y position that only increments after every second button
        const buttonY = currentY + Math.floor(i / 2) * (40 + 8);

        // We need a custom drawMenuButton call here to handle the custom width and position
        const btnWidth = twoButtonWidth;
        const btnHeight = 40;
        
        // This is a manual call to the underlying draw function from GameCanvas
        // In a real scenario, you would pass the drawMenuButton function itself
        drawMenuButtonHelper(
            `${action.name} (${action.cost} EGY)`,
            () => performBattleAction(action.id),
            '#DC2626',
            !canAfford
        );
    }
    // Increment currentY based on the rows we added
    currentY += Math.ceil(allActions.length / 2) * (40 + 8);


    // --- Draw Item and Flee buttons as full-width rows ---
    const hasCoffee = (gameState.player.inventory.coffee?.quantity || 0) > 0;
    drawMenuButtonHelper(
      `Use Coffee (+30 EGY)`,
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
      !hasCoffee
    );

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

  } else {
    drawMenuTextHelper(`${battle.opponent.name} is thinking...`, '#F59E0B', '16px', 'center', true);
  }

  return currentY;
};