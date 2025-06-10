// components/GameMenus/InventoryMenu.ts
import { calculateArtworkValue } from '../../utils/marketLogic';
import { QUEST_DEFINITIONS } from '../../quests/questDefinitions';
import type { BaseMenuProps, GameState } from '../../types/game';
import { wrapAndDrawText } from '../../utils/gameLogic';

export const InventoryMenu = ({
  currentY,
  gameState,
  setGameState,
  drawMenuButtonHelper,
  drawMenuTextHelper,
  drawMenuTitleHelper,
  showMessage
}: BaseMenuProps): number => {
  // Draw title with proper spacing
  drawMenuTitleHelper('Inventory');
  currentY += 30; // Increased spacing after title

  // Equipment section
  drawMenuTextHelper('Equipment:', '#A78BFA', '16px', 'left', true);
  drawMenuTextHelper(`Brush: ${gameState.player.equipment.brush}`, '#CBD5E1');
  drawMenuTextHelper(`Outfit: ${gameState.player.equipment.outfit}`, '#CBD5E1');
  currentY += 20; // Increased spacing after equipment

  // Items section
  drawMenuTextHelper('Items:', '#A78BFA', '16px', 'left', true);
  currentY += 10;

  // Display items with proper spacing
  Object.entries(gameState.player.inventory).forEach(([itemId, item]) => {
    if (item.quantity <= 0) return; // Skip items with zero quantity

    let displayText = `${item.name} x${item.quantity}`;

    // Add value for art items
    if (item.type === 'art' && gameState.marketConditions) {
      const artKey = itemId as 'paintings' | 'sculptures' | 'digitalArt';
      const currentValue = calculateArtworkValue(artKey, gameState.player, gameState.marketConditions);
      displayText += ` (Value: $${currentValue.toFixed(2)})`;
    }

    drawMenuTextHelper(displayText, '#CBD5E1');
    currentY += 5; // Small spacing between item and button

    // Add use button for consumables
    if (item.type === 'consumable') {
      drawMenuButtonHelper(`Use ${item.name}`, () => {
        setGameState(prev => {
          const newPlayer = { ...prev.player };
          
          // Handle different consumable effects
          if (itemId === 'coffee') {
            newPlayer.energy = Math.min(100, newPlayer.energy + 30);
          } else if (itemId === 'snack') {
            newPlayer.energy = Math.min(100, newPlayer.energy + 15);
          }
          // Add more consumable effects as needed

          // Update inventory
          newPlayer.inventory = {
            ...newPlayer.inventory,
            [itemId]: { 
              ...item, 
              quantity: item.quantity - 1 
            }
          };

          // Remove item if quantity reaches zero
          if (newPlayer.inventory[itemId].quantity <= 0) {
            const { [itemId]: _, ...rest } = newPlayer.inventory;
            newPlayer.inventory = rest;
          }

          return { ...prev, player: newPlayer };
        });
      }, '#3B82F6', item.quantity <= 0);
      
      currentY += 40; // Button height + spacing
    } else {
      currentY += 15; // Regular spacing for non-consumables
    }
  });

  return currentY;
};