// src/components/ui/menus/StudyMenu.tsx
// The Study Menu as a React component.
import type { GameState } from '../../../types/game';
import { Button } from '../Button';
import { BookOpen } from 'lucide-react';

interface StudyMenuProps {
  gameState: GameState;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  onClose: () => void;
  showMessage: (title: string, text: string) => void;
}

export const StudyMenu = ({ gameState, setGameState, onClose, showMessage }: StudyMenuProps) => {
    const { player } = gameState;

    const handleStudy = () => {
        if (player.energy < 20) {
            showMessage("Too Tired", "You need at least 20 energy to study.");
            return;
        }

        setGameState(prev => {
            const skillGain = 0.5 + Math.random() * 0.5;
            const skills = ['artistic', 'networking', 'business', 'curating'] as const;
            const randomSkill = skills[Math.floor(Math.random() * skills.length)];
            
            const newPlayer = {
                ...prev.player,
                energy: prev.player.energy - 20,
                skills: {
                    ...prev.player.skills,
                    [randomSkill]: Math.min(10, prev.player.skills[randomSkill] + skillGain)
                }
            };
            
            showMessage("Study Complete!", `You gained ${skillGain.toFixed(2)} ${randomSkill} skill!`);

            return { ...prev, player: newPlayer };
        });
        onClose();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-6">
            <BookOpen size={64} className="text-purple-400" />
            <div>
                 <p className="text-lg">Study to improve your skills.</p>
                 <p className={`text-xl font-bold ${player.energy > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                    Energy: {player.energy} / 100
                 </p>
            </div>
            <Button
                variant="primary"
                onClick={handleStudy}
                disabled={player.energy < 20}
            >
                Study (+Random Skill, 20⚡)
            </Button>
        </div>
    );
};
