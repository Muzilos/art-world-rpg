// CoffeeShopMenu.ts
import type { BaseMenuProps } from '../../types/game';

export const CoffeeShopMenu = ({
  currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
}: BaseMenuProps) => {
  drawMenuTitleHelper('Coffee Shop');
  
  drawMenuTextHelper(
    'Buy a coffee for $10? Restores 30 energy.', 
    '#CBD5E1',
    '16px Noto Sans',
    'center'
  );
  currentY += 30;

  const canAfford = gameState.player.money >= 10;
  drawMenuButtonHelper('Buy Coffee ($10)', () => {
    if (canAfford) {
      setGameState(prev => {
        const inv = { ...prev.player.inventory };
        inv.coffee = {
          id: 'coffee',
          name: 'Coffee',
          type: 'consumable',
          quantity: (inv.coffee?.quantity || 0) + 1,
          description: 'Restores 30 energy.'
        };
        return {
          ...prev,
          player: {
            ...prev.player,
            money: prev.player.money - 10,
            inventory: inv
          },
          dialogue: {
            title: "Coffee!",
            text: "You bought an artisanal coffee.",
            options: [{
              text: "Nice!",
              action: () => setGameState(p => ({ ...p, dialogue: null }))
            }]
          }
        };
      });
    } else {
      showMessage('Not enough money', 'You need $10 for coffee.');
    }
  }, '#3B82F6', !canAfford);

  return currentY + 40; // Button height + spacing
};