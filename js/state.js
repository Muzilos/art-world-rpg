// // Skill abbreviations mapping for art world
// const skillAbbreviations = {
//   drawing: { abbr: 'DRW', icon: '✏️' },
//   painting: { abbr: 'PNT', icon: '🎨' },
//   sculpting: { abbr: 'SCL', icon: '🗿' },
//   endurance: { abbr: 'END', icon: '💪' },
//   influence: { abbr: 'INF', icon: '⭐' },
//   creativity: { abbr: 'CRE', icon: '💡' },
//   networking: { abbr: 'NET', icon: '🤝' },
//   business: { abbr: 'BIZ', icon: '💼' },
//   observation: { abbr: 'OBS', icon: '👁️' },
//   patience: { abbr: 'PAT', icon: '⏳' }
// };

// The central game state object for Art World RPG
const gameState = {
  currentMap: 'art_district', // Starting in the art district
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
  quests: {
    // firstCommission: 'not_started', // Create a portrait for a client
    // galleryShow: 'not_started',     // Get accepted into a gallery show
    // mentorQuest: 'not_started',     // Find and learn from a master artist
    // findHermit: 'not_started',      // Find the hermit
    // rarePigment: 'not_started',      // Obtain the rare pigment
    // artSchoolExploration: 'not_started',  // Explore the art school
    // forestDepths: 'not_started',          // Explore the deeper forest
    // mysticalArt: 'not_started',           // Create art with the mystical easel
    // masterAllSkills: 'not_started',       // Reach level 3 in all art skills
  }
};