// src/components/ui/menus/CreateArtMenu.tsx
// The Create Art Menu as a React component.
import type { GameState } from '../../../types/game';
import { Button } from '../Button';
import { Paintbrush } from 'lucide-react';

interface CreateArtMenuProps {
  gameState: GameState;
  createArt: (artType: string) => void;
  onClose: () => void;
}

export const CreateArtMenu = ({ gameState, createArt, onClose }: CreateArtMenuProps) => {
    const { player } = gameState;

    const artOptions = [
        { type: 'painting', label: 'Paint', energyCost: 25, skillReq: 1, variant: 'primary' as const },
        { type: 'sculpture', label: 'Sculpt', energyCost: 40, skillReq: 3, variant: 'success' as const },
        { type: 'digital', label: 'Digital Art', energyCost: 20, skillReq: 5, variant: 'secondary' as const }
    ];

    const handleCreateArt = (type: string) => {
        createArt(type);
        onClose();
    }

    return (
        <div className="flex flex-col h-full items-center justify-center gap-6">
             <Paintbrush size={64} className="text-purple-400" />
             <div className="text-center bg-slate-800/50 p-3 rounded-lg w-full">
                <p>Energy: {player.energy}/100</p>
                <p>Artistic Skill: {player.skills.artistic.toFixed(1)}</p>
            </div>
            <div className="w-full flex flex-col gap-4">
            {artOptions.map(art => {
                const canCreate = player.energy >= art.energyCost && player.skills.artistic >= art.skillReq;
                return (
                    <Button
                        key={art.type}
                        variant={art.variant}
                        onClick={() => handleCreateArt(art.type)}
                        disabled={!canCreate}
                    >
                        {art.label} ({art.energyCost}⚡, Skill {art.skillReq}+)
                    </Button>
                );
            })}
            </div>
        </div>
    );
};
