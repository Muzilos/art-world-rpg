// Game actions for art world
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
