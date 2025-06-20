// Skill abbreviations mapping
const skillAbbreviations = {
  vitality: { abbr: 'VIT', icon: '❤️' },
  reputation: { abbr: 'REP', icon: '⭐' },
  strength: { abbr: 'STR', icon: '💪' },
  dexterity: { abbr: 'DEX', icon: '🎯' },
  intelligence: { abbr: 'INT', icon: '🧠' },
  creativity: { abbr: 'CRE', icon: '🎨' },
  stealth: { abbr: 'STL', icon: '👤' },
  speed: { abbr: 'SPD', icon: '⚡' }
};

// The central game state object, holding all dynamic data of the game.
const gameState = {
  currentMap: 'town', // The ID of the currently active map.
  clickMarker: { x: -1, y: -1, type: 'normal' }, // Stores coordinates and type of the last clicked tile for highlighting.
  ui: {
    statsPanelCollapsed: false, // Whether the stats menu UI is currently collapsed.
  },
  player: {
    x: 5, y: 5, // Player's current coordinates on the map.
    path: [], // Array of tiles representing the player's movement path (for A*).
    speed: 100, // Movement speed in milliseconds per tile.
    moveTimer: 0, // Timer to control movement animation.
    backpack: [], // Array to store items the player has collected.
    stats: {
      // level and xp per skill
      hp: 100, maxHp: 100, // Player's stats.
      attack: 10, defense: 5,
      xpToNextLevel: 100, // Experience points and requirement for next level.
      skills: {
        vitality: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        reputation: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        strength: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        dexterity: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        intelligence: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        creativity: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        stealth: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        speed: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        }
      }
    }
  },
  quests: {
    chickenQuest: 'not_started', // Status of the chicken retrieval quest.
    crystalQuest: 'not_started',  // Status of the magical crystal quest.
    mysteriousNoteQuest: 'not_started' // Status of the mysterious note quest.
  },
};
