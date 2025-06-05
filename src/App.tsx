import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronsUp, ChevronsDown, MapPin, Palette, Trophy, Coffee, Briefcase, Book, Home, Users, Clock, ShoppingBag, Feather, Shield, Target, Zap, TrendingUp, Shirt, Percent, Landmark, Handshake, Star, Award, BarChart } from 'lucide-react';

// --- HELPER FUNCTIONS ---
// Updated text wrapper: returns an array of lines and the total height.
const getWrappedLines = (ctx, text, maxWidth, font) => {
  ctx.font = font;
  const words = text.split(' ');
  let line = '';
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
};

const wrapAndDrawText = (ctx, text, x, y, maxWidth, lineHeight, style) => {
  // Set default styles
  const { fillStyle = '#FFFFFF', font = '16px Noto Sans', textAlign = 'left' } = style;

  // Get the lines of text
  const lines = getWrappedLines(ctx, text, maxWidth, font);

  ctx.fillStyle = fillStyle;
  ctx.font = font;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle'; // Consistent vertical alignment

  lines.forEach((line, index) => {
    const currentY = y + (index * lineHeight);
    let currentX = x;
    if (textAlign === 'center') {
      currentX = x + maxWidth / 2;
    } else if (textAlign === 'right') {
      currentX = x + maxWidth;
    }
    ctx.fillText(line, currentX, currentY);
  });

  // Return the total height of the text block, which is useful information
  return lines.length * lineHeight;
};

// A* Pathfinding (Unchanged from previous version)
const aStar = (start, end, map) => {
  const openSet = [start];
  const closedSet = new Set();
  const cameFrom = {};
  const gScore = {};
  gScore[`${start.x},${start.y}`] = 0;
  const fScore = {};
  fScore[`${start.x},${start.y}`] = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);

  const getNeighbors = (node) => {
    const neighbors = [];
    const { x, y } = node;
    const potentialNeighbors = [{ x, y: y - 1 }, { x, y: y + 1 }, { x: x - 1, y }, { x: x + 1, y }];
    return potentialNeighbors.filter(n =>
      n.y >= 0 && n.y < map.length && n.x >= 0 && n.x < map[0].length &&
      ![1, 7, 13, 19].includes(map[n.y][n.x])
    );
  };

  while (openSet.length > 0) {
    let lowestFIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (fScore[`${openSet[i].x},${openSet[i].y}`] < fScore[`${openSet[lowestFIndex].x},${openSet[lowestFIndex].y}`]) {
        lowestFIndex = i;
      }
    }
    const current = openSet[lowestFIndex];

    if (current.x === end.x && current.y === end.y) {
      const path = [current];
      let currentPathNode = current;
      while (cameFrom[`${currentPathNode.x},${currentPathNode.y}`]) {
        currentPathNode = cameFrom[`${currentPathNode.x},${currentPathNode.y}`];
        path.unshift(currentPathNode);
      }
      return path;
    }

    openSet.splice(lowestFIndex, 1);
    closedSet.add(`${current.x},${current.y}`);

    getNeighbors(current).forEach(neighbor => {
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) return;

      const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
        openSet.push(neighbor);
      } else if (tentativeGScore >= (gScore[neighborKey] || Infinity)) {
        return;
      }

      cameFrom[neighborKey] = current;
      gScore[neighborKey] = tentativeGScore;
      fScore[neighborKey] = tentativeGScore + Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
    });
  }
  return []; // No path found
};


const ArtGalleryRPG = () => {
  const canvasRef = useRef(null);
  const uiClickableElementsRef = useRef([]);
  const playerPathRef = useRef([]);
  const targetIndicatorRef = useRef(null);
  const keysRef = useRef({}); // *** CRITICAL FIX: Use ref for key state to prevent stale closures in game loop

  const [gameState, setGameState] = useState({
    player: {
      x: 5.5, y: 5.5, facing: 'down', sprite: 0, money: 500, reputation: 0, energy: 100,
      level: 1, exp: 0, title: 'Aspiring Artist',
      inventory: { paintings: 3, sculptures: 0, digitalArt: 0, coffee: 2, businessCards: 5 },
      skills: { artistic: 1, networking: 1, business: 1, curating: 1 },
      equipment: { brush: 'Basic Brush', outfit: 'Casual Clothes' },
      relationships: {}, quests: ['first_sale'], completedQuests: [], achievements: []
    },
    currentMap: 'studio', dialogue: null, menu: null, battle: null,
    time: 8, day: 1, weather: 'sunny', music: true, events: [],
    unlockedMaps: ['studio', 'gallery'], marketMultiplier: 1.0,
    gameTick: 0,
  });

  // animationFrame is used to trigger re-renders for the canvas, not for game logic timing.
  const [animationFrame, setAnimationFrame] = useState(0);

  // --- MAPS, TILES, SPRITES, QUESTS, ETC. ---
  const maps = { /* ... (Your existing maps data) ... */
    studio: {
      name: "Your Studio", width: 10, height: 10, bgm: 'peaceful',
      tiles: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 2, 2, 2, 2, 2, 2, 2, 2, 1], [1, 2, 3, 2, 2, 2, 2, 4, 2, 1], [1, 2, 2, 2, 2, 2, 2, 2, 2, 1], [1, 2, 2, 2, 2, 2, 2, 2, 2, 1], [1, 2, 2, 2, 2, 2, 2, 2, 2, 1], [1, 2, 5, 2, 2, 2, 2, 6, 2, 1], [1, 2, 2, 2, 2, 2, 2, 2, 2, 1], [1, 2, 2, 2, 2, 2, 2, 2, 2, 1], [1, 1, 1, 1, 0, 0, 1, 1, 1, 1]],
      objects: { '2,2': { type: 'easel', interaction: 'create_art', name: 'Easel' }, '7,2': { type: 'computer', interaction: 'check_market', name: 'Computer' }, '2,6': { type: 'bed', interaction: 'rest', name: 'Bed' }, '7,6': { type: 'bookshelf', interaction: 'study', name: 'Bookshelf' } },
      exits: { '4,9': { to: 'gallery', x: 5, y: 1 }, '5,9': { to: 'gallery', x: 5, y: 1 } }
    },
    gallery: {
      name: "Chelsea Gallery District", width: 20, height: 20, bgm: 'sophisticated',
      tiles: [[1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 7, 7, 7, 7, 2, 2, 2, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 1], [1, 7, 8, 8, 8, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 1], [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1], [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1], [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1], [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1], [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0], [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0], [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1], [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1], [1, 7, 8, 8, 8, 2, 2, 2, 8, 8, 8, 8, 8, 2, 2, 2, 8, 8, 7, 1], [1, 7, 7, 7, 7, 2, 2, 2, 7, 7, 7, 7, 7, 2, 2, 2, 7, 7, 7, 1], [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1], [1, 9, 9, 9, 9, 2, 2, 2, 9, 9, 9, 9, 9, 2, 2, 2, 10, 10, 10, 1], [1, 9, 11, 11, 11, 2, 2, 2, 11, 11, 11, 11, 11, 2, 2, 2, 12, 12, 12, 1], [1, 9, 11, 11, 11, 2, 2, 2, 11, 11, 11, 11, 11, 2, 2, 2, 12, 12, 12, 1], [1, 9, 11, 11, 11, 2, 2, 2, 11, 11, 11, 11, 11, 2, 2, 2, 12, 12, 12, 1], [1, 9, 9, 9, 9, 2, 2, 2, 9, 9, 9, 9, 9, 2, 2, 2, 10, 10, 10, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
      objects: { '3,2': { type: 'npc_collector', name: 'Victoria Sterling', interaction: 'talk_npc' }, '10,5': { type: 'npc_artist', name: 'Jackson Park', interaction: 'talk_npc' }, '6,10': { type: 'npc_critic', name: 'Eleanor Sharp', interaction: 'talk_npc' }, '15,7': { type: 'npc_gallerist', name: 'Marcus Chen', interaction: 'talk_npc' }, '5,15': { type: 'gallery_door', name: 'Pace Gallery', interaction: 'enter_gallery_pace' }, '16,15': { type: 'gallery_door', name: 'Rising Stars Gallery', interaction: 'enter_gallery_rising' }, '10,3': { type: 'info_board', interaction: 'check_events', name: 'Events Board' } },
      exits: { '5,0': { to: 'studio', x: 4, y: 8 }, '6,0': { to: 'studio', x: 5, y: 8 }, '7,0': { to: 'studio', x: 5, y: 8 }, '0,6': { to: 'brooklyn', x: 18, y: 7 }, '0,7': { to: 'brooklyn', x: 18, y: 8 }, '19,6': { to: 'soho', x: 1, y: 7 }, '19,7': { to: 'soho', x: 1, y: 8 } }
    },
    brooklyn: {
      name: "Brooklyn Art Scene", width: 20, height: 15, bgm: 'indie', locked: true, unlockReq: { reputation: 25 },
      tiles: [[13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13], [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 13], [13, 14, 2, 15, 15, 15, 2, 2, 2, 2, 2, 2, 2, 16, 16, 16, 2, 2, 14, 13], [13, 14, 2, 15, 2, 15, 2, 2, 2, 2, 2, 2, 2, 16, 2, 16, 2, 2, 14, 13], [13, 14, 2, 15, 15, 15, 2, 2, 2, 2, 2, 2, 2, 16, 16, 16, 2, 2, 14, 13], [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 0], [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 0], [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 13], [13, 14, 2, 17, 17, 17, 2, 2, 2, 2, 2, 2, 2, 18, 18, 18, 2, 2, 14, 13], [13, 14, 2, 17, 2, 17, 2, 2, 2, 2, 2, 2, 2, 18, 2, 18, 2, 2, 14, 13], [13, 14, 2, 17, 17, 17, 2, 2, 2, 2, 2, 2, 2, 18, 18, 18, 2, 2, 14, 13], [13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13], [13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
      objects: { '4,9': { type: 'warehouse_studio', name: 'Bushwick Collective Studio', interaction: 'enter_warehouse' }, '14,3': { type: 'coffee_shop', name: 'Grindhouse Coffee', interaction: 'enter_coffee_shop' }, '4,3': { type: 'street_vendor', name: 'Street Art Supplies', interaction: 'shop_street_supplies' }, '14,9': { type: 'thrift_store', name: 'Beacon\'s Closet (ish)', interaction: 'shop_thrift_store' }, '9,6': { type: 'npc_hipster', name: 'Ezra Moon', interaction: 'talk_npc' }, '7,2': { type: 'npc_muralist', name: 'Maya Rodriguez', interaction: 'talk_npc' } },
      exits: { '19,6': { to: 'gallery', x: 1, y: 6 }, '19,7': { to: 'gallery', x: 1, y: 7 } }
    },
    soho: {
      name: "SoHo Shopping District", width: 20, height: 15, bgm: 'upbeat', locked: true, unlockReq: { money: 2000 },
      tiles: [[19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19], [19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19], [19, 20, 21, 21, 21, 2, 2, 2, 2, 2, 2, 21, 21, 21, 2, 2, 2, 2, 20, 19], [0, 20, 21, 22, 21, 2, 2, 2, 2, 2, 2, 21, 23, 21, 2, 2, 2, 2, 20, 19], [0, 20, 21, 21, 21, 2, 2, 2, 2, 2, 2, 21, 21, 21, 2, 2, 2, 2, 20, 19], [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19], [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19], [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19], [19, 20, 24, 24, 24, 2, 2, 2, 2, 2, 2, 25, 25, 25, 2, 2, 2, 2, 20, 19], [19, 20, 24, 22, 24, 2, 2, 2, 2, 2, 2, 25, 22, 25, 2, 2, 2, 2, 20, 19], [19, 20, 24, 24, 24, 2, 2, 2, 2, 2, 2, 25, 25, 25, 2, 2, 2, 2, 20, 19], [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19], [19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19], [19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19], [19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19]],
      objects: { '3,3': { type: 'luxury_gallery', name: 'Gagosian Gallery (esque)', interaction: 'enter_luxury_gallery' }, '12,3': { type: 'art_supply_pro', name: 'Pro Art Supplies', interaction: 'shop_pro_supplies' }, '3,9': { type: 'fashion_boutique', name: 'Chic Boutique', interaction: 'shop_fashion_boutique' }, '12,9': { type: 'wine_bar', name: 'The Velvet Rope Wine Bar', interaction: 'network_wine_bar' }, '8,6': { type: 'npc_influencer', name: 'Chloe Kim', interaction: 'talk_npc' }, '6,11': { type: 'npc_dealer', name: 'Philippe Dubois', interaction: 'talk_npc' } },
      exits: { '0,3': { to: 'gallery', x: 18, y: 6 }, '0,4': { to: 'gallery', x: 18, y: 7 } }
    }
  };
  const tileColors = { 0: '#6c757d', 1: '#343a40', 2: '#adb5bd', 3: '#e9ecef', 4: '#ced4da', 5: '#dee2e6', 6: '#f8f9fa', 7: '#ffffff', 8: '#ffd700', 9: '#2F4F4F', 10: '#DC143C', 11: '#B0C4DE', 12: '#8B0000', 13: '#A0522D', 14: '#708090', 15: '#FF69B4', 16: '#F5F5DC', 17: '#654321', 18: '#FF4500', 19: '#E0E0E0', 20: '#C0C0C0', 21: '#ADD8E6', 22: '#DAA520', 23: '#3CB371', 24: '#800080', 25: '#4B0082', };
  const sprites = { player: { down: ['🚶', '🏃'], up: ['🚶', '🏃'], left: ['🚶', '🏃'], right: ['🚶', '🏃'] }, easel: '🖼️', computer: '💻', bed: '🛏️', bookshelf: '📚', gallery_door: '🚪', info_board: '📋', npc_collector: '🧐', npc_artist: '🧑‍🎨', npc_critic: '✒️', npc_gallerist: '🕴️', painting_wall: '🖼️', warehouse_studio: '🏭', coffee_shop: '☕', street_vendor: '🏪', thrift_store: '🧥', npc_hipster: '🧔', npc_muralist: '👩‍🎨', luxury_gallery: '🏛️', art_supply_pro: '🛍️', fashion_boutique: '👚', wine_bar: '🍷', npc_influencer: '🤳', npc_dealer: '💼', };
  const questDefinitions = { /* ... (Your existing questDefinitions data) ... */
    first_sale: { id: 'first_sale', name: 'First Sale', description: 'Create and sell your first artwork to a collector.', checkComplete: (gs) => gs.player.money > 500 && gs.player.completedQuests.length > 0, reward: { exp: 50, money: 100, reputation: 5 }, unlocksQuests: ['network_intro', 'brooklyn_scout'] },
    network_intro: { id: 'network_intro', name: 'Social Butterfly Basics', description: 'Meet 3 different people in the art world.', checkComplete: (gs) => Object.keys(gs.player.relationships).length >= 3, reward: { exp: 75, reputation: 10, item: { businessCards: 5 } } },
    brooklyn_scout: { id: 'brooklyn_scout', name: 'Brooklyn Bound', description: 'Unlock and visit the Brooklyn Art Scene district.', checkComplete: (gs) => gs.unlockedMaps.includes('brooklyn'), reward: { exp: 100, item: { coffee: 3 } }, unlocksQuests: ['soho_aspirations'] },
    masterpiece_quest: { id: 'masterpiece_quest', name: 'Create a Masterpiece', description: 'Create an artwork with a quality rating over 8.', checkComplete: (gs) => gs.player.achievements.includes('created_masterpiece'), reward: { exp: 200, reputation: 25, money: 500 } },
    gallery_show_prep: { id: 'gallery_show_prep', name: 'Road to Exhibition', description: 'Gain 50 reputation and speak to Marcus Chen in Chelsea.', checkComplete: (gs) => gs.player.reputation >= 50, reward: { exp: 150 }, unlocksQuests: ['first_exhibition'] },
    first_exhibition: { id: 'first_exhibition', name: 'My First Show!', description: 'Successfully host your first gallery exhibition (offered by Marcus Chen).', checkComplete: (gs) => gs.player.achievements.includes('hosted_gallery_show'), reward: { exp: 500, reputation: 100, money: 2000 } },
    soho_aspirations: { id: 'soho_aspirations', name: 'SoHo Dreams', description: 'Earn $2000 to unlock the SoHo district.', checkComplete: (gs) => gs.player.money >= 2000 && gs.unlockedMaps.includes('soho'), reward: { exp: 250, reputation: 20 } },
  };
  const playerTitles = [{ rep: 0, level: 1, title: 'Aspiring Artist' }, { rep: 20, level: 3, title: 'Emerging Talent' }, { rep: 50, level: 5, title: 'Studio Regular' }, { rep: 100, level: 8, title: 'Noticed Artist' }, { rep: 250, level: 12, title: 'Chelsea Contender' }, { rep: 500, level: 16, title: 'Brooklyn Star' }, { rep: 1000, level: 20, title: 'SoHo Sensation' }, { rep: 2000, level: 25, title: 'Living Legend' }];
  const battleActions = [{ id: 'defend_concept', name: 'Defend Concept', power: 25, accuracy: 0.9, cost: 10, skill: 'artistic', description: 'Explain your artistic vision.' }, { id: 'cite_history', name: 'Cite Art History', power: 20, accuracy: 1.0, cost: 15, skill: 'curating', description: 'Reference masters.' }, { id: 'charm_offensive', name: 'Charm Offensive', power: 15, accuracy: 0.8, cost: 10, skill: 'networking', description: 'Use charisma.' }, { id: 'technical_breakdown', name: 'Technical Breakdown', power: 30, accuracy: 0.7, cost: 20, skill: 'artistic', description: 'Detail skill.' }];
  const criticAttacks = [{ name: 'Skeptical Scrutiny', power: 15, accuracy: 0.9 }, { name: 'Derisive Dismissal', power: 25, accuracy: 0.7 }, { name: 'Academic Interrogation', power: 20, accuracy: 0.8 },];


  // --- INPUT & UI HANDLERS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      // Stop player pathfinding on manual movement
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        playerPathRef.current = [];
        targetIndicatorRef.current = null;
      }

      if (gameState.dialogue || gameState.menu || gameState.battle) {
        if (key === 'escape') {
          if (gameState.dialogue) closeDialogue();
          else if (gameState.menu) closeMenu();
        }
        return;
      }

      if (key === 'm') setGameState(prev => ({ ...prev, menu: prev.menu === 'status' ? null : 'status' }));
      if (key === 'i') setGameState(prev => ({ ...prev, menu: prev.menu === 'inventory' ? null : 'inventory' }));
      if (key === 'q') setGameState(prev => ({ ...prev, menu: prev.menu === 'quests' ? null : 'quests' }));
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const canvas = canvasRef.current;
    const handleWheel = (event) => {
      if (gameState.dialogue) {
        event.preventDefault();
        scrollDialogue(event.deltaY > 0 ? 1 : -1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas?.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas?.removeEventListener('wheel', handleWheel);
    };
  }, [gameState.dialogue, gameState.menu, gameState.battle]); // Rerun only when UI state changes to correctly manage event listeners


  // --- CANVAS CLICK HANDLER for MOVEMENT & UI ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;

      // --- UI Click Handling ---
      if (gameState.dialogue || gameState.menu || gameState.battle) {
        const clickableElements = [...uiClickableElementsRef.current];
        for (const element of clickableElements) {
          if (clickX >= element.x && clickX <= element.x + element.width &&
            clickY >= element.y && clickY <= element.y + element.height) {
            if (element.action) {
              element.action();
              return;
            }
          }
        }
        return;
      }

      // --- Game World Click Handling (Pathfinding) ---
      const TILE_SIZE = 32;
      const currentMapData = maps[gameState.currentMap];
      const camX = gameState.player.x * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
      const camY = gameState.player.y * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;
      const clampedCamX = Math.max(0, Math.min(camX, currentMapData.width * TILE_SIZE - canvas.width));
      const clampedCamY = Math.max(0, Math.min(camY, currentMapData.height * TILE_SIZE - canvas.height));
      const worldX = clickX + clampedCamX;
      const worldY = clickY + clampedCamY;
      const targetTileX = Math.floor(worldX / TILE_SIZE);
      const targetTileY = Math.floor(worldY / TILE_SIZE);

      if (targetTileY >= 0 && targetTileY < currentMapData.height && targetTileX >= 0 && targetTileX < currentMapData.width &&
        ![1, 7, 13, 19].includes(currentMapData.tiles[targetTileY][targetTileX])) {
        const startNode = { x: Math.floor(gameState.player.x), y: Math.floor(gameState.player.y) };
        const endNode = { x: targetTileX, y: targetTileY };
        const path = aStar(startNode, endNode, currentMapData.tiles);
        if (path.length > 0) {
          playerPathRef.current = path;
          targetIndicatorRef.current = { x: targetTileX, y: targetTileY, time: Date.now() };
        }
      }
    };
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gameState.dialogue, gameState.menu, gameState.battle, gameState.currentMap, gameState.player.x, gameState.player.y]);


  // --- GAME LOOP ---
  useEffect(() => {
    const renderLoop = setInterval(() => {
      setAnimationFrame(prev => (prev + 1));
    }, 1000 / 30); // ~30 FPS

    const logicLoop = setInterval(() => {
      setGameState(prev => {
        const keys = keysRef.current; // Use the ref for current key state
        let {
          player, currentMap, dialogue, menu, battle, time, day, weather, marketMultiplier, gameTick
        } = { ...prev };

        if (dialogue || menu || battle) {
          // Pause game logic when UI is open, but allow sprite animation to reset
          player.sprite = 0;
          return { ...prev, player };
        }

        let dx = 0, dy = 0;
        let moved = false;
        const moveSpeed = keys['shift'] ? 0.22 : 0.12;

        // Pathfinding Movement
        if (playerPathRef.current.length > 0) {
          const nextStep = playerPathRef.current[0];
          const targetX = nextStep.x + 0.5;
          const targetY = nextStep.y + 0.5;
          const distX = targetX - player.x;
          const distY = targetY - player.y;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance < moveSpeed) {
            player.x = targetX;
            player.y = targetY;
            playerPathRef.current.shift();
            if (playerPathRef.current.length === 0) targetIndicatorRef.current = null;
          } else {
            dx = (distX / distance);
            dy = (distY / distance);
          }
          moved = true;
        }
        // Keyboard Movement
        else {
          let keyDx = 0, keyDy = 0;
          if (keys['w'] || keys['arrowup']) { keyDy = -1; player.facing = 'up'; }
          if (keys['s'] || keys['arrowdown']) { keyDy = 1; player.facing = 'down'; }
          if (keys['a'] || keys['arrowleft']) { keyDx = -1; player.facing = 'left'; }
          if (keys['d'] || keys['arrowright']) { keyDx = 1; player.facing = 'right'; }
          if (keyDx !== 0 || keyDy !== 0) {
            dx = keyDx; dy = keyDy;
            moved = true;
          }
        }

        if (moved) {
          let targetX = player.x + dx * moveSpeed;
          let targetY = player.y + dy * moveSpeed;
          const currentMapData = maps[currentMap];

          // Simple collision check against the center of the next tile position
          const nextGridX = Math.floor(targetX + Math.sign(dx) * 0.4);
          const nextGridY = Math.floor(targetY + Math.sign(dy) * 0.4);

          if (currentMapData.tiles[nextGridY] && ![1, 7, 13, 19].includes(currentMapData.tiles[nextGridY][nextGridX])) {
            player.x = targetX;
            player.y = targetY;
          }
          player.sprite = Math.floor(animationFrame / 5) % 2;
        } else {
          player.sprite = 0;
        }


        // Clamp player position
        const currentMapData = maps[currentMap];
        player.x = Math.max(0, Math.min(player.x, currentMapData.width - 1));
        player.y = Math.max(0, Math.min(player.y, currentMapData.height - 1));

        // Interaction Check
        if (keys[' '] || keys['enter']) {
          const interactionResult = checkInteraction(player, currentMapData);
          if (interactionResult) {
            dialogue = interactionResult.dialogue || dialogue;
            menu = interactionResult.menu || menu;
            battle = interactionResult.battle || battle;
            // This consumes the key press so it doesn't re-trigger
            // while the dialogue box is opening.
            keysRef.current[' '] = false;
            keysRef.current['enter'] = false;
          }
          // keys[' '] = false; keys['enter'] = false; // Prevent repeated interaction
        }

        // Exit Check
        const pGridX = Math.floor(player.x + 0.5);
        const pGridY = Math.floor(player.y + 0.5);
        const exit = currentMapData.exits?.[`${pGridX},${pGridY}`];
        if (exit) {
          // ... (Your exit logic)
          currentMap = exit.to;
          player.x = exit.x + 0.5;
          player.y = exit.y + 0.5;
          playerPathRef.current = [];
        }


        // Time Progression
        if (gameTick % 100 === 0 && gameTick > 0) {
          time = (time + 1) % 24;
          if (time === 0) {
            day += 1;
            // ... your daily update logic
          }
        }

        return { ...prev, player, currentMap, dialogue, menu, battle, time, day, gameTick: gameTick + 1 };
      });
    }, 50); // 20Hz

    return () => {
      clearInterval(renderLoop);
      clearInterval(logicLoop);
    };
  }, []); // *** CRITICAL FIX: Empty dependency array ensures intervals are set only once.


  // --- QUESTS & PROGRESSION ---
  useEffect(() => {
    const activeQuests = gameState.player.quests.map(id => questDefinitions[id]).filter(q => q && !gameState.player.completedQuests.includes(q.id));
    activeQuests.forEach(quest => { if (quest.checkComplete(gameState)) { completeQuest(quest.id); } });

    const currentTitle = playerTitles.slice().reverse().find(t => gameState.player.reputation >= t.rep && gameState.player.level >= t.level);
    if (currentTitle && currentTitle.title !== gameState.player.title) {
      setGameState(prev => ({
        ...prev,
        player: { ...prev.player, title: currentTitle.title },
        dialogue: { title: "Rank Up!", text: `You are now known as: ${currentTitle.title}!`, options: [{ text: "Awesome!", action: closeDialogue }] }
      }));
    }

    const expNeeded = gameState.player.level * 100 * (1 + (gameState.player.level - 1) * 0.1);
    if (gameState.player.exp >= expNeeded) {
      setGameState(prev => ({
        ...prev,
        player: { ...prev.player, level: prev.player.level + 1, exp: prev.player.exp - expNeeded, energy: 100 },
        dialogue: { title: "LEVEL UP!", text: `You reached Level ${prev.player.level + 1}! Energy restored.`, options: [{ text: "Excellent!", action: closeDialogue }] }
      }));
    }
  }, [gameState.player.exp, gameState.player.reputation, gameState.player.level, gameState.player.money, gameState.unlockedMaps, gameState.player.achievements, gameState.player.relationships, gameState.player.quests]);


  // --- INTERACTIONS & CORE LOGIC ---
  const checkInteraction = (player, currentMapData) => {
    const p = player;
    const currentTileX = Math.floor(p.x + 0.5);
    const currentTileY = Math.floor(p.y + 0.5);

    // Create a list of tiles to check for interactions
    const tilesToCheck = [
      // First, check the tile the player is standing on
      `${currentTileX},${currentTileY}`
    ];

    // Second, determine the tile the player is facing and add it to the list
    let facingTileX = currentTileX;
    let facingTileY = currentTileY;
    if (p.facing === 'up') facingTileY -= 1;
    if (p.facing === 'down') facingTileY += 1;
    if (p.facing === 'left') facingTileX -= 1;
    if (p.facing === 'right') facingTileX += 1;

    // Add the facing tile only if it's different from the current one
    const facingTileKey = `${facingTileX},${facingTileY}`;
    if (facingTileKey !== tilesToCheck[0]) {
      tilesToCheck.push(facingTileKey);
    }

    // Loop through the tiles and return the first interaction found
    for (const key of tilesToCheck) {
      if (currentMapData.objects && currentMapData.objects[key]) {
        const obj = currentMapData.objects[key];
        // Pass the player state to handleInteraction
        return handleInteraction(obj.interaction, obj, p);
      }
    }

    return null; // No interaction found on any relevant tile
  };

  const handleInteraction = (interactionType, objData, player) => {
    if (interactionType === 'talk_npc') {
      handleNPCTalk(objData);
      return null;
    }
    switch (interactionType) {
      case 'create_art': return { menu: 'create_art' };
      case 'rest': return { menu: 'rest' };
      case 'study': return { menu: 'study' };
      case 'check_market': return { menu: 'market' };
      case 'enter_coffee_shop': shopCoffee(); return null;
      case 'shop_pro_supplies': return { menu: 'shop_pro_art_supplies' };
      case 'shop_fashion_boutique': return { menu: 'shop_fashion' };
      case 'network_wine_bar': networkAtWineBar(); return null;
      case 'enter_gallery_pace':
      case 'enter_gallery_rising':
      case 'enter_luxury_gallery':
        showMessage(objData.name, `You enter ${objData.name}.`); return null;
      case 'check_events': showMessage("Events Board", "Upcoming: 'New Wave Painters'. Eleanor Sharp expected."); return null;
      default: showMessage("Hmm...", "Nothing interesting here."); return null;
    }
  };

  const showMessage = (title, text, options = [{ text: "Okay", action: closeDialogue }]) => {
    setGameState(prev => ({
      ...prev,
      dialogue: { title, text, options, scroll: 0 } // Add scroll property
    }));
  };

  const scrollDialogue = (direction) => {
    setGameState(prev => {
      if (!prev.dialogue) return prev;
      const newScroll = prev.dialogue.scroll + direction;
      // Clamping will be handled during render as we need the line count
      return {
        ...prev,
        dialogue: { ...prev.dialogue, scroll: newScroll }
      };
    });
  };

  const closeDialogue = () => setGameState(prev => ({ ...prev, dialogue: null }));
  const closeMenu = () => setGameState(prev => ({ ...prev, menu: null }));
  // ... ALL your other game logic functions here ...
  // createArt, rest, study, handleNPCTalk, network, openSellArtMenu, sellArt,
  // shopCoffee, buyEquipmentItem, buyConsumableItem, networkAtWineBar,
  // completeQuest, startCritiqueBattle, handleBattleAction

  const createArt = (artType) => {
    setGameState(prev => {
      const player = prev.player; let energyCost = 0; let skillReq = 0; let artKey = ''; let baseQuality = player.skills.artistic;
      switch (artType) { case 'painting': energyCost = 25; skillReq = 1; artKey = 'paintings'; break; case 'sculpture': energyCost = 40; skillReq = 3; artKey = 'sculptures'; baseQuality *= 0.8; break; case 'digital': energyCost = 20; skillReq = 5; artKey = 'digitalArt'; baseQuality *= 1.1; break; }
      if (player.equipment.brush === 'Pro Brush Set') baseQuality += 1;
      if (player.energy < energyCost) { return { ...prev, dialogue: { title: "Too Tired", text: `Need ${energyCost} energy.`, options: [{ text: "OK", action: closeDialogue }] } }; }
      if (player.skills.artistic < skillReq) { return { ...prev, dialogue: { title: "Skill Lacking", text: `Need Artistic skill ${skillReq}.`, options: [{ text: "OK", action: closeDialogue }] } }; }
      const quality = Math.min(10, Math.max(1, Math.random() * 5 + baseQuality)).toFixed(1); const isMasterpiece = parseFloat(quality) >= 8.5;
      let newAchievements = player.achievements; if (isMasterpiece && !newAchievements.includes('created_masterpiece')) { newAchievements = [...newAchievements, 'created_masterpiece']; }
      const expGain = 10 + Math.floor(parseFloat(quality) * 2) + (isMasterpiece ? 50 : 0);
      return { ...prev, player: { ...player, energy: player.energy - energyCost, inventory: { ...player.inventory, [artKey]: player.inventory[artKey] + 1 }, skills: { ...player.skills, artistic: Math.min(10, player.skills.artistic + 0.1 + (isMasterpiece ? 0.2 : 0)) }, exp: player.exp + expGain, achievements: newAchievements }, dialogue: { title: "Artwork Created!", text: `Created ${isMasterpiece ? '✨MASTERPIECE✨ ' : ''}${artType} (Q: ${quality}/10).\n+${expGain} EXP.`, options: [{ text: "Excellent!", action: closeDialogue }] }, menu: null };
    });
  };
  const rest = (duration) => {
    setGameState(prev => {
      let energyGain = 0, timePassed = 0, newDay = prev.day, newTime = prev.time;
      if (duration === 'nap') { energyGain = 30; timePassed = 2; } else if (duration === 'sleep') { energyGain = 100; timePassed = 8; }
      newTime += timePassed; let daysPassed = 0; while (newTime >= 24) { newTime -= 24; daysPassed++; } newDay += daysPassed;
      if (duration === 'sleep' && newTime < 8) newTime = 8;
      let eventMsg = ""; if (duration === 'sleep' && Math.random() < 0.3) { eventMsg = "\nYou had a strange dream..."; }
      return { ...prev, player: { ...prev.player, energy: Math.min(100, prev.player.energy + energyGain) }, time: newTime, day: newDay, dialogue: { title: "Rested", text: `Gained ${energyGain} energy.${eventMsg}`, options: [{ text: "Refreshed!", action: closeDialogue }] }, menu: null };
    });
  };
  const study = (skillName) => {
    setGameState(prev => {
      const player = prev.player; const energyCost = 15; if (player.energy < energyCost) { return { ...prev, dialogue: { title: "Too Tired", text: `Need ${energyCost} energy.`, options: [{ text: "OK", action: closeDialogue }] } }; }
      const skillGain = 0.2 + (Math.random() * 0.1); const expGain = 15;
      return { ...prev, player: { ...player, energy: player.energy - energyCost, skills: { ...player.skills, [skillName]: Math.min(10, player.skills[skillName] + skillGain) }, exp: player.exp + expGain }, dialogue: { title: "Study Session", text: `Studied ${skillName}, skill improved. +${expGain} EXP.`, options: [{ text: "Knowledge!", action: closeDialogue }] }, menu: null };
    });
  };
  const handleNPCTalk = (npcData) => {
    setGameState(prev => {
      const player = prev.player; const npcName = npcData.name;
      const newRelationships = { ...player.relationships, [npcName]: (player.relationships[npcName] || 0) + 1 };
      const relationshipLevel = newRelationships[npcName];
      let dialogueText = `"${npcName} looks at you. `; let dialogueOptions = [{ text: "Goodbye.", action: closeDialogue }];
      if (relationshipLevel <= 1) dialogueText += `Sizing up."`; else if (relationshipLevel <= 5) dialogueText += `Polite nod."`; else dialogueText += `Greets warmly, '${player.title}!'."`;

      switch (npcData.type) {
        case 'npc_collector':
          const totalArt = player.inventory.paintings + player.inventory.sculptures + player.inventory.digitalArt;
          if (totalArt === 0) { dialogueText = `"No art to show? Come back when you have something to sell."` }
          else if (player.reputation < 5 && relationshipLevel < 3) { dialogueText = `"You need to make more of a name for yourself before I consider your work."` }
          else {
            dialogueText = `"Ah, ${player.title}. Do you have something exquisite for my collection?"`;
            dialogueOptions = [{ text: "Sell Art", action: () => openSellArtMenu(npcData) }, { text: "Network", action: () => { network(npcName, 'collector'); closeDialogue(); } }, { text: "Bye", action: closeDialogue }]
          }
          break;
        case 'npc_critic':
          if (player.skills.artistic < 2 && relationshipLevel < 2) { dialogueText = `"A bit derivative, don't you think? Develop your craft."` }
          else if (player.reputation < 10 && relationshipLevel < 4) {
            dialogueText = `"I've heard whispers about you. Are you prepared to defend your work?"`;
            dialogueOptions = [{ text: "Discuss (Battle!)", action: () => startCritiqueBattle(npcData) }, { text: "Not now.", action: closeDialogue }]
          } else {
            dialogueText = `"Ah, ${player.title}, always a pleasure. Shall we delve into the nuances of your latest endeavors?"`;
            dialogueOptions = [{ text: "Debate! (Battle)", action: () => startCritiqueBattle(npcData) }, { text: "Later.", action: closeDialogue }]
          }
          break;
        default:
          dialogueText = `${npcName} nods at you.`
      }
      return { ...prev, player: { ...player, relationships: newRelationships }, dialogue: { title: npcName, text: dialogueText, options: dialogueOptions } };
    });
  };
  const network = (npcName, npcType) => {
    setGameState(prev => {
      const player = prev.player; if (player.energy < 10) { return { ...prev, dialogue: { title: "Too Tired", text: "Need 10 energy.", options: [{ text: "OK", action: closeDialogue }] } }; }
      let repGain = 1 + Math.floor(player.skills.networking * 0.5); let expGain = 10;
      if (npcType === 'influencer') repGain *= 2; if (npcType === 'dealer') repGain += player.skills.business;
      return { ...prev, player: { ...player, energy: player.energy - 10, reputation: player.reputation + repGain, exp: player.exp + expGain, skills: { ...player.skills, networking: Math.min(10, player.skills.networking + 0.1) } }, dialogue: { title: "Networking Success!", text: `Chatted with ${npcName}.\n+${repGain} Rep, +${expGain} EXP.`, options: [{ text: "Cool!", action: closeDialogue }] } };
    });
  };
  const openSellArtMenu = (collectorData) => {
    setGameState(prev => {
      const player = prev.player;
      const artAvailable = [
        player.inventory.paintings > 0 ? { type: 'painting', key: 'paintings' } : null,
        player.inventory.sculptures > 0 ? { type: 'sculpture', key: 'sculptures' } : null,
        player.inventory.digitalArt > 0 ? { type: 'digitalArt', key: 'digitalArt' } : null
      ].filter(Boolean);

      if (artAvailable.length === 0) { return { ...prev, dialogue: { title: collectorData.name, text: "You have no art to sell!", options: [{ text: "OK", action: closeDialogue }] } }; }

      const options = artAvailable.map(art => {
        const basePrice = art.type === 'painting' ? 100 : art.type === 'sculpture' ? 150 : 80;
        const qualityFactor = 1 + (player.skills.artistic / 10);
        const equipmentBonus = player.equipment.brush === 'Pro Brush Set' ? 1.2 : 1.0;
        const marketPrice = Math.floor(basePrice * qualityFactor * equipmentBonus * prev.marketMultiplier * (1 + player.skills.business / 20));
        const reputationBonus = 1 + (player.reputation / 200);
        const finalPrice = Math.floor(marketPrice * reputationBonus);
        return { text: `Sell ${art.type} (Est: $${finalPrice})`, action: () => sellArt(art.key, finalPrice, collectorData.name) };
      });
      options.push({ text: "Nevermind", action: closeDialogue });
      return { ...prev, dialogue: { title: collectorData.name, text: "Which piece are you offering?", options: options } };
    });
  };
  const sellArt = (artKey, price, collectorName) => {
    setGameState(prev => {
      const newPlayer = { ...prev.player };
      newPlayer.money += price;
      newPlayer.reputation += 5 + Math.floor(price / 100);
      newPlayer.exp += 20 + Math.floor(price / 50);
      newPlayer.inventory = { ...newPlayer.inventory, [artKey]: newPlayer.inventory[artKey] - 1 };
      newPlayer.skills = { ...newPlayer.skills, business: Math.min(10, newPlayer.skills.business + 0.1) };
      return { ...prev, player: newPlayer, dialogue: { title: "Sale Successful!", text: `Sold to ${collectorName} for $${price}!\n+Rep, +EXP.`, options: [{ text: "Excellent!", action: closeDialogue }] } }
    });
  };
  const shopCoffee = () => {
    setGameState(prev => {
      const coffeePrice = 10; const energyBoost = 30;
      const options = [
        {
          text: `Buy Coffee ($${coffeePrice}) - Have ${prev.player.inventory.coffee}`, action: () => {
            setGameState(s => {
              if (s.player.money < coffeePrice) { return { ...s, dialogue: { title: "No Money", text: "Can't afford it.", options: [{ text: "OK", action: closeDialogue }] } }; }
              if (s.player.inventory.coffee >= 5) { return { ...s, dialogue: { title: "Too Much", text: "You're carrying too much coffee already.", options: [{ text: "OK", action: closeDialogue }] } }; }
              return { ...s, player: { ...s.player, money: s.player.money - coffeePrice, inventory: { ...s.player.inventory, coffee: s.player.inventory.coffee + 1 } }, dialogue: { title: "Coffee!", text: `You bought an artisanal coffee.`, options: [{ text: "Nice!", action: closeDialogue }] } };
            });
          }
        },
        {
          text: `Drink Coffee (Have ${prev.player.inventory.coffee})`, action: () => {
            setGameState(s => {
              if (s.player.inventory.coffee <= 0) { return { ...s, dialogue: { title: "No Coffee", text: "You don't have any to drink.", options: [{ text: "OK", action: closeDialogue }] } }; }
              return { ...s, player: { ...s.player, energy: Math.min(100, s.player.energy + energyBoost), inventory: { ...s.player.inventory, coffee: s.player.inventory.coffee - 1 } }, dialogue: { title: "Ahhh!", text: `You feel a surge of energy! +${energyBoost} Energy.`, options: [{ text: "Wired!", action: closeDialogue }] } };
            });
          }
        },
        { text: "Leave", action: closeDialogue }];
      return { ...prev, dialogue: { title: "Grindhouse Coffee", text: "Best brew in Brooklyn?", options: options } };
    });
  };
  const buyEquipmentItem = (itemType, itemName, price, skillBoost, skillName) => {
    setGameState(prev => {
      if (prev.player.money < price) { return { ...prev, dialogue: { title: "No Funds", text: `You need $${price}.`, options: [{ text: "OK", action: closeDialogue }] } }; }
      if (prev.player.equipment[itemType] === itemName) { return { ...prev, dialogue: { title: "Owned", text: `You already own the ${itemName}.`, options: [{ text: "OK", action: closeDialogue }] } }; }
      return { ...prev, player: { ...prev.player, money: prev.player.money - price, equipment: { ...prev.player.equipment, [itemType]: itemName }, skills: { ...prev.player.skills, [skillName]: Math.min(10, prev.player.skills[skillName] + skillBoost) } }, dialogue: { title: "Purchased!", text: `You bought the ${itemName}! ${skillName} +${skillBoost}.`, options: [{ text: "Great!", action: closeDialogue }] }, menu: null };
    });
  };
  const buyConsumableItem = (itemName, itemKey, price, amount) => {
    setGameState(prev => {
      if (prev.player.money < price) { return { ...prev, dialogue: { title: "No Funds", text: `You need $${price}.`, options: [{ text: "OK", action: closeDialogue }] } }; }
      return { ...prev, player: { ...prev.player, money: prev.player.money - price, inventory: { ...prev.player.inventory, [itemKey]: prev.player.inventory[itemKey] + amount } }, dialogue: { title: "Purchased!", text: `You bought ${amount} ${itemName}.`, options: [{ text: "Stocked!", action: closeDialogue }] }, menu: null };
    });
  };
  const networkAtWineBar = () => {
    setGameState(prev => {
      const player = prev.player; const cost = 50; if (player.money < cost) { return { ...prev, dialogue: { title: "No Funds", text: `It costs $${cost} for a glass of wine here.`, options: [{ text: "OK", action: closeDialogue }] } }; }
      if (player.energy < 20) { return { ...prev, dialogue: { title: "Too Tired", text: "You need more energy to network effectively.", options: [{ text: "OK", action: closeDialogue }] } }; }
      const outfitBonus = player.equipment.outfit === 'Designer Outfit' ? 1.5 : 1.0; const repGain = Math.floor((5 + player.skills.networking * 2) * outfitBonus); const expGain = 30 + Math.floor(player.skills.networking * 5);
      return { ...prev, player: { ...player, money: player.money - cost, energy: player.energy - 20, reputation: player.reputation + repGain, exp: player.exp + expGain, skills: { ...prev.player.skills, networking: Math.min(10, player.skills.networking + 0.2), } }, dialogue: { title: "SoHo Networking", text: `You made some important connections.\n+${repGain} Rep, +${expGain} EXP.`, options: [{ text: "Schmoozed!", action: closeDialogue }] } };
    });
  };
  const completeQuest = (questId) => {
    setGameState(prev => {
      const quest = questDefinitions[questId]; if (!quest || prev.player.completedQuests.includes(questId)) return prev;
      let rewardText = `Quest Complete: ${quest.name}!`; let playerUpdate = { ...prev.player };
      playerUpdate.exp += quest.reward.exp || 0; if (quest.reward.exp) rewardText += `\n+${quest.reward.exp} EXP`; playerUpdate.money += quest.reward.money || 0; if (quest.reward.money) rewardText += `\n+$${quest.reward.money}`; playerUpdate.reputation += quest.reward.reputation || 0; if (quest.reward.reputation) rewardText += `\n+${quest.reward.reputation} Rep`;
      if (quest.reward.item) { Object.keys(quest.reward.item).forEach(itemKey => { playerUpdate.inventory[itemKey] = (playerUpdate.inventory[itemKey] || 0) + quest.reward.item[itemKey]; rewardText += `\n+${quest.reward.item[itemKey]} ${itemKey}`; }); }
      playerUpdate.quests = playerUpdate.quests.filter(id => id !== questId); playerUpdate.completedQuests = [...playerUpdate.completedQuests, questId];
      if (quest.unlocksQuests) { quest.unlocksQuests.forEach(newQuestId => { if (!playerUpdate.quests.includes(newQuestId) && !playerUpdate.completedQuests.includes(newQuestId)) { playerUpdate.quests.push(newQuestId); rewardText += `\nNew Quest: ${questDefinitions[newQuestId]?.name || newQuestId}`; } }); }
      return { ...prev, player: playerUpdate, dialogue: { title: "Quest Complete!", text: rewardText, options: [{ text: "Onwards!", action: closeDialogue }] } };
    });
  };
  const startCritiqueBattle = (criticData) => {
    setGameState(prev => {
      if (prev.player.energy < 30) { return { ...prev, dialogue: { title: criticData.name, text: "You're too tired for a heated debate right now.", options: [{ text: "OK", action: closeDialogue }] } }; }
      return { ...prev, player: { ...prev.player, energy: prev.player.energy - 10 }, battle: { type: 'critique', opponent: { name: criticData.name, hp: 100, maxHp: 100, type: criticData.type }, player: { hp: 100, maxHp: 100 }, turn: 'player', log: [`${criticData.name} challenges your artistic vision! "Defend your work!"`] }, dialogue: null, menu: null };
    });
  };
  const handleBattleAction = (action) => {
    setGameState(prev => {
      const battle = prev.battle; if (!battle || battle.turn !== 'player') return prev;
      let newBattle = JSON.parse(JSON.stringify(battle)); newBattle.log = []; const playerSkill = prev.player.skills[action.skill] || 1; const energyCost = action.cost;
      let newPlayerState = { ...prev.player };

      if (newPlayerState.energy < energyCost) { newBattle.log.push(`You're too flustered to use "${action.name}".`); }
      else {
        newPlayerState.energy -= energyCost;
        const hitChance = action.accuracy * (1 + playerSkill / 20); const didHit = Math.random() < hitChance; newBattle.log.push(`You attempt to "${action.name}".`);
        if (didHit) { const damage = Math.floor(action.power * (1 + playerSkill / 10) * (Math.random() * 0.4 + 0.8)); newBattle.opponent.hp = Math.max(0, newBattle.opponent.hp - damage); newBattle.log.push(`It's compelling! The critic loses ${damage} composure.`); if (action.skill) { newPlayerState.skills = { ...newPlayerState.skills, [action.skill]: Math.min(10, newPlayerState.skills[action.skill] + 0.05) }; } }
        else { newBattle.log.push(`Your argument falls flat...`); }
      }

      if (newBattle.opponent.hp <= 0) {
        newBattle.log.push(`${newBattle.opponent.name} is speechless! "Remarkable..."`);
        const repGain = 50 + Math.floor(newPlayerState.skills.artistic * 2);
        newPlayerState.reputation += repGain;
        newPlayerState.exp += 100;
        newPlayerState.energy = Math.max(10, newPlayerState.energy);
        return { ...prev, player: newPlayerState, battle: null, dialogue: { title: "Debate Won!", text: `You successfully defended your art against ${newBattle.opponent.name}!\n+${repGain} Rep, +100 EXP.`, options: [{ text: "Vindicated!", action: closeDialogue }] } };
      }

      newBattle.turn = 'opponent';

      setTimeout(() => {
        setGameState(latestState => {
          const currentBattle = latestState.battle;
          if (!currentBattle || currentBattle.turn !== 'opponent' || currentBattle.opponent.hp <= 0) return latestState;

          let opponentBattle = JSON.parse(JSON.stringify(currentBattle)); const criticAction = criticAttacks[Math.floor(Math.random() * criticAttacks.length)]; opponentBattle.log.push(`${opponentBattle.opponent.name} counters with: "${criticAction.name}"!`); const didHitOpponent = Math.random() < criticAction.accuracy;
          if (didHitOpponent) { const damage = Math.floor(criticAction.power * (Math.random() * 0.4 + 0.8)); opponentBattle.player.hp = Math.max(0, opponentBattle.player.hp - damage); opponentBattle.log.push(`The critique stings! You lose ${damage} composure.`) } else { opponentBattle.log.push(`Their point misses the mark!`) }

          if (opponentBattle.player.hp <= 0) {
            opponentBattle.log.push(`You feel overwhelmed and concede the point.`);
            let finalPlayerState = { ...latestState.player };
            finalPlayerState.reputation = Math.max(0, finalPlayerState.reputation - 10); finalPlayerState.exp += 20; finalPlayerState.energy = Math.max(0, finalPlayerState.energy - 20);
            return { ...latestState, player: finalPlayerState, battle: null, dialogue: { title: "Debate Lost...", text: `You couldn't quite sway ${opponentBattle.opponent.name}.\n-10 Rep, +20 EXP.`, options: [{ text: "I'll be back.", action: closeDialogue }] } };
          }
          opponentBattle.turn = 'player';
          return { ...latestState, battle: opponentBattle };
        });
      }, 1500);
      return { ...prev, player: newPlayerState, battle: newBattle };
    });
  };



  // --- CANVAS RENDERING ---
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const TILE_SIZE = 32;
    const RENDER_WIDTH_TILES = 15; const RENDER_HEIGHT_TILES = 15;
    canvas.width = RENDER_WIDTH_TILES * TILE_SIZE;
    canvas.height = RENDER_HEIGHT_TILES * TILE_SIZE;

    uiClickableElementsRef.current = [];

    // Camera setup
    const camX = gameState.player.x * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
    const camY = gameState.player.y * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;
    const currentMapData = maps[gameState.currentMap];
    const clampedCamX = Math.max(0, Math.min(camX, currentMapData.width * TILE_SIZE - canvas.width));
    const clampedCamY = Math.max(0, Math.min(camY, currentMapData.height * TILE_SIZE - canvas.height));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-clampedCamX, -clampedCamY);

    // Render Tiles
    const startCol = Math.floor(clampedCamX / TILE_SIZE);
    const endCol = startCol + RENDER_WIDTH_TILES + 1;
    const startRow = Math.floor(clampedCamY / TILE_SIZE);
    const endRow = startRow + RENDER_HEIGHT_TILES + 1;

    for (let r = startRow; r < Math.min(endRow, currentMapData.height); r++) {
      for (let c = startCol; c < Math.min(endCol, currentMapData.width); c++) {
        if (r < 0 || c < 0) continue;
        const tileVal = currentMapData.tiles[r]?.[c];
        if (tileVal !== undefined) {
          ctx.fillStyle = tileColors[tileVal] || '#FF00FF';
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Render Objects
    Object.entries(currentMapData.objects).forEach(([posKey, objData]) => {
      const [objMapX, objMapY] = posKey.split(',').map(Number);
      ctx.font = `${TILE_SIZE * 0.7}px Noto Color Emoji, Apple Color Emoji, Segoe UI Emoji`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sprites[objData.type] || '?', objMapX * TILE_SIZE + TILE_SIZE / 2, objMapY * TILE_SIZE + TILE_SIZE / 2 + 2);
    });

    // Render Target Indicator
    if (targetIndicatorRef.current) {
      const { x, y, time } = targetIndicatorRef.current;
      const alpha = 1 - Math.min(1, (Date.now() - time) / 500);
      if (alpha <= 0) {
        targetIndicatorRef.current = null;
      } else {
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      }
    }


    // Render Player
    ctx.font = `${TILE_SIZE * 0.7}px Noto Color Emoji, Apple Color Emoji, Segoe UI Emoji`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const playerSprite = sprites.player[gameState.player.facing][gameState.player.sprite];
    ctx.fillText(playerSprite, gameState.player.x * TILE_SIZE + TILE_SIZE / 2, gameState.player.y * TILE_SIZE + TILE_SIZE / 2 + 2);

    ctx.restore(); // Restore from camera translation


    // --- UI Rendering ---
    const drawRoundedRect = (x, y, w, h, r, fill, stroke = null) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width; ctx.stroke(); } };
    const addClickable = (x, y, width, height, action) => { uiClickableElementsRef.current.push({ x, y, width, height, action }); };

    // --- DIALOGUE RENDERING (REVISED) ---
    if (gameState.dialogue) {
      const d = gameState.dialogue;
      const boxWidth = canvas.width * 0.8;
      const boxHeight = 220; // Fixed height for scrollable area
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = (canvas.height - boxHeight) / 2;
      const padding = 20;
      const lineHeight = 22;
      const buttonHeight = 40;

      // Background overlay
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dialogue box
      drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 10, 'rgba(30,41,59,0.95)', { color: 'rgba(71,85,105,1)', width: 2 });

      // Title
      wrapAndDrawText(ctx, d.title || "Notification", boxX, boxY + padding, boxWidth, 28, { fillStyle: '#A78BFA', font: 'bold 20px Noto Sans', textAlign: 'center' });

      // --- Text Area & Scrolling Logic ---
      const textAreaX = boxX + padding;
      const textAreaY = boxY + padding + 40;
      const textAreaWidth = boxWidth - padding * 2;
      const textAreaHeight = boxHeight - (padding * 2 + 40 + buttonHeight + 10); // Reserve space for title and buttons

      const textFont = '16px Noto Sans';
      const lines = getWrappedLines(ctx, d.text, textAreaWidth, textFont);
      const maxVisibleLines = Math.floor(textAreaHeight / lineHeight);

      // Clamp scroll value
      const maxScroll = Math.max(0, lines.length - maxVisibleLines);
      d.scroll = Math.max(0, Math.min(d.scroll, maxScroll));

      // Draw scroll indicators if needed
      if (maxScroll > 0) {
        const scrollbarX = textAreaX + textAreaWidth + 5;
        // Up Arrow
        drawRoundedRect(scrollbarX, textAreaY, 20, 20, 5, d.scroll > 0 ? '#7C3AED' : '#4B5563');
        addClickable(scrollbarX, textAreaY, 20, 20, () => scrollDialogue(-1));
        // Down Arrow
        drawRoundedRect(scrollbarX, textAreaY + textAreaHeight - 20, 20, 20, 5, d.scroll < maxScroll ? '#7C3AED' : '#4B5563');
        addClickable(scrollbarX, textAreaY + textAreaHeight - 20, 20, 20, () => scrollDialogue(1));
      }

      // Clip the text area and draw visible lines
      ctx.save();
      ctx.beginPath();
      ctx.rect(textAreaX, textAreaY, textAreaWidth, textAreaHeight);
      ctx.clip();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = textFont;
      ctx.textAlign = 'left';
      for (let i = 0; i < maxVisibleLines; i++) {
        const lineIndex = d.scroll + i;
        if (lineIndex < lines.length) {
          ctx.fillText(lines[lineIndex], textAreaX, textAreaY + (i * lineHeight) + lineHeight / 1.5);
        }
      }
      ctx.restore();

      // Options Buttons
      const optionsY = boxY + boxHeight - padding - buttonHeight;
      d.options.forEach((opt, idx) => {
        // Basic layout for single button, can be expanded for more
        const btnX = boxX + padding;
        const btnWidth = boxWidth - padding * 2;
        drawRoundedRect(btnX, optionsY, btnWidth, buttonHeight, 5, '#7C3AED', { color: '#6D28D9', width: 1 });
        wrapAndDrawText(ctx, opt.text, btnX, optionsY + buttonHeight / 2 - (lineHeight / 3), btnWidth, lineHeight, { fillStyle: '#FFFFFF', font: 'bold 15px Noto Sans', textAlign: 'center' });
        addClickable(btnX, optionsY, btnWidth, buttonHeight, opt.action);
      });
    }

    if (gameState.menu) {
      // ... (Your existing menu drawing logic) ...
      const menu = gameState.menu; const boxWidth = canvas.width * 0.9; const boxHeight = canvas.height * 0.85;
      const boxX = (canvas.width - boxWidth) / 2; const boxY = (canvas.height - boxHeight) / 2;
      const padding = 20; const lineHeight = 20; const itemHeight = 30; const buttonHeight = 40; const buttonMargin = 8; let currentY = boxY + padding;
      ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 10, 'rgba(30,41,59,0.98)', { color: 'rgba(71,85,105,1)', width: 2 });
      const drawMenuTitle = (title) => { wrapAndDrawText(ctx, title, boxX, currentY + 10, boxWidth, 28, { fillStyle: '#A78BFA', font: 'bold 24px Noto Sans', textAlign: 'center' }); currentY += 45; };
      const drawMenuText = (text, color = '#CBD5E1', size = '15px', align = 'left', isBold = false, customMaxWidth = null) => {
        const textMaxWidth = customMaxWidth || boxWidth - padding * 2;
        const textX = align === 'center' ? boxX + (boxWidth - textMaxWidth) / 2 : boxX + padding;

        currentY += wrapAndDrawText(ctx, text, textX, currentY, textMaxWidth, lineHeight, {
          fillStyle: color,
          font: `${isBold ? 'bold ' : ''}${size} Noto Sans`,
          textAlign: align
        });
      }; const drawMenuButton = (text, action, bgColor = '#7C3AED', textColor = '#FFFFFF', disabled = false) => { const btnX = boxX + padding; const btnWidth = boxWidth - padding * 2; const finalBgColor = disabled ? '#4B5563' : bgColor; const finalTextColor = disabled ? '#9CA3AF' : textColor; drawRoundedRect(btnX, currentY, btnWidth, buttonHeight, 5, finalBgColor); wrapAndDrawText(ctx, text, btnX, currentY + buttonHeight / 2 - lineHeight / 3, btnWidth, lineHeight, { fillStyle: finalTextColor, font: 'bold 15px Noto Sans', textAlign: 'center' }); if (!disabled) addClickable(btnX, currentY, btnWidth, buttonHeight, action); currentY += buttonHeight + buttonMargin; };
      const drawProgressBar = (value, max, barColor = '#22C55E') => { const barWidth = boxWidth - padding * 2; const barX = boxX + padding; drawRoundedRect(barX, currentY, barWidth, 12, 6, '#334155'); const progressWidth = Math.max(0, (value / max) * barWidth); if (progressWidth > 0) drawRoundedRect(barX, currentY, progressWidth, 12, 6, barColor); currentY += 18; }
      const p = gameState.player;
      // Menu specific drawing
      if (menu === 'status') {/* ... status menu ... */ drawMenuTitle("Player Status"); drawMenuText(`Title: ${p.title}`, '#A78BFA', '16px', 'left', true); drawMenuText(`Level: ${p.level} (EXP: ${p.exp.toFixed(0)} / ${(p.level * 100 * (1 + (p.level - 1) * 0.1)).toFixed(0)})`); drawProgressBar(p.exp, p.level * 100 * (1 + (p.levedrawMenuTextl - 1) * 0.1)); (`Money: $${p.money}`, '#4ADE80'); drawMenuText(`Reputation: ${p.reputation}`, '#FACC15'); drawMenuText(`Energy: ${p.energy}/100`); drawProgressBar(p.energy, 100, '#38BDF8'); currentY += lineHeight; drawMenuText("Skills:", '#A78BFA', '18px', 'left', true); Object.entries(p.skills).forEach(([skill, val]) => drawMenuText(`${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${val.toFixed(1)}/10`)); currentY += lineHeight; drawMenuText("Equipment:", '#A78BFA', '18px', 'left', true); drawMenuText(`Brush: ${p.equipment.brush}`); drawMenuText(`Outfit: ${p.equipment.outfit}`); }
      else if (menu === 'inventory') {
        /* ... inventory menu ... */
        drawMenuTitle("Inventory");
        const inv = p.inventory;
        drawMenuText(`Paintings: ${inv.paintings}`, '#FDE047');
        drawMenuText(`Sculptures: ${inv.sculptures}`, '#FDE047');
        drawMenuText(`Digital Art: ${inv.digitalArt}`, '#FDE047');
        currentY += lineHeight / 2; ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(boxX + padding, currentY);
        ctx.lineTo(boxX + boxWidth - padding, currentY);
        ctx.stroke(); currentY += lineHeight / 2;
        drawMenuText(`Coffee: ${inv.coffee}`, '#FDE047');
        drawMenuText(`Business Cards: ${inv.businessCards}`, '#FDE047');
      }
      else if (menu === 'quests') {
        drawMenuTitle("Quests & Achievements");

        // --- Active Quests Section ---
        wrapAndDrawText(ctx, "Active Quests:", boxX + padding, currentY, boxWidth - padding * 2, lineHeight, {
          fillStyle: '#A78BFA',
          font: 'bold 18px Noto Sans',
          textAlign: 'left'
        });
        currentY += 30;

        if (p.quests.length > 0) {
          p.quests.map(id => questDefinitions[id]).filter(q => q).forEach(q => {
            drawRoundedRect(boxX + padding, currentY, boxWidth - padding * 2, itemHeight * 2.5, 5, 'rgba(71,85,105,0.5)');

            // Corrected Quest Name
            wrapAndDrawText(ctx, q.name, boxX + padding * 1.5, currentY + 18, boxWidth - padding * 3, lineHeight, {
              fillStyle: '#C4B5FD',
              font: 'bold 15px Noto Sans',
              textAlign: 'left'
            });

            // Corrected Quest Description
            wrapAndDrawText(ctx, q.description, boxX + padding * 1.5, currentY + 40, boxWidth - padding * 3, 14, {
              fillStyle: '#D1D5DB',
              font: '13px Noto Sans',
              textAlign: 'left'
            });

            currentY += itemHeight * 2.5 + buttonMargin;
          });
        } else {
          wrapAndDrawText(ctx, "No active quests.", boxX + padding, currentY, boxWidth - padding * 2, lineHeight, {
            fillStyle: '#9CA3AF',
            font: '15px Noto Sans',
            textAlign: 'left'
          });
          currentY += 30;
        }

        currentY += lineHeight * 0.5;

        // --- Other Sections ---
        wrapAndDrawText(ctx, "Completed Quests:", boxX + padding, currentY, boxWidth - padding * 2, lineHeight, {
          fillStyle: '#A78BFA',
          font: 'bold 18px Noto Sans',
          textAlign: 'left'
        });
        currentY += 30;
        /*...completed quests...*/

        wrapAndDrawText(ctx, "Achievements:", boxX + padding, currentY, boxWidth - padding * 2, lineHeight, {
          fillStyle: '#A78BFA',
          font: 'bold 18px Noto Sans',
          textAlign: 'left'
        });
        currentY += 30;
        /*...achievements...*/
      }

      else if (menu === 'market') {
        drawMenuTitle("Market Analysis");
        const marketStatus = gameState.marketMultiplier > 1.1 ? "Hot!" : gameState.marketMultiplier < 0.9 ? "Cool..." : "Stable";
        const colorClass = gameState.marketMultiplier > 1.1 ? '#4ADE80' : gameState.marketMultiplier < 0.9 ? '#F87171' : '#FACC15';

        wrapAndDrawText(ctx, `Multiplier: ${gameState.marketMultiplier.toFixed(2)}x`, boxX, currentY, boxWidth, lineHeight, {
          fillStyle: colorClass,
          font: 'bold 24px Noto Sans',
          textAlign: 'center'
        });
        currentY += 30;

        wrapAndDrawText(ctx, `Status: ${marketStatus}`, boxX, currentY, boxWidth, lineHeight, {
          fillStyle: colorClass,
          font: '18px Noto Sans',
          textAlign: 'center'
        });
        currentY += 30;

        wrapAndDrawText(ctx, "Affects art sale prices. Changes daily. Higher Business skill also helps!", boxX, currentY, boxWidth, lineHeight, {
          fillStyle: '#9CA3AF',
          font: '13px Noto Sans',
          textAlign: 'center'
        });
      }

      else if (menu === 'create_art') {
        drawMenuTitle("Create Art");

        wrapAndDrawText(ctx, `Energy: ${p.energy}/100 | Artistic: ${p.skills.artistic.toFixed(1)}`, boxX, currentY, boxWidth, lineHeight, {
          fillStyle: '#CBD5E1',
          font: '15px Noto Sans',
          textAlign: 'center'
        });
        currentY += 30;

        drawMenuButton("Paint (25 EGY, Skill 1+)", () => createArt('painting'), '#3B82F6');
        drawMenuButton("Sculpt (40 EGY, Skill 3+)", () => createArt('sculpture'), '#22C55E', undefined, p.skills.artistic < 3);
        drawMenuButton("Digital Art (20 EGY, Skill 5+)", () => createArt('digital'), '#8B5CF6', undefined, p.skills.artistic < 5);
      }

      else if (menu === 'rest') {
        drawMenuTitle("Rest");

        wrapAndDrawText(ctx, `Time: ${gameState.time}:00, Day ${gameState.day} | Energy: ${p.energy}/100`, boxX, currentY, boxWidth, lineHeight, {
          fillStyle: '#CBD5E1',
          font: '15px Noto Sans',
          textAlign: 'center'
        });
        currentY += 30;

        drawMenuButton("Nap (2 Hrs, +30 Energy)", () => rest('nap'), '#38BDF8');
        drawMenuButton("Sleep (Until 8 AM, +100 Energy)", () => rest('sleep'), '#64748B');
      }

      else if (menu === 'study') {
        drawMenuTitle("Study");

        wrapAndDrawText(ctx, `Energy: ${p.energy}/100`, boxX, currentY, boxWidth, lineHeight, {
          fillStyle: '#CBD5E1',
          font: '15px Noto Sans',
          textAlign: 'center'
        });
        currentY += 30;

        drawMenuButton("Artistic (15 EGY)", () => study('artistic'), '#EF4444');
        drawMenuButton("Networking (15 EGY)", () => study('networking'), '#F59E0B');
        drawMenuButton("Business (15 EGY)", () => study('business'), '#10B981');
        drawMenuButton("Curating (15 EGY)", () => study('curating'), '#0EA5E9');
      }

      else if (menu === 'shop_pro_art_supplies') {
        drawMenuTitle("Pro Art Supplies (SoHo)");

        wrapAndDrawText(ctx, `Money: $${p.money}`, boxX, currentY, boxWidth, lineHeight, {
          fillStyle: '#CBD5E1',
          font: '15px Noto Sans',
          textAlign: 'center'
        });
        currentY += 30;

        drawMenuButton(`Pro Brush Set ($500) ${p.equipment.brush === 'Pro Brush Set' ? "(Owned)" : ""}`, () => buyEquipmentItem('brush', 'Pro Brush Set', 500, 1, 'artistic'), '#14B8A6', undefined, p.equipment.brush === 'Pro Brush Set');
        drawMenuButton("Premium Business Cards (20x) ($50)", () => buyConsumableItem('Business Cards', 'businessCards', 50, 20), '#F97316');
      }

      else if (menu === 'shop_fashion') {
        drawMenuTitle("Chic Boutique (SoHo)");

        wrapAndDrawText(ctx, `Money: $${p.money}`, boxX, currentY, boxWidth, lineHeight, {
          fillStyle: '#CBD5E1',
          font: '15px Noto Sans',
          textAlign: 'center'
        });
        currentY += 30;

        drawMenuButton(`Designer Outfit ($1000) ${p.equipment.outfit === 'Designer Outfit' ? "(Owned)" : ""}`, () => buyEquipmentItem('outfit', 'Designer Outfit', 1000, 1, 'networking'), '#EC4899', undefined, p.equipment.outfit === 'Designer Outfit');

        wrapAndDrawText(ctx, "More styles coming soon!", boxX, currentY, boxWidth, lineHeight, {
          fillStyle: '#6B7280',
          font: '12px Noto Sans',
          textAlign: 'center'
        });
      } else { drawMenuText(`Menu: ${menu} (Canvas Incomplete)`); }
      const closeBtnYActual = Math.min(currentY + buttonMargin, boxY + boxHeight - padding - buttonHeight); // Ensure close button is within bounds
      drawRoundedRect(boxX + padding, closeBtnYActual, boxWidth - padding * 2, buttonHeight, 5, '#DC2626');
      wrapAndDrawText(ctx, "Close", boxX + padding, closeBtnYActual + buttonHeight / 2 - lineHeight / 3, boxWidth - padding * 2, lineHeight, { fillStyle: '#FFFFFF', font: 'bold 16px Noto Sans', textAlign: 'center' });
      addClickable(boxX + padding, closeBtnYActual, boxWidth - padding * 2, buttonHeight, closeMenu);
    }

    if (gameState.battle) {
      // ... (Your existing battle drawing logic) ...
      const battle = gameState.battle; const player = gameState.player; const boxWidth = canvas.width * 0.95; const boxHeight = canvas.height * 0.9; const boxX = (canvas.width - boxWidth) / 2; const boxY = (canvas.height - boxHeight) / 2; const padding = 15; const lineHeight = 18; let currentY = boxY + padding;
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 10, 'rgba(30,41,59,0.98)', { color: 'rgba(220,38,38,0.7)', width: 2 });
      wrapAndDrawText(ctx, battle.opponent.name, boxX, currentY + 10, boxWidth, 24, { fillStyle: '#F87171', font: 'bold 20px Noto Sans', textAlign: 'center' }); currentY += 30;
      wrapAndDrawText(ctx, `Composure: ${battle.opponent.hp}/${battle.opponent.maxHp}`, boxX, currentY, boxWidth, lineHeight, { fillStyle: '#E2E8F0', font: '14px Noto Sans', textAlign: 'center' }); currentY += lineHeight;
      const oppBarX = boxX + padding * 2; const barWidth = boxWidth - padding * 4; drawRoundedRect(oppBarX, currentY, barWidth, 10, 5, '#475569'); drawRoundedRect(oppBarX, currentY, Math.max(0, (battle.opponent.hp / battle.opponent.maxHp) * barWidth), 10, 5, '#EF4444'); currentY += 25;
      const logBoxHeight = 70; drawRoundedRect(boxX + padding, currentY, boxWidth - padding * 2, logBoxHeight, 5, 'rgba(51,65,85,0.7)'); let logTextY = currentY + 10; battle.log.slice(-3).forEach(entry => { wrapAndDrawText(ctx, `> ${entry}`, boxX + padding + 10, logTextY, boxWidth - padding * 2 - 20, 15, { fillStyle: '#9CA3AF', font: '13px Noto Sans', textAlign: 'left' }); logTextY += 16; }); currentY += logBoxHeight + 15;
      wrapAndDrawText(ctx, `${player.title} (You)`, boxX, currentY + 10, boxWidth, 22, { fillStyle: '#60A5FA', font: 'bold 18px Noto Sans', textAlign: 'center' }); currentY += 28;
      wrapAndDrawText(ctx, `Composure: ${battle.player.hp}/${battle.player.maxHp}`, boxX, currentY, boxWidth, lineHeight, { fillStyle: '#E2E8F0', font: '14px Noto Sans', textAlign: 'center' }); currentY += lineHeight;
      drawRoundedRect(oppBarX, currentY, barWidth, 10, 5, '#475569'); drawRoundedRect(oppBarX, currentY, Math.max(0, (battle.player.hp / battle.player.maxHp) * barWidth), 10, 5, '#3B82F6'); currentY += 15;
      wrapAndDrawText(ctx, `Energy: ${player.energy}`, boxX, currentY, boxWidth, 14, { fillStyle: '#9CA3AF', font: '13px Noto Sans', textAlign: 'center' }); currentY += 25;
      if (battle.turn === 'player') {
        const actionButtonHeight = 35; const actionButtonWidth = (boxWidth - padding * 2 - padding) / 2; battleActions.forEach((action, idx) => { const btnX = boxX + padding + (idx % 2) * (actionButtonWidth + padding); const btnY = currentY + Math.floor(idx / 2) * (actionButtonHeight + 10); const isDisabled = player.energy < action.cost; const bgColor = isDisabled ? '#4B5563' : '#7C3AED'; const textColor = isDisabled ? '#9CA3AF' : '#FFFFFF'; drawRoundedRect(btnX, btnY, actionButtonWidth, actionButtonHeight, 5, bgColor); wrapAndDrawText(ctx, `${action.name} (${action.cost}E)`, btnX, btnY + actionButtonHeight / 2 - 8, actionButtonWidth, lineHeight, { fillStyle: textColor, font: 'bold 13px Noto Sans', textAlign: 'center' }); if (!isDisabled) { addClickable(btnX, btnY, actionButtonWidth, actionButtonHeight, () => handleBattleAction(action)); } });
      } else { wrapAndDrawText(ctx, "Critic is thinking...", boxX, currentY + 20, boxWidth, 20, { fillStyle: '#FACC15', font: 'italic 16px Noto Sans', textAlign: 'center' }); }
    }

  }, [gameState, animationFrame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 select-none font-sans">
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
        <header className="mb-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-400 tracking-wider">Art World RPG</h1>
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-slate-400 mt-2 space-y-1 sm:space-y-0">
            <span>Day: {gameState.day}, Time: {gameState.time.toString().padStart(2, '0')}:00</span>
            <span className="hidden sm:inline">|</span>
            <span className="truncate"><MapPin size={14} className="inline mr-1" /> {maps[gameState.currentMap]?.name || 'Unknown Area'}</span>
            <span className="hidden sm:inline">|</span>
            <span>Weather: {gameState.weather}</span>
            <span className="hidden sm:inline">|</span>
            <span><span className="text-green-400">$ {gameState.player.money}</span> | Rep: <span className="text-yellow-400">{gameState.player.reputation}</span></span>
          </div>
        </header>
        <div className="relative mx-auto w-[480px] h-[480px] border-2 border-purple-500/70 rounded-lg overflow-hidden shadow-2xl bg-black cursor-pointer">
          <canvas ref={canvasRef} />
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'status' ? null : 'status' }))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><User size={16} className="mr-2" /> Status (M)</button>
          <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'inventory' ? null : 'inventory' }))} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><Briefcase size={16} className="mr-2" /> Inv (I)</button>
          <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'quests' ? null : 'quests' }))} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><Trophy size={16} className="mr-2" /> Quests (Q)</button>
          <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'market' ? null : 'market' }))} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><BarChart size={16} className="mr-2" /> Market</button>
        </div>
        <footer className="mt-4 text-center text-xs text-slate-500">
          Controls: Arrow Keys/WASD or Click to Move, Shift to Sprint, Space/Enter to Interact. Esc to close UI.
        </footer>
      </div>
    </div>
  );
};

export default ArtGalleryRPG;