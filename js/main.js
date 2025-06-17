let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}
function update(deltaTime) {
  gameState.player.moveTimer -= deltaTime;
  if (gameState.player.path.length > 0 && gameState.player.moveTimer <= 0) {
    gameState.player.moveTimer = gameState.player.speed;
    const nextStep = gameState.player.path.shift();
    gameState.player.x = nextStep.x;
    gameState.player.y = nextStep.y;
    checkTransition();
  }
}
function checkTransition() {
  const map = maps[gameState.currentMap];
  const transition = map.transitions.find(t => t.x === gameState.player.x && t.y === gameState.player.y);
  if (transition) {
    gameState.currentMap = transition.targetMap;
    gameState.player.x = transition.targetX;
    gameState.player.y = transition.targetY;
    gameState.player.path = [];
  }
}
function initializeEventListeners() {
  document.getElementById('levelUpButton').addEventListener('click', levelUp);
  document.getElementById('closeDialogue').addEventListener('click', closeDialogue);
  document.getElementById('statsHeader').addEventListener('click', () => {
    const content = document.getElementById('statsContent');
    const toggle = document.getElementById('statsToggle');
    content.classList.toggle('collapsed');
    toggle.textContent = content.classList.contains('collapsed') ? '[ + ]' : '[ - ]';
  });
  canvas.addEventListener('click', (event) => {
    if (!document.getElementById('dialogueBox').classList.contains('hidden')) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left, mouseY = event.clientY - rect.top;
    const tileX = Math.floor(mouseX / TILE_SIZE), tileY = Math.floor(mouseY / TILE_SIZE);
    const character = (gameState.characters[gameState.currentMap] || []).find(c => c.x === tileX && c.y === tileY);
    if (character) {
      let dialogueState = 'start';
      if (character.id === 'old_man') {
        // This logic determines which dialogue to show based on quest progress
        const questStatus = gameState.quests.chickenQuest;
        const hasChicken = gameState.player.backpack.includes('chicken');
        if (questStatus === 'rewarded') {
          dialogueState = 'quest_rewarded';
        } else if (questStatus === 'completed' && hasChicken) {
          dialogueState = 'quest_hand_over';
        } else if (questStatus === 'accepted' || (questStatus === 'completed' && !hasChicken)) {
          dialogueState = 'quest_in_progress';
        }
      }
      showDialogue(character, dialogueState);
      return;
    }
    const map = maps[gameState.currentMap];
    const path = aStar({ x: gameState.player.x, y: gameState.player.y }, { x: tileX, y: tileY }, map);
    if (path.length > 0) {
      path.shift();
      gameState.player.path = path;
      gameState.player.moveTimer = 0;
    }
  });
}

// --- Initial Game Start ---
updateStatsUI();
updateBackpackUI(); // Initial backpack draw
initializeEventListeners();
requestAnimationFrame(gameLoop);
