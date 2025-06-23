const gameState = {
  currentMap: 'apartment_living_room',
  clickMarker: { x: -1, y: -1, type: 'normal' },
  ui: {
    statsPanelCollapsed: false,
  },
  player: {
    x: 5, y: 5,
    sprite: "red",
    path: [],
    speed: 100,
    moveTimer: 0,
    backpack: {
      'canvas': 1,
      'pencil': 1,
      'sketchbook': 1
    },
    money: 50, // Starting money
    energy: 100, // Energy system for crafting
    maxEnergy: 100,
    stats: {
      hp: 100, maxHp: 100, // Renamed to represent mental/physical well-being
      skills: {
        drawing: {
          level: 1,
          xp: 0,
          xpToNextLevel: 100
        },
        painting: {
          level: 1,
          xp: 0,
          xpToNextLevel: 100
        },
        sculpting: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        endurance: {
          level: 1,
          xp: 0,
          xpToNextLevel: 100
        },
        influence: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        creativity: {
          level: 1,
          xp: 0,
          xpToNextLevel: 100
        },
        networking: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        },
        business: {
          level: 0,
          xp: 0,
          xpToNextLevel: 100
        }
      }
    }
  },
  quests: {}
};