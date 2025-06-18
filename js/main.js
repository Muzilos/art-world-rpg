// === UTILITY FUNCTIONS ===
function isAdjacent(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1 && !(x1 === x2 && y1 === y2);
}

function getDialogueState(character) {
  if (character.id === 'old_man') {
    const questStatus = gameState.quests.chickenQuest;
    const hasChicken = gameState.player.backpack.includes('chicken');
    if (questStatus === 'rewarded') return 'quest_rewarded';
    if (questStatus === 'completed' && hasChicken) return 'quest_hand_over';
    if (questStatus === 'accepted' || (questStatus === 'completed' && !hasChicken)) return 'quest_in_progress';
  }
  
  if (character.id === 'merchant') {
    const questStatus = gameState.quests.crystalQuest;
    const hasCrystal = gameState.player.backpack.includes('crystal');
    if (questStatus === 'rewarded') return 'quest_rewarded';
    if (questStatus === 'completed' && hasCrystal) return 'quest_hand_over';
    if (questStatus === 'accepted' || (questStatus === 'completed' && !hasCrystal)) return 'quest_in_progress';
  }
  
  return 'start';
}

// === GAME LOOP ===
requestAnimationFrame(gameLoop);

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
    gameState.clickMarker.x = -1;
    gameState.clickMarker.y = -1;
  }
}

// === EVENT LISTENERS ===
function initializeEventListeners() {
  document.getElementById('closeDialogue').addEventListener('click', closeDialogue);
  
  canvas.addEventListener('click', (event) => {
    if (!document.getElementById('dialogueBox').classList.contains('hidden')) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let tileX = Math.floor(mouseX / TILE_SIZE);
    let tileY = Math.floor(mouseY / TILE_SIZE);
    
    // Update click marker
    gameState.clickMarker.x = tileX;
    gameState.clickMarker.y = tileY;
    gameState.clickMarker.type = 'normal';
    
    // Check for character interaction (must be adjacent)
    const character = (gameState.characters[gameState.currentMap] || []).find(c => c.x === tileX && c.y === tileY);
    if (character) {
      if (isAdjacent(gameState.player.x, gameState.player.y, tileX, tileY)) {
        gameState.clickMarker.type = 'interactive';
        const dialogueState = getDialogueState(character);
        showDialogue(character, dialogueState);
        return;
      } else {
        gameState.clickMarker.type = 'interactive';
      }
    }
    
    // Check for transition markers
    const map = maps[gameState.currentMap];
    const transition = map.transitions.find(t => t.x === tileX && t.y === tileY);
    if (transition) {
      gameState.clickMarker.type = 'interactive';
    }
    
    // Movement
    const path = aStar({ x: gameState.player.x, y: gameState.player.y }, { x: tileX, y: tileY }, map);
    if (path.length > 0) {
      path.shift(); // Remove starting position
      gameState.player.path = path;
      gameState.player.moveTimer = 0;
    }
  });
}

initializeEventListeners();
requestAnimationFrame(gameLoop);