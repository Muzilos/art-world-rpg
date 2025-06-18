const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const map = maps[gameState.currentMap];
  
  // Draw tiles
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileIndex = y * map.width + x;
      ctx.fillStyle = tileColors[map.tiles[tileIndex]] || '#000';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  
  // Draw click marker
  if (gameState.clickMarker.x >= 0 && gameState.clickMarker.y >= 0) {
    ctx.strokeStyle = gameState.clickMarker.type === 'interactive' ? '#fbbf24' : '#60a5fa';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      gameState.clickMarker.x * TILE_SIZE + 2, 
      gameState.clickMarker.y * TILE_SIZE + 2, 
      TILE_SIZE - 4, 
      TILE_SIZE - 4
    );
  }
  
  // Draw characters
  (gameState.characters[gameState.currentMap] || []).forEach(char => {
    ctx.fillStyle = char.id === 'chicken' ? '#ffffff' : 
                   char.id === 'crystal' ? '#fbbf24' : 'purple';
    ctx.beginPath();
    ctx.arc(
      char.x * TILE_SIZE + TILE_SIZE / 2, 
      char.y * TILE_SIZE + TILE_SIZE / 2, 
      TILE_SIZE / 2 - 2, 
      0, Math.PI * 2
    );
    ctx.fill();
  });
  
  // Draw player
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(
    gameState.player.x * TILE_SIZE + TILE_SIZE / 2, 
    gameState.player.y * TILE_SIZE + TILE_SIZE / 2, 
    TILE_SIZE / 2 - 2, 
    0, Math.PI * 2
  );
  ctx.fill();
  
  // Draw UI on map
  drawMapUI();
}

function drawMapUI() {
  const stats = gameState.player.stats;
  
  // Health bar
  const hpBarWidth = 120;
  const hpBarHeight = 12;
  const hpRatio = stats.hp / stats.maxHp;
  
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(10, 10, hpBarWidth, hpBarHeight);
  ctx.fillStyle = hpRatio > 0.5 ? '#48bb78' : hpRatio > 0.25 ? '#ed8936' : '#f56565';
  ctx.fillRect(10, 10, hpBarWidth * hpRatio, hpBarHeight);
  
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '12px Courier New';
  ctx.fillText(`HP: ${stats.hp}/${stats.maxHp}`, 10, 35);
  
  // Level and XP
  ctx.fillText(`Level: ${stats.level}`, 10, 50);
  ctx.fillText(`XP: ${stats.xp}/${stats.xpToNextLevel}`, 10, 65);
  
  // Attack/Defense
  ctx.fillText(`ATK: ${stats.attack} DEF: ${stats.defense}`, 10, 80);
  
  // Backpack
  ctx.fillText('Backpack:', 10, 100);
  if (gameState.player.backpack.length === 0) {
    ctx.fillStyle = '#a0aec0';
    ctx.fillText('(empty)', 10, 115);
  } else {
    gameState.player.backpack.forEach((item, i) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`• ${item.charAt(0).toUpperCase() + item.slice(1)}`, 10, 115 + i * 15);
    });
  }
}