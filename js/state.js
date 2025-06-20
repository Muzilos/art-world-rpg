// Skill abbreviations mapping for art world
const skillAbbreviations = {
  drawing: { abbr: 'DRW', icon: '✏️' },
  painting: { abbr: 'PNT', icon: '🎨' },
  sculpting: { abbr: 'SCL', icon: '🗿' },
  endurance: { abbr: 'END', icon: '💪' },
  influence: { abbr: 'INF', icon: '⭐' },
  creativity: { abbr: 'CRE', icon: '💡' },
  networking: { abbr: 'NET', icon: '🤝' },
  business: { abbr: 'BIZ', icon: '💼' }
};

// The central game state object for Art World RPG
const gameState = {
  currentMap: 'art_district', // Starting in the art district
  clickMarker: { x: -1, y: -1, type: 'normal' },
  ui: {
    statsPanelCollapsed: false,
  },
  player: {
    x: 5, y: 5,
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
    firstCommission: 'not_started', // Create a portrait for a client
    galleryShow: 'not_started',     // Get accepted into a gallery show
    mentorQuest: 'not_started'      // Find and learn from a master artist
  },
  crafting: {
    availableRecipes: [
      {
        id: 'pencil_sketch',
        name: 'Pencil Sketch',
        materials: { 'pencil': 0.1, 'paper': 1 },
        time: 30,
        skill: 'drawing',
        minLevel: 1,
        value: 10,
        energy: 15
      },
      {
        id: 'watercolor_painting',
        name: 'Watercolor Painting',
        materials: { 'watercolor': 0.2, 'canvas': 1, 'brush': 0.1 },
        time: 120,
        skill: 'painting',
        minLevel: 2,
        value: 45,
        energy: 35
      },
      {
        id: 'oil_painting',
        name: 'Oil Painting',
        materials: { 'oil_paint': 0.2, 'canvas': 1, 'brush': 0.2, 'palette': 1 },
        time: 300,
        skill: 'painting',
        minLevel: 3,
        value: 150,
        energy: 50
      },
      {
        id: 'clay_sculpture',
        name: 'Clay Sculpture',
        materials: { 'clay': 1, 'sculpting_tools': 1 },
        time: 180,
        skill: 'sculpting',
        minLevel: 1,
        value: 80,
        energy: 40
      }
    ]
  },
  shops: {
    artSupplyStore: {
      items: [
        { id: 'canvas', name: 'Canvas', price: 5 },
        { id: 'paper', name: 'Paper', price: 1 },
        { id: 'pencil', name: 'Pencil', price: 2 },
        { id: 'brush', name: 'Paint Brush', price: 8 },
        { id: 'watercolor', name: 'Watercolor Set', price: 15 },
        { id: 'oil_paint', name: 'Oil Paint Set', price: 25 },
        { id: 'palette', name: 'Paint Palette', price: 10 },
        { id: 'clay', name: 'Clay Block', price: 12 },
        { id: 'sculpting_tools', name: 'Sculpting Tools', price: 20 }
      ]
    },
    coffeeShop: {
      items: [
        { id: 'coffee', name: 'Coffee', price: 3, energyRestore: 20 },
        { id: 'espresso', name: 'Espresso', price: 4, energyRestore: 30 },
        { id: 'sandwich', name: 'Sandwich', price: 6, energyRestore: 40 }
      ]
    }
  }
};