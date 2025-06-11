// src/components/ui/menus/QuestMenu.tsx
// The Quest Menu as a React component.
import type { GameState } from '../../../types/game';
import { QUEST_DEFINITIONS } from '../../../quests/questDefinitions';

interface QuestMenuProps {
  gameState: GameState;
}

export const QuestMenu = ({ gameState }: QuestMenuProps) => {
    const { player } = gameState;
    const activeQuests = player.quests.map(id => QUEST_DEFINITIONS[id]).filter(Boolean);
    const completedQuests = player.completedQuests.map(id => QUEST_DEFINITIONS[id]).filter(Boolean);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="text-lg font-bold text-purple-400 mb-2">Active Quests</h3>
                {activeQuests.length > 0 ? activeQuests.map(quest => (
                    <div key={quest.id} className="bg-slate-800 p-3 rounded-lg mb-2">
                        <p className="font-semibold text-white">{quest.name}</p>
                        <p className="text-sm text-slate-400 italic">{quest.description}</p>
                    </div>
                )) : <p className="text-slate-400 italic pl-4">No active quests.</p>}
            </div>
             <div>
                <h3 className="text-lg font-bold text-purple-400 mb-2">Completed Quests</h3>
                {completedQuests.length > 0 ? completedQuests.map(quest => (
                    <div key={quest.id} className="bg-slate-800/50 p-3 rounded-lg mb-2 text-slate-500">
                        <p className="font-semibold line-through">{quest.name}</p>
                    </div>
                )) : <p className="text-slate-400 italic pl-4">No quests completed yet.</p>}
            </div>
        </div>
    );
};
