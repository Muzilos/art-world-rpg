// Definitions of characters for each map, including their positions and dialogue trees.
const characters = {
  'town': [{
    id: 'old_man', x: 8, y: 8, // Old Man character in town.
    dialogue: {
      'start': { // Initial dialogue state for the Old Man.
        text: "Hello, traveler! My prized chicken is missing. Could you find it?",
        options: [
          { text: "Of course!", nextState: 'quest_accepted', action: () => gameState.quests.chickenQuest = 'accepted' },
          { text: "I'm too busy.", nextState: 'quest_rejected' }
        ]
      },
      'quest_accepted': { text: "Thank you! I believe it's in the forest. It's dangerous there.", options: [{ text: "I'll be back.", nextState: 'end' }] },
      'quest_in_progress': { text: "Still no sign of my chicken?", options: [{ text: "I'm still looking.", nextState: 'end' }] },
      'quest_rejected': { text: "A shame. If you change your mind, I'll be here.", options: [{ text: "Goodbye.", nextState: 'end' }] },
      'quest_hand_over': { // Dialogue when player has the chicken and is ready to turn it in.
        text: "You have my chicken! Amazing! May I have him back?",
        options: [{
          text: "Here you go.",
          nextState: 'quest_rewarded',
          action: () => {
            gameState.player.backpack = gameState.player.backpack.filter(item => item !== 'chicken'); // Remove chicken from backpack.
            gameState.player.stats.xp += 50; // Award XP.
            if (gameState.player.stats.xp >= gameState.player.stats.xpToNextLevel) { // Check for level up.
              gameState.player.stats.level++;
              gameState.player.stats.xp -= gameState.player.stats.xpToNextLevel;
              gameState.player.stats.xpToNextLevel = Math.floor(gameState.player.stats.xpToNextLevel * 1.5); // Increase XP for next level.
              gameState.player.stats.maxHp += 10;
              gameState.player.stats.hp = gameState.player.stats.maxHp; // Restore HP on level up.
              gameState.player.stats.attack += 2;
              gameState.player.stats.defense += 1;
              showDialogue({ id: 'game_system', dialogue: { 'level_up': { text: `You leveled up to Level ${gameState.player.stats.level}! HP, Attack, and Defense increased!`, options: [{ text: "Awesome!", nextState: 'end' }] } } }, 'level_up');
            }
            gameState.quests.chickenQuest = 'rewarded'; // Update quest status.
          }
        }]
      },
      'quest_rewarded': { text: "It's good to have him back. Thank you again!", options: [{ text: "Anytime.", nextState: 'end' }] },
      'end': { text: "Farewell.", options: [] } // End state for dialogue.
    }
  }, {
    id: 'merchant', x: 15, y: 10, // Merchant character in town.
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
            gameState.player.stats.attack += 5; // Reward with attack boost.
            if (gameState.player.stats.xp >= gameState.player.stats.xpToNextLevel) {
              gameState.player.stats.level++;
              gameState.player.stats.xp -= gameState.player.stats.xpToNextLevel;
              gameState.player.stats.xpToNextLevel = Math.floor(gameState.player.stats.xpToNextLevel * 1.5);
              gameState.player.stats.maxHp += 10;
              gameState.player.stats.hp = gameState.player.stats.maxHp;
              gameState.player.stats.attack += 2;
              gameState.player.stats.defense += 1;
              showDialogue({ id: 'game_system', dialogue: { 'level_up': { text: `You leveled up to Level ${gameState.player.stats.level}! HP, Attack, and Defense increased!`, options: [{ text: "Awesome!", nextState: 'end' }] } } }, 'level_up');
            }
            gameState.quests.crystalQuest = 'rewarded';
          }
        }]
      },
      'quest_rewarded': { text: "Pleasure doing business with you!", options: [{ text: "Likewise.", nextState: 'end' }] },
      'end': { text: "Safe travels!", options: [] }
    }
  }],
    'forest': [{
      id: 'chicken', x: 18, y: 15, // Chicken character in the forest.
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
                characters.forest = characters.forest.filter(c => c.id !== 'chicken'); // Remove chicken from map.
              }
            },
            { text: "Leave the chicken.", nextState: 'end' }
          ]
        },
        'end': { text: "Bawk." }
      }
    }],
      'mountain_cave': [{
        id: 'crystal', x: 12, y: 8, // Crystal item in the mountain cave.
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
                  characters.mountain_cave = characters.mountain_cave.filter(c => c.id !== 'crystal'); // Remove crystal from map.
                }
              },
              { text: "Leave it alone.", nextState: 'end' }
            ]
          },
          'end': { text: "The crystal hums softly." }
        }
      }],
        'hidden_grotto': [{ // New: Mysterious Figure in the Hidden Grotto
          id: 'mysterious_figure', x: 10, y: 10,
          dialogue: {
            'start': {
              text: "A cloaked figure stands silently. They drop a dusty note as you approach.",
              options: [
                {
                  text: "Pick up the note.",
                  nextState: 'note_found',
                  action: () => {
                    gameState.player.backpack.push('mysterious_note');
                    // The mysterious figure doesn't disappear, but their dialogue changes
                    // or they become non-interactive for this quest.
                    gameState.quests.mysteriousNoteQuest = 'accepted';
                    // Remove the note from the 'world' after pickup if it was a visible item
                    // For now, it's just triggered by interacting with the figure.
                  }
                },
                { text: "Leave them be.", nextState: 'end' }
              ]
            },
            'note_found': {
              text: "The note reads: 'Seek the Ancient Tablet in the forgotten shrine. Only then will the truth be revealed.'",
              options: [
                { text: "What shrine?", nextState: 'shrine_question' },
                { text: "This is cryptic.", nextState: 'end' }
              ]
            },
            'shrine_question': {
              text: "The figure merely points vaguely towards the east, then vanishes into thin air.",
              options: [{
                text: "They vanished!", nextState: 'end', action: () => {
                  // Remove the mysterious figure after they vanish
                  characters.hidden_grotto = characters.hidden_grotto.filter(c => c.id !== 'mysterious_figure');
                  // Hint for a new area or quest
                  showDialogue({ id: 'game_system', dialogue: { 'hint': { text: "A new path seems to have opened in the eastern forest... perhaps leading to a shrine?", options: [{ text: "Investigate.", nextState: 'end' }] } } }, 'hint');
                }
              }]
            },
            'quest_in_progress': {
              text: "The space where the figure once stood feels cold. You recall the note's words about the Ancient Tablet.",
              options: [{ text: "I must find that shrine.", nextState: 'end' }]
            },
            'end': { text: "Silence returns to the grotto." }
          }
        }]
}
