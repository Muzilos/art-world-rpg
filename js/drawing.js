const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

/**
 * Draws all game elements onto the canvas.
 */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
  const map = maps[gameState.currentMap]; // Get the current map data

  // Draw tiles
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileIndex = y * map.width + x;
      ctx.fillStyle = tileColors[map.tiles[tileIndex]] || '#000'; // Get tile color, default to black
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE); // Draw the tile

      // Highlight transition tiles (doors)
      const transition = map.transitions.find(t => t.x === x && t.y === y);
      if (transition) {
        ctx.strokeStyle = '#ff00ff'; // Magenta color for doors
        ctx.lineWidth = 2; // Thicker border
        ctx.strokeRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }
  }

  // Draw click marker (yellow for interactive, blue for normal movement)
  if (gameState.clickMarker.x >= 0 && gameState.clickMarker.y >= 0) {
    ctx.strokeStyle = gameState.clickMarker.type === 'interactive' ? '#fbbf24' : '#60a5fa'; // Tailwind amber-400 or blue-400
    ctx.lineWidth = 3; // Make the border thicker
    ctx.strokeRect(
      gameState.clickMarker.x * TILE_SIZE + 2,
      gameState.clickMarker.y * TILE_SIZE + 2,
      TILE_SIZE - 4,
      TILE_SIZE - 4
    );
  }

  // Draw characters (chicken, crystal, and new mysterious figure)
  (characters[gameState.currentMap] || []).forEach(char => {
    let color;
    switch (char.id) {
      case 'chicken':
        color = '#ffffff'; // White for chicken
        break;
      case 'crystal':
        color = '#fbbf24'; // Amber for crystal
        break;
      case 'mysterious_figure':
        color = '#8b5cf6'; // Purple for mysterious figure (Tailwind violet-500)
        break;
      default:
        color = 'purple'; // Default for other characters
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      char.x * TILE_SIZE + TILE_SIZE / 2, // Center X
      char.y * TILE_SIZE + TILE_SIZE / 2, // Center Y
      TILE_SIZE / 2 - 2, // Radius, slightly smaller than tile
      0, Math.PI * 2 // Full circle
    );
    ctx.fill();
  });

  // Draw player
  ctx.fillStyle = 'red'; // Player color
  ctx.beginPath();
  ctx.arc(
    gameState.player.x * TILE_SIZE + TILE_SIZE / 2, // Center X
    gameState.player.y * TILE_SIZE + TILE_SIZE / 2, // Center Y
    TILE_SIZE / 2 - 2, // Radius, slightly smaller than tile
    0, Math.PI * 2 // Full circle
  );
  ctx.fill();

  // Draw UI elements on top of the map
  drawMapUI();
}

/**
 * Draws the player's UI elements (HP, Level, XP, Backpack) on the canvas.
 */
function drawMapUI() {
  const stats = gameState.player.stats; // Get player stats

  // Health bar
  const hpBarWidth = 120;
  const hpBarHeight = 12;
  const hpRatio = stats.hp / stats.maxHp; // Current HP ratio

  ctx.fillStyle = '#4a5568'; // Background for HP bar (Tailwind gray-700)
  ctx.fillRect(10, 10, hpBarWidth, hpBarHeight); // Draw background bar
  // Fill HP bar with color based on HP ratio
  ctx.fillStyle = hpRatio > 0.5 ? '#48bb78' : hpRatio > 0.25 ? '#ed8936' : '#f56565'; // Green, orange, or red
  ctx.fillRect(10, 10, hpBarWidth * hpRatio, hpBarHeight); // Draw filled HP bar

  ctx.fillStyle = '#e2e8f0'; // Text color (Tailwind gray-200)
  ctx.font = '12px Courier New'; // Font for UI text
  ctx.fillText(`HP: ${stats.hp}/${stats.maxHp}`, 10, 35); // Display HP text

  // Level and XP
  ctx.fillText(`Level: ${stats.level}`, 10, 50); // Display level
  ctx.fillText(`XP: ${stats.xp}/${stats.xpToNextLevel}`, 10, 65); // Display XP

  // Attack/Defense
  ctx.fillText(`ATK: ${stats.attack} DEF: ${stats.defense}`, 10, 80); // Display ATK/DEF

  // Backpack content
  ctx.fillText('Backpack:', 10, 100); // Backpack label
  if (gameState.player.backpack.length === 0) {
    ctx.fillStyle = '#a0aec0'; // Lighter gray for empty message (Tailwind gray-400)
    ctx.fillText('(empty)', 10, 115); // Display empty message
  } else {
    // List items in backpack
    gameState.player.backpack.forEach((item, i) => {
      ctx.fillStyle = '#e2e8f0'; // Text color
      ctx.fillText(`• ${item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' ')}`, 10, 115 + i * 15); // Format item name
    });
  }
}
