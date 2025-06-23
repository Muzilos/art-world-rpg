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
    }, {
      name: 'quantity',
      type: 'number',
      label: 'Quantity',
      defaultValue: 1
    }]
  },
  removeItemFromBackpack: {
    name: 'Remove Item from Backpack',
    parameters: [{
      name: 'item',
      type: 'text',
      label: 'Item ID'
    }, {
      name: 'quantity',
      type: 'number',
      label: 'Quantity',
      defaultValue: 1
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
          'drawing', // Updated to match gameState.skills
          'painting', // Updated to match gameState.skills
          'sculpting', // Updated to match gameState.skills
          'endurance', // Updated to match gameState.skills
          'influence', // Updated to match gameState.skills
          'creativity', // Updated to match gameState.skills
          'networking', // Updated to match gameState.skills
          'business', // Updated to match gameState.skills
          'observation', // Added for completeness, if it exists in skillAbbreviations
          'patience' // Added for completeness, if it exists in skillAbbreviations
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
      { name: 'stat', type: 'select', label: 'Stat Name', options: ['hp', 'maxHp', 'energy', 'maxEnergy'] }, // Relevant player stats
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
gameActionMetadata.gainXp.parameters[1].options = () => Object.keys(gameState.player.stats.skills); // Make skill options dynamic
gameActionMetadata.removeEntity.parameters[0].options = () => Object.keys(maps);


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
      showGameMessage(`You gained ${amount} XP in ${skill}!`, 'info');

      if (currentState.player.stats.skills[skill].xp >= currentState.player.stats.skills[skill].xpToNextLevel) {
        currentState.player.stats.skills[skill].level++;
        currentState.player.stats.skills[skill].xp -= currentState.player.stats.skills[skill].xpToNextLevel;
        currentState.player.stats.skills[skill].xpToNextLevel = Math.floor(currentState.player.stats.skills[skill].xpToNextLevel * 1.5);

        if (skill === 'endurance') {
          currentState.player.maxEnergy += 10;
          currentState.player.energy = currentState.player.maxEnergy;
        }

        showGameMessage(`Your ${skillAbbreviations[skill].abbr} skill improved to Level ${currentState.player.stats.skills[skill].level}!`, 'success');
      }
    }
    return true;
  },

  addMoney: (amount) => (currentState) => {
    currentState.player.money += amount;
    showGameMessage(`Gained $${amount}. Current money: $${currentState.player.money}`, 'success');
    return true;
  },

  spendMoney: (amount) => (currentState) => {
    if (currentState.player.money >= amount) {
      currentState.player.money -= amount;
      showGameMessage(`Spent $${amount}. Remaining money: $${currentState.player.money}`, 'info');
      return true;
    } else {
      showGameMessage(`Not enough money. Need $${amount}, have $${currentState.player.money}`, 'error');
      return false;
    }
  },

  restoreEnergy: (amount) => (currentState) => {
    currentState.player.energy = Math.min(currentState.player.maxEnergy, currentState.player.energy + amount);
    showGameMessage(`Restored ${amount} energy. Current energy: ${currentState.player.energy}`, 'success');
    return true;
  },

  // Existing actions with updated names
  removeEntity: (mapId, entityId) => (currentState, currentEntities) => {
    const map = maps[mapId];
    if (map && map.entities) {
      map.entities = map.entities.filter(e => e.id !== entityId);
      showGameMessage(`Removed entity '${entityId}' from map '${mapId}'.`, 'info');
    } else {
      showGameMessage(`Map '${mapId}' not found or has no entities. Cannot remove entity '${entityId}'.`, 'warning');
    }
    return true;
  },

  addItemToBackpack: (item, quantity = 1) => (currentState) => {
    if (currentState.player.backpack[item]) {
      currentState.player.backpack[item] += quantity;
    } else {
      currentState.player.backpack[item] = quantity;
    }
    showGameMessage(`Added ${quantity}x '${item}' to backpack. Total: ${currentState.player.backpack[item]}`, 'success');
    return true;
  },

  removeItemFromBackpack: (item, quantity = 1) => (currentState) => {
    if (!currentState.player.backpack[item] || currentState.player.backpack[item] < quantity) {
      showGameMessage(`Not enough '${item}' in backpack. Need ${quantity}, have ${currentState.player.backpack[item] || 0}`, 'error');
      return false;
    }

    currentState.player.backpack[item] -= quantity;
    if (currentState.player.backpack[item] <= 0) {
      delete currentState.player.backpack[item];
    }

    showGameMessage(`Removed ${quantity}x '${item}' from backpack.`, 'info');
    return true;
  },

  hasItem: (item, quantity = 1) => (currentState) => {
    return currentState.player.backpack[item] >= quantity;
  },

  changeQuestState: (questId, newState) => (currentState) => {
    if (currentState.quests.hasOwnProperty(questId)) {
      currentState.quests[questId] = newState;
      showGameMessage(`Quest '${questId}' state changed to '${newState}'.`, 'info');
    } else {
      showGameMessage(`Quest '${questId}' not found. Cannot change state.`, 'warning');
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
