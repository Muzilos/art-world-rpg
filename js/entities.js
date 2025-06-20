// Enhanced game actions for art world
const gameActionMetadata = {
  none: {
    name: 'None',
    parameters: []
  },
  addItemToBackpack: {
    name: 'Add Item to Backpack',
    parameters: [{
      name: 'item',
      type: 'text',
      label: 'Item ID'
    }]
  },
  removeItemFromBackpack: {
    name: 'Remove Item from Backpack',
    parameters: [{
      name: 'item',
      type: 'text',
      label: 'Item ID'
    }]
  },
  hasItem: {
    name: 'Check if Item in Backpack',
    parameters: [{
      name: 'item',
      type: 'text',
      label: 'Item ID'
    }]
  },
  changeQuestState: {
    name: 'Change Quest Status',
    parameters: [
      { name: 'questId', type: 'select', label: 'Quest ID', options: () => Object.keys(gameState.quests) }, // Dynamic options
      { name: 'newState', type: 'select', label: 'New Status', options: ['not_started', 'accepted', 'in_progress', 'completed', 'rewarded'] }
    ]
  },
  gainXp: {
    name: 'Gain Experience Points',
    parameters: [
      {
        name: 'amounts',
        type: 'list(number)',
        label: 'XP Amounts',
        defaultValue: 0
      },
      // skill
      {
        name: 'skills',
        type: 'list(string)',
        label: 'Skills',
        options: [
          'vitality',
          'reputation',
          'strength',
          'dexterity',
          'intelligence',
          'creativity',
          'stealth',
          'speed'
        ]
      }
    ]
  },
  removeEntity: {
    name: 'Remove Entity from Map',
    parameters: [
      { name: 'mapId', type: 'select', label: 'Map ID', options: () => Object.keys(maps) },
      { name: 'entityId', type: 'text', label: 'Entity ID (e.g., chicken)' }
    ]
  },
  boostStat: {
    name: 'Boost Player Stat',
    parameters: [
      { name: 'stat', type: 'select', label: 'Stat Name', options: ['attack', 'defense', 'maxHp', 'hp'] },
      { name: 'amount', type: 'number', label: 'Amount', defaultValue: 0 }
    ]
  },
  showGameSystemHint: {
    name: 'Show Game System Hint',
    parameters: [
      { name: 'message', type: 'textarea', label: 'Message Text' },
      { name: 'nextState', type: 'text', label: 'Next Dialogue State (optional)', defaultValue: 'end' }
    ]
  },
  addMoney: {
    name: 'Add Money',
    parameters: [{
      name: 'amount',
      type: 'number',
      label: 'Amount',
      defaultValue: 0
    }]
  },
  spendMoney: {
    name: 'Spend Money',
    parameters: [{
      name: 'amount',
      type: 'number',
      label: 'Amount',
      defaultValue: 0
    }]
  },
  restoreEnergy: {
    name: 'Restore Energy',
    parameters: [{
      name: 'amount',
      type: 'number',
      label: 'Amount',
      defaultValue: 0
    }]
  },

  customAction: { // For raw JavaScript code input
    name: 'Custom JavaScript',
    parameters: [{
      name: 'code',
      type: 'textarea',
      label: 'Raw JavaScript Code'
    }]
  }
};

const gameActions = {
  gainXp: (amounts, skills) => (currentState) => {
    if (amounts.length !== skills.length) {
      console.error("Error: The 'amounts' and 'skills' arrays must have the same number of elements.");
      return false;
    }

    for (let i = 0; i < amounts.length; i++) {
      const amount = amounts[i];
      const skill = skills[i];

      if (!currentState.player.stats.skills[skill]) {
        console.warn(`Warning: Skill '${skill}' not found in player stats. Skipping XP gain for this skill.`);
        continue;
      }

      currentState.player.stats.skills[skill].xp += amount;
      console.log(`Gained ${amount} XP in ${skill}. Current XP: ${currentState.player.stats.skills[skill].xp}`);

      if (currentState.player.stats.skills[skill].xp >= currentState.player.stats.skills[skill].xpToNextLevel) {
        currentState.player.stats.skills[skill].level++;
        currentState.player.stats.skills[skill].xp -= currentState.player.stats.skills[skill].xpToNextLevel;
        currentState.player.stats.skills[skill].xpToNextLevel = Math.floor(currentState.player.stats.skills[skill].xpToNextLevel * 1.5);

        if (skill === 'endurance') {
          currentState.player.maxEnergy += 10;
          currentState.player.energy = currentState.player.maxEnergy;
        }

        console.log(`Leveled up ${skill} to Level ${currentState.player.stats.skills[skill].level}.`);

        showDialogue({
          id: 'game_system',
          dialogue: {
            'level_up': {
              text: `Your ${skill} skill improved to Level ${currentState.player.stats.skills[skill].level}! You feel more confident in your artistic abilities.`,
              options: [{
                text: "Great!",
                nextState: 'end'
              }]
            }
          },
        }, 'level_up');
      }
    }
    return true;
  },

  addMoney: (amount) => (currentState) => {
    currentState.player.money += amount;
    console.log(`Gained $${amount}. Current money: $${currentState.player.money}`);
    return true;
  },

  spendMoney: (amount) => (currentState) => {
    if (currentState.player.money >= amount) {
      currentState.player.money -= amount;
      console.log(`Spent $${amount}. Remaining money: $${currentState.player.money}`);
      return true;
    } else {
      console.warn(`Not enough money. Need $${amount}, have $${currentState.player.money}`);
      return false;
    }
  },

  restoreEnergy: (amount) => (currentState) => {
    currentState.player.energy = Math.min(currentState.player.maxEnergy, currentState.player.energy + amount);
    console.log(`Restored ${amount} energy. Current energy: ${currentState.player.energy}`);
    return true;
  },

  // Existing actions with updated names
  removeEntity: (mapId, entityId) => (currentState, currentEntities) => {
    if (currentEntities[mapId]) {
      currentEntities[mapId] = currentEntities[mapId].filter(e => e.id !== entityId);
      console.log(`Removed entity '${entityId}' from map '${mapId}'.`);
    } else {
      console.warn(`Map '${mapId}' not found. Cannot remove entity '${entityId}'.`);
    }
    return true;
  },

  addItemToBackpack: (item, quantity = 1) => (currentState) => {
    if (currentState.player.backpack[item]) {
      currentState.player.backpack[item] += quantity;
    } else {
      currentState.player.backpack[item] = quantity;
    }
    console.log(`Added ${quantity}x '${item}' to backpack. Total: ${currentState.player.backpack[item]}`);
    return true;
  },

  removeItemFromBackpack: (item, quantity = 1) => (currentState) => {
    if (!currentState.player.backpack[item] || currentState.player.backpack[item] < quantity) {
      console.warn(`Not enough '${item}' in backpack. Need ${quantity}, have ${currentState.player.backpack[item] || 0}`);
      return false;
    }

    currentState.player.backpack[item] -= quantity;
    if (currentState.player.backpack[item] <= 0) {
      delete currentState.player.backpack[item];
    }

    console.log(`Removed ${quantity}x '${item}' from backpack.`);
    return true;
  },

  hasItem: (item, quantity = 1) => (currentState) => {
    return currentState.player.backpack[item] >= quantity;
  },

  changeQuestState: (questId, newState) => (currentState) => {
    if (currentState.quests.hasOwnProperty(questId)) {
      currentState.quests[questId] = newState;
      console.log(`Quest '${questId}' state changed to '${newState}'.`);
    } else {
      console.warn(`Quest '${questId}' not found. Cannot change state.`);
      return false;
    }
    return true;
  },

  showGameSystemHint: (message, nextState = 'end') => (currentState, currentEntities) => {
    showDialogue({
      id: 'game_system',
      dialogue: {
        'hint': {
          text: message,
          options: [{
            text: "Got it.",
            nextState: nextState
          }]
        }
      }
    }, 'hint');
    return true;
  }
};

// Art World entities with appropriate dialogue and quests
const entities = {
  'art_district': [
    {
      id: 'gallery_owner',
      x: 8,
      y: 8,
      dialogue: {
        'start': {
          text: `Welcome to my gallery! I'm always looking for fresh talent. Would you be interested in creating a portrait commission?`,
          options: [
            {
              text: `I'd love to try!`,
              nextState: 'commission_accepted',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "firstCommission",
                    "newState": "accepted"
                  }
                }
              ]
            },
            {
              text: `I'm not ready yet.`,
              nextState: 'not_ready',
            }
          ]
        },
        'commission_accepted': {
          text: `Excellent! I need a portrait drawing. You'll need good drawing skills and the right materials. The client will pay $50 for quality work.`,
          options: [
            {
              text: `I'll get started right away.`,
              nextState: 'end',
            }
          ]
        },
        'commission_in_progress': {
          text: `How's that portrait coming along? Remember, quality matters for building your reputation.`,
          options: [
            {
              text: `Still working on it.`,
              nextState: 'end',
            }
          ]
        },
        'not_ready': {
          text: `That's fine. Practice your skills and come back when you're more confident. There's an art supply store nearby.`,
          options: [
            {
              text: `Thanks for the advice.`,
              nextState: 'end',
            }
          ]
        },
        'commission_complete': {
          text: `This portrait is fantastic! You have real talent. Here's your payment, and I'd like to discuss a gallery show opportunity.`,
          options: [
            {
              text: `Thank you! I'm interested in the gallery show.`,
              nextState: 'gallery_opportunity',
              actions: [
                {
                  "id": "addMoney",
                  "params": {
                    "amount": 50
                  }
                },
                {
                  "id": "gainXp",
                  "params": {
                    "amounts": [75, 25],
                    "skills": ["drawing", "influence"]
                  }
                },
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "firstCommission",
                    "newState": "rewarded"
                  }
                }
              ]
            }
          ]
        },
        'gallery_opportunity': {
          text: `I host monthly shows for emerging artists. You'll need 3 high-quality pieces to participate. The exposure could launch your career!`,
          options: [
            {
              text: `I'll start preparing my portfolio.`,
              nextState: 'end',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "galleryShow",
                    "newState": "accepted"
                  }
                }
              ]
            }
          ]
        },
        'end': {
          text: `Best of luck with your artistic journey!`,
          options: []
        }
      }
    },
    {
      id: 'supply_store_owner',
      x: 15,
      y: 10,
      dialogue: {
        'start': {
          text: `Welcome to ArtMart! We have everything an artist needs. What can I get you today?`,
          options: [
            {
              text: `I'd like to buy some supplies.`,
              nextState: 'shop_menu',
            },
            {
              text: `Just browsing, thanks.`,
              nextState: 'end',
            }
          ]
        },
        'shop_menu': {
          text: `Here's what we have in stock:\n• Canvas - $5\n• Paper - $1\n• Pencils - $2\n• Paint Brushes - $8\n• Watercolor Set - $15\n• Oil Paint Set - $25\n\nWhat would you like?`,
          options: [
            {
              text: `Canvas ($5)`,
              nextState: 'buy_canvas',
            },
            {
              text: `Paper ($1)`,
              nextState: 'buy_paper',
            },
            {
              text: `Pencils ($2)`,
              nextState: 'buy_pencil',
            },
            {
              text: `Maybe later.`,
              nextState: 'end',
            }
          ]
        },
        'buy_canvas': {
          text: `Great choice! Canvas is essential for serious painting work.`,
          options: [
            {
              text: `Thanks!`,
              nextState: 'end',
              actions: [
                {
                  "id": "spendMoney",
                  "params": {
                    "amount": 5
                  }
                },
                {
                  "id": "addItemToBackpack",
                  "params": {
                    "item": "canvas"
                  }
                }
              ]
            }
          ]
        },
        'buy_paper': {
          text: `Perfect for sketches and practice work!`,
          options: [
            {
              text: `Thanks!`,
              nextState: 'end',
              actions: [
                {
                  "id": "spendMoney",
                  "params": {
                    "amount": 1
                  }
                },
                {
                  "id": "addItemToBackpack",
                  "params": {
                    "item": "paper"
                  }
                }
              ]
            }
          ]
        },
        'buy_pencil': {
          text: `Every artist needs good pencils. These are professional grade!`,
          options: [
            {
              text: `Thanks!`,
              nextState: 'end',
              actions: [
                {
                  "id": "spendMoney",
                  "params": {
                    "amount": 2
                  }
                },
                {
                  "id": "addItemToBackpack",
                  "params": {
                    "item": "pencil"
                  }
                }
              ]
            }
          ]
        },
        'end': {
          text: `Keep creating amazing art!`,
          options: []
        }
      }
    }
  ],
  'coffee_shop': [
    {
      id: 'barista',
      x: 12,
      y: 8,
      dialogue: {
        'start': {
          text: `Welcome to The Creative Grind! Nothing fuels artistic inspiration like good coffee. What can I get you?`,
          options: [
            {
              text: `Coffee please ($3)`,
              nextState: 'buy_coffee',
            },
            {
              text: `Espresso ($4)`,
              nextState: 'buy_espresso',
            },
            {
              text: `Just looking around.`,
              nextState: 'end',
            }
          ]
        },
        'buy_coffee': {
          text: `One coffee coming up! This should give you the energy boost you need for your next masterpiece.`,
          options: [
            {
              text: `Perfect, thanks!`,
              nextState: 'end',
              actions: [
                {
                  "id": "spendMoney",
                  "params": {
                    "amount": 3
                  }
                },
                {
                  "id": "restoreEnergy",
                  "params": {
                    "amount": 20
                  }
                }
              ]
            }
          ]
        },
        'buy_espresso': {
          text: `Double shot espresso! This will definitely keep you going through those long painting sessions.`,
          options: [
            {
              text: `Just what I needed!`,
              nextState: 'end',
              actions: [
                {
                  "id": "spendMoney",
                  "params": {
                    "amount": 4
                  }
                },
                {
                  "id": "restoreEnergy",
                  "params": {
                    "amount": 30
                  }
                }
              ]
            }
          ]
        },
        'end': {
          text: `Enjoy, and may your creativity flow!`,
          options: []
        }
      }
    }
  ],
  'art_studio': [
    {
      id: 'master_artist',
      x: 10,
      y: 10,
      dialogue: {
        'start': {
          text: `Ah, a young artist! I can see the passion in your eyes. Would you like to learn from someone who's been painting for 40 years?`,
          options: [
            {
              text: `Yes, please teach me!`,
              nextState: 'mentorship_accepted',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "mentorQuest",
                    "newState": "accepted"
                  }
                }
              ]
            },
            {
              text: `Maybe another time.`,
              nextState: 'end',
            }
          ]
        },
        'mentorship_accepted': {
          text: `Excellent! First lesson: technique is important, but emotion is everything. Create something that moves people, not just something that looks pretty.`,
          options: [
            {
              text: `I understand. Thank you for the wisdom.`,
              nextState: 'end',
              actions: [
                {
                  "id": "gainXp",
                  "params": {
                    "amounts": [50, 25, 25],
                    "skills": ["creativity", "painting", "drawing"]
                  }
                }
              ]
            }
          ]
        },
        'end': {
          text: `Remember, art is not what you see, but what you make others see.`,
          options: []
        }
      }
    }
  ]
};