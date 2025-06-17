const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const map = maps[gameState.currentMap];
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    const tileIndex = y * map.width + x;
    ctx.fillStyle = tileColors[map.tiles[tileIndex]] || '#000';
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  (gameState.characters[gameState.currentMap] || []).forEach(char => {
    ctx.fillStyle = char.id === 'chicken' ? '#ffffff' : 'purple';
    ctx.beginPath();
    ctx.arc(char.x * TILE_SIZE + TILE_SIZE / 2, char.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(gameState.player.x * TILE_SIZE + TILE_SIZE / 2, gameState.player.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
}
