const gameState = {
  currentMap: 'town',
  player: {
    x: 5, y: 5, path: [], speed: 100, moveTimer: 0,
    backpack: [], // The player's inventory
    stats: { level: 1, hp: 100, maxHp: 100, attack: 10, defense: 5, xp: 0, xpToNextLevel: 100 }
  },
  quests: {
    chickenQuest: 'not_started' // States: not_started, accepted, completed, rewarded
  },
  characters: {
    'town': [{
      id: 'old_man', x: 8, y: 8,
      dialogue: {
        'start': { text: "Hello, traveler! My prized chicken is missing. Could you find it?", options: [{ text: "Of course!", nextState: 'quest_accepted', action: () => gameState.quests.chickenQuest = 'accepted' }, { text: "I'm too busy.", nextState: 'quest_rejected' }] },
        'quest_accepted': { text: "Thank you! I believe it's in the forest. It's a dangerous place.", options: [{ text: "I'll be back.", nextState: 'end' }] },
        'quest_in_progress': { text: "Still no sign of my chicken?", options: [{ text: "I'm still looking.", nextState: 'end' }] },
        'quest_rejected': { text: "A shame. If you change your mind, I'll be here.", options: [{ text: "Goodbye.", nextState: 'end' }] },
        'quest_hand_over': { text: "You have my chicken! Amazing! May I have him back?", options: [{ text: "Here you go.", nextState: 'quest_rewarded', action: () => { gameState.player.backpack = gameState.player.backpack.filter(item => item !== 'chicken'); gameState.player.stats.xp += 50; gameState.quests.chickenQuest = 'rewarded'; updateStatsUI(); updateBackpackUI(); } }] },
        'quest_rewarded': { text: "It's good to have him back. Thank you again!", options: [{ text: "Anytime.", nextState: 'end' }] },
        'end': { text: "Farewell.", options: [] }
      }
    }],
    'forest': [{
      id: 'chicken', x: 18, y: 15,
      dialogue: {
        'start': { text: "Bawk bawk! The chicken looks lost.", options: [{ text: "Put the chicken in your backpack.", nextState: 'end', action: () => { gameState.quests.chickenQuest = 'completed'; gameState.player.backpack.push('chicken'); gameState.characters.forest = gameState.characters.forest.filter(c => c.id !== 'chicken'); updateBackpackUI(); } }, { text: "Leave the chicken.", nextState: 'end' }] },
        'end': { text: "Bawk." }
      }
    }]
  }
};
