import type { GameState, MenuType, ObjectData, Player, GameMap, NPCData } from '../types/game';

// Helper Functions
export const getWrappedLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  ctx.font = font;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
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

export const wrapAndDrawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  style: { 
    fillStyle: string; 
    font: string; 
    textAlign: CanvasTextAlign;
    padding?: number; // Optional padding for text within its container
  }
) => {
  const padding = style.padding || 10; // Default padding if not specified
  const effectiveWidth = maxWidth - (padding * 2); // Account for padding on both sides
  
  const lines = getWrappedLines(ctx, text, effectiveWidth, style.font);
  ctx.font = style.font;
  ctx.fillStyle = style.fillStyle;
  ctx.textAlign = style.textAlign;

  // Calculate the starting x position based on text alignment
  let startX = x;
  if (style.textAlign === 'center') {
    startX = x + (maxWidth / 2);
  } else if (style.textAlign === 'right') {
    startX = x + maxWidth - padding;
  } else {
    // For left alignment, add padding
    startX = x + padding;
  }

  lines.forEach((line, i) => {
    const lineY = y + (i * lineHeight);
    ctx.fillText(line, startX, lineY);
  });

  return lines.length * lineHeight;
};

// Game Logic Functions
export const checkInteraction = (player: Player, currentMap: GameMap): ObjectData | null => {
  const playerTileX = Math.floor(player.x / 32);
  const playerTileY = Math.floor(player.y / 32);

  // Check all objects within a 1-tile radius
  for (const [key, obj] of Object.entries(currentMap.objects)) {
    const [objX, objY] = key.split(',').map(Number);
    if (Math.abs(objX - playerTileX) <= 1 && Math.abs(objY - playerTileY) <= 1) {
      return {
        sprite: obj.type,
        interaction: obj.interaction,
        name: obj.name,
        type: obj.type,
        x: objX * 32,
        y: objY * 32
      };
    }
  }
  return null;
};

export const handleMapTransition = (player: Player, currentMap: GameMap, targetMap: string): { player: Player; map: string } => {
  // Find the door object that triggered the transition
  const door = Object.entries(currentMap.objects).find(([key, obj]) => {
    if (obj.interaction !== 'exit') return false;
    
    // Get player's tile position
    const playerTileX = Math.floor(player.x / 32);
    const playerTileY = Math.floor(player.y / 32);
    
    // Get door's tile position
    const [doorTileX, doorTileY] = key.split(',').map(Number);
    
    // Check if player is adjacent to the door (including diagonals)
    const isAdjacent = Math.abs(playerTileX - doorTileX) <= 1 && Math.abs(playerTileY - doorTileY) <= 1;
    
    return isAdjacent;
  });

  if (!door) {
    return { player, map: currentMap.name };
  }

  // Get the target position from the door's data
  const exitKey = door[0];
  const exitData = currentMap.exits?.[exitKey];
  if (!exitData) {
    return { player, map: currentMap.name };
  }
  
  // Update player position to the target position
  const updatedPlayer = {
    ...player,
    x: exitData.x * 32,
    y: exitData.y * 32,
    path: [], // Clear any existing path
  };

  return { player: updatedPlayer, map: targetMap };
};

export const handleInteraction = (interactionType: string, data: ObjectData, player: Player, currentMap: GameMap): { menu: MenuType; data?: NPCData | Record<string, unknown>; mapTransition?: { map: string; position: { x: number; y: number } } } | null => {
  // Handle map transitions
  if (interactionType === 'exit') {
    const exitKey = `${Math.floor(data.x / 32)},${Math.floor(data.y / 32)}`;
    const exitData = currentMap.exits?.[exitKey];
    if (exitData) {
      return { 
        menu: 'exit',
        data: {
          targetMap: exitData.to,
          targetPosition: { x: exitData.x * 32, y: exitData.y * 32 }
        } as Record<string, unknown>,
        mapTransition: {
          map: exitData.to,
          position: { x: exitData.x * 32, y: exitData.y * 32 }
        }
      };
    }
    return null;
  }

  // Handle NPC interactions
  if (interactionType === 'talk_npc') {
    return {
      menu: 'talk_npc',
      data: {
        type: data.type,
        name: data.name,
        x: data.x,
        y: data.y,
        interaction: data.interaction
      } as NPCData
    };
  }

  // Handle shop interactions
  if (interactionType === 'shop') {
    return {
      menu: 'shop',
      data: {
        name: data.name,
        description: "Welcome to the shop! What would you like to buy?",
        reputationChange: 0,
        sale: null
      }
    };
  }

  return null;
};

export const updatePlayerPosition = (player: Player, isSprinting: boolean): Player => {
  if (!player.path || player.path.length === 0) {
    return player;
  }

  const moveSpeed = isSprinting ? 4 : 2;
  const nextPoint = player.path[0];
  const dx = nextPoint.x - player.x;
  const dy = nextPoint.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < moveSpeed) {
    // Reached the next point
    player.x = nextPoint.x;
    player.y = nextPoint.y;
    player.path.shift();

    // Update facing direction based on movement
    if (player.path.length > 0) {
      const nextNextPoint = player.path[0];
      const nextDx = nextNextPoint.x - player.x;
      const nextDy = nextNextPoint.y - player.y;
      
      if (Math.abs(nextDx) > Math.abs(nextDy)) {
        player.facing = nextDx > 0 ? 'right' : 'left';
      } else {
        player.facing = nextDy > 0 ? 'down' : 'up';
      }
    }

    // Update player sprite animation
    player.sprite = (player.sprite + 1) % 4; // Assuming 4 frames of animation
  } else {
    // Move towards the next point
    const ratio = moveSpeed / distance;
    player.x += dx * ratio;
    player.y += dy * ratio;
  }

  return player;
};

export const handleShopTransaction = (
  itemName: string,
  itemKey: string,
  price: number,
  amount: number,
  setGameState: (updater: (prev: GameState) => GameState) => void,
  closeDialogue: () => void
) => {
  setGameState(prev => {
    const newState = { ...prev };
    if (newState.player.money >= price * amount) {
      newState.player.money -= price * amount;
      if (!newState.player.inventory[itemKey]) {
        newState.player.inventory[itemKey] = {
          id: itemKey,
          name: itemName,
          type: 'consumable',
          value: 1,
          description: 'A consumable item.',
          quantity: amount
        };
      } else {
        newState.player.inventory[itemKey].quantity += amount;
      }
      newState.dialogue = {
        title: "Purchase Successful!",
        text: `You bought ${amount}x ${itemName} for $${price * amount}.`,
        options: [{ text: "Great!", action: closeDialogue }]
      };
    } else {
      newState.dialogue = {
        title: "Not Enough Money",
        text: `You need $${price * amount} to buy ${amount}x ${itemName}.`,
        options: [{ text: "Okay", action: closeDialogue }]
      };
    }
    return newState;
  });
};

// Add more game logic functions as needed... 