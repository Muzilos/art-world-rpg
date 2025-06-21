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

// Adjust gameActionMetadata for dynamic options (quests, skills)
// This is critical for the entity editor to correctly list dynamic options.
gameActionMetadata.changeQuestState.parameters[0].options = () => Object.keys(gameState.quests);

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
  gallery_owner: {
    name: "Gallery Owner",
    x: 8,
    y: 8,
    sprite: "#8b5cf6", // Purple
    dialogue: {
      'start': {
        text: `Welcome to my gallery! I'm always looking for fresh talent. Would you be interested in creating a portrait commission?`,
        options: [{
          text: `I'd love to try!`,
          nextState: 'commission_accepted',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "firstCommission",
              "newState": "accepted"
            }
          }]
        }, {
          text: `I'm not ready yet.`,
          nextState: 'not_ready',
        }]
      },
      'commission_accepted': {
        text: `Excellent! I need a portrait drawing. You'll need good drawing skills and the right materials. The client will pay $50 for quality work.`,
        options: [{
          text: `I'll get started right away.`,
          nextState: 'end',
        }]
      },
      'commission_in_progress': {
        text: `How's that portrait coming along? Remember, quality matters for building your reputation.`,
        options: [{
          text: `Still working on it.`,
          nextState: 'end',
        }]
      },
      'not_ready': {
        text: `That's fine. Practice your skills and come back when you're more confident. There's an art supply store nearby.`,
        options: [{
          text: `Thanks for the advice.`,
          nextState: 'end',
        }]
      },
      'commission_complete': {
        text: `This portrait is fantastic! You have real talent. Here's your payment, and I'd like to discuss a gallery show opportunity.`,
        options: [{
          text: `Thank you! I'm interested in the gallery show.`,
          nextState: 'gallery_opportunity',
          actions: [{
            "id": "addMoney",
            "params": {
              "amount": 50
            }
          }, {
            "id": "gainXp",
            "params": {
              "amounts": [75, 25],
              "skills": ["drawing", "influence"]
            }
          }, {
            "id": "changeQuestState",
            "params": {
              "questId": "firstCommission",
              "newState": "rewarded"
            }
          }]
        }]
      },
      'gallery_opportunity': {
        text: `I host monthly shows for emerging artists. You'll need 3 high-quality pieces to participate. The exposure could launch your career!`,
        options: [{
          text: `I'll start preparing my portfolio.`,
          nextState: 'end',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "galleryShow",
              "newState": "accepted"
            }
          }]
        }]
      },
      'gallery_opportunity_accepted': {
        text: `Glad to hear you're working on your portfolio! Come back when your three pieces are ready.`,
        options: [{
          text: "Will do!",
          nextState: 'end'
        }]
      },
      'end': {
        text: `Best of luck with your artistic journey!`,
        options: []
      }
    },
    dialogueLogic: [{
      conditions: [{
        type: 'questStatus',
        questId: 'firstCommission',
        status: 'rewarded'
      }],
      targetState: 'gallery_opportunity'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'galleryShow',
        status: 'accepted'
      }],
      targetState: 'gallery_opportunity_accepted'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'firstCommission',
        status: 'completed'
      }],
      targetState: 'commission_complete'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'firstCommission',
        status: 'in_progress'
      }],
      targetState: 'commission_in_progress'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'firstCommission',
        status: 'accepted'
      }],
      targetState: 'commission_accepted'
    }, {
      conditions: [],
      targetState: 'start'
    }],
  },
  supply_store_owner: {
    name: "Supply Store Owner",
    x: 15,
    y: 10,
    sprite: "#f59e0b", // Amber
    dialogue: {
      'start': {
        text: `Welcome to ArtMart! We have everything an artist needs. What can I get you today?`,
        options: [{
          text: `I'd like to buy some supplies.`,
          nextState: 'shop_menu',
        }, {
          text: `Just Browse, thanks.`,
          nextState: 'end',
        }]
      },
      'shop_menu': {
        text: `Here's what we have in stock:\n• Canvas - $5\n• Paper - $1\n• Pencils - $2\n• Paint Brushes - $8\n• Watercolor Set - $15\n• Oil Paint Set - $25\n\nWhat would you like?`,
        options: [{
          text: `Canvas ($5)`,
          nextState: 'buy_canvas',
        }, {
          text: `Paper ($1)`,
          nextState: 'buy_paper',
        }, {
          text: `Pencils ($2)`,
          nextState: 'buy_pencil',
        }, {
          text: `Maybe later.`,
          nextState: 'end',
        }]
      },
      'buy_canvas': {
        text: `Great choice! Canvas is essential for serious painting work.`,
        options: [{
          text: `Thanks!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 5
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "canvas"
            }
          }]
        }]
      },
      'buy_paper': {
        text: `Perfect for sketches and practice work!`,
        options: [{
          text: `Thanks!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 1
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "paper"
            }
          }]
        }]
      },
      'buy_pencil': {
        text: `Every artist needs good pencils. These are professional grade!`,
        options: [{
          text: `Thanks!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 2
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "pencil"
            }
          }]
        }]
      },
      'end': {
        text: `Keep creating amazing art!`,
        options: []
      }
    }
  },
  traveler: {
    name: "Traveler",
    x: 3,
    y: 15,
    sprite: "#000000", // Black
    dialogue: {
      'start': {
        text: `Excuse me, traveler! I'm trying to find an old hermit said to live deep in the forest, but I'm lost. Can you help?`,
        options: [{
          text: `I can try to find them.`,
          nextState: 'quest_accepted',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "findHermit",
              "newState": "accepted"
            }
          }]
        }, {
          text: `Sorry, I'm busy.`,
          nextState: 'end',
        }]
      },
      'quest_accepted': {
        text: `Thank you! They say the forest entrance is somewhere to the north, beyond the supply store.`,
        options: [{
          text: `I'll look there.`,
          nextState: 'end',
        }]
      },
      'quest_completed': {
        text: `You found the hermit! Thank you so much. Take this for your troubles.`,
        options: [{
          text: `My pleasure!`,
          nextState: 'end',
          actions: [{
            "id": "addMoney",
            "params": {
              "amount": 25
            }
          }, {
            "id": "gainXp",
            "params": {
              "amounts": [10, 15],
              "skills": ["networking", "influence"]
            }
          }, {
            "id": "changeQuestState",
            "params": {
              "questId": "findHermit",
              "newState": "rewarded"
            }
          }]
        }]
      },
      'end': {
        text: `Farewell!`,
        options: []
      }
    },
    dialogueLogic: [{
      conditions: [{
        type: 'questStatus',
        questId: 'findHermit',
        status: 'rewarded'
      }],
      targetState: 'end'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'findHermit',
        status: 'completed'
      }],
      targetState: 'quest_completed'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'findHermit',
        status: 'accepted'
      }],
      targetState: 'quest_accepted'
    }, {
      conditions: [],
      targetState: 'start'
    }],
  },
  barista: {
    name: "Barista",
    x: 12,
    y: 8,
    sprite: '#8b4513', // Brown
    dialogue: {
      'start': {
        text: `Welcome to The Creative Grind! Nothing fuels artistic inspiration like good coffee. What can I get you?`,
        options: [{
          text: `Coffee please ($3)`,
          nextState: 'buy_coffee',
        }, {
          text: `Espresso ($4)`,
          nextState: 'buy_espresso',
        }, {
          text: `Just looking around.`,
          nextState: 'end',
        }]
      },
      'buy_coffee': {
        text: `One coffee coming up! This should give you the energy boost you need for your next masterpiece.`,
        options: [{
          text: `Perfect, thanks!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 3
            }
          }, {
            "id": "restoreEnergy",
            "params": {
              "amount": 20
            }
          }]
        }]
      },
      'buy_espresso': {
        text: `Double shot espresso! This will definitely keep you going through those long painting sessions.`,
        options: [{
          text: `Just what I needed!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 4
            }
          }, {
            "id": "restoreEnergy",
            "params": {
              "amount": 30
            }
          }]
        }]
      },
      'end': {
        text: `Enjoy, and may your creativity flow!`,
        options: []
      }
    }
  },
  master_artist: {
    name: "Master Artist",
    x: 10,
    y: 10,
    sprite: "#dc2626", // Red
    dialogue: {
      'start': {
        text: `Ah, a young artist! I can see the passion in your eyes. Would you like to learn from someone who's been painting for 40 years?`,
        options: [{
          text: `Yes, please teach me!`,
          nextState: 'mentorship_accepted',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "mentorQuest",
              "newState": "accepted"
            }
          }]
        }, {
          text: `Maybe another time.`,
          nextState: 'end',
        }]
      },
      'mentorship_accepted': {
        text: `Excellent! First lesson: technique is important, but emotion is everything. Create something that moves people, not just something that looks pretty.`,
        options: [{
          text: `I understand. Thank you for the wisdom.`,
          nextState: 'end',
          actions: [{
            "id": "gainXp",
            "params": {
              "amounts": [50, 25, 25],
              "skills": ["creativity", "painting", "drawing"]
            }
          }, {
            "id": "changeQuestState",
            "params": {
              "questId": "mentorQuest",
              "newState": "rewarded"
            }
          }]
        }]
      },
      'mentorship_completed_dialogue': {
        text: `You have learned all I can teach you for now, young artist. Go forth and create your own masterpieces!`,
        options: [{
          text: "Thank you, master!",
          nextState: 'end'
        }]
      },
      'end': {
        text: `Remember, art is not what you see, but what you make others see.`,
        options: []
      }
    },
    dialogueLogic: [{
      conditions: [{
        type: 'questStatus',
        questId: 'mentorQuest',
        status: 'rewarded'
      }],
      targetState: 'mentorship_completed_dialogue'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'mentorQuest',
        status: 'accepted'
      }],
      targetState: 'mentorship_accepted'
    }, {
      conditions: [],
      targetState: 'start'
    }]
  },
  ancient_tree: {
    name: "Ancient Tree",
    x: 20,
    y: 12,
    sprite: "#dc2626", // Brown
    dialogue: {
      'start': {
        text: `This ancient tree pulses with a strange energy. You notice a shimmering pigment at its base.`,
        options: [{
          text: `Collect the pigment.`,
          nextState: 'collected',
          actions: [{
            "id": "addItemToBackpack",
            "params": {
              "item": "rare_pigment"
            }
          }, {
            "id": "changeQuestState",
            "params": {
              "questId": "rarePigment",
              "newState": "completed"
            }
          }]
        }, {
          text: `Leave it be.`,
          nextState: 'end'
        }]
      },
      'collected': {
        text: `You've collected the rare pigment. It feels valuable.`,
        options: [{
          text: "Okay",
          nextState: 'end'
        }]
      },
      'empty': {
        text: `The tree seems to have no more pigment to give for now.`,
        options: [{
          text: "Okay",
          nextState: 'end'
        }]
      },
      'not_eligible': {
        text: `The tree is beautiful, but you don't feel a need to interact with it right now.`,
        options: [{
          text: "Okay",
          nextState: 'end'
        }]
      },
      'end': {
        text: ``,
        options: []
      }
    },
    dialogueLogic: [{
      conditions: [{
        type: 'questStatus',
        questId: 'rarePigment',
        status: 'rewarded'
      }],
      targetState: 'empty'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'rarePigment',
        status: 'completed'
      }, {
        type: 'hasItem',
        itemId: 'rare_pigment'
      }],
      targetState: 'empty'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'rarePigment',
        status: 'completed'
      }],
      targetState: 'empty'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'rarePigment',
        status: 'accepted'
      }],
      targetState: 'start'
    }, {
      conditions: [],
      targetState: 'not_eligible'
    }]
  },
  hermit: {
    name: "Hermit",
    x: 12,
    y: 9,
    dialogue: {
      'start': {
        text: `A visitor? It's been ages. What brings a young artist like you to my quiet abode?`,
        options: [{
          text: `A traveler sent me.`,
          nextState: 'traveler_acknowledgment',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "findHermit",
              "newState": "completed"
            }
          }]
        }, {
          text: `Just exploring.`,
          nextState: 'end'
        }]
      },
      'traveler_acknowledgment': {
        text: `Ah, that old wanderer. So you found me! Now that that's settled, perhaps you can help me with a small task. I need some rare pigment from the deepest part of the forest.`,
        options: [{
          text: `I can help!`,
          nextState: 'pigment_quest_accepted',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "rarePigment",
              "newState": "accepted"
            }
          }]
        }, {
          text: `I'll think about it.`,
          nextState: 'end'
        }]
      },
      'pigment_quest_accepted': {
        text: `The pigment is usually found near ancient trees. Bring it back to me.`,
        options: [{
          text: `Understood.`,
          nextState: 'end'
        }]
      },
      'pigment_quest_completed_ready_to_reward': {
        text: `This is it! The rare azure pigment. Your keen eye and persistence are commendable. Take this ancient brush; it will aid your painting skill.`,
        options: [{
          text: `Thank you, master!`,
          nextState: 'end',
          actions: [{
            "id": "removeItemFromBackpack",
            "params": {
              "item": "rare_pigment"
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "ancient_brush"
            }
          }, {
            "id": "gainXp",
            "params": {
              "amounts": [100, 50],
              "skills": ["painting", "creativity"]
            }
          }, {
            "id": "changeQuestState",
            "params": {
              "questId": "rarePigment",
              "newState": "rewarded"
            }
          }]
        }]
      },
      'end': {
        text: `May your artistic journey be long and fulfilling.`,
        options: []
      }
    },
    dialogueLogic: [{
      conditions: [{
        type: 'questStatus',
        questId: 'rarePigment',
        status: 'rewarded'
      }],
      targetState: 'end'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'rarePigment',
        status: 'completed'
      }, {
        type: 'hasItem',
        itemId: 'rare_pigment'
      }],
      targetState: 'pigment_quest_completed_ready_to_reward'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'rarePigment',
        status: 'accepted'
      }],
      targetState: 'pigment_quest_accepted'
    }, {
      conditions: [{
        type: 'questStatus',
        questId: 'findHermit',
        status: 'completed'
      }],
      targetState: 'traveler_acknowledgment'
    }, {
      conditions: [],
      targetState: 'start'
    }]
  },
  school_receptionist: {
    name: "School Receptionist",
    x: 12,
    y: 8,
    sprite: "#4a90e2", // Blue
    dialogue: {
      'start': {
        text: `Welcome to the New York Art Academy! We offer classes in drawing, painting, and sculpture. Each wing specializes in different techniques.`,
        options: [{
          text: `Tell me about the classes.`,
          nextState: 'class_info',
        }, {
          text: `How do I enroll?`,
          nextState: 'enrollment_info',
        }, {
          text: `Thanks, I'll look around.`,
          nextState: 'end',
        }]
      },
      'class_info': {
        text: `Our drawing classes focus on fundamental techniques and observational skills. Painting classes cover watercolor, oils, and acrylics. Sculpture classes teach clay modeling and casting.`,
        options: [{
          text: `That sounds great!`,
          nextState: 'end',
        }]
      },
      'enrollment_info': {
        text: `Classes are $25 each and provide skill boosts plus valuable supplies. Visit each instructor to sign up for their specific workshops.`,
        options: [{
          text: `I'll check them out.`,
          nextState: 'end',
        }]
      },
      'end': {
        text: `Enjoy exploring our facilities!`,
        options: []
      }
    }
  },

  drawing_instructor: {
    name: "Drawing Instructor",
    x: 12,
    y: 2,
    sprite: "#ff6b35", // Orange
    dialogue: {
      'start': {
        text: `I teach fundamental drawing techniques. My workshop covers line quality, shading, and proportion. Would you like to take my class for $25?`,
        options: [{
          text: `Yes, I'd like to take the class.`,
          nextState: 'take_class',
        }, {
          text: `Maybe later.`,
          nextState: 'end',
        }]
      },
      'take_class': {
        text: `Excellent! Here are some drawing exercises and techniques. Practice makes perfect!`,
        options: [{
          text: `Thank you for the lesson!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 25
            }
          }, {
            "id": "gainXp",
            "params": {
              "amounts": [100],
              "skills": ["drawing"]
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "charcoal"
            }
          }]
        }]
      },
      'end': {
        text: `Keep practicing your drawing skills!`,
        options: []
      }
    }
  },

  painting_instructor: {
    name: "Painting Instructor",
    x: 12,
    y: 6,
    sprite: "#e74c3c", // Red
    dialogue: {
      'start': {
        text: `I specialize in color theory and painting techniques. My workshop will teach you about mixing colors and brush control. Class fee is $25.`,
        options: [{
          text: `I'd love to learn!`,
          nextState: 'take_class',
        }, {
          text: `Not right now.`,
          nextState: 'end',
        }]
      },
      'take_class': {
        text: `Wonderful! Color is the soul of painting. Remember, warm colors advance, cool colors recede. Here are some premium paints!`,
        options: [{
          text: `This is incredibly helpful!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 25
            }
          }, {
            "id": "gainXp",
            "params": {
              "amounts": [100],
              "skills": ["painting"]
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "oil_paint"
            }
          }]
        }]
      },
      'end': {
        text: `Paint with passion!`,
        options: []
      }
    }
  },

  sculpture_instructor: {
    name: "Sculpture Instructor",
    x: 12,
    y: 8,
    sprite: "#795548", // Brown
    dialogue: {
      'start': {
        text: `Sculpture is about bringing life to clay and stone. My workshop covers hand-building and tool techniques. Ready to get your hands dirty for $25?`,
        options: [{
          text: `Absolutely!`,
          nextState: 'take_class',
        }, {
          text: `I'll think about it.`,
          nextState: 'end',
        }]
      },
      'take_class': {
        text: `Excellent! Feel the clay, understand its nature. Sculpture teaches patience and vision. Here are professional sculpting tools!`,
        options: [{
          text: `I can feel the difference already!`,
          nextState: 'end',
          actions: [{
            "id": "spendMoney",
            "params": {
              "amount": 25
            }
          }, {
            "id": "gainXp",
            "params": {
              "amounts": [100],
              "skills": ["sculpting"]
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "sculpting_tools"
            }
          }]
        }]
      },
      'end': {
        text: `Shape your dreams!`,
        options: []
      }
    }
  },

  forest_spirit: {
    name: "Forest Spirit",
    x: 12,
    y: 5,
    sprite: "#00ff7f", // Spring green
    dialogue: {
      'start': {
        text: `The forest whispers of ancient artistry... I sense creative energy within you. The deeper woods hold secrets for those pure of heart.`,
        options: [{
          text: `What kind of secrets?`,
          nextState: 'secrets',
        }, {
          text: `I'm just exploring.`,
          nextState: 'end',
        }]
      },
      'secrets': {
        text: `Natural pigments flow through these woods, and there's a sacred clearing where art comes alive. But only those who respect nature's balance may find them.`,
        options: [{
          text: `I respect nature deeply.`,
          nextState: 'blessing',
          actions: [{
            "id": "gainXp",
            "params": {
              "amounts": [25],
              "skills": ["creativity"]
            }
          }, {
            "id": "restoreEnergy",
            "params": {
              "amount": 30
            }
          }]
        }]
      },
      'blessing': {
        text: `Your spirit is pure. The forest blesses your journey. May your art flourish like the wildflowers.`,
        options: [{
          text: `Thank you, forest spirit.`,
          nextState: 'end'
        }]
      },
      'end': {
        text: `Walk gently, create boldly...`,
        options: []
      }
    }
  },

  nature_artist: {
    name: "Nature Artist",
    x: 12,
    y: 9,
    sprite: "#228b22", // Forest green
    dialogue: {
      'start': {
        text: `I've been painting nature here for decades. This clearing has perfect light and inspiration. The pond reflects colors like nowhere else.`,
        options: [{
          text: `Can you teach me about plein air painting?`,
          nextState: 'teach_plein_air',
        }, {
          text: `It's beautiful here.`,
          nextState: 'end',
        }]
      },
      'teach_plein_air': {
        text: `Painting outdoors teaches you to see light as it truly is - always changing, always alive. Here, take this field easel as a gift.`,
        options: [{
          text: `This is wonderful, thank you!`,
          nextState: 'end',
          actions: [{
            "id": "addItemToBackpack",
            "params": {
              "item": "field_easel"
            }
          }, {
            "id": "gainXp",
            "params": {
              "amounts": [50, 25],
              "skills": ["painting", "creativity"]
            }
          }]
        }]
      },
      'end': {
        text: `Paint what you feel, not just what you see.`,
        options: []
      }
    }
  },

  mystical_easel: {
    name: "Mystical Easel",
    x: 12,
    y: 6,
    sprite: "#9370db", // Medium purple
    dialogue: {
      'start': {
        text: `This ancient easel hums with magical energy. Paintings created here seem to come alive with extraordinary beauty.`,
        options: [{
          text: `Try painting on the mystical easel.`,
          nextState: 'use_easel',
        }, {
          text: `Just admire it.`,
          nextState: 'end'
        }]
      },
      'use_easel': {
        text: `As you paint, the colors seem to glow and dance. Your artwork transcends the ordinary - this is truly magical!`,
        options: [{
          text: `Incredible!`,
          nextState: 'end',
          actions: [{
            "id": "gainXp",
            "params": {
              "amounts": [150, 100],
              "skills": ["creativity", "painting"]
            }
          }, {
            "id": "addItemToBackpack",
            "params": {
              "item": "enchanted_painting"
            }
          }]
        }]
      },
      'end': {
        text: `The easel awaits the next inspired artist...`,
        options: []
      }
    }
  },
  quest_board: {
    name: 'Quest Board',
    x: 20,
    y: 12,
    sprite: "#8b4513", // Brown
    dialogue: {
      'start': {
        text: `📋 COMMUNITY QUEST BOARD 📋\n\n🎨 Art School Tours Available!\n🌲 Forest Expeditions Forming\n✨ Mystical Art Challenges\n🏆 Master Artist Competitions`,
        options: [{
          text: `Take on the Art School Challenge`,
          nextState: 'school_quest',
        }, {
          text: `Accept Forest Exploration Quest`,
          nextState: 'forest_quest',
        }, {
          text: `Try the Mystical Art Challenge`,
          nextState: 'mystical_quest',
        }, {
          text: `Just browsing`,
          nextState: 'end',
        }]
      },
      'school_quest': {
        text: `🏫 ART SCHOOL EXPLORATION: Visit all three studio classrooms and take at least one class. Reward: Advanced supplies and networking boost!`,
        options: [{
          text: `Accept the challenge!`,
          nextState: 'end',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "artSchoolExploration",
              "newState": "accepted"
            }
          }]
        }, {
          text: `Maybe later`,
          nextState: 'start'
        }]
      },
      'forest_quest': {
        text: `🌲 DEEP FOREST EXPEDITION: Explore the forest depths, find the mystical clearing, and discover the hidden grove. Reward: Rare materials and nature's blessing!`,
        options: [{
          text: `I'm ready for adventure!`,
          nextState: 'end',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "forestDepths",
              "newState": "accepted"
            }
          }]
        }, {
          text: `Not today`,
          nextState: 'start'
        }]
      },
      'mystical_quest': {
        text: `✨ MYSTICAL ART CHALLENGE: Create an enchanted artwork using the mystical easel hidden deep in the forest. Reward: ???`,
        options: [{
          text: `Accept the mystical challenge!`,
          nextState: 'end',
          actions: [{
            "id": "changeQuestState",
            "params": {
              "questId": "mysticalArt",
              "newState": "accepted"
            }
          }]
        }, {
          text: `Too mysterious for me`,
          nextState: 'start'
        }]
      },
      'end': {
        text: `Good luck with your artistic journey!`,
        options: []
      }
    }
  }
};