// logic/npcDialogueLogic.ts
import type { GameState, NPCData } from '../types/game';
import { createCloseDialogue } from './closeDialogueLogic';

export interface DialogueOption {
  condition: boolean;
  color: string;
  disabled: boolean | undefined;
  closeDialogue: () => void;
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
          options: [{
            text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else if (player.reputation < 5 && relationshipLevel < 3) {
        return {
          text: "You need to make more of a name for yourself before I consider your work.",
          options: [{
            text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else {
        return {
          text: `Ah, ${player.title}. Do you have something exquisite for my collection?`,
          options: [
            {
              text: "Sell Art", action: () => openSellArtMenu(npcData),
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: "Network", action: () => { network(npcData.name, 'collector'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: "Goodbye", action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_critic': {
      if (player.skills.artistic < 2 && relationshipLevel < 2) {
        return {
          text: "A bit derivative, don't you think? Develop your craft.",
          options: [{ text: "OK", condition: false, color: '', disabled: false, closeDialogue: closeDialogue, action: closeDialogue }]
        };
      } else if (player.reputation < 10 && relationshipLevel < 4) {
        return {
          text: "I've heard whispers about you. Are you prepared to defend your work?",
          options: [
            {
              text: "Discuss (Battle!)", action: () => startCritiqueBattle(npcData),
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: "Not now.", action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      } else {
        return {
          text: `Ah, ${player.title}, always a pleasure. Shall we delve into the nuances of your latest endeavors?`,
          options: [
            {
              text: "Debate! (Battle)", action: () => startCritiqueBattle(npcData),
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: "Network", action: () => { network(npcData.name, 'critic'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: "Later.", action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_influencer': {
      if (player.reputation < 10 && relationshipLevel < 2) {
        return {
          text: "I only work with established artists. Build your reputation first.",
          options: [{
            text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else {
        return {
          text: "Looking to boost your social media presence?",
          options: [
            {
              text: 'Promote Artwork',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 20) {
                  showMessage("Too Tired", "You need 20 energy to promote your artwork.");
                  return;
                }
                const repGain = 15 + Math.floor(player.skills.networking * 2);
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 20,
                    reputation: prev.player.reputation + repGain,
                    exp: prev.player.exp + 30,
                    skills: {
                      ...prev.player.skills,
                      networking: Math.min(10, prev.player.skills.networking + 0.2)
                    }
                  },
                  dialogue: {
                    title: "Promotion Successful!",
                    text: `Your artwork is trending!\n+${repGain} Reputation\n+30 EXP\n+0.2 Networking`,
                    options: [{ text: "Great!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Collaborate',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 40) {
                  showMessage("Too Tired", "You need 40 energy for a collaboration.");
                  return;
                }
                const repGain = 30 + Math.floor(player.skills.networking * 3);
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 40,
                    reputation: prev.player.reputation + repGain,
                    exp: prev.player.exp + 50,
                    skills: {
                      ...prev.player.skills,
                      networking: Math.min(10, prev.player.skills.networking + 0.4)
                    }
                  },
                  dialogue: {
                    title: "Collaboration Successful!",
                    text: `Your collaboration went viral!\n+${repGain} Reputation\n+50 EXP\n+0.4 Networking`,
                    options: [{ text: "Amazing!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Network', action: () => { network(npcData.name, 'influencer'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: 'Goodbye', action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_dealer': {
      if (player.reputation < 15 && relationshipLevel < 3) {
        return {
          text: "I only deal with artists who have proven themselves in the market.",
          options: [{
            text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else {
        return {
          text: "Interested in the art market?",
          options: [
            {
              text: 'Learn Market Trends',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 15) {
                  showMessage("Too Tired", "You need 15 energy to learn market trends.");
                  return;
                }
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 15,
                    skills: {
                      ...prev.player.skills,
                      business: Math.min(10, prev.player.skills.business + 0.5)
                    }
                  },
                  dialogue: {
                    title: "Market Knowledge Gained!",
                    text: "You've learned valuable insights about the art market.\n+0.5 Business Skill",
                    options: [{ text: "Thanks!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Commission Work',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 50) {
                  showMessage("Too Tired", "You need 50 energy to take on a commission.");
                  return;
                }
                const quality = Math.min(10, Math.max(1, Math.random() * 5 + player.skills.artistic));
                const price = Math.floor(500 * (quality / 5));
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 50,
                    money: prev.player.money + price,
                    reputation: prev.player.reputation + 20,
                    skills: {
                      ...prev.player.skills,
                      artistic: Math.min(10, prev.player.skills.artistic + 0.3)
                    }
                  },
                  dialogue: {
                    title: "Commission Complete!",
                    text: `You created a quality ${quality.toFixed(1)}/10 piece.\n+$${price}\n+20 Reputation\n+0.3 Artistic Skill`,
                    options: [{ text: "Excellent!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Network', action: () => { network(npcData.name, 'dealer'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: 'Goodbye', action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_historian': {
      if (player.skills.artistic < 2 && relationshipLevel < 2) {
        return {
          text: "Your understanding of art history is too basic. Come back when you've developed your craft.",
          options: [{
            text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else {
        return {
          text: "Fascinated by art history?",
          options: [
            {
              text: 'Art History Lesson',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 20) {
                  showMessage("Too Tired", "You need 20 energy for an art history lesson.");
                  return;
                }
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 20,
                    exp: prev.player.exp + 20,
                    skills: {
                      ...prev.player.skills,
                      curating: Math.min(10, prev.player.skills.curating + 0.5)
                    }
                  },
                  dialogue: {
                    title: "Lesson Learned!",
                    text: "You've gained valuable insights into art history.\n+20 EXP\n+0.5 Curating Skill",
                    options: [{ text: "Fascinating!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Research Project',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 40) {
                  showMessage("Too Tired", "You need 40 energy for a research project.");
                  return;
                }
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 40,
                    exp: prev.player.exp + 40,
                    skills: {
                      ...prev.player.skills,
                      curating: Math.min(10, prev.player.skills.curating + 1)
                    }
                  },
                  dialogue: {
                    title: "Research Complete!",
                    text: "Your research has deepened your understanding of art.\n+40 EXP\n+1.0 Curating Skill",
                    options: [{ text: "Enlightening!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Network', action: () => { network(npcData.name, 'historian'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: 'Goodbye', action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_curator': {
      if (player.reputation < 20 && relationshipLevel < 3) {
        return {
          text: "I only work with artists who have established themselves in the art world.",
          options: [{
            text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else {
        return {
          text: "Looking to showcase your work?",
          options: [
            {
              text: 'Exhibition Proposal',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 30) {
                  showMessage("Too Tired", "You need 30 energy to prepare an exhibition proposal.");
                  return;
                }
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 30,
                    exp: prev.player.exp + 25,
                    skills: {
                      ...prev.player.skills,
                      curating: Math.min(10, prev.player.skills.curating + 0.5)
                    }
                  },
                  dialogue: {
                    title: "Proposal Submitted!",
                    text: "Your exhibition proposal has been received.\n+25 EXP\n+0.5 Curating Skill",
                    options: [{ text: "Great!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Group Show',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 60) {
                  showMessage("Too Tired", "You need 60 energy to participate in a group show.");
                  return;
                }
                const repGain = 20 + Math.floor(player.skills.curating * 2);
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    energy: prev.player.energy - 60,
                    reputation: prev.player.reputation + repGain,
                    skills: {
                      ...prev.player.skills,
                      curating: Math.min(10, prev.player.skills.curating + 0.5),
                      networking: Math.min(10, prev.player.skills.networking + 0.5)
                    }
                  },
                  dialogue: {
                    title: "Group Show Success!",
                    text: `Your work was well received!\n+${repGain} Reputation\n+0.5 Curating Skill\n+0.5 Networking Skill`,
                    options: [{ text: "Wonderful!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Network', action: () => { network(npcData.name, 'curator'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: 'Goodbye', action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_artist': {
      if (player.skills.artistic < 3 && relationshipLevel < 2) {
        return {
          text: "Focus on developing your fundamentals first. Practice makes perfect.",
          options: [{
            text: "OK", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else {
        return {
          text: "Fellow artist! Want to learn some advanced techniques?",
          options: [
            {
              text: 'Learn Techniques ($50)',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.money < 50) {
                  showMessage("Not enough money", "You need $50 for this lesson.");
                  return;
                }
                if (player.energy < 30) {
                  showMessage("Too Tired", "You need 30 energy for this lesson.");
                  return;
                }
                deps.setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    money: prev.player.money - 50,
                    energy: prev.player.energy - 30,
                    skills: {
                      ...prev.player.skills,
                      artistic: Math.min(10, prev.player.skills.artistic + 1)
                    }
                  },
                  dialogue: {
                    title: "Lesson Complete!",
                    text: "You learned valuable techniques!\n+1 Artistic Skill",
                    options: [{ text: "Excellent!", action: closeDialogue }]
                  }
                }));
              }
            },
            {
              text: 'Network', action: () => { network(npcData.name, 'artist'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: 'Goodbye', action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_gallerist': {
      if (player.reputation < 30 && relationshipLevel < 3) {
        return {
          text: "Your portfolio needs more substance before we can consider a partnership.",
          options: [{
            text: "I understand", action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }]
        };
      } else {
        return {
          text: "Interested in showing your work in my gallery?",
          options: [
            {
              text: 'Submit Portfolio',
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue,
              action: () => {
                if (player.energy < 25) {
                  showMessage("Too Tired", "You need 25 energy to prepare your portfolio.");
                  return;
                }
                const success = Math.random() < (0.3 + player.reputation * 0.01);
                const repChange = success ? 15 : -5;
                const moneyGain = success ? 300 : 0;
                deps.setGameState(prev => {

                  const newAchievements = success && !prev.player.achievements.includes('hosted_gallery_show')
                    ? [...prev.player.achievements, 'hosted_gallery_show']
                    : prev.player.achievements;
                  return {
                    ...prev,
                    player: {
                      ...prev.player,
                      energy: prev.player.energy - 25,
                      reputation: prev.player.reputation + repChange,
                      money: prev.player.money + moneyGain,
                      achievements: newAchievements
                    },
                    dialogue: {
                      title: success ? "Portfolio Accepted!" : "Portfolio Rejected",
                      text: success
                        ? `Your work will be featured!\n+${repChange} Reputation\n+$${moneyGain}`
                        : `Not quite what we're looking for.\n${repChange} Reputation`,
                      options: [{ text: success ? "Fantastic!" : "I'll keep trying", action: closeDialogue }]
                    }
                  };
                });
              }
            },
            {
              text: 'Network', action: () => { network(npcData.name, 'gallerist'); closeDialogue(); },
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            },
            {
              text: 'Goodbye', action: closeDialogue,
              condition: false,
              color: '',
              disabled: false,
              closeDialogue: closeDialogue
            }
          ]
        };
      }
    }

    case 'npc_hipster': {
      return {
        text: relationshipLevel < 2
          ? "Oh, you're into art? That's... cool, I guess. I was into art before it was mainstream."
          : "Hey! Want to check out this underground art scene I know about?",
        options: [
          {
            text: relationshipLevel < 2 ? 'Talk Art' : 'Underground Scene',
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue,
            action: () => {
              if (player.energy < 15) {
                showMessage("Too Tired", "You need 15 energy to explore the scene.");
                return;
              }
              const repGain = relationshipLevel < 2 ? 2 : 8;
              deps.setGameState(prev => ({
                ...prev,
                player: {
                  ...prev.player,
                  energy: prev.player.energy - 15,
                  reputation: prev.player.reputation + repGain,
                  exp: prev.player.exp + 15,
                  skills: {
                    ...prev.player.skills,
                    networking: Math.min(10, prev.player.skills.networking + 0.3)
                  }
                },
                dialogue: {
                  title: relationshipLevel < 2 ? "Art Chat" : "Underground Connections",
                  text: `${relationshipLevel < 2 ? 'Interesting conversation about obscure artists.' : 'You discovered some hidden artistic gems!'}\n+${repGain} Reputation\n+15 EXP\n+0.3 Networking`,
                  options: [{ text: "Cool!", action: closeDialogue }]
                }
              }));
            }
          },
          {
            text: 'Network', action: () => { network(npcData.name, 'hipster'); closeDialogue(); },
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          },
          {
            text: 'Later', action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }
        ]
      };
    }

    case 'npc_muralist': {
      return {
        text: relationshipLevel < 2
          ? "Street art is the real art. Galleries are just prisons for creativity."
          : "Want to learn some street art techniques? The city is our canvas!",
        options: [
          {
            text: relationshipLevel < 2 ? 'Discuss Philosophy' : 'Learn Street Art',
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue,
            action: () => {
              if (player.energy < 25) {
                showMessage("Too Tired", "You need 25 energy for street art practice.");
                return;
              }
              const skillGain = relationshipLevel < 2 ? 0.2 : 0.7;
              deps.setGameState(prev => ({
                ...prev,
                player: {
                  ...prev.player,
                  energy: prev.player.energy - 25,
                  exp: prev.player.exp + 20,
                  skills: {
                    ...prev.player.skills,
                    artistic: Math.min(10, prev.player.skills.artistic + skillGain)
                  }
                },
                dialogue: {
                  title: relationshipLevel < 2 ? "Art Philosophy" : "Street Art Lesson",
                  text: `${relationshipLevel < 2 ? 'You gained a new perspective on art.' : 'You learned authentic street art techniques!'}\n+20 EXP\n+${skillGain.toFixed(1)} Artistic Skill`,
                  options: [{ text: "Inspiring!", action: closeDialogue }]
                }
              }));
            }
          },
          {
            text: 'Network', action: () => { network(npcData.name, 'muralist'); closeDialogue(); },
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          },
          {
            text: 'Peace out', action: closeDialogue,
            condition: false,
            color: '',
            disabled: false,
            closeDialogue: closeDialogue
          }
        ]
      };
    }

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
          {
            text: "Goodbye.", action: closeDialogue,
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
