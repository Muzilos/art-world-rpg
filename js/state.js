const gameState = {
  currentMap: 'town',
  clickMarker: { x: -1, y: -1, type: 'normal' }, // Track clicked tile
  player: {
    x: 5, y: 5, path: [], speed: 100, moveTimer: 0,
    backpack: [],
    stats: { level: 1, hp: 100, maxHp: 100, attack: 10, defense: 5, xp: 0, xpToNextLevel: 100 }
  },
  quests: {
    chickenQuest: 'not_started',
    crystalQuest: 'not_started'
  },
  characters: {
    'town': [{
      id: 'old_man', x: 8, y: 8,
      dialogue: {
        'start': { 
          text: "Hello, traveler! My prized chicken is missing. Could you find it?", 
          options: [
            { text: "Of course!", nextState: 'quest_accepted', action: () => gameState.quests.chickenQuest = 'accepted' }, 
            { text: "I'm too busy.", nextState: 'quest_rejected' }
          ] 
        },
        'quest_accepted': { text: "Thank you! I believe it's in the forest. It's dangerous there.", options: [{ text: "I'll be back.", nextState: 'end' }] },
        'quest_in_progress': { text: "Still no sign of my chicken?", options: [{ text: "I'm still looking.", nextState: 'end' }] },
        'quest_rejected': { text: "A shame. If you change your mind, I'll be here.", options: [{ text: "Goodbye.", nextState: 'end' }] },
        'quest_hand_over': { 
          text: "You have my chicken! Amazing! May I have him back?", 
          options: [{ 
            text: "Here you go.", 
            nextState: 'quest_rewarded', 
            action: () => { 
              gameState.player.backpack = gameState.player.backpack.filter(item => item !== 'chicken'); 
              gameState.player.stats.xp += 50; 
              gameState.quests.chickenQuest = 'rewarded'; 
            } 
          }] 
        },
        'quest_rewarded': { text: "It's good to have him back. Thank you again!", options: [{ text: "Anytime.", nextState: 'end' }] },
        'end': { text: "Farewell.", options: [] }
      }
    }, {
      id: 'merchant', x: 15, y: 10,
      dialogue: {
        'start': { 
          text: "Welcome! I've heard rumors of a magical crystal in the mountains. Interested?", 
          options: [
            { text: "Tell me more.", nextState: 'crystal_info' },
            { text: "Not interested.", nextState: 'end' }
          ]
        },
        'crystal_info': {
          text: "The Crystal of Power lies deep in the mountain caves. Bring it to me and I'll reward you handsomely!",
          options: [
            { text: "I'll find it.", nextState: 'quest_accepted', action: () => gameState.quests.crystalQuest = 'accepted' },
            { text: "Too dangerous.", nextState: 'end' }
          ]
        },
        'quest_accepted': { text: "Excellent! Be careful in those caves.", options: [{ text: "I will.", nextState: 'end' }] },
        'quest_in_progress': { text: "Any luck finding the crystal?", options: [{ text: "Still searching.", nextState: 'end' }] },
        'quest_hand_over': {
          text: "The Crystal of Power! Magnificent! Here's your reward.",
          options: [{
            text: "Thank you.",
            nextState: 'quest_rewarded',
            action: () => {
              gameState.player.backpack = gameState.player.backpack.filter(item => item !== 'crystal');
              gameState.player.stats.xp += 100;
              gameState.player.stats.attack += 5;
              gameState.quests.crystalQuest = 'rewarded';
            }
          }]
        },
        'quest_rewarded': { text: "Pleasure doing business with you!", options: [{ text: "Likewise.", nextState: 'end' }] },
        'end': { text: "Safe travels!", options: [] }
      }
    }],
    'forest': [{
      id: 'chicken', x: 18, y: 15,
      dialogue: {
        'start': { 
          text: "Bawk bawk! The chicken looks lost.", 
          options: [
            { 
              text: "Put the chicken in your backpack.", 
              nextState: 'end', 
              action: () => { 
                gameState.quests.chickenQuest = 'completed'; 
                gameState.player.backpack.push('chicken'); 
                gameState.characters.forest = gameState.characters.forest.filter(c => c.id !== 'chicken'); 
              } 
            }, 
            { text: "Leave the chicken.", nextState: 'end' }
          ] 
        },
        'end': { text: "Bawk." }
      }
    }],
    'mountain_cave': [{
      id: 'crystal', x: 12, y: 8,
      dialogue: {
        'start': {
          text: "A brilliant crystal pulses with magical energy.",
          options: [
            {
              text: "Take the crystal.",
              nextState: 'end',
              action: () => {
                gameState.quests.crystalQuest = 'completed';
                gameState.player.backpack.push('crystal');
                gameState.characters.mountain_cave = gameState.characters.mountain_cave.filter(c => c.id !== 'crystal');
              }
            },
            { text: "Leave it alone.", nextState: 'end' }
          ]
        },
        'end': { text: "The crystal hums softly." }
      }
    }]
  }
};