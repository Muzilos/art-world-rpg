// src/components/ui/menus/InventoryMenu.tsx
// The Inventory Menu as a React component.
import type { GameState } from '../../../types/game';
import { Button } from '../Button';
import { calculateArtworkValue } from '../../../utils/marketLogic';

interface InventoryMenuProps {
  gameState: GameState;
  setGameState: (updater: (prev: GameState) => GameState) => void;
}

export const InventoryMenu = ({ gameState, setGameState }: InventoryMenuProps) => {
  const { player, marketConditions } = gameState;

  const handleUseItem = (itemId: string) => {
     setGameState(prev => {
          const newState = JSON.parse(JSON.stringify(prev));
          const item = newState.player.inventory[itemId];
          if (!item || item.quantity <= 0) return prev;

          if (itemId === 'coffee') {
            newState.player.energy = Math.min(100, newState.player.energy + 30);
          }
          
          item.quantity--;
          if (item.quantity <= 0) {
              delete newState.player.inventory[itemId];
          }
          
          return newState;
     });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-purple-400 mb-2">Equipment</h3>
        <div className="pl-4 text-slate-300">
          <p>Brush: {player.equipment.brush}</p>
          <p>Outfit: {player.equipment.outfit}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-purple-400 mb-2">Items</h3>
        <div className="flex flex-col gap-3 pl-4">
          {Object.keys(player.inventory).length > 0 ? Object.entries(player.inventory).map(([key, item]) => (
            <div key={key} className="bg-slate-800 p-3 rounded-lg">
              <p className="font-semibold text-white">{item.name} <span className="text-slate-400 font-normal">x{item.quantity}</span></p>
              <p className="text-sm text-slate-400 italic mb-2">{item.description}</p>
              {item.type === 'art' && marketConditions && (
                <p className="text-sm text-green-400">Market Value: ${calculateArtworkValue(key as any, player, marketConditions)}</p>
              )}
               {item.type === 'consumable' && (
                <Button variant="success" className="mt-2 py-1 text-sm" onClick={() => handleUseItem(key)}>Use</Button>
               )}
            </div>
          )) : (
            <p className="text-slate-400 italic">Your inventory is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
};
