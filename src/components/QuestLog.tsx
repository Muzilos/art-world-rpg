import React from 'react';
import type { GameState } from '../types/game';
import { QUEST_DEFINITIONS } from '../quests/questDefinitions';

interface QuestLogProps {
  gameState: GameState;
}

export const QuestLog: React.FC<QuestLogProps> = ({ gameState }) => {
  const { quests, completedQuests } = gameState.player;

  const renderQuestSection = (title: string, questIds: string[], isCompleted: boolean) => (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-purple-400 mb-3">{title}</h3>
      {questIds.length > 0 ? (
        <div className="space-y-4">
          {questIds.map(questId => {
            const quest = QUEST_DEFINITIONS[questId];
            if (!quest) return null;

            return (
              <div
                key={questId}
                className={`p-4 rounded-lg ${
                  isCompleted ? 'bg-gray-700' : 'bg-gray-800'
                }`}
              >
                <h4 className="text-lg font-semibold text-purple-300 mb-2">
                  {quest.name}
                </h4>
                <p className="text-gray-300 mb-3">{quest.description}</p>
                <div className="text-sm text-gray-400">
                  <p>Rewards:</p>
                  <ul className="list-disc list-inside">
                    {quest.reward.exp && <li>+{quest.reward.exp} EXP</li>}
                    {quest.reward.money && <li>+${quest.reward.money}</li>}
                    {quest.reward.reputation && <li>+{quest.reward.reputation} Reputation</li>}
                    {quest.reward.item && Object.entries(quest.reward.item).map(([item, amount]) => (
                      <li key={item}>+{amount} {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400 italic">No {isCompleted ? 'completed' : 'active'} quests.</p>
      )}
    </div>
  );

  return (
    <div className="p-4 max-h-[600px] overflow-y-auto">
      {renderQuestSection('Active Quests', quests, false)}
      {renderQuestSection('Completed Quests', completedQuests, true)}
    </div>
  );
}; 