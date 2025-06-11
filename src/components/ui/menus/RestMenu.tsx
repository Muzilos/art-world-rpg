// src/components/ui/menus/RestMenu.tsx
// The Rest Menu as a React component.
import type { GameState } from '../../../types/game';
import { Button } from '../Button';
import { Bed } from 'lucide-react';

interface RestMenuProps {
  gameState: GameState;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  onClose: () => void;
}

export const RestMenu = ({ gameState, setGameState, onClose }: RestMenuProps) => {
  const { player, time, day } = gameState;
  const energyFull = player.energy >= 100;

  const handleRest = () => {
    setGameState(prev => {
      const newEnergy = Math.min(100, prev.player.energy + 40);
      const newTime = (prev.time + 4 * 60) % (24 * 60);
      const newDay = newTime < prev.time ? prev.day + 1 : prev.day;
      return {
        ...prev,
        player: { ...prev.player, energy: newEnergy },
        time: newTime,
        day: newDay,
      };
    });
    onClose();
  };

  const formattedTime = `${(Math.floor(time / 60)).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6">
      <Bed size={64} className="text-purple-400" />
      <div>
        <p className="text-lg">Day {day}, {formattedTime}</p>
        <p className={`text-2xl font-bold ${player.energy > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
          Energy: {player.energy} / 100
        </p>
      </div>
      <Button
        variant="success"
        onClick={handleRest}
        disabled={energyFull}
      >
        {energyFull ? 'Energy Full!' : 'Rest (+40 Energy, 4 hours)'}
      </Button>
    </div>
  );
};
