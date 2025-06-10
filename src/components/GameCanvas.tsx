import { useRef, useEffect, useState } from 'react';
import type { GameState, GameMap, MenuType, NPCData, ObjectData } from '../types/game';
import { SPRITES, TILE_COLORS } from '../constants/game';
import { wrapAndDrawText, getWrappedLines } from '../utils/gameLogic';
import { BATTLE_ACTIONS } from '../constants/game';
import { QUEST_DEFINITIONS } from '../quests/questDefinitions';
import { MAPS } from '../constants/maps';
import { getMarketSummary, calculateArtworkValue, generateMarketAnalysis } from '../utils/marketLogic';

const TILE_SIZE = 32;

interface GameCanvasProps {
  gameState: GameState;
  currentMap: GameMap;
  onCanvasClick: (x: number, y: number, menu?: MenuType) => void;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  createArt: (artType: string) => void;
  closeDialogue: (func: () => void) => void;
}

// Helper types
interface DialogueOption {
  text: string;
  action: (func: () => void) => void;
}

interface NPCDialogue {
  text: string;
  options: DialogueOption[];
}

export const GameCanvas = ({
  gameState,
  currentMap,
  onCanvasClick,
  setGameState,
  createArt,
  closeDialogue
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiClickableElementsRef = useRef<Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    action: () => void
  }>>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // UI Helper Functions
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: string,
    stroke: { color: string; width: number } | null = null
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.stroke();
    }
  };

  const addClickable = (x: number, y: number, width: number, height: number, action: () => void) => {
    if (typeof action === 'function') {
      uiClickableElementsRef.current.push({ x, y, width, height, action });
    } else {
      console.error('Attempted to add clickable without valid action function');
    }
  };

  const closeMenu = () => {
    onCanvasClick(-999, -999);
  };

  const showMessage = (
    title: string,
    text: string,
    options: DialogueOption[] = [{ text: "Okay", action: closeDialogue }]
  ) => {
    setGameState(prev => ({
      ...prev,
      dialogue: { title, text, options }
    }));
  };

  // Game Logic Functions
  const sellArt = (artKey: string, price: number, collectorName: string) => {
    setGameState(prev => {
      const newState = { ...prev };
      if (newState.player.inventory[artKey]) {
        newState.player.money += price;
        newState.player.reputation += 5;
        newState.player.inventory[artKey].quantity--;
        if (newState.player.inventory[artKey].quantity <= 0) {
          delete newState.player.inventory[artKey];
        }
        showMessage(
          "Artwork Sold!",
          `You sold your artwork to ${collectorName} for $${price}.`,
          [{ text: "Great!", action: closeDialogue }]
        );
      }
      return newState;
    });
  };

  const completeQuest = (questId: string) => {
    setGameState(prev => {
      const quest = QUEST_DEFINITIONS[questId];
      if (!quest || prev.player.completedQuests.includes(questId)) return prev;

      let rewardText = `Quest Complete: ${quest.name}!`;
      const playerUpdate = { ...prev.player };

      playerUpdate.exp += quest.reward.exp || 0;
      if (quest.reward.exp) rewardText += `\n+${quest.reward.exp} EXP`;

      playerUpdate.money += quest.reward.money || 0;
      if (quest.reward.money) rewardText += `\n+$${quest.reward.money}`;

      playerUpdate.reputation += quest.reward.reputation || 0;
      if (quest.reward.reputation) rewardText += `\n+${quest.reward.reputation} Rep`;

      return {
        ...prev,
        player: playerUpdate,
        dialogue: {
          title: "Quest Complete!",
          text: rewardText,
          options: [{ text: "Excellent!", action: closeDialogue }]
        }
      };
    });
  };

  const network = (npcName: string, npcType: string) => {
    setGameState(prev => {
      const player = prev.player;
      if (player.energy < 10) {
        showMessage("Too Tired", "Need 10 energy.", [{ text: "OK", action: closeDialogue }]);
        return prev;
      }

      let repGain = 1 + Math.floor(player.skills.networking * 0.5);
      const expGain = 10;
      if (npcType === 'influencer') repGain *= 2;
      if (npcType === 'dealer') repGain += player.skills.business;

      return {
        ...prev,
        player: {
          ...player,
          energy: player.energy - 10,
          reputation: player.reputation + repGain,
          exp: player.exp + expGain,
          skills: {
            ...player.skills,
            networking: Math.min(10, player.skills.networking + 0.1)
          }
        },
        dialogue: {
          title: "Networking Success!",
          text: `Chatted with ${npcName}.\n+${repGain} Rep, +${expGain} EXP.`,
          options: [{ text: "Cool!", action: closeDialogue }]
        }
      };
    });
  };

  const openSellArtMenu = (collectorData: NPCData) => {
    setGameState(prev => {
      const player = prev.player;
      const artItems = Object.entries(player.inventory)
        .filter(([_, item]) => item.type === 'art')
        .map(([key, item]) => ({
          text: `Sell ${item.name} for $${item.value || 0}`,
          action: () => sellArt(key, item.value || 0, collectorData.name)
        }));

      if (artItems.length > 0) {
        return {
          ...prev,
          dialogue: {
            title: "Sell Artwork",
            text: "What would you like to sell?",
            options: artItems
          }
        };
      } else {
        return {
          ...prev,
          dialogue: {
            title: "No Artwork",
            text: "You don't have any artwork to sell.",
            options: [{ text: "OK", action: closeDialogue }]
          }
        };
      }
    });
  };

  const startCritiqueBattle = (criticData: NPCData) => {
    setGameState(prev => ({
      ...prev,
      battle: {
        type: 'critic',
        player: {
          hp: 100,
          maxHp: 100,
          energy: prev.player.energy
        },
        opponent: {
          name: criticData.name,
          hp: 100,
          maxHp: 100,
          type: 'critic'
        },
        turn: 'player',
        log: [`${criticData.name} challenges you to a critique battle!`]
      },
      menu: 'battle'
    }));
  };

  // NPC Dialogue System
  const getNPCDialogue = (npcData: NPCData, player: any, relationshipLevel: number): NPCDialogue => {
    const npcType = npcData.type;

    switch (npcType) {
      case 'npc_collector': {
        const totalArt = Object.values(player.inventory)
          .filter(item => item.type === 'art')
          .reduce((sum, item) => sum + (item.quantity || 0), 0);

        if (totalArt === 0) {
          return {
            text: "No art to show? Come back when you have something to sell.",
            options: [{ text: "OK", action: closeDialogue }]
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
              { text: "Sell Art", action: () => openSellArtMenu(npcData) },
              { text: "Network", action: () => { network(npcData.name, 'collector'); closeDialogue(); } },
              { text: "Goodbye", action: closeDialogue }
            ]
          };
        }
      }

      case 'npc_influencer': {
        if (player.reputation < 10 && relationshipLevel < 2) {
          return {
            text: "I only work with established artists. Build your reputation first.",
            options: [{ text: "OK", action: closeDialogue }]
          };
        } else {
          return {
            text: "Looking to boost your social media presence?",
            options: [
              {
                text: 'Promote Artwork',
                action: () => {
                  if (player.energy < 20) {
                    showMessage("Too Tired", "You need 20 energy to promote your artwork.");
                    return;
                  }
                  const repGain = 15 + Math.floor(player.skills.networking * 2);
                  setGameState(prev => ({
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
                action: () => {
                  if (player.energy < 40) {
                    showMessage("Too Tired", "You need 40 energy for a collaboration.");
                    return;
                  }
                  const repGain = 30 + Math.floor(player.skills.networking * 3);
                  setGameState(prev => ({
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
              { text: 'Network', action: () => { network(npcData.name, 'influencer'); closeDialogue(); } },
              { text: 'Goodbye', action: closeDialogue }
            ]
          };
        }
      }

      case 'npc_dealer': {
        if (player.reputation < 15 && relationshipLevel < 3) {
          return {
            text: "I only deal with artists who have proven themselves in the market.",
            options: [{ text: "OK", action: closeDialogue }]
          };
        } else {
          return {
            text: "Interested in the art market?",
            options: [
              {
                text: 'Learn Market Trends',
                action: () => {
                  if (player.energy < 15) {
                    showMessage("Too Tired", "You need 15 energy to learn market trends.");
                    return;
                  }
                  setGameState(prev => ({
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
                action: () => {
                  if (player.energy < 50) {
                    showMessage("Too Tired", "You need 50 energy to take on a commission.");
                    return;
                  }
                  const quality = Math.min(10, Math.max(1, Math.random() * 5 + player.skills.artistic));
                  const price = Math.floor(500 * (quality / 5));
                  setGameState(prev => ({
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
              { text: 'Network', action: () => { network(npcData.name, 'dealer'); closeDialogue(); } },
              { text: 'Goodbye', action: closeDialogue }
            ]
          };
        }
      }

      case 'npc_historian': {
        if (player.skills.artistic < 2 && relationshipLevel < 2) {
          return {
            text: "Your understanding of art history is too basic. Come back when you've developed your craft.",
            options: [{ text: "OK", action: closeDialogue }]
          };
        } else {
          return {
            text: "Fascinated by art history?",
            options: [
              {
                text: 'Art History Lesson',
                action: () => {
                  if (player.energy < 20) {
                    showMessage("Too Tired", "You need 20 energy for an art history lesson.");
                    return;
                  }
                  setGameState(prev => ({
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
                action: () => {
                  if (player.energy < 40) {
                    showMessage("Too Tired", "You need 40 energy for a research project.");
                    return;
                  }
                  setGameState(prev => ({
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
              { text: 'Network', action: () => { network(npcData.name, 'historian'); closeDialogue(); } },
              { text: 'Goodbye', action: closeDialogue }
            ]
          };
        }
      }

      case 'npc_curator': {
        if (player.reputation < 20 && relationshipLevel < 3) {
          return {
            text: "I only work with artists who have established themselves in the art world.",
            options: [{ text: "OK", action: closeDialogue }]
          };
        } else {
          return {
            text: "Looking to showcase your work?",
            options: [
              {
                text: 'Exhibition Proposal',
                action: () => {
                  if (player.energy < 30) {
                    showMessage("Too Tired", "You need 30 energy to prepare an exhibition proposal.");
                    return;
                  }
                  setGameState(prev => ({
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
                action: () => {
                  if (player.energy < 60) {
                    showMessage("Too Tired", "You need 60 energy to participate in a group show.");
                    return;
                  }
                  const repGain = 20 + Math.floor(player.skills.curating * 2);
                  setGameState(prev => ({
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
              { text: 'Network', action: () => { network(npcData.name, 'curator'); closeDialogue(); } },
              { text: 'Goodbye', action: closeDialogue }
            ]
          };
        }
      }

      case 'npc_critic': {
        if (player.skills.artistic < 2 && relationshipLevel < 2) {
          return {
            text: "A bit derivative, don't you think? Develop your craft.",
            options: [{ text: "OK", action: closeDialogue }]
          };
        } else if (player.reputation < 10 && relationshipLevel < 4) {
          return {
            text: "I've heard whispers about you. Are you prepared to defend your work?",
            options: [
              { text: "Discuss (Battle!)", action: () => startCritiqueBattle(npcData) },
              { text: "Not now.", action: closeDialogue }
            ]
          };
        } else {
          return {
            text: `Ah, ${player.title}, always a pleasure. Shall we delve into the nuances of your latest endeavors?`,
            options: [
              { text: "Debate! (Battle)", action: () => startCritiqueBattle(npcData) },
              { text: "Network", action: () => { network(npcData.name, 'critic'); closeDialogue(); } },
              { text: "Later.", action: closeDialogue }
            ]
          };
        }
      }

      // Add missing NPC types
      case 'npc_artist': {
        if (player.skills.artistic < 3 && relationshipLevel < 2) {
          return {
            text: "Focus on developing your fundamentals first. Practice makes perfect.",
            options: [{ text: "OK", action: closeDialogue }]
          };
        } else {
          return {
            text: "Fellow artist! Want to learn some advanced techniques?",
            options: [
              {
                text: 'Learn Techniques ($50)',
                action: () => {
                  if (player.money < 50) {
                    showMessage("Not enough money", "You need $50 for this lesson.");
                    return;
                  }
                  if (player.energy < 30) {
                    showMessage("Too Tired", "You need 30 energy for this lesson.");
                    return;
                  }
                  setGameState(prev => ({
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
              { text: 'Network', action: () => { network(npcData.name, 'artist'); closeDialogue(); } },
              { text: 'Goodbye', action: closeDialogue }
            ]
          };
        }
      }

      case 'npc_gallerist': {
        if (player.reputation < 30 && relationshipLevel < 3) {
          return {
            text: "Your portfolio needs more substance before we can consider a partnership.",
            options: [{ text: "I understand", action: closeDialogue }]
          };
        } else {
          return {
            text: "Interested in showing your work in my gallery?",
            options: [
              {
                text: 'Submit Portfolio',
                action: () => {
                  if (player.energy < 25) {
                    showMessage("Too Tired", "You need 25 energy to prepare your portfolio.");
                    return;
                  }
                  const success = Math.random() < (0.3 + player.reputation * 0.01);
                  const repChange = success ? 15 : -5;
                  const moneyGain = success ? 300 : 0;
                  setGameState(prev => ({
                    ...prev,
                    player: {
                      ...prev.player,
                      energy: prev.player.energy - 25,
                      reputation: prev.player.reputation + repChange,
                      money: prev.player.money + moneyGain
                    },
                    dialogue: {
                      title: success ? "Portfolio Accepted!" : "Portfolio Rejected",
                      text: success
                        ? `Your work will be featured!\n+${repChange} Reputation\n+$${moneyGain}`
                        : `Not quite what we're looking for.\n${repChange} Reputation`,
                      options: [{ text: success ? "Fantastic!" : "I'll keep trying", action: closeDialogue }]
                    }
                  }));
                }
              },
              { text: 'Network', action: () => { network(npcData.name, 'gallerist'); closeDialogue(); } },
              { text: 'Goodbye', action: closeDialogue }
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
              action: () => {
                if (player.energy < 15) {
                  showMessage("Too Tired", "You need 15 energy to explore the scene.");
                  return;
                }
                const repGain = relationshipLevel < 2 ? 2 : 8;
                setGameState(prev => ({
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
            { text: 'Network', action: () => { network(npcData.name, 'hipster'); closeDialogue(); } },
            { text: 'Later', action: closeDialogue }
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
              action: () => {
                if (player.energy < 25) {
                  showMessage("Too Tired", "You need 25 energy for street art practice.");
                  return;
                }
                const skillGain = relationshipLevel < 2 ? 0.2 : 0.7;
                setGameState(prev => ({
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
            { text: 'Network', action: () => { network(npcData.name, 'muralist'); closeDialogue(); } },
            { text: 'Peace out', action: closeDialogue }
          ]
        };
      }

      default: {
        return {
          text: `${npcData.name} looks at you. ${relationshipLevel <= 1 ? 'Sizing up.' : relationshipLevel <= 5 ? 'Polite nod.' : `Greets warmly, '${player.title}!'`}`,
          options: [
            { text: 'Network', action: () => { network(npcData.name, 'generic'); closeDialogue(); } },
            { text: "Goodbye.", action: closeDialogue }
          ]
        };
      }
    }
  };

  // Study menu handler
  const handleStudyMenu = () => {
    setGameState(prev => {
      if (prev.player.energy < 20) {
        return {
          ...prev,
          dialogue: {
            title: "Too Tired",
            text: "You need 20 energy to study.",
            options: [{ text: "OK", action: closeDialogue }]
          }
        };
      }

      const skillGain = 0.5 + Math.random() * 0.5;
      const randomSkill = ['artistic', 'networking', 'business', 'curating'][Math.floor(Math.random() * 4)] as keyof typeof prev.player.skills;

      return {
        ...prev,
        player: {
          ...prev.player,
          energy: prev.player.energy - 20,
          skills: {
            ...prev.player.skills,
            [randomSkill]: Math.min(10, prev.player.skills[randomSkill] + skillGain)
          }
        },
        dialogue: {
          title: "Study Complete!",
          text: `You gained ${skillGain.toFixed(2)} ${randomSkill} skill!`,
          options: [{ text: "Great!", action: closeDialogue }]
        }
      };
    });
  };

  // Drawing Functions
  const drawMenuButton = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    action: () => void,
    color = '#3B82F6',
    disabled = false
  ) => {
    const lineHeight = 20;
    ctx.font = 'bold 14px Noto Sans';
    const lines = getWrappedLines(ctx, text, width, ctx.font);
    const textHeight = lines.length * lineHeight;
    const textY = y + (height - textHeight) / 2 + lineHeight * 0.85;

    // Hover effect
    let isHovered = false;
    if (mousePos &&
      mousePos.x >= x && mousePos.x <= x + width &&
      mousePos.y >= y && mousePos.y <= y + height &&
      !disabled
    ) {
      isHovered = true;
    }

    const bgColor = disabled ? '#64748B' : isHovered ? '#2563EB' : color;
    const textColor = isHovered ? '#FACC15' : '#FFFFFF';

    drawRoundedRect(ctx, x, y, width, height, 5, bgColor);

    lines.forEach((line: string, i: number) => {
      wrapAndDrawText(ctx, line, x, textY + i * lineHeight, width, lineHeight, {
        fillStyle: textColor,
        font: 'bold 14px Noto Sans',
        textAlign: 'center' as CanvasTextAlign
      });
    });

    if (!disabled) {
      addClickable(x, y, width, height, action);
    }
  };

  const drawMenu = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!gameState.menu) return;

    const boxWidth = canvas.width * 0.9;
    const boxHeight = canvas.height * 0.85;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;
    const padding = 20;
    const lineHeight = 20;
    const buttonHeight = 40;
    const buttonMargin = 8;
    let currentY = boxY + padding;

    // Draw menu background
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10, 'rgba(30,41,59,0.98)', {
      color: 'rgba(71,85,105,1)',
      width: 2
    });

    // Helper functions for menu drawing
    const drawMenuTitle = (title: string) => {
      wrapAndDrawText(ctx, title, boxX + padding, currentY + 10, boxWidth - padding * 2, 28, {
        fillStyle: '#A78BFA',
        font: 'bold 24px Noto Sans',
        textAlign: 'center' as CanvasTextAlign
      });
      currentY += 45;
    };

    const drawMenuText = (
      text: string,
      color = '#CBD5E1',
      size = '15px',
      align: CanvasTextAlign = 'left',
      isBold = false
    ) => {
      const textMaxWidth = boxWidth - padding * 2;
      const textX = align === 'center' ? boxX + (boxWidth - textMaxWidth) / 2 : boxX + padding;
      currentY += wrapAndDrawText(ctx, text, textX, currentY, textMaxWidth, lineHeight, {
        fillStyle: color,
        font: `${isBold ? 'bold ' : ''}${size} Noto Sans`,
        textAlign: align
      });
    };

    const drawMenuButtonHelper = (text: string, action: () => void, color = '#3B82F6', disabled = false) => {
      const btnWidth = boxWidth - padding * 2;
      const btnX = boxX + padding;
      drawMenuButton(ctx, text, btnX, currentY, btnWidth, buttonHeight, action, color, disabled);
      currentY += buttonHeight + buttonMargin;
    };

    // Draw menu content based on type
    switch (gameState.menu) {

      case 'inventory': {
        drawMenuTitle('Inventory');
        drawMenuText('Equipment:', '#A78BFA', '16px', 'left', true);
        drawMenuText(`Brush: ${gameState.player.equipment.brush}`, '#CBD5E1');
        drawMenuText(`Outfit: ${gameState.player.equipment.outfit}`, '#CBD5E1');
        currentY += 10;
        drawMenuText('Items:', '#A78BFA', '16px', 'left', true);

        Object.entries(gameState.player.inventory).forEach(([itemId, item]) => {
          let displayText = `${item.name} x${item.quantity}`;

          // Show current market value for art pieces
          if (item.type === 'art' && gameState.marketConditions) {
            const artKey = itemId as 'paintings' | 'sculptures' | 'digitalArt';
            const currentValue = calculateArtworkValue(artKey, gameState.player, gameState.marketConditions);
            displayText += ` (Value: $${currentValue})`;
          }

          drawMenuText(displayText, '#CBD5E1');

          if (item.type === 'consumable' && item.quantity > 0) {
            drawMenuButtonHelper(`Use (${item.name})`, () => {
              setGameState(prev => {
                const newPlayer = { ...prev.player };
                if (itemId === 'coffee') {
                  newPlayer.energy = Math.min(100, newPlayer.energy + 30);
                }
                newPlayer.inventory = {
                  ...newPlayer.inventory,
                  [itemId]: { ...item, quantity: item.quantity - 1 }
                };
                return { ...prev, player: newPlayer };
              });
            });
          }
        });
        break;
      }

      case 'quests':
        drawMenuTitle('Quests');
        if (gameState.player.quests.length === 0) {
          drawMenuText('No active quests', '#CBD5E1', '16px', 'center');
        } else {
          gameState.player.quests.forEach(questId => {
            const quest = QUEST_DEFINITIONS[questId];
            if (!quest) return;

            const isCompleted = gameState.player.completedQuests.includes(questId);
            const textColor = isCompleted ? '#9CA3AF' : '#CBD5E1';
            const titleColor = isCompleted ? '#6B7280' : '#CBD5E1';

            drawMenuText(quest.name, titleColor, '16px', 'left', true);
            drawMenuText(quest.description, textColor, '14px', 'left', false);

            if (quest.reward.money) {
              drawMenuText(`Reward: $${quest.reward.money}`, textColor, '14px', 'left', false);
            }
            if (quest.reward.reputation) {
              drawMenuText(`Rep: ${quest.reward.reputation}`, textColor, '14px', 'left', false);
            }
            if (quest.reward.exp) {
              drawMenuText(`EXP: ${quest.reward.exp}`, textColor, '14px', 'left', false);
            }

            if (isCompleted) {
              drawMenuText('✓ Completed', '#22C55E', '14px', 'left', true);
            }
          });
        }
        break;

      case 'create_art':
        drawMenuTitle('Create Art');
        drawMenuText(`Energy: ${gameState.player.energy}/100 | Artistic: ${gameState.player.skills.artistic.toFixed(1)}`, '#CBD5E1', '15px', 'center');
        currentY += 30;
        drawMenuButtonHelper('Paint (25 EGY, Skill 1+)', () => createArt('painting'), '#3B82F6');
        drawMenuButtonHelper('Sculpt (40 EGY, Skill 3+)', () => createArt('sculpture'), '#22C55E', gameState.player.skills.artistic < 3);
        drawMenuButtonHelper('Digital Art (20 EGY, Skill 5+)', () => createArt('digital'), '#8B5CF6', gameState.player.skills.artistic < 5);
        break;

      case 'rest':
        drawMenuTitle('Rest');
        drawMenuText(`Time: ${gameState.time}:00, Day ${gameState.day} | Energy: ${gameState.player.energy}/100`, '#CBD5E1', '15px', 'center');
        currentY += 30;
        drawMenuButtonHelper('Nap (2 Hrs, +30 Energy)', () => {
          let newTime = gameState.time + 2;
          let newDay = gameState.day;
          if (newTime >= 24) {
            newTime = newTime % 24;
            newDay += 1;
          }
          setGameState(prev => ({
            ...prev,
            time: newTime,
            day: newDay,
            player: {
              ...prev.player,
              energy: Math.min(100, prev.player.energy + 30)
            }
          }));
        }, '#38BDF8');
        drawMenuButtonHelper('Sleep (Until 8 AM, +100 Energy)', () => {
          setGameState(prev => ({
            ...prev,
            time: 8,
            day: prev.day + 1,
            player: {
              ...prev.player,
              energy: 100
            }
          }));
        }, gameState.time < 21 ? '#64748B' : '#3B82F6', gameState.time < 21);
        break;

      case 'talk_npc': {
        const npcData = gameState.menuData as NPCData;
        if (!npcData) return;

        drawMenuTitle(npcData.name);
        const player = gameState.player;
        const relationshipLevel = player.relationships?.[npcData.name] || 0;
        const dialogue = getNPCDialogue(npcData, player, relationshipLevel);

        drawMenuText(dialogue.text, '#CBD5E1', '16px', 'left');
        currentY += 20;
        dialogue.options.forEach(option => {
          drawMenuButtonHelper(option.text, option.action);
        });
        break;
      }

      case 'battle':
        drawMenuTitle('Critic Battle');
        const battle = gameState.battle;
        if (!battle) return;

        drawMenuText(`Opponent: ${battle.opponent.name} (${battle.opponent.hp}/${battle.opponent.maxHp} HP)`, '#F87171', '16px', 'center');
        drawMenuText(`You: ${battle.player.hp}/${battle.player.maxHp} HP`, '#4ADE80', '16px', 'center');

        battle.log.slice(-5).forEach((entry: string) => drawMenuText(entry, '#CBD5E1', '14px', 'left'));

        if (battle.turn === 'player') {
          BATTLE_ACTIONS.forEach(action => {
            drawMenuButtonHelper(action.name, () => {
              const hit = Math.random() < action.accuracy;
              const newLog = [...battle.log];

              if (hit) {
                battle.opponent.hp -= action.power;
                newLog.push(`You used ${action.name}! It hit for ${action.power} damage.`);
              } else {
                newLog.push(`You used ${action.name}, but missed!`);
              }

              if (battle.opponent.hp <= 0) {
                newLog.push('You won the battle! Reputation +10');
                setGameState(prev => ({
                  ...prev,
                  player: { ...prev.player, reputation: prev.player.reputation + 10 },
                  battle: null,
                  menu: null
                }));
                return;
              }

              setGameState(prev => ({
                ...prev,
                battle: { ...battle, log: newLog, turn: 'opponent' }
              }));

              setTimeout(() => {
                const oppHit = Math.random() < 0.8;
                const newLog2 = [...newLog];

                if (oppHit) {
                  battle.player.hp -= 15;
                  newLog2.push('Critic attacks! You lose 15 HP.');
                } else {
                  newLog2.push('Critic attacks but misses!');
                }

                if (battle.player.hp <= 0) {
                  newLog2.push('You lost the battle! Reputation -5');
                  setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, reputation: Math.max(0, prev.player.reputation - 5) },
                    battle: null,
                    menu: null
                  }));
                  return;
                }

                setGameState(prev => ({
                  ...prev,
                  battle: { ...battle, log: newLog2, turn: 'player' }
                }));
              }, 1000);
            });
          });
        } else {
          drawMenuText('Opponent is thinking...', '#CBD5E1', '16px', 'center');
        }
        break;

      case 'buy_coffee':
        drawMenuTitle('Coffee Shop');
        drawMenuText('Buy a coffee for $10? Restores 30 energy.', '#CBD5E1', '16px', 'center');
        drawMenuButtonHelper('Buy Coffee ($10)', () => {
          if (gameState.player.money >= 10) {
            setGameState(prev => {
              const inv = { ...prev.player.inventory };
              if (inv.coffee) {
                inv.coffee = {
                  ...inv.coffee,
                  quantity: inv.coffee.quantity + 1
                };
              } else {
                inv.coffee = {
                  id: 'coffee',
                  name: 'Coffee',
                  type: 'consumable',
                  quantity: 1,
                  description: 'Restores 30 energy.'
                };
              }
              return {
                ...prev,
                player: {
                  ...prev.player,
                  money: prev.player.money - 10,
                  inventory: inv
                },
                dialogue: {
                  title: "Coffee!",
                  text: "You bought an artisanal coffee.",
                  options: [{
                    text: "Nice!",
                    action: () => {
                      setGameState(p => ({ ...p, dialogue: null }));
                    }
                  }]
                }
              };
            });
          } else {
            showMessage('Not enough money', 'You need $10 for coffee.');
          }
        });
        break;

      case 'buy_supplies':
        drawMenuTitle('Art Supplies');
        drawMenuText('Buy art supplies for $25? Needed for creating art.', '#CBD5E1', '16px', 'center');
        drawMenuButtonHelper('Buy Supplies ($25)', () => {
          if (gameState.player.money >= 25) {
            setGameState(prev => {
              const inv = { ...prev.player.inventory };
              if (inv.supplies) {
                inv.supplies = {
                  ...inv.supplies,
                  quantity: inv.supplies.quantity + 1
                };
              } else {
                inv.supplies = {
                  id: 'supplies',
                  name: 'Art Supplies',
                  type: 'consumable',
                  quantity: 1,
                  description: 'Needed for creating art.'
                };
              }
              return {
                ...prev,
                player: {
                  ...prev.player,
                  money: prev.player.money - 25,
                  inventory: inv
                },
                menu: null
              };
            });
          } else {
            showMessage('Not enough money', 'You need $25 for supplies.');
          }
        });
        break;
      case 'status':
        drawMenuTitle('Status');
        drawMenuText(`Level ${gameState.player.level} ${gameState.player.title}`, '#A78BFA', '18px', 'center', true);
        currentY += 10;
        drawMenuText(`Money: $${gameState.player.money}`, '#4ADE80');
        drawMenuText(`Energy: ${gameState.player.energy}/100`, '#FACC15');
        drawMenuText(`Reputation: ${gameState.player.reputation}`, '#F87171');
        currentY += 10;
        drawMenuText('Skills:', '#A78BFA', '16px', 'left', true);
        drawMenuText(`Artistic: ${gameState.player.skills.artistic.toFixed(1)}`, '#CBD5E1');
        drawMenuText(`Networking: ${gameState.player.skills.networking.toFixed(1)}`, '#CBD5E1');
        drawMenuText(`Business: ${gameState.player.skills.business.toFixed(1)}`, '#CBD5E1');
        drawMenuText(`Curating: ${gameState.player.skills.curating.toFixed(1)}`, '#CBD5E1');
        break;
      case 'study':
        drawMenuTitle('Study');
        drawMenuText(`Energy: ${gameState.player.energy}/100`, '#CBD5E1', '15px', 'center');
        currentY += 20;
        drawMenuText('Study to improve a random skill!', '#CBD5E1', '15px', 'center');
        currentY += 20;
        drawMenuButtonHelper('Study (20 Energy)', handleStudyMenu);
        break;

      case 'teach_artist':
        drawMenuTitle('Master Artist');
        drawMenuText('Learn advanced techniques from a master artist.', '#CBD5E1', '15px', 'center');
        currentY += 20;
        drawMenuButtonHelper('Learn Techniques ($50, +1 Artistic)', () => {
          if (gameState.player.money >= 50) {
            setGameState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                money: prev.player.money - 50,
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
          } else {
            showMessage('Not enough money', 'You need $50 for this lesson.');
          }
        });
        break;

      case 'judge_gallerist':
        drawMenuTitle('Gallerist Judgement');
        const repChange = gameState.menuData?.reputationChange || 0;
        const sale = gameState.menuData?.sale;
        drawMenuText(
          repChange > 0
            ? `The gallerist is impressed! Reputation +${repChange}`
            : `The gallerist is unimpressed. Reputation ${repChange}`,
          '#CBD5E1',
          '16px',
          'center'
        );
        if (sale) {
          drawMenuText(`You made a sale! +${sale.amount}`, '#4ADE80', '16px', 'center');
        }
        drawMenuButtonHelper('Continue', () => {
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              reputation: prev.player.reputation + repChange,
              money: sale ? prev.player.money + sale.amount : prev.player.money
            },
            menu: null
          }));
        });
        break;

      case 'market':
        drawMenuTitle('Art Market');

        // Display current market conditions
        if (gameState.marketConditions) {
          drawMenuText('Market Conditions:', '#A78BFA', '16px', 'left', true);
          const marketSummary = getMarketSummary(gameState.marketConditions);
          drawMenuText(marketSummary, '#CBD5E1', '14px', 'left');
          currentY += 15;
        }

        drawMenuText('Your Artwork:', '#A78BFA', '16px', 'left', true);

        // Show available artwork with current values
        const artworks = Object.entries(gameState.player.inventory)
          .filter(([_, item]) => item.type === 'art' && item.quantity > 0);

        if (artworks.length > 0) {
          artworks.forEach(([key, item]) => {
            const artKey = key as 'paintings' | 'sculptures' | 'digitalArt';
            let currentValue = item.value || 0;

            // Recalculate current market value if market conditions exist
            if (gameState.marketConditions) {
              currentValue = calculateArtworkValue(artKey, gameState.player, gameState.marketConditions);
            }

            const marketData = gameState.marketConditions?.[artKey];
            const trendIcon = marketData ? {
              rising: '📈',
              stable: '➡️',
              falling: '📉'
            }[marketData.marketTrend] : '';

            const demandIcon = marketData ? {
              low: '🔻',
              medium: '🔸',
              high: '🔥'
            }[marketData.demandLevel] : '';

            drawMenuText(`${item.name} x${item.quantity}`, '#CBD5E1', '15px', 'left', true);
            drawMenuText(`Value: $${currentValue} ${trendIcon} ${demandIcon}`, '#4ADE80', '14px', 'left');

            // Add sell button for each artwork type
            if (item.quantity > 0) {
              drawMenuButtonHelper(`Sell ${item.name} ($${currentValue})`, () => {
                setGameState(prev => {
                  const newInventory = { ...prev.player.inventory };
                  newInventory[key] = {
                    ...newInventory[key],
                    quantity: newInventory[key].quantity - 1
                  };

                  // Remove from inventory if quantity reaches 0
                  if (newInventory[key].quantity <= 0) {
                    delete newInventory[key];
                  }

                  return {
                    ...prev,
                    player: {
                      ...prev.player,
                      money: prev.player.money + currentValue,
                      reputation: prev.player.reputation + Math.floor(currentValue / 50),
                      inventory: newInventory
                    },
                    dialogue: {
                      title: "Artwork Sold!",
                      text: `You sold your ${item.name} for $${currentValue}!\n+${Math.floor(currentValue / 50)} Reputation`,
                      options: [{ text: "Excellent!", action: closeDialogue }]
                    }
                  };
                });
              }, '#22C55E');
            }
          });
        } else {
          drawMenuText('No artwork to sell. Create some art first!', '#CBD5E1', '15px', 'center');
        }

        currentY += 20;

        // Market analysis button
        drawMenuButtonHelper('Market Analysis (Business Skill)', () => {
          if (gameState.player.skills.business < 2) {
            showMessage('Business Skill Too Low', 'You need at least level 2 Business skill for market analysis.');
            return;
          }

          if (!gameState.marketConditions) {
            showMessage('No Market Data', 'Market conditions are not available.');
            return;
          }

          const analysis = generateMarketAnalysis(gameState.player, gameState.marketConditions);
          showMessage('Market Analysis', analysis);
        }, '#8B5CF6', gameState.player.skills.business < 2);

        break;
      case 'shop': {
        const shopData = gameState.menuData?.shop;
        if (shopData) {
          drawMenuTitle(shopData.name);
          drawMenuText(shopData.description, '#CBD5E1');
          currentY += 20;
          drawMenuButtonHelper(`Buy ${shopData.sale.name} (${shopData.sale.price})`, () => {
            if (gameState.player.money >= shopData.sale.price) {
              setGameState(prev => {
                const newPlayer = { ...prev.player };
                newPlayer.money -= shopData.sale.price;
                newPlayer.reputation += shopData.reputationChange || 0;
                newPlayer.inventory = {
                  ...newPlayer.inventory,
                  [shopData.sale.id]: {
                    id: shopData.sale.id,
                    name: shopData.sale.name,
                    type: shopData.sale.type,
                    description: shopData.sale.description,
                    quantity: (newPlayer.inventory[shopData.sale.id]?.quantity || 0) + 1,
                    value: shopData.sale.value
                  }
                };
                return {
                  ...prev,
                  player: newPlayer,
                  dialogue: {
                    title: "Purchase Successful",
                    text: `You bought ${shopData.sale.name} for ${shopData.sale.price}.`,
                    options: [{ text: "OK", action: closeDialogue }]
                  }
                };
              });
            } else {
              showMessage('Not enough money', `You need ${shopData.sale.price} for this item.`);
            }
          });
        }
        break;
      }
    }

    // Add close button
    const closeBtnWidth = 120;
    const closeBtnHeight = 30;
    const closeBtnX = boxX + boxWidth - closeBtnWidth - padding;
    const closeBtnY = boxY + boxHeight - closeBtnHeight - padding;

    drawMenuButton(ctx, 'Close', closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, () => {
      onCanvasClick(-1000, -1000);
    }, '#7C3AED');
  };

  const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Clear clickable elements for this frame
    uiClickableElementsRef.current = [];

    // Set canvas size
    canvas.width = 480;
    canvas.height = 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    const RENDER_WIDTH_TILES = 15;
    const RENDER_HEIGHT_TILES = 15;

    // Camera setup
    const camX = gameState.player.x - canvas.width / 2 + TILE_SIZE / 2;
    const camY = gameState.player.y - canvas.height / 2 + TILE_SIZE / 2;
    const clampedCamX = Math.max(0, Math.min(camX, currentMap.width * TILE_SIZE - canvas.width));
    const clampedCamY = Math.max(0, Math.min(camY, currentMap.height * TILE_SIZE - canvas.height));

    ctx.save();
    ctx.translate(-clampedCamX, -clampedCamY);

    // Render Tiles
    const startCol = Math.floor(clampedCamX / TILE_SIZE);
    const endCol = startCol + RENDER_WIDTH_TILES + 1;
    const startRow = Math.floor(clampedCamY / TILE_SIZE);
    const endRow = startRow + RENDER_HEIGHT_TILES + 1;

    for (let r = startRow; r < Math.min(endRow, currentMap.height); r++) {
      for (let c = startCol; c < Math.min(endCol, currentMap.width); c++) {
        if (r < 0 || c < 0) continue;
        const tileVal = currentMap.tiles[r]?.[c];
        if (tileVal !== undefined) {
          ctx.fillStyle = TILE_COLORS[tileVal as keyof typeof TILE_COLORS] || '#FF00FF';
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw map objects
    Object.entries(currentMap.objects).forEach(([key, obj]) => {
      const [x, y] = key.split(',').map(Number);
      const sprite = SPRITES[obj.type as keyof typeof SPRITES];
      if (typeof sprite === 'string') {
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sprite, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
      }
    });

    // Draw player
    const playerSprite = SPRITES.player[gameState.player.facing][gameState.player.sprite];
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerSprite, gameState.player.x + TILE_SIZE / 2, gameState.player.y + TILE_SIZE / 2);

    // Draw hover indicator if mouse is over a tile
    if (mousePos) {
      const mouseTileX = Math.floor((mousePos.x + clampedCamX) / TILE_SIZE);
      const mouseTileY = Math.floor((mousePos.y + clampedCamY) / TILE_SIZE);

      if (mouseTileX >= 0 && mouseTileX < currentMap.width &&
        mouseTileY >= 0 && mouseTileY < currentMap.height) {

        const isOnInteractiveObject = Object.entries(currentMap.objects).some(([key, obj]) => {
          const [objTileX, objTileY] = key.split(',').map(Number);
          const isInteractive = ['exit', 'npc', 'shop', 'create_art', 'rest', 'study', 'buy_coffee', 'buy_supplies', 'talk_npc'].includes(obj.interaction);
          return objTileX === mouseTileX && objTileY === mouseTileY && isInteractive;
        });

        if (isOnInteractiveObject || currentMap.tiles[mouseTileY][mouseTileX] !== 1) {
          const x = mouseTileX * TILE_SIZE;
          const y = mouseTileY * TILE_SIZE;

          ctx.shadowColor = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.shadowBlur = 8;
          ctx.fillStyle = isOnInteractiveObject ? 'rgba(239, 68, 68, 0.1)' : 'rgba(250, 204, 21, 0.1)';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          ctx.shadowBlur = 0;
          ctx.strokeStyle = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          const accentSize = 3;
          ctx.fillStyle = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.fillRect(x, y, accentSize, accentSize);
          ctx.fillRect(x + TILE_SIZE - accentSize, y, accentSize, accentSize);
          ctx.fillRect(x, y + TILE_SIZE - accentSize, accentSize, accentSize);
          ctx.fillRect(x + TILE_SIZE - accentSize, y + TILE_SIZE - accentSize, accentSize, accentSize);
        }
      }
    }

    ctx.restore();

    // Draw player stats at the bottom
    const statsPadding = 10;
    const statsHeight = 30;
    const statsY = canvas.height - statsHeight - statsPadding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    drawRoundedRect(ctx, statsPadding, statsY, canvas.width - statsPadding * 2, statsHeight, 5, ctx.fillStyle);

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#4ADE80';
    ctx.fillText(`$ ${gameState.player.money}`, statsPadding + 10, statsY + statsHeight / 2);

    ctx.fillStyle = '#FACC15';
    ctx.fillText(`⚡ ${gameState.player.energy}/100`, statsPadding + 100, statsY + statsHeight / 2);

    ctx.fillStyle = '#F87171';
    ctx.fillText(`⭐ ${gameState.player.reputation}`, statsPadding + 200, statsY + statsHeight / 2);

    ctx.fillStyle = '#A78BFA';
    ctx.fillText(`${gameState.time.toString().padStart(2, '0')}:00`, statsPadding + 300, statsY + statsHeight / 2);

    // Draw UI icons
    const iconSize = 40;
    const padding = 10;
    const icons = [
      { icon: '📊', menu: 'status', x: padding, y: padding },
      { icon: '🎒', menu: 'inventory', x: padding + iconSize + padding, y: padding },
      { icon: '📜', menu: 'quests', x: padding + (iconSize + padding) * 2, y: padding },
      { icon: '💰', menu: 'market', x: padding + (iconSize + padding) * 3, y: padding }
    ];

    icons.forEach(({ icon, menu, x, y }) => {
      ctx.fillStyle = gameState.menu === menu ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)';
      drawRoundedRect(ctx, x, y, iconSize, iconSize, 8, ctx.fillStyle, { color: 'white', width: 1 });

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(icon, x + iconSize / 2, y + iconSize / 2);

      addClickable(x, y, iconSize, iconSize, () => {
        onCanvasClick(-999, -999);
        if (gameState.menu === menu) {
          onCanvasClick(-1000, -1000);
        } else {
          onCanvasClick(-1001, -1001, menu as MenuType);
        }
      });
    });

    // Draw menu
    drawMenu(ctx, canvas);

    // Draw dialogue if present
    // Replace the dialogue rendering section in GameCanvas.tsx with this fixed version:

    // Draw dialogue if present
    if (gameState.dialogue) {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Dynamic sizing based on content
      const maxWidth = canvasWidth * 0.85;
      const minHeight = 150;
      const padding = 24;
      const titleLineHeight = 30; // Increased for better spacing
      const textLineHeight = 24;  // Increased for better spacing
      const buttonHeight = 36;
      const buttonSpacing = 10;   // Increased spacing between buttons
      const sectionSpacing = 20;  // Space between title, text, and buttons

      // Pre-calculate text dimensions with proper fonts
      ctx.font = 'bold 18px Noto Sans';
      const titleLines = getWrappedLines(ctx, gameState.dialogue.title, maxWidth - padding * 2, ctx.font);

      ctx.font = '16px Noto Sans';
      const textLines = getWrappedLines(ctx, gameState.dialogue.text, maxWidth - padding * 2, ctx.font);

      // Calculate actual heights needed
      const titleHeight = titleLines.length * titleLineHeight;
      const textHeight = textLines.length * textLineHeight;
      const buttonsHeight = gameState.dialogue.options.length * (buttonHeight + buttonSpacing) - buttonSpacing;

      // Total content height with proper spacing
      const contentHeight = titleHeight + sectionSpacing + textHeight + sectionSpacing + buttonsHeight;
      const boxHeight = Math.max(minHeight, contentHeight + padding * 2);
      const boxWidth = Math.min(maxWidth, Math.max(350, canvasWidth * 0.75)); // Minimum width increased

      // Center the dialogue box
      const boxX = (canvasWidth - boxWidth) / 2;
      const boxY = Math.max(20, (canvasHeight - boxHeight) / 2);

      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw main dialogue box with enhanced styling
      const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
      gradient.addColorStop(0, '#1E293B');
      gradient.addColorStop(1, '#0F172A');

      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 12, gradient, {
        color: '#7C3AED',
        width: 3
      });

      // Add inner shadow effect
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(ctx, boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4, 10, 'rgba(30, 41, 59, 0.8)');
      ctx.restore();

      let currentY = boxY + padding;

      // Draw title with enhanced styling and proper positioning
      ctx.save();
      ctx.shadowColor = 'rgba(167, 139, 250, 0.5)';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 18px Noto Sans';
      ctx.fillStyle = '#A78BFA';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      titleLines.forEach((line, i) => {
        const lineY = currentY + (i * titleLineHeight);
        ctx.fillText(line, boxX + padding, lineY);
      });
      ctx.restore();

      currentY += titleHeight + sectionSpacing;

      // Draw separator line
      const separatorY = currentY - (sectionSpacing / 2);
      const separatorGradient = ctx.createLinearGradient(boxX + padding, separatorY, boxX + boxWidth - padding, separatorY);
      separatorGradient.addColorStop(0, 'rgba(124, 58, 237, 0)');
      separatorGradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.6)');
      separatorGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

      ctx.strokeStyle = separatorGradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boxX + padding, separatorY);
      ctx.lineTo(boxX + boxWidth - padding, separatorY);
      ctx.stroke();

      // Draw text content with proper spacing and positioning
      ctx.save();
      ctx.font = '16px Noto Sans';
      ctx.fillStyle = '#CBD5E1';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      textLines.forEach((line, i) => {
        const lineY = currentY + (i * textLineHeight);
        ctx.fillText(line, boxX + padding, lineY);
      });
      ctx.restore();

      currentY += textHeight + sectionSpacing;

      // Draw buttons with improved layout and no overlap
      gameState.dialogue.options.forEach((option, index) => {
        const btnWidth = boxWidth - padding * 2;
        const btnX = boxX + padding;
        const isLastButton = index === gameState.dialogue.options.length - 1;
        const buttonColor = isLastButton ? '#059669' : '#7C3AED';

        // Check for hover state
        let isHovered = false;
        if (mousePos &&
          mousePos.x >= btnX && mousePos.x <= btnX + btnWidth &&
          mousePos.y >= currentY && mousePos.y <= currentY + buttonHeight
        ) {
          isHovered = true;
        }

        const finalButtonColor = isHovered ? (isLastButton ? '#047857' : '#6D28D9') : buttonColor;

        // Draw button with enhanced styling
        ctx.save();
        if (isHovered) {
          ctx.shadowColor = isLastButton ? 'rgba(5, 150, 105, 0.5)' : 'rgba(124, 58, 237, 0.5)';
          ctx.shadowBlur = 8;
        }

        // Custom button drawing to ensure no text overlap
        drawRoundedRect(ctx, btnX, currentY, btnWidth, buttonHeight, 6, finalButtonColor);

        // Draw button text with proper centering
        ctx.font = 'bold 14px Noto Sans';
        ctx.fillStyle = isHovered ? '#FACC15' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Ensure text fits in button
        const maxTextWidth = btnWidth - 20; // 10px padding on each side
        let buttonText = option.text;
        let textWidth = ctx.measureText(buttonText).width;

        // Truncate text if too long
        while (textWidth > maxTextWidth && buttonText.length > 3) {
          buttonText = buttonText.slice(0, -4) + '...';
          textWidth = ctx.measureText(buttonText).width;
        }

        ctx.fillText(buttonText, btnX + btnWidth / 2, currentY + buttonHeight / 2);

        // Add clickable area
        addClickable(btnX, currentY, btnWidth, buttonHeight, option.action);

        ctx.restore();

        currentY += buttonHeight + buttonSpacing;
      });

      // Add a subtle pulsing border effect for important dialogues
      if (gameState.dialogue.title.includes('Quest') || gameState.dialogue.title.includes('Complete')) {
        ctx.save();
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = Date.now() * 0.01; // Animated dash
        ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
        ctx.restore();
      }
    }
  };

  const handleInteraction = (obj: ObjectData) => {
    const npcData: NPCData = {
      name: obj.name || '',
      type: obj.type || '',
      x: obj.x,
      y: obj.y
    };

    // Handle NPC interactions with unified system
    if (obj.type.startsWith('npc_')) {
      const player = gameState.player;
      const relationshipLevel = player.relationships?.[npcData.name] || 0;
      const dialogue = getNPCDialogue(npcData, player, relationshipLevel);

      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          relationships: {
            ...prev.player.relationships,
            [npcData.name]: (prev.player.relationships[npcData.name] || 0) + 1
          }
        },
        dialogue: {
          title: npcData.name,
          text: dialogue.text,
          options: dialogue.options
        }
      }));
      return;
    }

    // Handle other interactions
    switch (obj.interaction) {
      case 'exit': {
        const currentMapData = MAPS[gameState.currentMap];
        const exitKey = `${Math.floor(obj.x / 32)},${Math.floor(obj.y / 32)}`;
        const exitData = currentMapData.exits?.[exitKey];
        if (exitData) {
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              x: exitData.x * 32,
              y: exitData.y * 32,
              path: []
            },
            currentMap: exitData.to
          }));
        }
        break;
      }
      case 'create_art':
        setGameState(prev => ({ ...prev, menu: 'create_art' }));
        break;
      case 'rest':
        setGameState(prev => ({ ...prev, menu: 'rest' }));
        break;
      case 'buy_coffee':
        setGameState(prev => ({ ...prev, menu: 'buy_coffee' }));
        break;
      case 'buy_supplies':
        setGameState(prev => ({ ...prev, menu: 'buy_supplies' }));
        break;
      case 'talk_npc':
        setGameState(prev => ({ ...prev, menu: 'talk_npc', menuData: npcData }));
        break;
      case 'study':
        setGameState(prev => ({ ...prev, menu: 'study' }));
        break;
      case 'teach_artist':
        setGameState(prev => ({ ...prev, menu: 'teach_artist' }));
        break;
      case 'judge_gallerist':
        setGameState(prev => ({
          ...prev,
          menu: 'judge_gallerist',
          menuData: {
            reputationChange: Math.random() > 0.5 ? 5 : -3,
            sale: Math.random() > 0.7 ? { amount: 200 } : null
          }
        }));
        break;
      case 'shop': {
        // Get shop data from the object
        const shopObject = Object.entries(currentMap.objects).find(([key, o]) => {
          const [oX, oY] = key.split(',').map(Number);
          return oX * TILE_SIZE === obj.x && oY * TILE_SIZE === obj.y;
        });

        if (shopObject) {
          const shopData = shopObject[1].data;
          setGameState(prev => ({
            ...prev,
            menu: 'shop',
            menuData: { shop: shopData }
          }));
        }
        break;
      }
    }
  };

  // Handle pending interactions (like exits)
  useEffect(() => {
    if (gameState.pendingInteraction &&
      gameState.player.x === gameState.pendingInteraction.x &&
      gameState.player.y === gameState.pendingInteraction.y) {
      if (gameState.pendingInteraction.type === 'exit') {
        handleInteraction(gameState.pendingInteraction.data);
      }
      setGameState(prev => ({ ...prev, pendingInteraction: null }));
    }
  }, [gameState.player.x, gameState.player.y, gameState.pendingInteraction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGame(ctx, canvas);
  }, [gameState, currentMap, mousePos]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Don't redraw here - use the current clickable elements
    // drawGame(ctx, canvas);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check UI elements first
    for (const element of uiClickableElementsRef.current) {
      if (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      ) {
        if (typeof element.action === 'function') {
          element.action();
          event.stopPropagation();
          return;
        } else {
          console.error('Clickable element has invalid action:', element);
        }
      }
    }

    // If a menu is open, close it if click is outside the menu box
    if (gameState.menu) {
      const boxWidth = canvas.width * 0.9;
      const boxHeight = canvas.height * 0.85;
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = (canvas.height - boxHeight) / 2;
      if (
        x < boxX ||
        x > boxX + boxWidth ||
        y < boxY ||
        y > boxY + boxHeight
      ) {
        onCanvasClick(-1000, -1000);
        return;
      }
    }

    // Handle game world click
    const camX = gameState.player.x - canvas.width / 2 + TILE_SIZE / 2;
    const camY = gameState.player.y - canvas.height / 2 + TILE_SIZE / 2;
    const clampedCamX = Math.max(0, Math.min(camX, currentMap.width * TILE_SIZE - canvas.width));
    const clampedCamY = Math.max(0, Math.min(camY, currentMap.height * TILE_SIZE - canvas.height));

    const worldX = x + clampedCamX;
    const worldY = y + clampedCamY;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    // Check if clicked on an interactive object
    const clickedObject = Object.entries(currentMap.objects).find(([key, obj]) => {
      const [objTileX, objTileY] = key.split(',').map(Number);
      return objTileX === tileX && objTileY === tileY &&
        ['exit', 'npc', 'shop', 'create_art', 'rest', 'study', 'buy_coffee', 'buy_supplies', 'talk_npc'].includes(obj.interaction);
    });

    if (clickedObject) {
      const [key, obj] = clickedObject;
      const [objX, objY] = key.split(',').map(Number);
      const objectData: ObjectData = {
        interaction: obj.interaction,
        name: obj.name,
        type: obj.type,
        x: objX * TILE_SIZE,
        y: objY * TILE_SIZE
      };

      if (obj.interaction === 'exit') {
        setGameState(prev => ({
          ...prev,
          pendingInteraction: {
            x: objX * TILE_SIZE,
            y: objY * TILE_SIZE,
            type: 'exit',
            data: objectData
          }
        }));
        onCanvasClick(worldX, worldY);
      } else if (obj.type.startsWith('npc_')) {
        handleInteraction(objectData);
      } else {
        onCanvasClick(-1001, -1001, obj.interaction as MenuType);
      }
    } else if (tileX >= 0 && tileX < currentMap.width &&
      tileY >= 0 && tileY < currentMap.height &&
      currentMap.tiles[tileY][tileX] !== 1) {
      onCanvasClick(worldX, worldY);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full cursor-pointer"
    />
  );
};

export default GameCanvas;
