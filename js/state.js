// The central game state object, holding all dynamic data of the game.
const gameState = {
  currentMap: 'town', // The ID of the currently active map.
  clickMarker: { x: -1, y: -1, type: 'normal' }, // Stores coordinates and type of the last clicked tile for highlighting.
  player: {
    x: 5, y: 5, // Player's current coordinates on the map.
    path: [], // Array of tiles representing the player's movement path (for A*).
    speed: 100, // Movement speed in milliseconds per tile.
    moveTimer: 0, // Timer to control movement animation.
    backpack: [], // Array to store items the player has collected.
    stats: {
      level: 1, hp: 100, maxHp: 100, // Player's combat stats.
      attack: 10, defense: 5,
      xp: 0, xpToNextLevel: 100 // Experience points and requirement for next level.
    }
  },
  quests: {
    chickenQuest: 'not_started', // Status of the chicken retrieval quest.
    crystalQuest: 'not_started',  // Status of the magical crystal quest.
    mysteriousNoteQuest: 'not_started' // New: Status of the mysterious note quest.
  },
};
