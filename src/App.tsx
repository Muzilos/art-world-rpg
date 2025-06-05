import React, { useState, useEffect, useRef } from 'react';
import { User, Volume2, VolumeX, Sparkles, MapPin, Palette, Trophy, Coffee, Briefcase, Book, Home, Users, Clock, ShoppingBag, Feather, Shield, Target, Zap, TrendingUp, Shirt, Percent, Landmark, Handshake, Star, Award, BarChart } from 'lucide-react';

const ArtGalleryRPG = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    player: {
      x: 5,
      y: 5,
      facing: 'down',
      sprite: 0, // Sprite will now effectively be static due to rendering change
      money: 500,
      reputation: 0,
      energy: 100,
      level: 1,
      exp: 0,
      title: 'Aspiring Artist',
      inventory: {
        paintings: 3,
        sculptures: 0,
        digitalArt: 0,
        coffee: 2,
        businessCards: 5
      },
      skills: {
        artistic: 1,
        networking: 1,
        business: 1,
        curating: 1
      },
      equipment: {
        brush: 'Basic Brush',
        outfit: 'Casual Clothes'
      },
      relationships: {},
      quests: ['first_sale'],
      completedQuests: [],
      achievements: []
    },
    currentMap: 'studio',
    dialogue: null,
    menu: null,
    battle: null,
    time: 8,
    day: 1,
    weather: 'sunny',
    music: true,
    events: [],
    unlockedMaps: ['studio', 'gallery'],
    marketMultiplier: 1.0,
  });

  const [keys, setKeys] = useState({});
  const [animationFrame, setAnimationFrame] = useState(0); // Still used for game loop timing

  // --- MAP DEFINITIONS (Unchanged from previous version) ---
  const maps = {
    studio: {
      name: "Your Studio",
      width: 10,
      height: 10,
      bgm: 'peaceful', 
      tiles: [ 
        [1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,3,2,2,2,2,4,2,1], 
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,5,2,2,2,2,6,2,1], 
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,0,0,1,1,1,1] 
      ],
      objects: {
        '2,2': { type: 'easel', interaction: 'create_art', name: 'Easel' },
        '7,2': { type: 'computer', interaction: 'check_market', name: 'Computer' },
        '2,6': { type: 'bed', interaction: 'rest', name: 'Bed' },
        '7,6': { type: 'bookshelf', interaction: 'study', name: 'Bookshelf' },
      },
      exits: {
        '4,9': { to: 'gallery', x: 5, y: 1 },
        '5,9': { to: 'gallery', x: 5, y: 1 }
      }
    },
    gallery: {
      name: "Chelsea Gallery District",
      width: 20,
      height: 20,
      bgm: 'sophisticated',
       tiles: [ 
        [1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,7,7,7,7,2,2,2,7,7,7,7,7,7,7,7,7,7,7,1],
        [1,7,8,8,8,2,2,2,8,8,8,8,8,8,8,8,8,8,7,1],
        [1,7,8,2,2,2,2,2,2,2,2,2,2,2,2,2,2,8,7,1],
        [1,7,8,2,2,2,2,2,2,2,2,2,2,2,2,2,2,8,7,1],
        [1,7,8,2,2,2,2,2,2,2,2,2,2,2,2,2,2,8,7,1],
        [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,8,7,1], 
        [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0], 
        [1,7,8,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
        [1,7,8,2,2,2,2,2,2,2,2,2,2,2,2,2,2,8,7,1],
        [1,7,8,2,2,2,2,2,2,2,2,2,2,2,2,2,2,8,7,1],
        [1,7,8,8,8,2,2,2,8,8,8,8,8,2,2,2,8,8,7,1],
        [1,7,7,7,7,2,2,2,7,7,7,7,7,2,2,2,7,7,7,1],
        [1,1,1,1,1,2,2,2,1,1,1,1,1,2,2,2,1,1,1,1],
        [1,9,9,9,9,2,2,2,9,9,9,9,9,2,2,2,10,10,10,1],
        [1,9,11,11,11,2,2,2,11,11,11,11,11,2,2,2,12,12,12,1],
        [1,9,11,11,11,2,2,2,11,11,11,11,11,2,2,2,12,12,12,1],
        [1,9,11,11,11,2,2,2,11,11,11,11,11,2,2,2,12,12,12,1],
        [1,9,9,9,9,2,2,2,9,9,9,9,9,2,2,2,10,10,10,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
      ],
      objects: {
        '3,2': { type: 'npc_collector', name: 'Victoria Sterling', interaction: 'talk_npc' },
        '10,5': { type: 'npc_artist', name: 'Jackson Park', interaction: 'talk_npc' },
        '6,10': { type: 'npc_critic', name: 'Eleanor Sharp', interaction: 'talk_npc' },
        '15,7': { type: 'npc_gallerist', name: 'Marcus Chen', interaction: 'talk_npc' },
        '5,15': { type: 'gallery_door', name: 'Pace Gallery', interaction: 'enter_gallery_pace' },
        '16,15': { type: 'gallery_door', name: 'Rising Stars Gallery', interaction: 'enter_gallery_rising' },
        '10,3': { type: 'info_board', interaction: 'check_events', name: 'Events Board' }
      },
      exits: {
        '5,0': { to: 'studio', x: 4, y: 8 },
        '6,0': { to: 'studio', x: 5, y: 8 },
        '7,0': { to: 'studio', x: 5, y: 8 },
        '0,6': { to: 'brooklyn', x: 18, y: 7 },
        '0,7': { to: 'brooklyn', x: 18, y: 8 },
        '19,6': { to: 'soho', x: 1, y: 7 },
        '19,7': { to: 'soho', x: 1, y: 8 }
      }
    },
    brooklyn: {
      name: "Brooklyn Art Scene",
      width: 20,
      height: 15,
      bgm: 'indie',
      locked: true,
      unlockReq: { reputation: 25 },
      tiles: [ 
        [13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],
        [13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,13],
        [13,14,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,14,13],
        [13,14,2,15,15,15,2,2,2,2,2,2,2,16,16,16,2,2,14,13], 
        [13,14,2,15,2,15,2,2,2,2,2,2,2,16,2,16,2,2,14,13],
        [13,14,2,15,15,15,2,2,2,2,2,2,2,16,16,16,2,2,14,13],
        [13,14,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,14,0], 
        [13,14,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,14,0], 
        [13,14,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,14,13],
        [13,14,2,17,17,17,2,2,2,2,2,2,2,18,18,18,2,2,14,13], 
        [13,14,2,17,2,17,2,2,2,2,2,2,2,18,2,18,2,2,14,13],
        [13,14,2,17,17,17,2,2,2,2,2,2,2,18,18,18,2,2,14,13],
        [13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,13],
        [13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,13],
        [13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13]
      ],
      objects: {
        '4,9': { type: 'warehouse_studio', name: 'Bushwick Collective Studio', interaction: 'enter_warehouse' },
        '14,3': { type: 'coffee_shop', name: 'Grindhouse Coffee', interaction: 'enter_coffee_shop' },
        '4,3': { type: 'street_vendor', name: 'Street Art Supplies', interaction: 'shop_street_supplies' },
        '14,9': { type: 'thrift_store', name: 'Beacon\'s Closet (ish)', interaction: 'shop_thrift_store' },
        '9,6': { type: 'npc_hipster', name: 'Ezra Moon', interaction: 'talk_npc' },
        '7,2': { type: 'npc_muralist', name: 'Maya Rodriguez', interaction: 'talk_npc' }
      },
      exits: {
        '19,6': { to: 'gallery', x: 1, y: 6 },
        '19,7': { to: 'gallery', x: 1, y: 7 }
      }
    },
    soho: {
      name: "SoHo Shopping District",
      width: 20,
      height: 15,
      bgm: 'upbeat',
      locked: true,
      unlockReq: { money: 2000 },
      tiles: [ 
        [19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19],
        [19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,19],
        [19,20,21,21,21,2,2,2,2,2,2,21,21,21,2,2,2,2,20,19],
        [0,20,21,22,21,2,2,2,2,2,2,21,23,21,2,2,2,2,20,19], 
        [0,20,21,21,21,2,2,2,2,2,2,21,21,21,2,2,2,2,20,19],
        [19,20,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,20,19],
        [19,20,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,20,19],
        [19,20,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,20,19],
        [19,20,24,24,24,2,2,2,2,2,2,25,25,25,2,2,2,2,20,19], 
        [19,20,24,22,24,2,2,2,2,2,2,25,22,25,2,2,2,2,20,19],
        [19,20,24,24,24,2,2,2,2,2,2,25,25,25,2,2,2,2,20,19],
        [19,20,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,20,19],
        [19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,19],
        [19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,19],
        [19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19]
      ],
      objects: {
        '3,3': { type: 'luxury_gallery', name: 'Gagosian Gallery (esque)', interaction: 'enter_luxury_gallery' },
        '12,3': { type: 'art_supply_pro', name: 'Pro Art Supplies', interaction: 'shop_pro_supplies' },
        '3,9': { type: 'fashion_boutique', name: 'Chic Boutique', interaction: 'shop_fashion_boutique' },
        '12,9': { type: 'wine_bar', name: 'The Velvet Rope Wine Bar', interaction: 'network_wine_bar' },
        '8,6': { type: 'npc_influencer', name: 'Chloe Kim', interaction: 'talk_npc' }, 
        '6,11': { type: 'npc_dealer', name: 'Philippe Dubois', interaction: 'talk_npc' }
      },
      exits: {
        '0,3': { to: 'gallery', x: 18, y: 6 },
        '0,4': { to: 'gallery', x: 18, y: 7 }
      }
    }
  };

  // --- TILE & SPRITE DEFINITIONS (Unchanged) ---
  const tileColors = {
    0: '#6c757d', 1: '#343a40', 2: '#adb5bd', 3: '#e9ecef', 4: '#ced4da',
    5: '#dee2e6', 6: '#f8f9fa', 7: '#ffffff', 8: '#ffd700', 9: '#2F4F4F',
    10: '#DC143C', 11: '#B0C4DE', 12: '#8B0000', 13: '#A0522D', 14: '#708090',
    15: '#FF69B4', 16: '#F5F5DC', 17: '#654321', 18: '#FF4500', 19: '#E0E0E0',
    20: '#C0C0C0', 21: '#ADD8E6', 22: '#DAA520', 23: '#3CB371', 24: '#800080',
    25: '#4B0082',
  };

  const sprites = { // Player sprite is now effectively static as we always use index 0
    player: { down: ['🧑', '🧑'], up: ['�', '🧑'], left: ['🧑', '🧑'], right: ['🧑', '🧑'] },
    easel: '🖼️', computer: '💻', bed: '🛏️', bookshelf: '📚', gallery_door: '🚪', info_board: '📋',
    npc_collector: '🧐', npc_artist: '🧑‍🎨', npc_critic: '✒️', npc_gallerist: '🕴️', painting_wall: '🖼️',
    warehouse_studio: '🏭', coffee_shop: '☕', street_vendor: '🏪', thrift_store: '🧥',
    npc_hipster: '🧔', npc_muralist: '👩‍🎨',
    luxury_gallery: '🏛️', art_supply_pro: '🛍️', fashion_boutique: '👚', wine_bar: '🍷',
    npc_influencer: '🤳', npc_dealer: '💼',
  };

  // --- QUEST DEFINITIONS (Unchanged) ---
  const questDefinitions = {
    first_sale: {
      id: 'first_sale', name: 'First Sale',
      description: 'Create and sell your first artwork to a collector.',
      checkComplete: (gs) => gs.player.money > 500 && gs.player.completedQuests.length > 0,
      reward: { exp: 50, money: 100, reputation: 5 },
      unlocksQuests: ['network_intro', 'brooklyn_scout']
    },
    network_intro: {
      id: 'network_intro', name: 'Social Butterfly Basics',
      description: 'Meet 3 different people in the art world.',
      checkComplete: (gs) => Object.keys(gs.player.relationships).length >= 3,
      reward: { exp: 75, reputation: 10, item: { businessCards: 5 } }
    },
    brooklyn_scout: {
      id: 'brooklyn_scout', name: 'Brooklyn Bound',
      description: 'Unlock and visit the Brooklyn Art Scene district.',
      checkComplete: (gs) => gs.unlockedMaps.includes('brooklyn'),
      reward: { exp: 100, item: { coffee: 3 } },
      unlocksQuests: ['soho_aspirations']
    },
    masterpiece_quest: {
      id: 'masterpiece_quest', name: 'Create a Masterpiece',
      description: 'Create an artwork with a quality rating over 8.',
      checkComplete: (gs) => gs.player.achievements.includes('created_masterpiece'),
      reward: { exp: 200, reputation: 25, money: 500 }
    },
    gallery_show_prep: {
      id: 'gallery_show_prep', name: 'Road to Exhibition',
      description: 'Gain 50 reputation and speak to Marcus Chen in Chelsea.',
      checkComplete: (gs) => gs.player.reputation >= 50,
      reward: { exp: 150 },
      unlocksQuests: ['first_exhibition']
    },
    first_exhibition: {
      id: 'first_exhibition', name: 'My First Show!',
      description: 'Successfully host your first gallery exhibition (offered by Marcus Chen).',
      checkComplete: (gs) => gs.player.achievements.includes('hosted_gallery_show'),
      reward: { exp: 500, reputation: 100, money: 2000 }
    },
     soho_aspirations: {
      id: 'soho_aspirations', name: 'SoHo Dreams',
      description: 'Earn $2000 to unlock the SoHo district.',
      checkComplete: (gs) => gs.player.money >= 2000 && gs.unlockedMaps.includes('soho'),
      reward: { exp: 250, reputation: 20 }
    },
  };

  // --- PLAYER TITLES (Unchanged) ---
  const playerTitles = [
    { rep: 0,    level: 1,  title: 'Aspiring Artist' }, { rep: 20,   level: 3,  title: 'Emerging Talent' },
    { rep: 50,   level: 5,  title: 'Studio Regular' }, { rep: 100,  level: 8,  title: 'Noticed Artist' },
    { rep: 250,  level: 12, title: 'Chelsea Contender' }, { rep: 500,  level: 16, title: 'Brooklyn Star' },
    { rep: 1000, level: 20, title: 'SoHo Sensation' }, { rep: 2000, level: 25, title: 'Living Legend' }
  ];

  // --- BATTLE ACTIONS & CRITIC ATTACKS (Unchanged) ---
  const battleActions = [
    { id: 'defend_concept', name: 'Defend Concept', power: 25, accuracy: 0.9, cost: 10, skill: 'artistic', description: 'Explain your artistic vision with passion.' },
    { id: 'cite_history', name: 'Cite Art History', power: 20, accuracy: 1.0, cost: 15, skill: 'curating', description: 'Reference masters and movements to support your work.' },
    { id: 'charm_offensive', name: 'Charm Offensive', power: 15, accuracy: 0.8, cost: 10, skill: 'networking', description: 'Use your charisma to win over the critic.' },
    { id: 'technical_breakdown', name: 'Technical Breakdown', power: 30, accuracy: 0.7, cost: 20, skill: 'artistic', description: 'Detail the skill and effort behind your piece.' }
  ];
  const criticAttacks = [
    { name: 'Skeptical Scrutiny', power: 15, accuracy: 0.9 }, { name: 'Derisive Dismissal', power: 25, accuracy: 0.7 },
    { name: 'Academic Interrogation', power: 20, accuracy: 0.8 },
  ];

  // --- KEYBOARD INPUT (Unchanged) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
      if (gameState.dialogue || gameState.battle) return;
      if (e.key.toLowerCase() === 'm') setGameState(prev => ({ ...prev, menu: prev.menu === 'status' ? null : 'status' }));
      if (e.key.toLowerCase() === 'i') setGameState(prev => ({ ...prev, menu: prev.menu === 'inventory' ? null : 'inventory' }));
      if (e.key.toLowerCase() === 'q') setGameState(prev => ({ ...prev, menu: prev.menu === 'quests' ? null : 'quests' }));
    };
    const handleKeyUp = (e) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.dialogue, gameState.battle]);

  // --- GAME LOOP (Player sprite animation logic removed from movement) ---
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 60); 

      setGameState(prev => {
        let newPlayer = { ...prev.player };
        let newCurrentMap = prev.currentMap;
        let newUnlockedMaps = [...prev.unlockedMaps];
        let newDialogue = prev.dialogue;
        let newTime = prev.time;
        let newDay = prev.day;
        let newWeather = prev.weather;
        let marketMult = prev.marketMultiplier;

        if (animationFrame % 300 === 0) { 
            newTime = (prev.time + 1);
            if (newTime >= 24) {
                newTime = 0;
                newDay = prev.day + 1;
                if (Math.random() < 0.2) { 
                    const weathers = ['sunny', 'rainy', 'foggy'];
                    newWeather = weathers[Math.floor(Math.random() * weathers.length)];
                }
                if (Math.random() < 0.15) { 
                    const change = (Math.random() * 0.4) - 0.2; 
                    marketMult = Math.max(0.5, Math.min(2.0, prev.marketMultiplier + change));
                }
            }
        }

        if (!prev.dialogue && !prev.menu && !prev.battle) {
          let dx = 0;
          let dy = 0;
          let newFacing = newPlayer.facing;
          let moved = false;

          if (keys['arrowup'] || keys['w']) { dy = -1; newFacing = 'up'; moved = true; }
          if (keys['arrowdown'] || keys['s']) { dy = 1; newFacing = 'down'; moved = true; }
          if (keys['arrowleft'] || keys['a']) { dx = -1; newFacing = 'left'; moved = true; }
          if (keys['arrowright'] || keys['d']) { dx = 1; newFacing = 'right'; moved = true; }

          if (moved) {
            let moveSpeed = 0.1; 
            if (keys['shift']) moveSpeed = 0.2; 

            let targetX = newPlayer.x + dx * moveSpeed;
            let targetY = newPlayer.y + dy * moveSpeed;

            const currentMapData = maps[prev.currentMap];
            const nextTileX = Math.floor(targetX + 0.5 + (dx * 0.4)); 
            const nextTileY = Math.floor(targetY + 0.5 + (dy * 0.4));

            if (currentMapData && nextTileX >= 0 && nextTileX < currentMapData.width &&
                nextTileY >= 0 && nextTileY < currentMapData.height &&
                currentMapData.tiles[nextTileY]?.[nextTileX] !== undefined && 
                ![1, 7, 13, 19].includes(currentMapData.tiles[nextTileY][nextTileX])) { 

              newPlayer.x = targetX;
              newPlayer.y = targetY;
              // newPlayer.sprite remains 0 for static sprite, or could be set if specific conditions met
            
              const currentTileKey = `${Math.floor(newPlayer.x + 0.5)},${Math.floor(newPlayer.y + 0.5)}`;
              if (currentMapData.exits && currentMapData.exits[currentTileKey]) {
                const exit = currentMapData.exits[currentTileKey];
                const destMap = maps[exit.to];

                if (destMap.locked) {
                  const req = destMap.unlockReq;
                  let canUnlock = true;
                  let reqText = [];
                  if (req.reputation && newPlayer.reputation < req.reputation) { canUnlock = false; reqText.push(`${req.reputation} Rep`); }
                  if (req.money && newPlayer.money < req.money) { canUnlock = false; reqText.push(`$${req.money}`); }
                  if (req.level && newPlayer.level < req.level) { canUnlock = false; reqText.push(`Lvl ${req.level}`); }

                  if (!canUnlock) {
                    newDialogue = {
                      title: "Area Locked",
                      text: `Requires: ${reqText.join(', ')}.`,
                      options: [{ text: "Okay", action: () => closeDialogue() }]
                    };
                    newPlayer.x -= dx * moveSpeed * 2;
                    newPlayer.y -= dy * moveSpeed * 2;
                  } else {
                    newCurrentMap = exit.to;
                    newPlayer.x = exit.x + 0.5;
                    newPlayer.y = exit.y + 0.5;
                    if (!newUnlockedMaps.includes(exit.to)) {
                        newUnlockedMaps.push(exit.to);
                        destMap.locked = false; 
                         newDialogue = {
                            title: "New Area Unlocked!",
                            text: `You can now access ${destMap.name}!`,
                            options: [{ text: "Explore!", action: () => closeDialogue() }]
                        };
                    }
                  }
                } else { 
                  newCurrentMap = exit.to;
                  newPlayer.x = exit.x + 0.5;
                  newPlayer.y = exit.y + 0.5;
                   if (!newUnlockedMaps.includes(exit.to)) newUnlockedMaps.push(exit.to); 
                }
              }
            }
            newPlayer.facing = newFacing;
          }
          // newPlayer.sprite is always 0 as per current sprites setup for static look
          newPlayer.sprite = 0; 

          newPlayer.x = Math.max(0, Math.min(newPlayer.x, maps[newCurrentMap].width - 0.51));
          newPlayer.y = Math.max(0, Math.min(newPlayer.y, maps[newCurrentMap].height - 0.51));
        }

        if ((keys[' '] || keys['enter']) && !prev.dialogue && !prev.menu && !prev.battle) {
            checkInteraction(); 
            keys[' '] = false; 
            keys['enter'] = false;
        }
        return { ...prev, player: newPlayer, currentMap: newCurrentMap, dialogue: newDialogue, unlockedMaps: newUnlockedMaps, time: newTime, day: newDay, weather: newWeather, marketMultiplier: marketMult };
      });
    }, 50); 

    return () => clearInterval(gameLoop);
  }, [keys, animationFrame]); 

  // --- QUEST & PROGRESSION CHECKS (Unchanged) ---
  useEffect(() => {
    const activeQuests = gameState.player.quests
        .map(id => questDefinitions[id])
        .filter(q => q && !gameState.player.completedQuests.includes(q.id));
    activeQuests.forEach(quest => { if (quest.checkComplete(gameState)) { completeQuest(quest.id); } });

    const currentTitle = playerTitles.slice().reverse()
      .find(t => gameState.player.reputation >= t.rep && gameState.player.level >= t.level);
    if (currentTitle && currentTitle.title !== gameState.player.title) {
      setGameState(prev => ({ ...prev, player: { ...prev.player, title: currentTitle.title },
        dialogue: { title: "Rank Up!", text: `You are now known as: ${currentTitle.title}!`, options: [{text: "Awesome!", action: closeDialogue}] }
      }));
    }

    const expNeeded = gameState.player.level * 100 * (1 + (gameState.player.level-1)*0.1);
    if (gameState.player.exp >= expNeeded) {
      setGameState(prev => ({ ...prev, player: { ...prev.player, level: prev.player.level + 1, exp: prev.player.exp - expNeeded, energy: 100 },
        dialogue: { title: "LEVEL UP!", text: `You reached Level ${prev.player.level + 1}! Energy restored. Skills improved!`, options: [{text: "Excellent!", action: closeDialogue}] }
      }));
    }
  }, [gameState.player.exp, gameState.player.reputation, gameState.player.level, gameState.player.money, gameState.unlockedMaps, gameState.player.achievements, gameState.player.relationships, gameState.player.quests]);

  // --- INTERACTION HANDLING (Unchanged) ---
  const checkInteraction = () => {
    const currentMapData = maps[gameState.currentMap];
    const p = gameState.player;
    let interactX = Math.floor(p.x + 0.5);
    let interactY = Math.floor(p.y + 0.5);

    if (p.facing === 'up') interactY -= 1;
    if (p.facing === 'down') interactY += 1;
    if (p.facing === 'left') interactX -= 1;
    if (p.facing === 'right') interactX += 1;

    const objectKey = `${interactX},${interactY}`;
    if (currentMapData.objects && currentMapData.objects[objectKey]) {
      const obj = currentMapData.objects[objectKey];
      handleInteraction(obj.interaction, obj);
    }
  };

  const handleInteraction = (interactionType, objData) => {
    if (interactionType === 'talk_npc') { handleNPCTalk(objData); return; }
    switch(interactionType) {
      case 'create_art': setGameState(prev => ({...prev, menu: 'create_art'})); break;
      case 'rest': setGameState(prev => ({...prev, menu: 'rest'})); break;
      case 'study': setGameState(prev => ({...prev, menu: 'study'})); break;
      case 'check_market': setGameState(prev => ({...prev, menu: 'market'})); break;
      case 'enter_coffee_shop': shopCoffee(); break;
      case 'shop_street_supplies': showMessage("Street Vendor", "Hey! Need some basic paints or maybe a cheap canvas? (Coming Soon!)"); break;
      case 'shop_thrift_store': showMessage("Thrift Store", "Looking for unique finds? Hidden gems await! (Coming Soon!)"); break;
      case 'shop_pro_supplies': setGameState(prev => ({...prev, menu: 'shop_pro_art_supplies'})); break;
      case 'shop_fashion_boutique': setGameState(prev => ({...prev, menu: 'shop_fashion'})); break;
      case 'network_wine_bar': networkAtWineBar(); break;
      case 'enter_gallery_pace': case 'enter_gallery_rising': case 'enter_luxury_gallery':
        showMessage(objData.name, `You enter ${objData.name}. The air is thick with artistic pretension... and opportunity.`); break;
      case 'check_events': showMessage("Events Board", "Upcoming: 'New Wave Painters' opening next Tuesday. Critic Eleanor Sharp expected to attend."); break;
      default: showMessage("Hmm...", "Nothing interesting here right now.");
    }
  };

  const closeDialogue = () => setGameState(prev => ({ ...prev, dialogue: null }));
  const closeMenu = () => setGameState(prev => ({ ...prev, menu: null}));
  const showMessage = (title, text, options = [{ text: "Okay", action: closeDialogue }]) => {
    setGameState(prev => ({ ...prev, dialogue: { title, text, options } }));
  };

  // --- ART CREATION, RESTING, STUDYING (Unchanged logic) ---
  const createArt = (artType) => {
    const player = gameState.player; let energyCost = 0; let skillReq = 0; let artKey = '';
    let baseQuality = player.skills.artistic;
    switch(artType) {
        case 'painting': energyCost = 25; skillReq = 1; artKey = 'paintings'; break;
        case 'sculpture': energyCost = 40; skillReq = 3; artKey = 'sculptures'; baseQuality *= 0.8; break;
        case 'digital': energyCost = 20; skillReq = 5; artKey = 'digitalArt'; baseQuality *= 1.1; break;
    }
    if (player.equipment.brush === 'Pro Brush Set') baseQuality += 1;
    if (player.energy < energyCost) { showMessage("Too Tired", `You need ${energyCost} energy.`); return; }
    if (player.skills.artistic < skillReq) { showMessage("Skill Lacking", `Need Artistic skill ${skillReq}.`); return; }
    const quality = Math.min(10, Math.max(1, Math.random() * 5 + baseQuality)).toFixed(1);
    const isMasterpiece = parseFloat(quality) >= 8.5;
    let newAchievements = player.achievements;
    if (isMasterpiece && !newAchievements.includes('created_masterpiece')) { newAchievements = [...newAchievements, 'created_masterpiece'];}
    const expGain = 10 + Math.floor(parseFloat(quality) * 2) + (isMasterpiece ? 50 : 0);
    setGameState(prev => ({...prev, player: {...prev.player, energy: prev.player.energy - energyCost, inventory: {...prev.player.inventory, [artKey]: prev.player.inventory[artKey] + 1}, skills: {...prev.player.skills, artistic: Math.min(10, prev.player.skills.artistic + 0.1 + (isMasterpiece ? 0.2 : 0))}, exp: prev.player.exp + expGain, achievements: newAchievements }, dialogue: { title: "Artwork Created!", text: `Created ${isMasterpiece ? '✨MASTERPIECE✨ ' : ''}${artType} (Q: ${quality}/10).\n+${expGain} EXP.`, options: [{ text: "Excellent!", action: closeDialogue }] }, menu: null }));
  };
  const rest = (duration) => {
    let energyGain = 0, timePassed = 0, newDay = gameState.day, newTime = gameState.time;
    if (duration === 'nap') { energyGain = 30; timePassed = 2; } else if (duration === 'sleep') { energyGain = 100; timePassed = 8; }
    newTime += timePassed; let daysPassed = 0;
    while (newTime >= 24) { newTime -= 24; daysPassed++; } newDay += daysPassed;
    if(duration === 'sleep' && newTime < 8) newTime = 8;
    let eventMsg = ""; if (duration === 'sleep' && Math.random() < 0.3) { eventMsg = "\nYou had a strange dream..."; }
    setGameState(prev => ({ ...prev, player: { ...prev.player, energy: Math.min(100, prev.player.energy + energyGain) }, time: newTime, day: newDay, dialogue: { title: "Rested", text: `Gained ${energyGain} energy.${eventMsg}`, options: [{ text: "Refreshed!", action: closeDialogue }] }, menu: null }));
  };
  const study = (skillName) => {
    const player = gameState.player; const energyCost = 15;
    if (player.energy < energyCost) { showMessage("Too Tired", `Need ${energyCost} energy.`); return; }
    const skillGain = 0.2 + (Math.random() * 0.1); const expGain = 15;
    setGameState(prev => ({ ...prev, player: { ...prev.player, energy: prev.player.energy - energyCost, skills: { ...prev.player.skills, [skillName]: Math.min(10, prev.player.skills[skillName] + skillGain) }, exp: prev.player.exp + expGain }, dialogue: { title: "Study Session", text: `Studied ${skillName}, skill improved. +${expGain} EXP.`, options: [{ text: "Knowledge!", action: closeDialogue }] }, menu:null }));
  };

  // --- NPC INTERACTIONS, SELLING, NETWORKING (Unchanged logic) ---
  const handleNPCTalk = (npcData) => {
    const player = gameState.player; const npcName = npcData.name;
    setGameState(prev => ({ ...prev, player: { ...prev.player, relationships: { ...prev.player.relationships, [npcName]: (prev.player.relationships[npcName] || 0) + 1 }}}));
    const relationshipLevel = (gameState.player.relationships[npcName] || 0) +1;
    let dialogueText = `"${npcName} looks at you. `; let dialogueOptions = [{ text: "Goodbye.", action: closeDialogue }];
    if (relationshipLevel <= 1) dialogueText += `They seem to be sizing you up."`; else if (relationshipLevel <= 5) dialogueText += `They offer a polite nod."`; else dialogueText += `They greet you warmly, '${player.title}!'."`;
    switch(npcData.type) {
        case 'npc_collector':
            const totalArt = player.inventory.paintings + player.inventory.sculptures + player.inventory.digitalArt;
            if (totalArt === 0) { dialogueText = `Victoria: "No art? Create something."`; }
            else if (player.reputation < 5 && relationshipLevel < 3) { dialogueText = `Victoria: "Need more standing."`; }
            else { dialogueText = `Victoria: "Ah, ${player.title}. Have something exquisite?"`; dialogueOptions = [ { text: "Sell Artwork", action: () => openSellArtMenu(npcData) }, { text: "Networking", action: () => { network(npcName, 'collector'); closeDialogue(); } }, { text: "Goodbye", action: closeDialogue } ]; }
            break;
        case 'npc_critic':
            if (player.skills.artistic < 2 && relationshipLevel < 2) { dialogueText = `Eleanor: "Develop your craft."`; }
            else if (player.reputation < 10 && relationshipLevel < 4) { dialogueText = `Eleanor: "Prepared to defend your work?"`; dialogueOptions = [ { text: "Discuss (Battle!)", action: () => startCritiqueBattle(npcData) }, { text: "Not now.", action: closeDialogue } ]; }
            else { dialogueText = `Eleanor: "${player.title}, shall we delve into your latest?"`; dialogueOptions = [ { text: "Debate! (Battle)", action: () => startCritiqueBattle(npcData) }, { text: "Later.", action: closeDialogue } ]; }
            break;
        case 'npc_gallerist':
             if (player.reputation < 20 && !gameState.player.achievements.includes('hosted_gallery_show')) { dialogueText = `Marcus: "Build your reputation."`; }
             else if (player.reputation >= 50 && !gameState.player.achievements.includes('hosted_gallery_show') && gameState.player.quests.includes('first_exhibition')) { dialogueText = `Marcus: "Impressive, ${player.title}. I offer you a solo exhibition."`; dialogueOptions = [ { text: "Accept!", action: () => { setGameState(prev => ({...prev, player: {...prev.player, achievements: [...prev.player.achievements, 'hosted_gallery_show']}})); completeQuest('first_exhibition'); }}, { text: "Need to prepare.", action: closeDialogue} ]; }
             else if (gameState.player.achievements.includes('hosted_gallery_show')) { dialogueText = `Marcus: "Your show was a triumph! What's next?"`;}
             else { dialogueText = `Marcus: "Keep creating. The art world watches."`; dialogueOptions = [ { text: "Opportunities?", action: () => { network(npcName, 'gallerist'); closeDialogue(); } }, { text: "Goodbye", action: closeDialogue } ]; }
            break;
        case 'npc_artist': dialogueText = `Jackson: "Hey, fellow artist! Struggle is real, huh?"`; dialogueOptions = [ { text: "Network", action: () => { network(npcName, 'artist'); closeDialogue(); } }, { text: "Advice?", action: () => { showMessage("Jackson's Advice", "Keep painting. Try coffee in Brooklyn."); closeDialogue(); }}, { text: "Later", action: closeDialogue } ]; break;
        case 'npc_hipster': dialogueText = `Ezra: "Oh, hey. Post-ironic deconstructionism? Or pickles?"`; dialogueOptions = [ { text: "Art scene?", action: () => { network(npcName, 'hipster'); closeDialogue(); } }, { text: "Brooklyn?", action: () => { showMessage("Ezra on Brooklyn", "Authentic. Not Chelsea. Check warehouses."); closeDialogue(); }}, { text: "Pickles?", action: closeDialogue } ]; break;
        case 'npc_muralist': dialogueText = `Maya: "Big walls, big statements. Yours?"`; dialogueOptions = [ { text: "Admire work", action: () => { network(npcName, 'muralist'); closeDialogue(); } }, { text: "Street art?", action: () => { showMessage("Maya on Street Art", "Voice of the people. Be bold, be fast."); closeDialogue(); }}, { text: "See ya", action: closeDialogue } ]; break;
        case 'npc_influencer': dialogueText = `Chloe: "OMG, hi! Love your vibe. Artist? My followers would *die*."`; dialogueOptions = [ { text: "Network (big Rep!)", action: () => { network(npcName, 'influencer'); closeDialogue(); } }, { text: "SoHo trends?", action: () => { showMessage("Chloe on SoHo", "Exclusivity, being seen. Right outfit, right spots."); closeDialogue(); }}, { text: "No photos.", action: closeDialogue } ]; break;
        case 'npc_dealer': dialogueText = `Philippe: "Bonjour. Eye for profitable aesthetics. Yours?"`; dialogueOptions = [ { text: "Representation?", action: () => { if(player.skills.business > 6 && player.reputation > 100) { showMessage("Philippe", "Intriguing. Discuss terms. Bring portfolio."); } else { showMessage("Philippe", "Enthusiasm noted. Refine market presence."); } closeDialogue(); } }, { text: "Market inquiry?", action: () => { network(npcName, 'dealer'); closeDialogue(); } }, { text: "Au revoir.", action: closeDialogue } ]; break;
        default: dialogueText = `${npcName} nods curtly.`;
    } showMessage(npcName, dialogueText, dialogueOptions);
  };
  const network = (npcName, npcType) => {
    const player = gameState.player; if (player.energy < 10) { showMessage("Too Tired", "Need 10 energy."); return; }
    let repGain = 1 + Math.floor(player.skills.networking * 0.5); let expGain = 10;
    if (npcType === 'influencer') repGain *= 2; if (npcType === 'dealer') repGain += player.skills.business;
    setGameState(prev => ({ ...prev, player: { ...prev.player, energy: prev.player.energy - 10, reputation: prev.player.reputation + repGain, exp: prev.player.exp + expGain, skills: { ...prev.player.skills, networking: Math.min(10, prev.player.skills.networking + 0.1) }}}));
    showMessage("Networking Success!", `Chatted with ${npcName}.\n+${repGain} Rep, +${expGain} EXP. Networking improved!`);
  };
  const openSellArtMenu = (collectorData) => {
    const player = gameState.player;
    const artAvailable = [ player.inventory.paintings > 0 ? {type: 'painting', key: 'paintings'} : null, player.inventory.sculptures > 0 ? {type: 'sculpture', key: 'sculptures'} : null, player.inventory.digitalArt > 0 ? {type: 'digitalArt', key: 'digitalArt'} : null ].filter(Boolean);
    if (artAvailable.length === 0) { showMessage(collectorData.name, "No art to sell!"); return; }
    const options = artAvailable.map(art => {
        const basePrice = art.type === 'painting' ? 100 : art.type === 'sculpture' ? 150 : 80;
        const qualityFactor = 1 + (player.skills.artistic / 10); const equipmentBonus = player.equipment.brush === 'Pro Brush Set' ? 1.2 : 1.0;
        const marketPrice = Math.floor(basePrice * qualityFactor * equipmentBonus * gameState.marketMultiplier * (1 + player.skills.business/20));
        const reputationBonus = 1 + (player.reputation / 200); const finalPrice = Math.floor(marketPrice * reputationBonus);
        return { text: `Sell ${art.type} (Est: $${finalPrice})`, action: () => sellArt(art.key, finalPrice, collectorData.name) };
    });
    options.push({text: "Nevermind", action: closeDialogue});
    showMessage(collectorData.name, "Which piece to offer?", options);
  };
  const sellArt = (artKey, price, collectorName) => {
     setGameState(prev => {
        const newPlayer = { ...prev.player }; newPlayer.money += price; newPlayer.reputation += 5 + Math.floor(price / 100);
        newPlayer.exp += 20 + Math.floor(price / 50); newPlayer.inventory = { ...newPlayer.inventory, [artKey]: newPlayer.inventory[artKey] - 1 };
        newPlayer.skills = { ...newPlayer.skills, business: Math.min(10, newPlayer.skills.business + 0.1) };
        return { ...prev, player: newPlayer, dialogue: { title: "Sale Successful!", text: `Sold to ${collectorName} for $${price}!\n+Rep, +EXP. Business improved.`, options: [{ text: "Excellent!", action: closeDialogue }] }};
    });
  };

  // --- SHOPS & SERVICES (Unchanged logic) ---
  const shopCoffee = () => {
    const coffeePrice = 10; const energyBoost = 30;
    const options = [
        { text: `Buy Coffee ($${coffeePrice}) - Have ${gameState.player.inventory.coffee}`, action: () => {
            if (gameState.player.money < coffeePrice) { showMessage("No Money", "Can't afford."); return; }
            if (gameState.player.inventory.coffee >= 5) { showMessage("Too Much", "Carrying too much!"); return; }
            setGameState(prev => ({ ...prev, player: { ...prev.player, money: prev.player.money - coffeePrice, inventory: {...prev.player.inventory, coffee: prev.player.inventory.coffee + 1}}, dialogue: { title: "Coffee!", text: `Bought artisanal coffee.`, options:[{text: "Nice!", action: closeDialogue}]} }));
        }},
        { text: `Drink Coffee (Have ${gameState.player.inventory.coffee})`, action: () => {
            if (gameState.player.inventory.coffee <= 0) { showMessage("No Coffee", "None to drink."); return; }
            setGameState(prev => ({ ...prev, player: { ...prev.player, energy: Math.min(100, prev.player.energy + energyBoost), inventory: {...prev.player.inventory, coffee: prev.player.inventory.coffee - 1}}, dialogue: { title: "Ahhh!", text: `+${energyBoost} Energy.`, options:[{text: "Wired!", action: closeDialogue}]} }));
        }}, { text: "Leave", action: closeDialogue }
    ]; showMessage("Grindhouse Coffee", "Best brew in Brooklyn?", options);
  };
  const buyEquipmentItem = (itemType, itemName, price, skillBoost, skillName) => {
      if (gameState.player.money < price) { showMessage("No Funds", `$${price} needed.`); return; }
      if (gameState.player.equipment[itemType] === itemName) { showMessage("Owned", `Already have ${itemName}.`); return; }
      setGameState(prev => ({ ...prev, player: { ...prev.player, money: prev.player.money - price, equipment: { ...prev.player.equipment, [itemType]: itemName }, skills: { ...prev.player.skills, [skillName]: Math.min(10, prev.player.skills[skillName] + skillBoost) }}, dialogue: { title: "Purchased!", text: `${itemName} bought! ${skillName} +${skillBoost}.`, options: [{text: "Great!", action: closeDialogue}] }, menu: null }));
  };
  const buyConsumableItem = (itemName, itemKey, price, amount) => {
     if (gameState.player.money < price) { showMessage("No Funds", `$${price} needed.`); return; }
       setGameState(prev => ({ ...prev, player: { ...prev.player, money: prev.player.money - price, inventory: { ...prev.player.inventory, [itemKey]: prev.player.inventory[itemKey] + amount }}, dialogue: { title: "Purchased!", text: `${amount} ${itemName} bought.`, options: [{text: "Stocked!", action: closeDialogue}] }, menu: null }));
  };
  const networkAtWineBar = () => {
    const player = gameState.player; const cost = 50;
    if (player.money < cost) { showMessage("No Funds", `$${cost} for entry.`); return; }
    if (player.energy < 20) { showMessage("Too Tired", "Need energy."); return; }
    const outfitBonus = player.equipment.outfit === 'Designer Outfit' ? 1.5 : 1.0;
    const repGain = Math.floor((5 + player.skills.networking * 2) * outfitBonus); const expGain = 30 + Math.floor(player.skills.networking * 5);
    setGameState(prev => ({ ...prev, player: { ...prev.player, money: prev.player.money - cost, energy: prev.player.energy - 20, reputation: prev.player.reputation + repGain, exp: prev.player.exp + expGain, skills: { ...prev.player.skills, networking: Math.min(10, prev.player.skills.networking + 0.2), }}, dialogue: { title: "SoHo Networking", text: `Influential connections made.\n+${repGain} Rep, +${expGain} EXP. Networking improved.`, options: [{text: "Schmoozed!", action: closeDialogue}] }}));
  };

  // --- QUEST COMPLETION (Unchanged logic) ---
  const completeQuest = (questId) => {
    const quest = questDefinitions[questId]; if (!quest || gameState.player.completedQuests.includes(questId)) return;
    let rewardText = `Quest Complete: ${quest.name}!`; let playerUpdate = { ...gameState.player };
    playerUpdate.exp += quest.reward.exp || 0; if (quest.reward.exp) rewardText += `\n+${quest.reward.exp} EXP`;
    playerUpdate.money += quest.reward.money || 0; if (quest.reward.money) rewardText += `\n+$${quest.reward.money}`;
    playerUpdate.reputation += quest.reward.reputation || 0; if (quest.reward.reputation) rewardText += `\n+${quest.reward.reputation} Rep`;
    if (quest.reward.item) { Object.keys(quest.reward.item).forEach(itemKey => { playerUpdate.inventory[itemKey] = (playerUpdate.inventory[itemKey] || 0) + quest.reward.item[itemKey]; rewardText += `\n+${quest.reward.item[itemKey]} ${itemKey}`; }); }
    playerUpdate.quests = playerUpdate.quests.filter(id => id !== questId); playerUpdate.completedQuests = [...playerUpdate.completedQuests, questId];
    if (quest.unlocksQuests) { quest.unlocksQuests.forEach(newQuestId => { if (!playerUpdate.quests.includes(newQuestId) && !playerUpdate.completedQuests.includes(newQuestId)) { playerUpdate.quests.push(newQuestId); rewardText += `\nNew Quest: ${questDefinitions[newQuestId]?.name || newQuestId}`; }});}
    setGameState(prev => ({ ...prev, player: playerUpdate, dialogue: { title: "Quest Complete!", text: rewardText, options: [{ text: "Onwards!", action: closeDialogue }] }}));
  };

  // --- ART CRITIQUE BATTLE (Unchanged logic) ---
  const startCritiqueBattle = (criticData) => {
    if (gameState.player.energy < 30) { showMessage(criticData.name, "Too tired for debate."); return; }
    setGameState(prev => ({ ...prev, player: {...prev.player, energy: prev.player.energy - 10}, battle: { type: 'critique', opponent: { name: criticData.name, hp: 100, maxHp: 100, type: criticData.type }, player: { hp: 100, maxHp: 100 }, turn: 'player', log: [`${criticData.name} challenges your vision! "Defend your work!"`] }, dialogue: null, menu: null }));
  };
  const handleBattleAction = (action) => {
    const battle = gameState.battle; if (!battle || battle.turn !== 'player') return;
    let newBattle = JSON.parse(JSON.stringify(battle)); newBattle.log = [];
    const playerSkill = gameState.player.skills[action.skill] || 1; const energyCost = action.cost;
    if (gameState.player.energy < energyCost) { newBattle.log.push(`Too flustered (low energy) for "${action.name}".`); newBattle.turn = 'opponent'; }
    else { setGameState(prev => ({...prev, player: {...prev.player, energy: prev.player.energy - energyCost}}));
        const hitChance = action.accuracy * (1 + playerSkill / 20); const didHit = Math.random() < hitChance;
        newBattle.log.push(`You use "${action.name}".`);
        if (didHit) { const damage = Math.floor(action.power * (1 + playerSkill / 10) * (Math.random() * 0.4 + 0.8));
            newBattle.opponent.hp = Math.max(0, newBattle.opponent.hp - damage); newBattle.log.push(`Compelling! Critic loses ${damage} composure.`);
            if (action.skill) { setGameState(prev => ({...prev, player: {...prev.player, skills: {...prev.player.skills, [action.skill]: Math.min(10, prev.player.skills[action.skill]+0.05) }}}));}
        } else { newBattle.log.push(`Argument falls flat...`); }
    }
    if (newBattle.opponent.hp <= 0) { newBattle.log.push(`${newBattle.opponent.name} is speechless! "Remarkable..."`);
        setGameState(prev => ({ ...prev, battle: null, player: { ...prev.player, reputation: prev.player.reputation + 50 + Math.floor(prev.player.skills.artistic * 2), exp: prev.player.exp + 100, energy: Math.max(10, prev.player.energy)}, dialogue: { title: "Debate Won!", text: `Defended art vs ${newBattle.opponent.name}!\n+${50 + Math.floor(prev.player.skills.artistic * 2)} Rep, +100 EXP.`, options: [{ text: "Vindicated!", action: closeDialogue }] }})); return;
    }
    newBattle.turn = 'opponent'; setGameState(prev => ({ ...prev, battle: newBattle }));
    setTimeout(() => {
        const battleState = gameStateRef.current.battle; if (!battleState || battleState.turn !== 'opponent' || battleState.opponent.hp <=0 || battleState.player.hp <=0) return;
        let opponentBattle = JSON.parse(JSON.stringify(battleState)); const criticAction = criticAttacks[Math.floor(Math.random() * criticAttacks.length)];
        opponentBattle.log.push(`${opponentBattle.opponent.name} counters: "${criticAction.name}"!`);
        const didHitOpponent = Math.random() < criticAction.accuracy;
        if (didHitOpponent) { const damage = Math.floor(criticAction.power * (Math.random() * 0.4 + 0.8));
            opponentBattle.player.hp = Math.max(0, opponentBattle.player.hp - damage); opponentBattle.log.push(`Critique stings! Lose ${damage} composure.`);
        } else { opponentBattle.log.push(`Their point misses!`); }
        if (opponentBattle.player.hp <= 0) { opponentBattle.log.push(`Overwhelmed. You concede.`);
            setGameState(prev => ({ ...prev, battle: null, player: { ...prev.player, reputation: Math.max(0, prev.player.reputation - 10), exp: prev.player.exp + 20, energy: Math.max(0, prev.player.energy - 20)}, dialogue: { title: "Debate Lost...", text: `Couldn't sway ${opponentBattle.opponent.name}. Tough lesson.\n-10 Rep, +20 EXP.`, options: [{ text: "I'll be back.", action: closeDialogue }] }})); return;
        }
        opponentBattle.turn = 'player'; setGameState(prev => ({ ...prev, battle: opponentBattle }));
    }, 1500);
  };
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // --- CANVAS RENDERING (Player sprite rendering simplified) ---
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const TILE_SIZE = 32; const RENDER_WIDTH_TILES = 15; const RENDER_HEIGHT_TILES = 15;
    canvas.width = RENDER_WIDTH_TILES * TILE_SIZE; canvas.height = RENDER_HEIGHT_TILES * TILE_SIZE;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const currentMapData = maps[gameState.currentMap]; if (!currentMapData) { ctx.fillStyle = 'red'; ctx.fillText("MAP NOT FOUND", 10, 10); return; }
    const camCenterX = gameState.player.x; const camCenterY = gameState.player.y;
    const camLeftTile = Math.floor(camCenterX - RENDER_WIDTH_TILES / 2);
    const camTopTile = Math.floor(camCenterY - RENDER_HEIGHT_TILES / 2);

    for (let y = 0; y < RENDER_HEIGHT_TILES; y++) {
        for (let x = 0; x < RENDER_WIDTH_TILES; x++) {
            const mapTileX = camLeftTile + x; const mapTileY = camTopTile + y;
            let tileType = 0;
            if (mapTileX >= 0 && mapTileX < currentMapData.width && mapTileY >= 0 && mapTileY < currentMapData.height) {
                tileType = currentMapData.tiles[mapTileY]?.[mapTileX] ?? 0;
            }
            ctx.fillStyle = tileColors[tileType] || '#FF00FF';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    Object.entries(currentMapData.objects).forEach(([posKey, objData]) => {
        const [objMapX, objMapY] = posKey.split(',').map(Number);
        const objScreenX = (objMapX - camLeftTile) * TILE_SIZE; const objScreenY = (objMapY - camTopTile) * TILE_SIZE;
        if (objScreenX > -TILE_SIZE && objScreenX < canvas.width && objScreenY > -TILE_SIZE && objScreenY < canvas.height) {
            ctx.font = `${TILE_SIZE * 0.7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(sprites[objData.type] || '?', objScreenX + TILE_SIZE / 2, objScreenY + TILE_SIZE / 2 +2);
        }
    });
    const playerScreenX = (gameState.player.x - camLeftTile) * TILE_SIZE;
    const playerScreenY = (gameState.player.y - camTopTile) * TILE_SIZE;
    ctx.font = `${TILE_SIZE*0.7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Use sprite index 0 for a static player sprite, based on facing direction
    const playerSprite = sprites.player[gameState.player.facing][0]; 
    ctx.fillText(playerSprite, playerScreenX, playerScreenY + 2);

    const hour = gameState.time;
    if (hour < 6 || hour >= 20) { ctx.fillStyle = 'rgba(0, 0, 30, 0.3)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    else if (gameState.weather === 'rainy') { ctx.fillStyle = 'rgba(100, 100, 150, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    else if (gameState.weather === 'foggy') { ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }, [gameState, animationFrame]);

  // --- UI RENDERING (Styling adjustments) ---
  const renderDialogue = () => {
    if (!gameState.dialogue) return null;
    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 sm:p-6 z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl text-white w-full max-w-lg border border-slate-700">
                <h3 className="text-2xl font-semibold mb-4 text-purple-400">{gameState.dialogue.title || "Notification"}</h3>
                <p className="mb-6 whitespace-pre-line leading-relaxed text-slate-200">{gameState.dialogue.text}</p>
                <div className="space-y-3">
                    {gameState.dialogue.options.map((opt, idx) => (
                        <button key={idx} onClick={opt.action} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75">
                            {opt.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const renderMenu = () => {
    if (!gameState.menu) return null;
    let menuContent;

    const commonCloseButton = <button onClick={closeMenu} className="mt-8 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-md w-full transition duration-150">Close</button>;
    const p = gameState.player; // Player data for easy access

    switch(gameState.menu) {
        case 'status':
            const expToNextLevel = p.level * 100 * (1 + (p.level-1)*0.1);
            menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Player Status</h2>
                    <div className="space-y-3 text-slate-200">
                        <p><strong>Title:</strong> <span className="text-purple-300">{p.title}</span></p>
                        <p><strong>Level:</strong> {p.level} (EXP: {p.exp.toFixed(0)} / {expToNextLevel.toFixed(0)})</p>
                        <progress value={p.exp} max={expToNextLevel} className="w-full h-3 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:bg-green-500 [&::-moz-progress-bar]:bg-green-500"></progress>
                        <p><strong>Money:</strong> <span className="text-green-400">${p.money}</span></p>
                        <p><strong>Reputation:</strong> <span className="text-yellow-400">{p.reputation}</span></p>
                        <p><strong>Energy:</strong> {p.energy}/100</p>
                        <progress value={p.energy} max={100} className="w-full h-3 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:bg-sky-500 [&::-moz-progress-bar]:bg-sky-500"></progress>
                    </div>
                    <div className="mt-6">
                        <h3 className="font-semibold text-xl mb-2 text-purple-300">Skills:</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-300">
                            {Object.entries(p.skills).map(([skill, val]) => <p key={skill} className="capitalize">{skill}: {val.toFixed(1)}/10</p>)}
                        </div>
                    </div>
                     <div className="mt-6">
                        <h3 className="font-semibold text-xl mb-2 text-purple-300">Equipment:</h3>
                        <p className="text-slate-300">Brush: {p.equipment.brush}</p>
                        <p className="text-slate-300">Outfit: {p.equipment.outfit}</p>
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
        case 'inventory':
            const inv = gameState.player.inventory;
            menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Inventory</h2>
                    <div className="space-y-2 text-slate-200">
                        <p>Paintings: <span className="text-yellow-300">{inv.paintings}</span></p>
                        <p>Sculptures: <span className="text-yellow-300">{inv.sculptures}</span></p>
                        <p>Digital Art: <span className="text-yellow-300">{inv.digitalArt}</span></p>
                        <hr className="my-4 border-slate-600"/>
                        <p>Coffee: <span className="text-yellow-300">{inv.coffee}</span></p>
                        <p>Business Cards: <span className="text-yellow-300">{inv.businessCards}</span></p>
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
        case 'quests':
             menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Quests & Achievements</h2>
                    <div>
                        <h3 className="font-semibold text-xl mb-2 text-purple-300">Active Quests:</h3>
                        {gameState.player.quests.length > 0 ? gameState.player.quests.map(id => questDefinitions[id]).filter(q=>q).map(q => (
                            <div key={q.id} className="p-3 border border-slate-600 bg-slate-700/50 rounded-md my-2">
                                <strong className="text-purple-300">{q.name}</strong>
                                <p className="text-sm text-slate-300 mt-1">{q.description}</p>
                            </div>
                        )) : <p className="text-slate-400">No active quests.</p>}
                    </div>
                    <div className="mt-6">
                        <h3 className="font-semibold text-xl mb-2 text-purple-300">Completed Quests:</h3>
                        {gameState.player.completedQuests.length > 0 ? gameState.player.completedQuests.map(id => questDefinitions[id]).filter(q=>q).map(q => (
                            <div key={q.id} className="p-3 border border-slate-700 bg-slate-700/30 rounded-md my-2 opacity-70">
                                <strong className="text-green-400">{q.name}</strong> (Completed)
                            </div>
                        )) : <p className="text-slate-400">No completed quests yet.</p>}
                    </div>
                    <div className="mt-6">
                         <h3 className="font-semibold text-xl mb-2 text-purple-300">Achievements:</h3>
                        {gameState.player.achievements.length > 0 ? gameState.player.achievements.map(ach => (
                            <div key={ach} className="p-3 border border-yellow-600 bg-yellow-500/20 rounded-md my-2 text-yellow-300 capitalize">
                                {ach.replace(/_/g, ' ')} <Star size={16} className="inline ml-1"/>
                            </div>
                        )) : <p className="text-slate-400">No achievements unlocked.</p>}
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
        case 'market':
            const marketStatus = gameState.marketMultiplier > 1.1 ? "Hot!" : gameState.marketMultiplier < 0.9 ? "Cool..." : "Stable";
            const colorClass = gameState.marketMultiplier > 1.1 ? "text-green-400" : gameState.marketMultiplier < 0.9 ? "text-red-400" : "text-yellow-400";
            menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Market Analysis</h2>
                    <p className="text-xl text-center mb-2 text-slate-200">Current Art Market Multiplier:</p>
                    <p className={`text-4xl font-bold text-center mb-4 ${colorClass}`}>{gameState.marketMultiplier.toFixed(2)}x</p>
                    <p className="text-xl text-center mb-6 text-slate-200">Market Status: <span className={`font-bold ${colorClass}`}>{marketStatus}</span></p>
                    <p className="text-sm text-center text-slate-400">This multiplier affects the sale price of your artworks. It can change daily.</p>
                    <p className="mt-2 text-sm text-center text-slate-400">Tip: Higher Business skill can also improve your sale prices!</p>
                    {commonCloseButton}
                </>
            );
            break;
        // Simplified Menu Button Styles
        const menuButtonBaseClass = "w-full text-white font-semibold py-3 px-4 rounded-md transition duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-50";
        case 'create_art':
             menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Create Art</h2>
                    <p className="mb-4 text-center text-slate-300">Energy: {p.energy}/100 | Artistic Skill: {p.skills.artistic.toFixed(1)}</p>
                    <div className="space-y-3">
                        <button onClick={() => createArt('painting')} className={`${menuButtonBaseClass} bg-blue-600 hover:bg-blue-700 focus:ring-blue-400`}>Paint (25 EGY, Skill 1+)</button>
                        <button onClick={() => createArt('sculpture')} disabled={p.skills.artistic < 3} className={`${menuButtonBaseClass} bg-green-600 hover:bg-green-700 focus:ring-green-400`}>Sculpt (40 EGY, Skill 3+)</button>
                        <button onClick={() => createArt('digital')} disabled={p.skills.artistic < 5} className={`${menuButtonBaseClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400`}>Digital Art (20 EGY, Skill 5+)</button>
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
        case 'rest':
            menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Rest</h2>
                    <p className="mb-4 text-center text-slate-300">Time: {gameState.time}:00, Day {gameState.day} | Energy: {p.energy}/100</p>
                    <div className="space-y-3">
                        <button onClick={() => rest('nap')} className={`${menuButtonBaseClass} bg-sky-600 hover:bg-sky-700 focus:ring-sky-400`}>Nap (2 Hours, +30 Energy)</button>
                        <button onClick={() => rest('sleep')} className={`${menuButtonBaseClass} bg-slate-600 hover:bg-slate-700 focus:ring-slate-400`}>Sleep (Until 8 AM, +100 Energy)</button>
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
         case 'study':
            menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Study</h2>
                    <p className="mb-4 text-center text-slate-300">Energy: {p.energy}/100</p>
                     <div className="space-y-3">
                        <button onClick={() => study('artistic')} className={`${menuButtonBaseClass} bg-red-600 hover:bg-red-700 focus:ring-red-400`}>Practice Art (15 EGY, +Artistic)</button>
                        <button onClick={() => study('networking')} className={`${menuButtonBaseClass} bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-400`}>Social Media Trends (15 EGY, +Networking)</button>
                        <button onClick={() => study('business')} className={`${menuButtonBaseClass} bg-green-600 hover:bg-green-700 focus:ring-green-400`}>Market Reports (15 EGY, +Business)</button>
                        <button onClick={() => study('curating')} className={`${menuButtonBaseClass} bg-blue-600 hover:bg-blue-700 focus:ring-blue-400`}>Art History (15 EGY, +Curating)</button>
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
        case 'shop_pro_art_supplies': 
             menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Pro Art Supplies (SoHo)</h2>
                    <p className="mb-4 text-center text-slate-300">Money: ${p.money}</p>
                    <div className="space-y-3">
                        <button onClick={() => buyEquipmentItem('brush', 'Pro Brush Set', 500, 1, 'artistic')} 
                            className={`${menuButtonBaseClass} bg-teal-600 hover:bg-teal-700 focus:ring-teal-400`}
                            disabled={p.equipment.brush === 'Pro Brush Set'}>
                            Pro Brush Set ($500) <span className="block text-xs opacity-80">(+1 Artistic Perm.) {p.equipment.brush === 'Pro Brush Set' ? "(Owned)" : ""}</span>
                        </button>
                         <button onClick={() => buyConsumableItem('Business Cards', 'businessCards', 50, 20)} 
                            className={`${menuButtonBaseClass} bg-orange-600 hover:bg-orange-700 focus:ring-orange-400`}>
                            Premium Business Cards (20x) ($50)
                        </button>
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
        case 'shop_fashion': 
            menuContent = (
                <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Chic Boutique (SoHo)</h2>
                     <p className="mb-4 text-center text-slate-300">Money: ${p.money}</p>
                    <div className="space-y-3">
                        <button onClick={() => buyEquipmentItem('outfit', 'Designer Outfit', 1000, 1, 'networking')} 
                            className={`${menuButtonBaseClass} bg-pink-600 hover:bg-pink-700 focus:ring-pink-400`}
                            disabled={p.equipment.outfit === 'Designer Outfit'}>
                            Designer Outfit ($1000) <span className="block text-xs opacity-80">(+1 Networking Perm.) {p.equipment.outfit === 'Designer Outfit' ? "(Owned)" : ""}</span>
                        </button>
                         <p className="text-sm text-center mt-4 text-slate-500">More styles coming soon!</p>
                    </div>
                    {commonCloseButton}
                </>
            );
            break;
        default: menuContent = <p>Unknown menu: {gameState.menu}</p>;
    }

    return (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 sm:p-6 z-40">
            <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl text-white w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-700">
                {menuContent}
            </div>
        </div>
    );
  };

  const renderBattleUI = () => {
    if (!gameState.battle) return null;
    const battle = gameState.battle;
    const player = gameState.player;

    return (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-2 sm:p-4 z-50 text-white">
            <div className="battle-arena w-full max-w-2xl bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl border-2 border-red-600/70">
                <div className="text-center mb-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-red-400">{battle.opponent.name}</h2>
                    <p className="text-sm text-slate-300">Composure: {battle.opponent.hp} / {battle.opponent.maxHp}</p>
                    <progress value={battle.opponent.hp} max={battle.opponent.maxHp} className="w-full sm:w-3/4 mx-auto mt-1 h-3 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:bg-red-500 [&::-moz-progress-bar]:bg-red-500"></progress>
                </div>

                <div className="battle-log h-28 sm:h-32 overflow-y-auto bg-slate-700/50 p-3 rounded-md mb-4 border border-slate-600 text-sm text-slate-300 leading-relaxed">
                    {battle.log.map((entry, idx) => <p key={idx} className="mb-1">{'>'} {entry}</p>)}
                </div>

                 <div className="text-center mb-5 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-sky-400">{player.title} (You)</h2>
                     <p className="text-sm text-slate-300">Composure: {battle.player.hp} / {battle.player.maxHp}</p>
                     <progress value={battle.player.hp} max={battle.player.maxHp} className="w-full sm:w-3/4 mx-auto mt-1 h-3 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:bg-sky-500 [&::-moz-progress-bar]:bg-sky-500"></progress>
                    <p className="text-xs text-slate-400 mt-1">Energy: {player.energy}</p>
                </div>

                {battle.turn === 'player' && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {battleActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleBattleAction(action)}
                                disabled={player.energy < action.cost}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-semibold py-2.5 sm:py-3 px-2 sm:px-3 rounded-md text-xs sm:text-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
                                title={`${action.description}\nCost: ${action.cost} Energy. Power: ${action.power}, Acc: ${action.accuracy*100}%. Uses ${action.skill} skill.`}
                            >
                                {action.name} ({action.cost}E)
                            </button>
                        ))}
                    </div>
                )}
                 {battle.turn === 'opponent' && <p className="text-center text-yellow-400 animate-pulse py-3">Critic is thinking...</p>}
            </div>
        </div>
    );
  };

  // --- MAIN COMPONENT RENDER (Centering and styling adjustments) ---
  return (
    // Centering the entire game on the page
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 select-none font-mono">
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl"> {/* Responsive max-width for the game area */}
        <header className="mb-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-400 tracking-wider">Art World RPG</h1>
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-slate-400 mt-2 space-y-1 sm:space-y-0">
              <span>Day: {gameState.day}, Time: {gameState.time.toString().padStart(2,'0')}:00</span>
              <span className="hidden sm:inline">|</span>
              <span className="truncate"><MapPin size={14} className="inline mr-1"/> {maps[gameState.currentMap]?.name || 'Unknown Area'}</span>
              <span className="hidden sm:inline">|</span>
              <span>Weather: {gameState.weather}</span>
              <span className="hidden sm:inline">|</span>
              <span><span className="text-green-400">$ {gameState.player.money}</span> | Rep: <span className="text-yellow-400">{gameState.player.reputation}</span></span>
          </div>
        </header>

        {/* Canvas container ensures it's centered if header/footer are wider */}
        <div className="relative mx-auto w-[480px] h-[480px] border-2 border-purple-500/70 rounded-lg overflow-hidden shadow-2xl bg-black">
          <canvas ref={canvasRef} />
          {renderDialogue()}
          {renderMenu()}
          {renderBattleUI()}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'status' ? null : 'status' }))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><User size={16} className="mr-2"/> Status (M)</button>
            <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'inventory' ? null : 'inventory' }))} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><Briefcase size={16} className="mr-2"/> Inv (I)</button>
            <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'quests' ? null : 'quests' }))} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><Trophy size={16} className="mr-2"/> Quests (Q)</button>
            <button onClick={() => setGameState(prev => ({ ...prev, menu: prev.menu === 'market' ? null : 'market' }))} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-md inline-flex items-center justify-center text-sm transition"><BarChart size={16} className="mr-2"/> Market</button>
        </div>
        <footer className="mt-4 text-center text-xs text-slate-500">
            Controls: Arrow Keys/WASD to Move, Shift to Sprint, Space/Enter to Interact.
        </footer>
      </div>
    </div>
  );
};

export default ArtGalleryRPG;
