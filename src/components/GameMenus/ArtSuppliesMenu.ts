// ArtSuppliesMenu.ts
import type { BaseMenuProps } from '../../types/game';

export const ArtSuppliesMenu = ({
  currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper
}: BaseMenuProps) => {
  drawMenuTitleHelper('Art Supplies');
  
  drawMenuTextHelper(
    'Buy art supplies for $25? Needed for creating art.', 
    '#CBD5E1',
    '16px Noto Sans',
    'center'
  );
  currentY += 30;

  const canAfford = gameState.player.money >= 25;
  drawMenuButtonHelper('Buy Supplies ($25)', () => {
    if (canAfford) {
      setGameState(prev => {
        const inv = { ...prev.player.inventory };
        inv.supplies = {
          id: 'supplies',
          name: 'Art Supplies',
          type: 'consumable',
          quantity: (inv.supplies?.quantity || 0) + 1,
          description: 'Needed for creating art.'
        };
        return {
          ...prev,
          player: {
            ...prev.player,
            money: prev.player.money - 25,
            inventory: inv
          },
          menu: null
        };
      });
    } else {
      showMessage('Not enough money', 'You need $25 for supplies.');
    }
  }, '#3B82F6', !canAfford);

  return currentY + 40; // Button height + spacing
};