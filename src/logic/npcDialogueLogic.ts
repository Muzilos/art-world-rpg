// logic/npcDialogueLogic.ts
import type { GameState, NPCData } from '../types/game';
import { createCloseDialogue } from './closeDialogueLogic';

export interface DialogueOption {
  condition: boolean;
  color: string;
  disabled: boolean | undefined;
  closeDialogue: any;
  text: string;
  action: () => void;
}

export interface NPCDialogue {
  text: string;
  options: DialogueOption[];
}

interface DialogueDeps {
  setGameState: (updater: (prev: GameState) => GameState) => void;
  showMessage: (title: string, text: string, options?: DialogueOption[]) => void;
  network: (npcName: string, npcType: string) => void;
  openSellArtMenu: (npcData: NPCData) => void;
  startCritiqueBattle: (npcData: NPCData) => void;
}

export const getNPCDialogue = (
  npcData: NPCData,
  player: GameState['player'],
  relationshipLevel: number,
  deps: DialogueDeps
): NPCDialogue => {
  const { showMessage, network, openSellArtMenu, startCritiqueBattle } = deps;
  const closeDialogue = createCloseDialogue(deps.setGameState);

  switch (npcData.type) {
    case 'npc_collector': {
      const totalArt = Object.values(player.inventory)
        .filter(item => item.type === 'art')
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

      if (totalArt === 0) {
        return {
          text: "No art to show? Come back when you have something to sell.",
          options: [{ text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else if (player.reputation < 5 && relationshipLevel < 3) {
        return {
          text: "You need to make more of a name for yourself before I consider your work.",
          options: [{ text: "OK", action: closeDialogue }]
        };
      } else {
        return {
          text: `Ah, ${player.title}. Do you have something exquisite for my collection?`,
          options: [
            { text: "Sell Art", action: () => openSellArtMenu(npcData),
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            { text: "Network", action: () => { network(npcData.name, 'collector'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            { text: "Goodbye", action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    // You can progressively move the other cases here.

    default: {
      return {
        text: `${npcData.name} looks at you. ${relationshipLevel <= 1 ? 'Sizing up.' : relationshipLevel <= 5 ? 'Polite nod.' : `Greets warmly, '${player.title}!'`}`,
        options: [
          {
            text: 'Network', action: () => { network(npcData.name, 'generic'); closeDialogue(); },
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          },
          { text: "Goodbye.", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }
        ]
      };
    }
  }
};
