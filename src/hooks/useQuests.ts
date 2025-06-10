import { useCallback } from 'react';
import type { GameState } from '../types/game';
import { QUEST_DEFINITIONS } from '../quests/questDefinitions';

export const useQuests = (setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const completeQuest = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = QUEST_DEFINITIONS[questId];
      if (!quest || prev.player.completedQuests.includes(questId)) return prev;

      let rewardText = `Quest Complete: ${quest.name}!`;
      const playerUpdate = { ...prev.player };

      // Apply rewards
      if (quest.reward.exp) {
        playerUpdate.exp += quest.reward.exp;
        rewardText += `\n+${quest.reward.exp} EXP`;
      }
      if (quest.reward.money) {
        playerUpdate.money += quest.reward.money;
        rewardText += `\n+$${quest.reward.money}`;
      }
      if (quest.reward.reputation) {
        playerUpdate.reputation += quest.reward.reputation;
        rewardText += `\n+${quest.reward.reputation} Rep`;
      }
      if (quest.reward.item) {
        Object.entries(quest.reward.item).forEach(([itemKey, amount]) => {
          if (playerUpdate.inventory[itemKey]) {
            playerUpdate.inventory[itemKey].quantity += amount;
          } else {
            playerUpdate.inventory[itemKey] = {
              id: itemKey,
              name: itemKey.charAt(0).toUpperCase() + itemKey.slice(1),
              type: 'consumable',
              description: '',
              quantity: amount
            };
          }
          rewardText += `\n+${amount} ${itemKey}`;
        });
      }

      // Update quest lists
      playerUpdate.quests = playerUpdate.quests.filter(id => id !== questId);
      playerUpdate.completedQuests = [...playerUpdate.completedQuests, questId];

      // Unlock new quests
      if (quest.unlocksQuests) {
        quest.unlocksQuests.forEach(newQuestId => {
          if (!playerUpdate.quests.includes(newQuestId) && !playerUpdate.completedQuests.includes(newQuestId)) {
            playerUpdate.quests.push(newQuestId);
            rewardText += `\nNew Quest: ${QUEST_DEFINITIONS[newQuestId]?.name || newQuestId}`;
          }
        });
      }

      return {
        ...prev,
        player: playerUpdate,
        dialogue: {
          title: "Quest Complete!",
          text: rewardText,
          options: [{ text: "Onwards!", action: () => setGameState(prev => ({ ...prev, dialogue: null })) }]
        }
      };
    });
  }, [setGameState]);

  const checkQuests = useCallback((gameState: GameState) => {
    const activeQuests = gameState.player.quests
      .map(id => QUEST_DEFINITIONS[id])
      .filter(q => q && !gameState.player.completedQuests.includes(q.id));

    activeQuests.forEach(quest => {
      if (quest.checkComplete(gameState)) {
        completeQuest(quest.id);
      }
    });
  }, [completeQuest]);

  return {
    completeQuest,
    checkQuests
  };
}; 