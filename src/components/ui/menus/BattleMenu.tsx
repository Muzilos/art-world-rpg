// src/components/ui/menus/BattleMenu.tsx
// I've continued to define and enhance this component.
// It now includes state for floating damage numbers and improved visual feedback.
import { useState, useEffect } from 'react';
import type { GameState, BattleState, FloatingText } from '../../../types/game';
import { BATTLE_ACTIONS } from '../../../constants/game';
import { Button } from '../Button';

interface BattleMenuProps {
  gameState: GameState;
  performBattleAction: (actionId: string) => void;
  setGameState: (updater: (prev: GameState) => GameState) => void;
}

const StatBar = ({ label, value, maxValue, colorClass }: { label: string, value: number, maxValue: number, colorClass: string }) => (
    <div className="my-2">
        <div className="flex justify-between text-sm font-semibold mb-1">
            <span className="text-slate-300">{label}</span>
            <span className="text-white">{value} / {maxValue}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border-2 border-slate-600">
            <div className={`${colorClass} h-full rounded-full transition-all duration-300`} style={{ width: `${Math.max(0, (value / maxValue) * 100)}%` }}></div>
        </div>
    </div>
);

export const BattleMenu = ({ gameState, performBattleAction, setGameState }: BattleMenuProps) => {
    const battle = gameState.battle as BattleState;
    // Local state for animations specific to this component instance
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

    // When the global battle floating texts update, show them locally
    useEffect(() => {
        if (battle.floatingTexts && battle.floatingTexts.length > 0) {
            setFloatingTexts(prev => [...prev, ...battle.floatingTexts]);
            // Clear the global state so they don't re-trigger
            setGameState(gs => ({
                ...gs,
                battle: gs.battle ? { ...gs.battle, floatingTexts: [] } : null
            }));

            // Remove the floating texts after the animation duration
            battle.floatingTexts.forEach(ft => {
                setTimeout(() => {
                    setFloatingTexts(prev => prev.filter(p => p.id !== ft.id));
                }, 1500); // Animation duration
            });
        }
    }, [battle.floatingTexts, setGameState]);


  const handleFlee = () => {
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
  }

  const handleUseCoffee = () => {
      setGameState(prev => {
          if (!prev.battle || (prev.player.inventory.coffee?.quantity || 0) <= 0) return prev;
          
          const newState = JSON.parse(JSON.stringify(prev));
          newState.player.energy = Math.min(100, newState.player.energy + 30);
          newState.player.inventory.coffee.quantity--;
          newState.battle.log.push("You drink a coffee, feeling re-energized!");
          
          // Add a floating text for energy gain
          const newFloatingText: FloatingText = { id: Date.now(), text: `+30 ⚡`, color: 'text-yellow-400', x: 50, y: 75 };
          newState.battle.floatingTexts.push(newFloatingText);
          
          return newState;
      });
  }

  return (
    <div className="relative flex flex-col h-full gap-4 p-4">
        {/* Floating Texts Container */}
        <div className="absolute inset-0 pointer-events-none">
            {floatingTexts.map(ft => (
                <div 
                    key={ft.id}
                    className={`absolute font-bold text-2xl animate-float-up ${ft.color}`}
                    style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
                >
                    {ft.text}
                </div>
            ))}
        </div>

        {/* Opponent Info */}
        <div className="relative text-center p-2 bg-slate-800/50 rounded-lg">
            <h3 className="text-xl font-bold text-red-400">{battle.opponent.name}</h3>
            <StatBar label="HP" value={battle.opponent.hp} maxValue={battle.opponent.maxHp} colorClass="bg-gradient-to-r from-red-600 to-red-400" />
        </div>

        {/* Battle Log */}
        <div className="flex-grow bg-slate-900/50 rounded-lg p-3 text-center text-sm text-slate-400 overflow-y-auto flex flex-col-reverse menu-scroll">
            {(battle.log || []).slice().reverse().map((entry, i) => <p key={i} className="mb-1">{entry}</p>)}
        </div>

        {/* Player Info */}
        <div className="relative text-center p-2 bg-slate-800/50 rounded-lg">
             <h3 className="text-xl font-bold text-green-400">You</h3>
            <StatBar label="HP" value={battle.player.hp} maxValue={battle.player.maxHp} colorClass="bg-gradient-to-r from-green-600 to-green-400" />
            <StatBar label="Energy" value={gameState.player.energy} maxValue={100} colorClass="bg-gradient-to-r from-yellow-600 to-yellow-400" />
        </div>

        {/* Player Actions */}
        {battle.turn === 'player' ? (
            <div className="grid grid-cols-2 gap-2">
                {BATTLE_ACTIONS.map(action => (
                    <Button 
                        key={action.id}
                        variant="danger"
                        onClick={() => performBattleAction(action.id)}
                        disabled={gameState.player.energy < action.cost}
                    >
                        {action.name} ({action.cost}⚡)
                    </Button>
                ))}
                 <Button 
                    variant="success"
                    disabled={(gameState.player.inventory.coffee?.quantity || 0) <= 0}
                    onClick={handleUseCoffee}
                 >
                    Use Coffee ({gameState.player.inventory.coffee?.quantity || 0})
                </Button>
                <Button variant="secondary" onClick={handleFlee}>
                    Flee
                </Button>
            </div>
        ) : (
            <div className="text-center p-4 text-yellow-400 font-bold animate-pulse">
                {battle.opponent.name} is thinking...
            </div>
        )}
    </div>
  );
};