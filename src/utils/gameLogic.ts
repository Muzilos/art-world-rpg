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

export const aStar = (start: { x: number; y: number }, end: { x: number; y: number }, map: any) => {
  const openSet = new Set([start]);
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map([[start, 0]]);
  const fScore = new Map([[start, heuristic(start, end)]]);

  const getNeighbors = (node: { x: number; y: number }) => {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];

    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;
      
      if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
        if (!map.collision[newY][newX]) {
          neighbors.push({ x: newX, y: newY });
        }
      }
    }
    return neighbors;
  };

  while (openSet.size > 0) {
    let current = null;
    let lowestFScore = Infinity;

    for (const node of openSet) {
      const score = fScore.get(node) || Infinity;
      if (score < lowestFScore) {
        lowestFScore = score;
        current = node;
      }
    }

    if (!current) break;

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);
    closedSet.add(current);

    for (const neighbor of getNeighbors(current)) {
      if (closedSet.has(neighbor)) continue;

      const tentativeGScore = (gScore.get(current) || Infinity) + 1;

      if (!openSet.has(neighbor)) {
        openSet.add(neighbor);
      } else if (tentativeGScore >= (gScore.get(neighbor) || Infinity)) {
        continue;
      }

      cameFrom.set(neighbor, current);
      gScore.set(neighbor, tentativeGScore);
      fScore.set(neighbor, tentativeGScore + heuristic(neighbor, end));
    }
  }

  return null;
};

const heuristic = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const reconstructPath = (cameFrom: Map<any, any>, current: any) => {
  const path = [current];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    path.unshift(current);
  }
  return path;
};

// Game Logic Functions
import type { GameMap, MapObject, Player, ObjectData } from '../types/game';

export const checkInteraction = (player: Player, currentMap: GameMap): MapObject | null => {
  const playerTileX = Math.floor(player.x / 32);
  const playerTileY = Math.floor(player.y / 32);

  // Check all objects within a 1-tile radius
  for (const obj of currentMap.objects) {
    const [objX, objY] = obj.id.split(',').map(Number);
    if (Math.abs(objX - playerTileX) <= 1 && Math.abs(objY - playerTileY) <= 1) {
      return obj;
    }
  }
  return null;
};

export const handleMapTransition = (player: Player, currentMap: GameMap, targetMap: string): { player: Player; map: string } => {
  // Find the door object that triggered the transition
  const door = currentMap.objects.find(obj => {
    if (obj.data.interaction !== 'exit') return false;
    
    // Get player's tile position
    const playerTileX = Math.floor(player.x / 32);
    const playerTileY = Math.floor(player.y / 32);
    
    // Get door's tile position
    const doorTileX = Math.floor(obj.x / 32);
    const doorTileY = Math.floor(obj.y / 32);
    
    // Check if player is adjacent to the door (including diagonals)
    const isAdjacent = Math.abs(playerTileX - doorTileX) <= 1 && Math.abs(playerTileY - doorTileY) <= 1;
    
    return isAdjacent;
  });

  if (!door) {
    return { player, map: currentMap.id };
  }

  // Get the target position from the door's data
  const targetPos = door.data.targetPosition || { x: 0, y: 0 };
  
  // Update player position to the target position
  const updatedPlayer = {
    ...player,
    x: targetPos.x,
    y: targetPos.y,
    path: [], // Clear any existing path
  };

  return { player: updatedPlayer, map: targetMap };
};

export const handleInteraction = (interactionType: string, data: ObjectData, player: Player, currentMap: GameMap): { menu: string; data?: any; mapTransition?: { map: string; position: { x: number; y: number } } } | null => {
  switch (interactionType) {
    case 'create_art':
      return { 
        menu: 'create_art',
        data: {
          energy: player.energy,
          skills: player.skills
        }
      };
    case 'rest':
      return { 
        menu: 'rest',
        data: {
          energy: player.energy,
          cost: 10 // Cost to rest
        }
      };
    case 'study':
      return { 
        menu: 'study',
        data: {
          energy: player.energy,
          skills: player.skills
        }
      };
    case 'exit':
      // Get the exit data from the map using the object's position
      const exitKey = `${Math.floor(data.x / 32)},${Math.floor(data.y / 32)}`;
      const exitData = currentMap.exits?.[exitKey];
      if (exitData) {
        return { 
          menu: 'exit',
          data: {
            targetMap: exitData.to,
            targetPosition: { x: exitData.x * 32, y: exitData.y * 32 }
          },
          mapTransition: {
            map: exitData.to,
            position: { x: exitData.x * 32, y: exitData.y * 32 }
          }
        };
      }
      return null;
    case 'npc':
      return { 
        menu: 'dialogue',
        data: {
          npcId: data.npcId,
          dialogueTree: data.dialogueTree
        }
      };
    case 'shop':
      return { 
        menu: 'market',
        data: {
          inventory: data.inventory,
          prices: data.prices
        }
      };
    default:
      return null;
  }
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

// Add more game logic functions as needed... 