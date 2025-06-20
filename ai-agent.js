// === UTILITY FUNCTIONS FOR AI AGENT (static methods) ===

// Helper function to escape backticks within strings to prevent syntax errors when nesting template literals
function escapeBackticksForCode(str) {
  if (typeof str === 'string') {
    return str.replace(/`/g, '\\`');
  }
  return str;
}

// Recursive function to process dialogue nodes and escape backticks in all text fields
function processDialogueNodeForSerialization(node) {
  if (node && typeof node === 'object') {
    // Process text field in the current node
    if (node.text) {
      node.text = escapeBackticksForCode(node.text);
    }
    // Process options, which also have text fields
    if (node.options && Array.isArray(node.options)) {
      node.options.forEach(option => {
        if (option.text) {
          option.text = escapeBackticksForCode(option.text);
        }
        // Recursively process nextState if it refers to another dialogue node within the same entity
        // (This is a simplified check, adjust if your dialogue structure is more complex and deeply nested)
        // For the current game structure, options directly link to nextState, not nested dialogue objects here.
      });
    }
    // No need to recurse into 'actions' as they typically contain function calls or data, not free text for display.
  }
}

// AI Agent for Art World RPG - Fixed Version
class AIGameAgent {
  constructor() {
    this.memory = {
      visitedLocations: new Set(),
      completedInteractions: new Set(),
      knownNPCs: new Map(),
      exploredMaps: new Set(),
      questProgress: {},
      lastActions: [],
      stuckCounter: 0,
      progressHistory: []
    };

    this.emotionalState = {
      boredom: 0,
      frustration: 0,
      curiosity: 100,
      satisfaction: 50
    };

    this.goals = {
      increaseMoney: { priority: 0.8, progress: 0 },
      increaseSkills: { priority: 0.7, progress: 0 },
      exploreWorld: { priority: 0.6, progress: 0 },
      completeQuests: { priority: 0.9, progress: 0 }
    };

    this.config = {
      actionDelay: 200, // Increased delay for stability
      boredomThreshold: 85,
      frustrationThreshold: 85,
      memoryWindowSize: 20
    };

    this.isRunning = false;
    this.actionQueue = [];
  }

  // === PERCEPTION SYSTEM ===
  perceiveGameState() {
    try {
      // Ensure gameState exists
      if (typeof gameState === 'undefined') {
        console.error('[AI Agent] gameState is undefined');
        return null;
      }

      const perception = {
        player: {
          position: { x: gameState.player.x, y: gameState.player.y },
          money: gameState.player.money || 0,
          energy: gameState.player.energy || 0,
          skills: JSON.parse(JSON.stringify(gameState.player.stats.skills || {})),
          backpack: { ...(gameState.player.backpack || {}) }
        },
        currentMap: gameState.currentMap,
        npcs: this.perceiveNPCs(),
        transitions: this.perceiveTransitions(),
        interactables: [],
        quests: { ...(gameState.quests || {}) }
      };

      // Calculate interactables after basic perception
      perception.interactables = this.perceiveInteractables(perception);

      return perception;
    } catch (error) {
      console.error('[AI Agent] Perception error:', error);
      return null;
    }
  }

  perceiveNPCs() {
    try {
      if (typeof entities === 'undefined' || !entities[gameState.currentMap]) {
        return [];
      }

      const currentMapEntities = entities[gameState.currentMap] || [];
      return currentMapEntities.map(npc => ({
        id: npc.id,
        position: { x: npc.x, y: npc.y },
        distance: this.calculateDistance(gameState.player, npc)
      }));
    } catch (error) {
      console.error('[AI Agent] NPC perception error:', error);
      return [];
    }
  }

  perceiveTransitions() {
    try {
      if (typeof maps === 'undefined' || !maps[gameState.currentMap]) {
        return [];
      }

      const map = maps[gameState.currentMap];
      return (map.transitions || []).map(t => ({
        position: { x: t.x, y: t.y },
        targetMap: t.targetMap,
        distance: this.calculateDistance(gameState.player, t)
      }));
    } catch (error) {
      console.error('[AI Agent] Transition perception error:', error);
      return [];
    }
  }

  perceiveInteractables(perception) {
    const interactables = [];

    try {
      // NPCs within interaction range
      perception.npcs.forEach(npc => {
        if (this.isAdjacent(gameState.player, npc.position)) {
          interactables.push({ type: 'npc', ...npc });
        }
      });

      // Transitions at current position
      perception.transitions.forEach(t => {
        if (gameState.player.x === t.position.x && gameState.player.y === t.position.y) {
          interactables.push({ type: 'transition', ...t });
        }
      });
    } catch (error) {
      console.error('[AI Agent] Interactables perception error:', error);
    }

    return interactables;
  }
  // === DECISION MAKING ===
  async makeDecision() {
    try {
      const perception = this.perceiveGameState();
      if (!perception) {
        this.emotionalState.frustration = Math.min(100, this.emotionalState.frustration + 5);
        return;
      }

      this.updateEmotionalState(perception);
      this.updateGoalProgress(perception);

      // Check if we should modify the game
      if (this.shouldModifyGame()) {
        await this.modifyGameWorld();
        return;
      }

      // Wait if dialogue is open
      if (this.isDialogueOpen()) {
        await this.sleep(500);
        return;
      }

      // Decide on next action
      const action = this.selectBestAction(perception);
      if (action) {
        this.executeAction(action);
        this.memory.lastActions.push(action);
        if (this.memory.lastActions.length > this.config.memoryWindowSize) {
          this.memory.lastActions.shift();
        }
      }
    } catch (error) {
      console.error('[AI Agent] Decision error:', error);
      this.emotionalState.frustration = Math.min(100, this.emotionalState.frustration + 10);
    }
  }

  selectBestAction(perception) {
    const possibleActions = this.generatePossibleActions(perception);

    if (possibleActions.length === 0) {
      this.emotionalState.frustration = Math.min(100, this.emotionalState.frustration + 5);
      return null;
    }

    // Score each action based on goals and curiosity
    const scoredActions = possibleActions.map(action => {
      let score = Math.random() * 10; // Base randomness

      // Goal-based scoring
      if (action.type === 'interact_npc') {
        score += this.goals.completeQuests.priority * 30;
        const interactionKey = `${gameState.currentMap}:${action.target.id}`;
        if (!this.memory.completedInteractions.has(interactionKey)) {
          score += this.emotionalState.curiosity * 0.5;
        }
      } else if (action.type === 'explore') {
        score += this.goals.exploreWorld.priority * 20;
        if (!this.memory.exploredMaps.has(action.targetMap)) {
          score += this.emotionalState.curiosity * 0.8;
        }
      } else if (action.type === 'move') {
        // Prefer unexplored areas
        const locationKey = `${gameState.currentMap}:${action.target.x},${action.target.y}`;
        if (!this.memory.visitedLocations.has(locationKey)) {
          score += 15;
        } else if (action.type === 'craft') {
          // High priority for crafting if it helps complete quests or increase skills
          const recipe = gameState.crafting.availableRecipes.find(r => r.id === action.target);
          if (recipe) {
            // Boost if crafting leads to quest completion
            // This would require more advanced quest parsing, but for now, prioritize if skill is needed
            if (this.goals.increaseSkills.progress < 100 && recipe.skill) {
              score += this.goals.increaseSkills.priority * 40; // High score for skill progression
            }
            // Prioritize if boredom is high (gives player something to do)
            score += this.emotionalState.boredom * 0.2;
          }
        }
      }

      // Avoid repetitive actions
      const recentSimilar = this.memory.lastActions.filter(a =>
        a.type === action.type &&
        a.target?.id === action.target?.id &&
        a.target?.x === action.target?.x &&
        a.target?.y === action.target?.y
      ).length;
      score -= recentSimilar * 15;

      return { action, score };
    });

    // Select action with highest score (with some randomness)
    scoredActions.sort((a, b) => b.score - a.score);
    const topActions = scoredActions.slice(0, Math.min(3, scoredActions.length));

    if (topActions.length === 0) return null;

    const selected = topActions[Math.floor(Math.random() * topActions.length)];
    return selected.action;
  }

  generatePossibleActions(perception) {
    const actions = [];

    try {
      // Interact with adjacent NPCs
      perception.interactables.forEach(item => {
        if (item.type === 'npc') {
          actions.push({
            type: 'interact_npc',
            target: item,
            description: `Talk to ${item.id}`
          });
        } else if (item.type === 'transition') {
          actions.push({
            type: 'explore',
            targetMap: item.targetMap,
            description: `Go to ${item.targetMap}`
          });
        }
      });

      // Move to NPCs
      perception.npcs.forEach(npc => {
        if (!this.isAdjacent(gameState.player, npc.position)) {
          actions.push({
            type: 'move',
            target: npc.position,
            purpose: 'interact_npc',
            description: `Move to ${npc.id}`
          });
        }
      });

      // Move to transitions
      perception.transitions.forEach(t => {
        if (gameState.player.x !== t.position.x || gameState.player.y !== t.position.y) {
          actions.push({
            type: 'move',
            target: t.position,
            purpose: 'explore',
            description: `Move to ${t.targetMap} entrance`
          });
        }
      });
      try {
        // Add crafting actions
        if (typeof gameState !== 'undefined' && gameState.crafting && gameState.crafting.availableRecipes) {
          gameState.crafting.availableRecipes.forEach(recipe => {
            const craftCheck = canCraft(recipe.id); // Call canCraft from crafting.js
            if (craftCheck.canCraft) {
              actions.push({
                type: 'craft',
                target: recipe.id,
                description: `Craft ${recipe.name}`
              });
            }
          });
        }
      } catch (error) {
        console.error('[AI Agent] Crafting action generation error:', error);
      }

      // Random exploration (reduced frequency)
      if (Math.random() < 0.1) {
        const map = maps[gameState.currentMap];
        const randomX = Math.floor(Math.random() * (map.width || 20));
        const randomY = Math.floor(Math.random() * (map.height || 15));
        actions.push({
          type: 'move',
          target: { x: randomX, y: randomY },
          purpose: 'explore',
          description: 'Random exploration'
        });
      }
    } catch (error) {
      console.error('[AI Agent] Action generation error:', error);
    }

    return actions;
  }

  executeAction(action) {
    console.log(`[AI Agent] Executing: ${action.description}`);

    try {
      switch (action.type) {
        case 'move':
          // Only click if the player is not currently on a path
          if (gameState.player.path.length === 0) { //
            this.clickCanvas(action.target.x, action.target.y);
            const locationKey = `${gameState.currentMap}:${action.target.x},${action.target.y}`; //
            this.memory.visitedLocations.add(locationKey);
          } else {
            console.log('[AI Agent] Player is already in motion, deferring new move.');
          }
          break;

        case 'interact_npc':
          this.clickCanvas(action.target.position.x, action.target.position.y);
          const interactionKey = `${gameState.currentMap}:${action.target.id}`; //
          this.memory.completedInteractions.add(interactionKey);
          this.memory.knownNPCs.set(action.target.id, {
            location: gameState.currentMap, //
            position: action.target.position
          });
          break;

        case 'explore':
          // Click on transition
          const transition = maps[gameState.currentMap].transitions.find( //
            t => t.targetMap === action.targetMap
          );
          if (transition) {
            this.clickCanvas(transition.x, transition.y);
            this.memory.exploredMaps.add(action.targetMap);
          }
          break;

        case 'craft':
          // Call the crafting function from crafting.js
          if (typeof startCrafting === 'function') {
            startCrafting(action.target);
            console.log(`[AI Agent] Initiated crafting of ${action.target}`);
          } else {
            console.error('[AI Agent] startCrafting function not found.');
          }
          break;
      }
    } catch (error) {
      console.error('[AI Agent] Action execution error:', error);
      this.emotionalState.frustration = Math.min(100, this.emotionalState.frustration + 5);
    }
  }

  // === EMOTIONAL STATE ===
  updateEmotionalState(perception) {
    // Check if stuck
    const isStuck = this.detectIfStuck();
    if (isStuck) {
      this.emotionalState.frustration = Math.min(100, this.emotionalState.frustration + 5);
      this.memory.stuckCounter++;
    } else {
      this.memory.stuckCounter = Math.max(0, this.memory.stuckCounter - 1);
      this.emotionalState.frustration = Math.max(0, this.emotionalState.frustration - 2);
    }

    // Check progress
    const progressMade = this.detectProgress(perception);
    if (progressMade) {
      this.emotionalState.satisfaction = Math.min(100, this.emotionalState.satisfaction + 10);
      this.emotionalState.boredom = Math.max(0, this.emotionalState.boredom - 5);
    } else {
      this.emotionalState.boredom = Math.min(100, this.emotionalState.boredom + 2);
      this.emotionalState.satisfaction = Math.max(0, this.emotionalState.satisfaction - 3);
    }

    // Update curiosity based on new discoveries
    const newDiscoveries = this.countNewDiscoveries();
    this.emotionalState.curiosity = Math.max(0, Math.min(100,
      this.emotionalState.curiosity - 1 + (newDiscoveries * 5)
    ));

    // Log emotional state occasionally
    if (Math.random() < 0.05) {
      console.log('[AI Agent] Emotional state:', this.emotionalState);
    }
  }

  detectIfStuck() {
    if (this.memory.lastActions.length < 5) return false;

    // Check for repetitive actions
    const recentActions = this.memory.lastActions.slice(-5);
    const uniqueActions = new Set(recentActions.map(a =>
      `${a.type}:${a.target?.x || ''}:${a.target?.y || ''}:${a.target?.id || ''}`
    ));

    return uniqueActions.size < 3;
  }

  detectProgress(perception) {
    try {
      const currentStats = {
        money: perception.player.money || 0,
        totalXP: Object.values(perception.player.skills || {}).reduce((sum, skill) =>
          sum + (skill.xp || 0) + ((skill.level || 0) * 100), 0
        ),
        questsCompleted: Object.values(perception.quests || {}).filter(q =>
          q === 'completed' || q === 'rewarded'
        ).length
      };

      this.memory.progressHistory.push(currentStats);
      if (this.memory.progressHistory.length > 10) {
        this.memory.progressHistory.shift();
      }

      if (this.memory.progressHistory.length < 2) return false;

      const oldStats = this.memory.progressHistory[0];
      return (
        currentStats.money > oldStats.money ||
        currentStats.totalXP > oldStats.totalXP ||
        currentStats.questsCompleted > oldStats.questsCompleted
      );
    } catch (error) {
      console.error('[AI Agent] Progress detection error:', error);
      return false;
    }
  }

  shouldModifyGame() {
    return (
      this.emotionalState.boredom > this.config.boredomThreshold ||
      this.emotionalState.frustration > this.config.frustrationThreshold ||
      (this.memory.stuckCounter > 10 && this.emotionalState.curiosity < 30)
    );
  }

  // === GAME MODIFICATION ===
  async modifyGameWorld() {
    console.log('[AI Agent] Modifying game world due to:', {
      boredom: this.emotionalState.boredom,
      frustration: this.emotionalState.frustration,
      stuckCounter: this.memory.stuckCounter
    });

    const modifications = [];

    // Decide what to modify based on emotional state
    if (this.emotionalState.boredom > this.emotionalState.frustration) {
      // Add new content
      modifications.push(this.generateNewMap());
      modifications.push(this.generateNewNPC());
      modifications.push(this.generateNewQuest());
    } else {
      // Make existing content easier/more rewarding
      modifications.push(this.modifyShopPrices());
      modifications.push(this.addEnergyRestorePoints());
      modifications.push(this.simplifyQuests());
    }

    // Apply modifications
    for (const mod of modifications) {
      if (mod) {
        await this.applyModification(mod);
      }
    }

    // Reset emotional state
    this.emotionalState = {
      boredom: 0,
      frustration: 0,
      curiosity: 100,
      satisfaction: 50
    };

    // Reset memory of stuck state
    this.memory.stuckCounter = 0;

    // Reload the game
    setTimeout(() => {
      console.log('[AI Agent] Reloading game with modifications...');
      window.location.reload();
    }, 1000);
  }

  generateNewMap() {
    const mapNames = ['museum', 'park', 'abandoned_studio', 'art_school'];
    const newMapName = mapNames[Math.floor(Math.random() * mapNames.length)];

    const mapCode = `
// AI Generated Map: ${newMapName}
maps['${newMapName}'] = {
  width: 20, height: 15,
  tiles: [
    ${this.generateRandomTiles(20, 15).join(', ')}
  ],
  transitions: [
    { x: 10, y: 14, targetMap: 'art_district', targetX: 15, targetY: 15 }
  ]
};

// Add transition from art_district to new map
maps['art_district'].transitions.push({
  x: 15, y: 15, targetMap: '${newMapName}', targetX: 10, targetY: 14
});`;

    return {
      type: 'map',
      file: 'js/maps.js',
      code: mapCode,
      description: `Added new map: ${newMapName}`
    };
  }

  generateRandomTiles(width, height) {
    const tiles = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Borders
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          tiles.push(1);
        } else {
          // Random walkable or obstacle
          tiles.push(Math.random() < 0.8 ? 0 : 2);
        }
      }
    }
    return tiles;
  }

  generateNewNPC() {
    const npcTypes = [
      { id: 'art_critic', role: 'Provides feedback on artworks' },
      { id: 'collector', role: 'Buys rare artworks for high prices' },
      { id: 'student', role: 'Seeks mentorship' },
      { id: 'rival_artist', role: 'Competitive challenges' }
    ];

    const npc = npcTypes[Math.floor(Math.random() * npcTypes.length)];
    const dialogue = this.generateNPCDialogue(npc);

    const code = `
// AI Generated NPC: ${npc.id}
if (!entities['art_district']) entities['art_district'] = [];
entities['art_district'].push({
  id: '${npc.id}',
  x: ${10 + Math.floor(Math.random() * 5)},
  y: ${10 + Math.floor(Math.random() * 5)},
  dialogue: ${JSON.stringify(dialogue, null, 2)}
});`;

    return {
      type: 'npc',
      file: 'js/entities.js',
      code: code,
      description: `Added new NPC: ${npc.id}`
    };
  }

  generateNPCDialogue(npc) {
    const templates = {
      art_critic: {
        start: {
          text: "I review artworks for the city's premier magazine. Show me your best piece!",
          options: [
            {
              text: "Here's my latest work",
              nextState: "review"
            },
            {
              text: "Not ready yet",
              nextState: "end"
            }
          ]
        },
        review: {
          text: "Impressive technique! This deserves recognition. Here's a bonus for your talent.",
          options: [{
            text: "Thank you!",
            nextState: "end",
            actions: [
              { id: "addMoney", params: { amount: 100 } },
              { id: "gainXp", params: { amounts: [50], skills: ["painting"] } }
            ]
          }]
        },
        end: { text: "Keep creating!", options: [] }
      },
      collector: {
        start: {
          text: "I collect unique artworks. Do you have anything special?",
          options: [
            {
              text: "I have this oil painting",
              nextState: "offer"
            },
            {
              text: "Not at the moment",
              nextState: "end"
            }
          ]
        },
        offer: {
          text: "Magnificent! I'll pay triple the usual price for this.",
          options: [{
            text: "Deal!",
            nextState: "end",
            actions: [
              { id: "addMoney", params: { amount: 450 } }
            ]
          }]
        },
        end: { text: "Come back when you have more art!", options: [] }
      },
      // You can add more templates here for student, rival_artist etc.
      // Make sure all 'text' fields in all templates are properly escaped.
      student: {
        start: {
          text: "I'm a new art student, always looking for inspiration and advice. Do you have any tips for a beginner?",
          options: [
            { text: "Practice daily with your sketchbook!", nextState: "advice1" },
            { text: "Try experimenting with different mediums.", nextState: "advice2" }
          ]
        },
        advice1: {
          text: "That's great advice! I'll make sure to carry my sketchbook everywhere.",
          options: [{ text: "Good luck!", nextState: "end" }]
        },
        advice2: {
          text: "Interesting! I've been sticking to pencils, but maybe I should try paints.",
          options: [{ text: "Give it a go!", nextState: "end" }]
        },
        end: { text: "Thanks for the chat!", options: [] }
      }
    };

    let dialogueData = templates[npc.id] || templates.art_critic;

    // Deep copy to avoid modifying the original template objects directly
    dialogueData = JSON.parse(JSON.stringify(dialogueData));

    // Iterate through all dialogue states and process their text content
    for (const stateKey in dialogueData) {
      if (dialogueData.hasOwnProperty(stateKey)) {
        processDialogueNodeForSerialization(dialogueData[stateKey]);
      }
    }

    return dialogueData; // Return the processed object
  }

  generateNewQuest() {
    const quest = {
      id: 'special_commission_' + Date.now(),
      name: 'Special Commission',
      description: 'Create a masterpiece for the mayor'
    };

    const code = `
// AI Generated Quest: ${quest.name}
gameState.quests['${quest.id}'] = 'not_started';

// Add quest giver dialogue
if (entities['art_district']) {
  const galleryOwner = entities['art_district'].find(e => e.id === 'gallery_owner');
  if (galleryOwner && galleryOwner.dialogue) {
    galleryOwner.dialogue['${quest.id}'] = {
      text: "The mayor wants a special commission! Create your finest work.",
      options: [{
        text: "I'll do it!",
        nextState: "end",
        actions: [{
          id: "changeQuestState",
          params: { questId: "${quest.id}", newState: "accepted" }
        }]
      }]
    };
  }
}`;

    return {
      type: 'quest',
      file: 'js/state.js',
      code: code,
      description: `Added new quest: ${quest.name}`
    };
  }

  modifyShopPrices() {
    const code = `
// AI Price Adjustment: Make items more affordable
if (gameState && gameState.shops) {
  Object.values(gameState.shops).forEach(shop => {
    if (shop.items) {
      shop.items.forEach(item => {
        item.price = Math.max(1, Math.floor(item.price * 0.7));
      });
    }
  });
}`;

    return {
      type: 'balance',
      file: 'js/state.js',
      code: code,
      description: 'Reduced shop prices by 30%'
    };
  }

  addEnergyRestorePoints() {
    const code = `
// AI Feature: Add free energy restore in art studio
if (!entities['art_studio']) entities['art_studio'] = [];
entities['art_studio'].push({
  id: 'water_fountain',
  x: 5,
  y: 5,
  dialogue: {
    start: {
      text: "The cool water refreshes you.",
      options: [{
        text: "Drink",
        nextState: "end",
        actions: [{
          id: "restoreEnergy",
          params: { amount: 50 }
        }]
      }]
    },
    end: { text: "You feel refreshed!", options: [] }
  }
});`;

    return {
      type: 'feature',
      file: 'js/entities.js',
      code: code,
      description: 'Added energy restore fountain'
    };
  }

  simplifyQuests() {
    const code = `
// AI Helper: Auto-progress stuck quests
if (gameState && gameState.quests) {
  Object.keys(gameState.quests).forEach(questId => {
    if (gameState.quests[questId] === 'accepted') {
      // Give hint instead of auto-completing
      console.log('[AI Helper] Quest hint for', questId, ': Check NPCs or craft required items');
    }
  });
}`;

    return {
      type: 'helper',
      file: 'js/state.js',
      code: code,
      description: 'Added quest hints'
    };
  }

  async applyModification(mod) {
    console.log(`[AI Agent] Applying modification: ${mod.description}`);

    let dataToSave;
    let targetFileName; // e.g., 'entities.json', 'maps.json', 'state.json'

    if (mod.type === 'entity_update' || mod.type === 'feature') {
      dataToSave = window.entities; // Send the whole entities object
      targetFileName = 'data/entities.json';
    } else if (mod.type === 'map' || mod.type === 'balance') {
      dataToSave = window.maps; // Send the whole maps object
      targetFileName = 'data/maps.json';
    } else if (mod.type === 'quest' || mod.type === 'helper') {
      dataToSave = window.gameState; // Send the whole gameState object
      targetFileName = 'data/state.json';
    }
    // Use JSON.stringify for robust serialization
    const contentString = JSON.stringify(dataToSave, null, 2);

    try {
      const response = await fetch('http://localhost:3000/update-data-file', { // New endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: targetFileName, content: contentString }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log(`[AI Agent] Data file ${targetFileName} updated successfully on server.`);
    } catch (error) {
      console.error(`[AI Agent] Error updating data file ${targetFileName}:`, error);
    }
    // Reload game after modification
    setTimeout(() => window.location.reload(), 1000);
  }

  // === UTILITY FUNCTIONS ===
  calculateDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  isAdjacent(a, b) {
    return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
  }

  isDialogueOpen() {
    const dialogueBox = document.getElementById('dialogueBox');
    return dialogueBox && !dialogueBox.classList.contains('hidden');
  }

  clickCanvas(tileX, tileY) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('[AI Agent] Canvas not found');
      return;
    }

    const rect = canvas.getBoundingClientRect();

    // Calculate click position accounting for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = rect.left + ((tileX + 0.5) * TILE_SIZE) / scaleX;
    const y = rect.top + ((tileY + 0.5) * TILE_SIZE) / scaleY;

    // Create and dispatch click event
    const event = new MouseEvent('click', {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true
    });

    canvas.dispatchEvent(event);
  }

  countNewDiscoveries() {
    // Count recent new discoveries
    let discoveries = 0;

    // New locations
    const recentLocations = Array.from(this.memory.visitedLocations).slice(-10);
    const oldLocations = Array.from(this.memory.visitedLocations).slice(0, -10);
    discoveries += recentLocations.filter(loc => !oldLocations.includes(loc)).length;

    // New NPCs
    const recentNPCs = Array.from(this.memory.knownNPCs.keys()).slice(-5);
    const oldNPCs = Array.from(this.memory.knownNPCs.keys()).slice(0, -5);
    discoveries += recentNPCs.filter(npc => !oldNPCs.includes(npc)).length;

    return discoveries;
  }

  updateGoalProgress(perception) {
    // Update goal progress based on perception
    try {
      // Money goal
      const moneyProgress = Math.min(100, (perception.player.money / 500) * 100);
      this.goals.increaseMoney.progress = moneyProgress;

      // Skills goal
      const totalLevels = Object.values(perception.player.skills || {})
        .reduce((sum, skill) => sum + (skill.level || 0), 0);
      this.goals.increaseSkills.progress = Math.min(100, (totalLevels / 20) * 100);

      // Exploration goal
      const mapsExplored = this.memory.exploredMaps.size;
      this.goals.exploreWorld.progress = Math.min(100, (mapsExplored / 5) * 100);

      // Quest goal
      const questsCompleted = Object.values(perception.quests || {})
        .filter(q => q === 'completed' || q === 'rewarded').length;
      const totalQuests = Object.keys(perception.quests || {}).length || 1;
      this.goals.completeQuests.progress = Math.min(100, (questsCompleted / totalQuests) * 100);
    } catch (error) {
      console.error('[AI Agent] Goal progress update error:', error);
    }
  }

  // === MAIN LOOP ===
  async start() {
    console.log('[AI Agent] Starting autonomous gameplay...');
    this.isRunning = true;

    // Apply any stored modifications
    this.loadStoredModifications();

    // Wait for game to initialize
    await this.sleep(1000);

    while (this.isRunning) {
      try {
        await this.makeDecision();
        await this.sleep(this.config.actionDelay);

        // Auto-handle dialogue options
        await this.handleDialogue();

      } catch (error) {
        console.error('[AI Agent] Loop error:', error);
        this.emotionalState.frustration = Math.min(100, this.emotionalState.frustration + 10);
        await this.sleep(2000); // Wait longer on error
      }
    }
  }

  async handleDialogue() {
    const dialogueBox = document.getElementById('dialogueBox');
    if (!dialogueBox || dialogueBox.classList.contains('hidden')) {
      return;
    }

    // Wait a bit to "read" the dialogue
    await this.sleep(1000);

    const options = document.querySelectorAll('#dialogueOptions button');
    if (options.length > 0) {
      // Choose option based on goals and keywords
      let bestOption = 0;
      let bestScore = -1;

      options.forEach((opt, idx) => {
        const text = opt.textContent.toLowerCase();
        let score = Math.random() * 10; // Base randomness

        // Prefer accepting quests and positive responses
        if (text.includes('yes') || text.includes('accept') || text.includes('love') ||
          text.includes("i'll") || text.includes('sure') || text.includes('help')) {
          score += 50;
        }

        // Prefer buying/getting items if we have money
        if ((text.includes('buy') || text.includes('get')) && gameState.player.money > 10) {
          score += 30;
        }

        // Avoid negative responses
        if (text.includes('no') || text.includes('not') || text.includes('later')) {
          score -= 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestOption = idx;
        }
      });

      // Click the best option
      setTimeout(() => {
        if (options[bestOption]) {
          options[bestOption].click();
        }
      }, 500);
    } else {
      // No options, check for close button
      const closeButton = document.getElementById('closeDialogue');
      if (closeButton && !closeButton.classList.contains('hidden')) {
        setTimeout(() => {
          closeButton.click();
        }, 500);
      }
    }
  }

  loadStoredModifications() {
    const mods = JSON.parse(localStorage.getItem('ai_agent_mods') || '[]');
    if (mods.length > 0) {
      console.log(`[AI Agent] Found ${mods.length} stored modifications`);
      // In a real implementation, these would be applied to the game files
      mods.forEach(mod => {
        console.log(`- ${mod.description}`);
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('[AI Agent] Stopping...');
    this.isRunning = false;
  }
}

// Initialize and start the agent
const aiAgent = new AIGameAgent();

// Add UI controls
const agentControl = document.createElement('div');
agentControl.style.cssText = `
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px;
  border-radius: 8px;
  z-index: 1000;
  font-family: 'Courier New', monospace;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;
agentControl.innerHTML = `
  <h3 style="margin: 0 0 10px 0; color: #90cdf4;">🤖 AI Agent Control</h3>
  <button id="startAgent" style="margin-right: 10px; padding: 5px 15px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Start AI</button>
  <button id="stopAgent" style="margin-right: 10px; padding: 5px 15px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Stop AI</button>
  <button id="clearMods" style="padding: 5px 15px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Mods</button>
  <div id="agentStatus" style="margin-top: 10px; font-size: 12px;"></div>
`;
document.body.appendChild(agentControl);

document.getElementById('startAgent').onclick = () => aiAgent.start();
document.getElementById('stopAgent').onclick = () => aiAgent.stop();
document.getElementById('clearMods').onclick = () => {
  localStorage.removeItem('ai_agent_mods');
  console.log('[AI Agent] Cleared stored modifications');
};

// Update status display
setInterval(() => {
  if (aiAgent.isRunning) {
    const status = document.getElementById('agentStatus');
    status.innerHTML = `
      <div style="color: #fbbf24;">Boredom: ${aiAgent.emotionalState.boredom.toFixed(0)}%</div>
      <div style="color: #f87171;">Frustration: ${aiAgent.emotionalState.frustration.toFixed(0)}%</div>
      <div style="color: #a78bfa;">Curiosity: ${aiAgent.emotionalState.curiosity.toFixed(0)}%</div>
      <div style="color: #10b981;">Satisfaction: ${aiAgent.emotionalState.satisfaction.toFixed(0)}%</div>
      <div style="margin-top: 5px; color: #94a3b8;">Visited: ${aiAgent.memory.visitedLocations.size} locations</div>
      <div style="color: #94a3b8;">Known NPCs: ${aiAgent.memory.knownNPCs.size}</div>
    `;
  }
}, 500);