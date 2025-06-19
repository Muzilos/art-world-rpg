// --- Common Dialogue/State Actions Abstraction ---
// Define the structure and parameters for each gameAction.
// This serves as the schema for the editor's UI and for parsing/exporting.
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
  customAction: { // For raw JavaScript code input
    name: 'Custom JavaScript',
    parameters: [{
      name: 'code',
      type: 'textarea',
      label: 'Raw JavaScript Code'
    }]
  }
};

// --- Game Actions Definition ---
// This object contains all game actions, which can be executed in the game.
const gameActions = {
  /**
   * Awards XP to the player and handles level-ups.
   * @param {number} amount The amount of XP to gain.
   */
  gainXp: (amounts, skills) => (currentState) => {
    // Ensure amounts and skills have the same length for one-to-one mapping
    if (amounts.length !== skills.length) {
      console.error("Error: The 'amounts' and 'skills' arrays must have the same number of elements.");
      return false; // Indicate failure
    }

    for (let i = 0; i < amounts.length; i++) {
      const amount = amounts[i];
      const skill = skills[i];

      // Check if the skill exists in player.stats to prevent errors
      if (!currentState.player.stats.skills[skill]) {
        console.warn(`Warning: Skill '${skill}' not found in player stats. Skipping XP gain for this skill.`);
        continue; // Skip to the next skill if it doesn't exist
      }

      currentState.player.stats.skills[skill].xp += amount;
      console.log(`Gained ${amount} XP in ${skill}. Current XP: ${currentState.player.stats.skills[skill].xp}`);

      if (currentState.player.stats.skills[skill].xp >= currentState.player.stats.skills[skill].xpToNextLevel) {
        currentState.player.stats.skills[skill].level++;
        currentState.player.stats.skills[skill].xp -= currentState.player.stats.skills[skill].xpToNextLevel;
        currentState.player.stats.skills[skill].xpToNextLevel = Math.floor(currentState.player.stats.skills[skill].xpToNextLevel * 1.5);

        if (skill === 'vitality') {
          // Increase max HP on vitality level-up
          currentState.player.stats.maxHp += 10 * currentState.player.stats.vitality.level;
          currentState.player.stats.hp = currentState.player.stats.maxHp; // Heal to full HP
        }

        console.log(`Leveled up ${skill} to Level ${currentState.player.stats.skills[skill].level}.`);

        // Using showDialogue for level-up notification
        showDialogue({
          id: 'game_system',
          dialogue: {
            'level_up': {
              text: `You leveled up ${skill} to Level ${currentState.player.stats.skills[skill].level}!`,
              options: [{
                text: "Awesome!",
                nextState: 'end'
              }]
            }
          },
        }, 'level_up');
      }
    }
    return true; // Indicate successful XP gain
  },

  /**
   * Removes an entity from a specific map.
   * @param {string} mapId The ID of the map the entity is on.
   * @param {string} entityId The ID of the entity to remove.
   */
  removeEntity: (mapId, entityId) => (currentState, currentEntities) => { // Added parameters for simulation
    if (currentEntities[mapId]) {
      currentEntities[mapId] = currentEntities[mapId].filter(e => e.id !== entityId);
      console.log(`Removed entity '${entityId}' from map '${mapId}'.`);
    }
    else {
      console.warn(`Map '${mapId}' not found. Cannot remove entity '${entityId}'.`);
    }
    return true; // Indicate successful removal
  },

  /**
   * Adds an item to the player's backpack.
   * @param {string} item The name of the item to add.
   */
  addItemToBackpack: (item) => (currentState) => { // Added parameters for simulation
    currentState.player.backpack.push(item);
    console.log(`Added '${item}' to backpack.`);
    return true; // Indicate successful addition
  },

  /**
   * Removes an item from the player's backpack.
   * @param {string} item The name of the item to remove.
   */
  removeItemFromBackpack: (item) => (currentState) => { // Added parameters for simulation
    if (!currentState.player.backpack.includes(item)) {
      console.warn(`Item '${item}' not found in backpack. Cannot remove.`);
      return false; // Indicate failure to remove
    }
    currentState.player.backpack = currentState.player.backpack.filter(i => i !== item);
    console.log(`Removed '${item}' from backpack.`);
    return true; // Indicate successful removal
  },

  /**
   * Changes the state of a quest.
   * @param {string} questId The ID of the quest to change.
   * @param {string} newState The new state for the quest (e.g., 'accepted', 'completed', 'rewarded').
   */
  changeQuestState: (questId, newState) => (currentState) => { // Added parameters for simulation
    if (currentState.quests.hasOwnProperty(questId)) {
      currentState.quests[questId] = newState;
      console.log(`Quest '${questId}' state changed to '${newState}'.`);
    }
    else {
      console.warn(`Quest '${questId}' not found. Cannot change state.`);
      return false; // Indicate failure to change state
    }
    return true; // Indicate successful state change
  },

  /**
   * Applies a stat boost to the player.
   * @param {string} stat The stat to boost (e.g., 'attack', 'defense', 'maxHp').
   * @param {number} amount The amount to increase the stat by.
   */
  boostStat: (stat, amount) => (currentState) => { // Added parameters for simulation
    if (currentState.player.stats.skills.hasOwnProperty(stat)) {
      currentState.player.stats.skills[stat].value += amount;
      console.log(`Player ${stat} increased by ${amount}. New ${stat}: ${currentState.player.stats.skills[stat].value}`);
      return true; // Indicate successful stat boost
    }
    return false; // Indicate failure to boost stat
  },

  /**
   * Displays a game system hint or message.
   * @param {string} message The message to display.
   * @param {string} nextState The next dialogue state after the hint (optional).
   */
  showGameSystemHint: (message, nextState = 'end') => (currentState, currentEntities) => { // Added parameters for simulation
    showDialogue({
      id: 'game_system',
      dialogue: {
        'hint': {
          text: message,
          options: [{
            text: "Okay.",
            nextState: nextState
          }]
        }
      }
    }, 'hint');
    return true; // Indicate successful hint display
  },
};

// Definitions of entities for each map, including their positions and dialogue trees.
// This `entities` object will be the source of truth for the editor, mutable.
const entities = {
  'town': [
    {
      id: 'old_man',
      x: 8,
      y: 8,
      dialogue: {
        'start': {
          text: `Hello, traveler! My prized chicken is missing. Could you find it?`,
          options: [
            {
              text: `Of course!`,
              nextState: 'quest_accepted',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "chickenQuest",
                    "newState": "accepted"
                  }
                }
              ]
            },
            {
              text: `I'm too busy.`,
              nextState: 'quest_rejected',
            }
          ]
        },
        'quest_accepted': {
          text: `Thank you! I believe it's in the forest. It's dangerous there.`,
          options: [
            {
              text: `I'll be back.`,
              nextState: 'end',
            }
          ]
        },
        'quest_in_progress': {
          text: `Still no sign of my chicken?`,
          options: [
            {
              text: `I'm still looking.`,
              nextState: 'end',
            }
          ]
        },
        'quest_rejected': {
          text: `A shame. If you change your mind, I'll be here.`,
          options: [
            {
              text: `Goodbye.`,
              nextState: 'end',
            }
          ]
        },
        'quest_hand_over': {
          text: `You have my chicken! Amazing! May I have him back?`,
          options: [
            {
              text: `Here you go.`,
              nextState: 'quest_rewarded',
              actions: [
                {
                  "id": "removeItemFromBackpack",
                  "params": {
                    "item": "chicken"
                  }
                },
                {
                  "id": "gainXp",
                  "params": {
                    "amounts": [
                      50,
                      100
                    ],
                    "skills": [
                      "vitality",
                      "reputation"
                    ]
                  }
                },
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "chickenQuest",
                    "newState": "rewarded"
                  }
                }
              ]
            }
          ]
        },
        'quest_rewarded': {
          text: `It's good to have him back. Thank you again!`,
          options: [
            {
              text: `Anytime.`,
              nextState: 'end',
            }
          ]
        },
        'end': {
          text: `Farewell.`,
          options: [
          ]
        }
      }
    },
    {
      id: 'merchant',
      x: 15,
      y: 10,
      dialogue: {
        'start': {
          text: `Welcome! I've heard rumors of a magical crystal in the mountains. Interested?`,
          options: [
            {
              text: `Tell me more.`,
              nextState: 'crystal_info',
            },
            {
              text: `Not interested.`,
              nextState: 'end',
            }
          ]
        },
        'crystal_info': {
          text: `The Crystal of Power lies deep in the mountain caves. Bring it to me and I'll reward you handsomely!`,
          options: [
            {
              text: `I'll find it.`,
              nextState: 'quest_accepted',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "crystalQuest",
                    "newState": "accepted"
                  }
                }
              ]
            },
            {
              text: `Too dangerous.`,
              nextState: 'end',
            }
          ]
        },
        'quest_accepted': {
          text: `Excellent! Be careful in those caves.`,
          options: [
            {
              text: `I will.`,
              nextState: 'end',
            }
          ]
        },
        'quest_in_progress': {
          text: `Any luck finding the crystal?`,
          options: [
            {
              text: `Still searching.`,
              nextState: 'end',
            }
          ]
        },
        'quest_hand_over': {
          text: `The Crystal of Power! Magnificent! Here's your reward.`,
          options: [
            {
              text: `Thank you.`,
              nextState: 'quest_rewarded',
              actions: [
                {
                  "id": "removeItemFromBackpack",
                  "params": {
                    "item": "crystal"
                  }
                },
                {
                  "id": "gainXp",
                  "params": {
                    "amounts": [
                      100,
                      50
                    ],
                    "skills": [
                      "intelligence",
                      "creativity"
                    ]
                  }
                },
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "crystalQuest",
                    "newState": "rewarded"
                  }
                }
              ]
            }
          ]
        },
        'quest_rewarded': {
          text: `Pleasure doing business with you!`,
          options: [
            {
              text: `Likewise.`,
              nextState: 'end',
            }
          ]
        },
        'end': {
          text: `Safe travels!`,
          options: [
          ]
        }
      }
    }
  ],
  'forest': [
    {
      id: 'chicken',
      x: 18,
      y: 15,
      dialogue: {
        'start': {
          text: `Bawk bawk! The chicken looks lost.`,
          options: [
            {
              text: `Put the chicken in your backpack.`,
              nextState: 'end',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "chickenQuest",
                    "newState": "completed"
                  }
                },
                {
                  "id": "addItemToBackpack",
                  "params": {
                    "item": "chicken"
                  }
                },
                {
                  "id": "removeEntity",
                  "params": {
                    "mapId": "forest",
                    "entityId": "chicken"
                  }
                }
              ]
            },
            {
              text: `Leave the chicken.`,
              nextState: 'end',
            }
          ]
        },
        'end': {
          text: `Bawk.`,
          options: [
          ]
        }
      }
    }
  ],
  'mountain_cave': [
    {
      id: 'crystal',
      x: 12,
      y: 8,
      dialogue: {
        'start': {
          text: `A brilliant crystal pulses with magical energy.`,
          options: [
            {
              text: `Take the crystal.`,
              nextState: 'end',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "crystalQuest",
                    "newState": "completed"
                  }
                },
                {
                  "id": "addItemToBackpack",
                  "params": {
                    "item": "crystal"
                  }
                },
                {
                  "id": "removeEntity",
                  "params": {
                    "mapId": "mountain_cave",
                    "entityId": "crystal"
                  }
                }
              ]
            },
            {
              text: `Leave it alone.`,
              nextState: 'end',
            }
          ]
        },
        'end': {
          text: `The crystal hums softly.`,
          options: [
          ]
        }
      }
    }
  ],
  'hidden_grotto': [
    {
      id: 'mysterious_figure',
      x: 10,
      y: 10,
      dialogue: {
        'start': {
          text: `A cloaked figure stands silently. They drop a dusty note as you approach.`,
          options: [
            {
              text: `Pick up the note.`,
              nextState: 'note_found',
              actions: [
                {
                  "id": "addItemToBackpack",
                  "params": {
                    "item": "mysterious_note"
                  }
                },
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "mysteriousNoteQuest",
                    "newState": "accepted"
                  }
                }
              ]
            },
            {
              text: `Leave them be.`,
              nextState: 'end',
            }
          ]
        },
        'note_found': {
          text: `The note reads: 'Seek the Ancient Tablet in the forgotten shrine. Only then will the truth be revealed.'`,
          options: [
            {
              text: `What shrine?`,
              nextState: 'shrine_question',
            },
            {
              text: `This is cryptic.`,
              nextState: 'end',
            }
          ]
        },
        'shrine_question': {
          text: `The figure merely points vaguely towards the east, then vanishes into thin air.`,
          options: [
            {
              text: `They vanished!`,
              nextState: 'end',
              actions: [
                {
                  "id": "changeQuestState",
                  "params": {
                    "questId": "mysteriousNoteQuest",
                    "newState": "in_progress"
                  }
                },
                {
                  "id": "removeEntity",
                  "params": {
                    "mapId": "hidden_grotto",
                    "entityId": "mysterious_figure"
                  }
                },
                {
                  "id": "showGameSystemHint",
                  "params": {
                    "message": "A new path seems to have opened in the eastern forest... perhaps leading to a shrine?",
                    "nextState": "end"
                  }
                }
              ]
            }
          ]
        },
        'quest_rewarded': {
          text: `You feel a strange energy in the air, as if the shrine's power has been awakened.`,
          options: [
            {
              text: `My work here is done.`,
              nextState: 'end',
              actions: [
                {
                  "id": "removeEntity",
                  "params": {
                    "mapId": "hidden_grotto",
                    "entityId": "mysterious_figure"
                  }
                }
              ]
            }
          ]
        },
        'quest_in_progress': {
          text: `The space where the figure once stood feels cold. You recall the note's words about the Ancient Tablet.`,
          options: [
            {
              text: `I must find that shrine.`,
              nextState: 'end',
            }
          ]
        },
        'end': {
          text: `Silence returns to the grotto.`,
          options: [
          ]
        }
      }
    }
  ]
};