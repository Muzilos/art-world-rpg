import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Palette, 
  MessageSquare, 
  TrendingUp, 
  Heart, 
  AlertCircle,
  Sparkles,
  Package,
  Users,
  Camera,
  Zap,
  Shield,
  Trophy,
  Star
} from 'lucide-react';

// Constants
const TILE_SIZE = 40;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const VIEWPORT_WIDTH = 12;
const VIEWPORT_HEIGHT = 10;

// Tile types
const TILES = {
  FLOOR: 0,
  WALL: 1,
  DOOR: 2,
  NPC: 3,
  ITEM: 4,
  CRAFT_STATION: 5,
  GALLERY: 6
};

// Character types
const CHARACTERS = {
  CRITIC: { icon: '🎭', color: '#9333ea' },
  COLLECTOR: { icon: '💰', color: '#eab308' },
  ARTIST: { icon: '🎨', color: '#3b82f6' },
  INFLUENCER: { icon: '📱', color: '#ec4899' },
  CURATOR: { icon: '🏛️', color: '#10b981' },
  RIVAL: { icon: '😈', color: '#ef4444' }
};

// Crafting materials and tiers
const MATERIALS = {
  // Basic materials
  CANVAS: { name: 'Canvas', tier: 1, icon: '🖼️' },
  PAINT: { name: 'Paint', tier: 1, icon: '🎨' },
  CLAY: { name: 'Clay', tier: 1, icon: '🪨' },
  PIXELS: { name: 'Digital Pixels', tier: 1, icon: '💾' },
  
  // Intermediate materials
  GOLD_LEAF: { name: 'Gold Leaf', tier: 2, icon: '✨' },
  MARBLE: { name: 'Marble', tier: 2, icon: '🗿' },
  HOLOGRAM: { name: 'Hologram Film', tier: 2, icon: '🌈' },
  RARE_PIGMENT: { name: 'Rare Pigment', tier: 2, icon: '💎' },
  
  // Advanced materials
  QUANTUM_INK: { name: 'Quantum Ink', tier: 3, icon: '🌌' },
  LIVING_METAL: { name: 'Living Metal', tier: 3, icon: '🤖' },
  TIME_CRYSTAL: { name: 'Time Crystal', tier: 3, icon: '⏳' },
  VOID_ESSENCE: { name: 'Void Essence', tier: 3, icon: '🕳️' }
};

// Crafting recipes
const RECIPES = {
  // Tier 1 - Basic Art
  SKETCH: { 
    name: 'Sketch', 
    materials: { CANVAS: 1, PAINT: 1 }, 
    reputation: 5,
    value: 50,
    tier: 1
  },
  POTTERY: { 
    name: 'Pottery', 
    materials: { CLAY: 2 }, 
    reputation: 7,
    value: 75,
    tier: 1
  },
  DIGITAL_ART: { 
    name: 'Digital Art', 
    materials: { PIXELS: 3 }, 
    reputation: 10,
    value: 100,
    tier: 1
  },
  
  // Tier 2 - Professional Art
  GOLDEN_PORTRAIT: { 
    name: 'Golden Portrait', 
    materials: { CANVAS: 2, GOLD_LEAF: 1, RARE_PIGMENT: 1 }, 
    reputation: 25,
    value: 500,
    tier: 2
  },
  MARBLE_SCULPTURE: { 
    name: 'Marble Sculpture', 
    materials: { MARBLE: 3, CLAY: 1 }, 
    reputation: 30,
    value: 750,
    tier: 2
  },
  HOLOGRAPHIC_INSTALLATION: { 
    name: 'Holographic Installation', 
    materials: { HOLOGRAM: 2, PIXELS: 2 }, 
    reputation: 35,
    value: 1000,
    tier: 2
  },
  
  // Tier 3 - Masterpieces
  QUANTUM_PAINTING: { 
    name: 'Quantum Painting', 
    materials: { QUANTUM_INK: 1, CANVAS: 1, TIME_CRYSTAL: 1 }, 
    reputation: 100,
    value: 5000,
    tier: 3
  },
  LIVING_SCULPTURE: { 
    name: 'Living Sculpture', 
    materials: { LIVING_METAL: 2, VOID_ESSENCE: 1 }, 
    reputation: 150,
    value: 7500,
    tier: 3
  },
  REALITY_BENDER: { 
    name: 'Reality Bending Artifact', 
    materials: { TIME_CRYSTAL: 2, VOID_ESSENCE: 2, QUANTUM_INK: 1 }, 
    reputation: 200,
    value: 10000,
    tier: 3
  }
};

// Drama events
const DRAMA_EVENTS = [
  {
    id: 'bought_followers',
    title: 'Follower Scandal!',
    description: 'Someone exposed that you bought followers!',
    reputationLoss: 50,
    duration: 5
  },
  {
    id: 'art_theft',
    title: 'Plagiarism Accusation!',
    description: 'A rival claims you stole their art style!',
    reputationLoss: 30,
    duration: 3
  },
  {
    id: 'twitter_beef',
    title: 'Social Media Drama!',
    description: 'You got into a heated argument online!',
    reputationLoss: 20,
    duration: 2
  },
  {
    id: 'gallery_snub',
    title: 'Gallery Rejection!',
    description: 'A prestigious gallery publicly rejected your work!',
    reputationLoss: 40,
    duration: 4
  }
];

// Maps
const MAPS = {
  gallery: {
    name: 'Main Gallery',
    width: 20,
    height: 15,
    tiles: Array(15).fill(null).map((_, y) => 
      Array(20).fill(null).map((_, x) => {
        if (y === 0 || y === 14 || x === 0 || x === 19) return TILES.WALL;
        if (x === 10 && y === 14) return TILES.DOOR;
        if (x === 5 && y === 5) return TILES.NPC;
        if (x === 15 && y === 8) return TILES.NPC;
        if (x === 3 && y === 10) return TILES.CRAFT_STATION;
        if (x === 17 && y === 3) return TILES.GALLERY;
        return TILES.FLOOR;
      })
    ),
    npcs: {
      '5,5': { type: 'CRITIC', name: 'Arturo Snob' },
      '15,8': { type: 'COLLECTOR', name: 'Rich McWealth' }
    }
  },
  studio: {
    name: 'Artist Studio',
    width: 20,
    height: 15,
    tiles: Array(15).fill(null).map((_, y) => 
      Array(20).fill(null).map((_, x) => {
        if (y === 0 || y === 14 || x === 0 || x === 19) return TILES.WALL;
        if (x === 10 && y === 0) return TILES.DOOR;
        if (x === 7 && y === 7) return TILES.NPC;
        if (x === 3 && y === 3) return TILES.CRAFT_STATION;
        if (x === 16 && y === 11) return TILES.CRAFT_STATION;
        if (x === 10 && y === 10) return TILES.ITEM;
        return TILES.FLOOR;
      })
    ),
    npcs: {
      '7,7': { type: 'ARTIST', name: 'Van Doodle' }
    }
  },
  socialHub: {
    name: 'Social Media Hub',
    width: 20,
    height: 15,
    tiles: Array(15).fill(null).map((_, y) => 
      Array(20).fill(null).map((_, x) => {
        if (y === 0 || y === 14 || x === 0 || x === 19) return TILES.WALL;
        if (x === 0 && y === 7) return TILES.DOOR;
        if (x === 10 && y === 7) return TILES.NPC;
        if (x === 5 && y === 10) return TILES.NPC;
        if (x === 15 && y === 4) return TILES.NPC;
        return TILES.FLOOR;
      })
    ),
    npcs: {
      '10,7': { type: 'INFLUENCER', name: 'InstaFamous' },
      '5,10': { type: 'RIVAL', name: 'Haterade' },
      '15,4': { type: 'CURATOR', name: 'Museum Mary' }
    }
  }
};

const Game = () => {
  const [player, setPlayer] = useState({
    x: 10,
    y: 7,
    reputation: 100,
    followers: 1000,
    money: 500,
    inventory: {
      CANVAS: 5,
      PAINT: 5,
      CLAY: 3,
      PIXELS: 10
    },
    artworks: [],
    currentDrama: null,
    achievements: []
  });
  
  const [currentMap, setCurrentMap] = useState('gallery');
  const [dialogue, setDialogue] = useState(null);
  const [notification, setNotification] = useState(null);
  const [craftingMenu, setCraftingMenu] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const gameLoopRef = useRef(null);
  const keysPressed = useRef({});

  // Update camera to follow player
  useEffect(() => {
    const halfViewportX = Math.floor(VIEWPORT_WIDTH / 2);
    const halfViewportY = Math.floor(VIEWPORT_HEIGHT / 2);
    
    const offsetX = Math.max(0, Math.min(player.x - halfViewportX, MAP_WIDTH - VIEWPORT_WIDTH));
    const offsetY = Math.max(0, Math.min(player.y - halfViewportY, MAP_HEIGHT - VIEWPORT_HEIGHT));
    
    setCameraOffset({ x: offsetX, y: offsetY });
  }, [player.x, player.y]);

  // Handle diagonal movement
  const movePlayer = useCallback((dx, dy) => {
    const map = MAPS[currentMap];
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
      const tile = map.tiles[newY][newX];
      
      if (tile === TILES.FLOOR || tile === TILES.DOOR) {
        setPlayer(p => ({ ...p, x: newX, y: newY }));
        
        // Check for map transitions
        if (tile === TILES.DOOR) {
          handleDoorTransition(newX, newY);
        }
      } else if (tile === TILES.NPC) {
        handleNPCInteraction(newX, newY);
      } else if (tile === TILES.CRAFT_STATION) {
        setCraftingMenu(true);
      } else if (tile === TILES.ITEM) {
        collectItem(newX, newY);
      }
    }
  }, [currentMap, player.x, player.y]);

  // Game loop for smooth diagonal movement
  useEffect(() => {
    const gameLoop = () => {
      let dx = 0;
      let dy = 0;
      
      if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) dy = -1;
      if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) dy = 1;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) dx = -1;
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) dx = 1;
      
      if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
      }
    };
    
    gameLoopRef.current = setInterval(gameLoop, 150);
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [movePlayer]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      
      if (e.key === 'i') setInventoryOpen(!inventoryOpen);
      if (e.key === 'Escape') {
        setDialogue(null);
        setCraftingMenu(false);
        setInventoryOpen(false);
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [inventoryOpen]);

  const handleDoorTransition = (x, y) => {
    if (currentMap === 'gallery' && y === 14) {
      setCurrentMap('studio');
      setPlayer(p => ({ ...p, x: 10, y: 1 }));
    } else if (currentMap === 'studio' && y === 0) {
      setCurrentMap('gallery');
      setPlayer(p => ({ ...p, x: 10, y: 13 }));
    } else if (currentMap === 'gallery' && x === 0) {
      setCurrentMap('socialHub');
      setPlayer(p => ({ ...p, x: 1, y: 7 }));
    } else if (currentMap === 'socialHub' && x === 0) {
      setCurrentMap('gallery');
      setPlayer(p => ({ ...p, x: 1, y: 7 }));
    }
  };

  const handleNPCInteraction = (x, y) => {
    const map = MAPS[currentMap];
    const npcKey = `${x},${y}`;
    const npc = map.npcs[npcKey];
    
    if (npc) {
      const character = CHARACTERS[npc.type];
      let dialogueContent = '';
      let options = [];
      
      switch (npc.type) {
        case 'CRITIC':
          dialogueContent = "Your work is... adequate. But does it truly challenge the zeitgeist?";
          options = [
            { text: "Challenge accepted!", effect: () => gainReputation(10) },
            { text: "Art is subjective!", effect: () => {} }
          ];
          break;
        case 'COLLECTOR':
          dialogueContent = "I'm looking for something... extraordinary. Show me your best work!";
          options = [
            { text: "View my portfolio", effect: () => showPortfolio() },
            { text: "I'll create something special", effect: () => {} }
          ];
          break;
        case 'INFLUENCER':
          dialogueContent = "OMG your aesthetic is so fire! Want to collab?";
          options = [
            { text: "Let's do it!", effect: () => gainFollowers(500) },
            { text: "I work alone", effect: () => {} }
          ];
          break;
        case 'RIVAL':
          dialogueContent = "I heard you've been buying followers. How pathetic!";
          options = [
            { text: "That's a lie!", effect: () => startDrama('twitter_beef') },
            { text: "Mind your business", effect: () => {} }
          ];
          break;
        case 'ARTIST':
          dialogueContent = "The secret to great art is passion... and good materials!";
          options = [
            { text: "Trade materials", effect: () => tradeMaterials() },
            { text: "Share techniques", effect: () => learnRecipe() }
          ];
          break;
        case 'CURATOR':
          dialogueContent = "Our gallery only showcases the finest works. Do you have what it takes?";
          options = [
            { text: "Submit artwork", effect: () => submitToGallery() },
            { text: "I need more time", effect: () => {} }
          ];
          break;
      }
      
      setDialogue({
        character: character.icon,
        name: npc.name,
        text: dialogueContent,
        options
      });
    }
  };

  const collectItem = (x, y) => {
    const randomMaterial = Object.keys(MATERIALS)[Math.floor(Math.random() * 4)];
    setPlayer(p => ({
      ...p,
      inventory: {
        ...p.inventory,
        [randomMaterial]: (p.inventory[randomMaterial] || 0) + 1
      }
    }));
    showNotification(`Found ${MATERIALS[randomMaterial].icon} ${MATERIALS[randomMaterial].name}!`);
    
    // Remove item from map
    const map = MAPS[currentMap];
    map.tiles[y][x] = TILES.FLOOR;
  };

  const gainReputation = (amount) => {
    setPlayer(p => ({ ...p, reputation: p.reputation + amount }));
    showNotification(`+${amount} Reputation! ${amount > 0 ? '📈' : '📉'}`);
  };

  const gainFollowers = (amount) => {
    setPlayer(p => ({ ...p, followers: p.followers + amount }));
    showNotification(`+${amount} Followers! 👥`);
  };

  const startDrama = (eventId) => {
    const drama = DRAMA_EVENTS.find(e => e.id === eventId);
    if (drama) {
      setPlayer(p => ({ 
        ...p, 
        currentDrama: drama,
        reputation: Math.max(0, p.reputation - drama.reputationLoss)
      }));
      showNotification(`${drama.title} -${drama.reputationLoss} Reputation! 😱`);
      
      // Drama expires after duration
      setTimeout(() => {
        setPlayer(p => ({ ...p, currentDrama: null }));
        showNotification("Drama resolved! 😌");
      }, drama.duration * 5000);
    }
  };

  const craftArtwork = (recipeName) => {
    const recipe = RECIPES[recipeName];
    const canCraft = Object.entries(recipe.materials).every(
      ([mat, qty]) => player.inventory[mat] >= qty
    );
    
    if (canCraft) {
      // Deduct materials
      const newInventory = { ...player.inventory };
      Object.entries(recipe.materials).forEach(([mat, qty]) => {
        newInventory[mat] -= qty;
      });
      
      // Add artwork
      const artwork = {
        name: recipe.name,
        value: recipe.value,
        tier: recipe.tier,
        created: new Date().toISOString()
      };
      
      setPlayer(p => ({
        ...p,
        inventory: newInventory,
        artworks: [...p.artworks, artwork],
        reputation: p.reputation + recipe.reputation
      }));
      
      showNotification(`Created ${recipe.name}! +${recipe.reputation} Rep`);
      setCraftingMenu(false);
    }
  };

  const showPortfolio = () => {
    if (player.artworks.length === 0) {
      showNotification("Your portfolio is empty! Create some art first.");
      return;
    }
    
    const bestArt = player.artworks.reduce((best, art) => 
      art.value > best.value ? art : best
    );
    
    setPlayer(p => ({ 
      ...p, 
      money: p.money + bestArt.value,
      artworks: p.artworks.filter(a => a !== bestArt)
    }));
    
    showNotification(`Sold ${bestArt.name} for $${bestArt.value}! 💰`);
  };

  const tradeMaterials = () => {
    // Simple material trading
    if (player.inventory.CLAY >= 2) {
      setPlayer(p => ({
        ...p,
        inventory: {
          ...p.inventory,
          CLAY: p.inventory.CLAY - 2,
          GOLD_LEAF: (p.inventory.GOLD_LEAF || 0) + 1
        }
      }));
      showNotification("Traded 2 Clay for 1 Gold Leaf! ✨");
    } else {
      showNotification("You need at least 2 Clay to trade!");
    }
  };

  const learnRecipe = () => {
    showNotification("Learned new crafting technique! Check your crafting menu.");
  };

  const submitToGallery = () => {
    if (player.artworks.some(a => a.tier >= 2)) {
      gainReputation(50);
      showNotification("Your work was accepted! Welcome to the gallery! 🎉");
    } else {
      showNotification("Your work needs to be at least Tier 2 quality!");
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const renderTile = (tile, x, y) => {
    const tileX = x - cameraOffset.x;
    const tileY = y - cameraOffset.y;
    
    if (tileX < 0 || tileX >= VIEWPORT_WIDTH || tileY < 0 || tileY >= VIEWPORT_HEIGHT) {
      return null;
    }
    
    const style = {
      position: 'absolute',
      left: tileX * TILE_SIZE,
      top: tileY * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px'
    };
    
    const map = MAPS[currentMap];
    const npcKey = `${x},${y}`;
    const npc = map.npcs[npcKey];
    
    switch (tile) {
      case TILES.WALL:
        return <div key={`${x},${y}`} style={{ ...style, backgroundColor: '#374151' }}>🧱</div>;
      case TILES.DOOR:
        return <div key={`${x},${y}`} style={{ ...style, backgroundColor: '#92400e' }}>🚪</div>;
      case TILES.NPC:
        if (npc) {
          const character = CHARACTERS[npc.type];
          return (
            <div key={`${x},${y}`} style={{ ...style, backgroundColor: '#1f2937' }}>
              <span style={{ fontSize: '28px' }}>{character.icon}</span>
            </div>
          );
        }
        return null;
      case TILES.CRAFT_STATION:
        return <div key={`${x},${y}`} style={{ ...style, backgroundColor: '#7c3aed' }}>🎨</div>;
      case TILES.GALLERY:
        return <div key={`${x},${y}`} style={{ ...style, backgroundColor: '#059669' }}>🖼️</div>;
      case TILES.ITEM:
        return <div key={`${x},${y}`} style={{ ...style, backgroundColor: '#dc2626' }}>📦</div>;
      default:
        return <div key={`${x},${y}`} style={{ ...style, backgroundColor: '#111827' }} />;
    }
  };

  const renderPlayer = () => {
    const screenX = player.x - cameraOffset.x;
    const screenY = player.y - cameraOffset.y;
    
    if (screenX < 0 || screenX >= VIEWPORT_WIDTH || screenY < 0 || screenY >= VIEWPORT_HEIGHT) {
      return null;
    }
    
    return (
      <div
        style={{
          position: 'absolute',
          left: screenX * TILE_SIZE,
          top: screenY * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          zIndex: 10
        }}
      >
        🧑‍🎨
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>{player.reputation} Rep</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>{player.followers.toLocaleString()} Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>{player.money}</span>
            </div>
          </div>
          <div className="text-xl font-bold">{MAPS[currentMap].name}</div>
        </div>

        {/* Game View */}
        <div className="flex-1 flex items-center justify-center bg-gray-950 p-4">
          <div 
            className="relative bg-black border-2 border-gray-700"
            style={{ 
              width: VIEWPORT_WIDTH * TILE_SIZE, 
              height: VIEWPORT_HEIGHT * TILE_SIZE,
              boxShadow: '0 0 40px rgba(0,0,0,0.8)'
            }}
          >
            {/* Render visible tiles */}
            {MAPS[currentMap].tiles.map((row, y) =>
              row.map((tile, x) => renderTile(tile, x, y))
            )}
            
            {/* Render player */}
            {renderPlayer()}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4 text-center">
          <p className="text-sm text-gray-400">
            Use WASD or Arrow Keys to move • Press I for inventory • Interact with objects and NPCs
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Art World RPG</h2>
        
        {/* Current Drama */}
        {player.currentDrama && (
          <div className="mb-4 p-3 bg-red-900/50 rounded">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="font-bold">{player.currentDrama.title}</span>
            </div>
            <p className="text-sm">{player.currentDrama.description}</p>
          </div>
        )}
        
        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-700 p-2 rounded text-center">
            <Trophy className="w-6 h-6 mx-auto text-yellow-400 mb-1" />
            <div className="text-sm">Artworks</div>
            <div className="font-bold">{player.artworks.length}</div>
          </div>
          <div className="bg-gray-700 p-2 rounded text-center">
            <Star className="w-6 h-6 mx-auto text-purple-400 mb-1" />
            <div className="text-sm">Achievements</div>
            <div className="font-bold">{player.achievements.length}</div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-sm text-gray-400 space-y-2">
          <p>🎨 Create art at crafting stations</p>
          <p>💬 Talk to NPCs for quests and drama</p>
          <p>📈 Build your reputation and followers</p>
          <p>🚪 Move between areas through doors</p>
          <p>📦 Collect materials from item boxes</p>
        </div>
      </div>

      {/* Dialogue Modal */}
      {dialogue && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{dialogue.character}</span>
              <div>
                <h3 className="font-bold text-lg">{dialogue.name}</h3>
              </div>
            </div>
            <p className="mb-4">{dialogue.text}</p>
            <div className="space-y-2">
              {dialogue.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    option.effect();
                    setDialogue(null);
                  }}
                  className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Crafting Menu */}
      {craftingMenu && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Palette className="w-6 h-6" />
              Crafting Station
            </h2>
            
            <div className="space-y-4">
              {Object.entries(RECIPES).map(([key, recipe]) => {
                const canCraft = Object.entries(recipe.materials).every(
                  ([mat, qty]) => (player.inventory[mat] || 0) >= qty
                );
                
                return (
                  <div
                    key={key}
                    className={`p-4 rounded ${
                      canCraft ? 'bg-gray-700' : 'bg-gray-900 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{recipe.name}</h3>
                        <p className="text-sm text-gray-400">
                          Tier {recipe.tier} • +{recipe.reputation} Rep • ${recipe.value}
                        </p>
                      </div>
                      <button
                        onClick={() => craftArtwork(key)}
                        disabled={!canCraft}
                        className={`px-4 py-2 rounded ${
                          canCraft
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-gray-600 cursor-not-allowed'
                        }`}
                      >
                        Craft
                      </button>
                    </div>
                    <div className="flex gap-2 text-sm">
                      {Object.entries(recipe.materials).map(([mat, qty]) => (
                        <div
                          key={mat}
                          className={`flex items-center gap-1 ${
                            (player.inventory[mat] || 0) >= qty
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          <span>{MATERIALS[mat].icon}</span>
                          <span>
                            {player.inventory[mat] || 0}/{qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => setCraftingMenu(false)}
              className="mt-4 w-full p-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Inventory */}
      {inventoryOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6" />
              Inventory
            </h2>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              {Object.entries(player.inventory).map(([mat, qty]) => (
                <div
                  key={mat}
                  className="bg-gray-700 p-3 rounded text-center"
                >
                  <div className="text-2xl mb-1">{MATERIALS[mat]?.icon || '?'}</div>
                  <div className="text-sm font-bold">{qty}</div>
                  <div className="text-xs text-gray-400">
                    {MATERIALS[mat]?.name || mat}
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="font-bold mb-2">Artworks ({player.artworks.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {player.artworks.map((art, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded text-sm">
                  <span className="font-bold">{art.name}</span>
                  <span className="text-gray-400"> • Tier {art.tier} • ${art.value}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setInventoryOpen(false)}
              className="mt-4 w-full p-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Close (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg animate-bounce">
          {notification}
        </div>
      )}
    </div>
  );
};

export default Game;