// === UTILITY FUNCTIONS ===
/**
 * Checks if two sets of coordinates are adjacent (including diagonals).
 * @param {number} x1 - X-coordinate of the first point.
 * @param {number} y1 - Y-coordinate of the first point.
 * @param {number} x2 - X-coordinate of the second point.
 * @param {number} y2 - Y-coordinate of the second point.
 * @returns {boolean} - True if adjacent, false otherwise.
 */
function isAdjacent(x1, y1, x2, y2) {
  // Returns true if the absolute difference in x is 0 or 1, AND
  // the absolute difference in y is 0 or 1, AND
  // they are not the exact same tile (i.e., not standing on self).
  return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1 && !(x1 === x2 && y1 === y2);
}

/**
 * Determines the appropriate dialogue state for a character based on quest progress.
 * @param {object} character - The character object.
 * @returns {string} - The key for the current dialogue state.
 */
function getDialogueState(character) {
  // Old Man quest for chicken
  if (character.id === 'old_man') {
    const questStatus = gameState.quests.chickenQuest;
    const hasChicken = gameState.player.backpack.includes('chicken');
    if (questStatus === 'rewarded') return 'quest_rewarded';
    if (questStatus === 'completed' && hasChicken) return 'quest_hand_over';
    if (questStatus === 'accepted' || (questStatus === 'completed' && !hasChicken)) return 'quest_in_progress';
  }

  // Merchant quest for crystal
  if (character.id === 'merchant') {
    const questStatus = gameState.quests.crystalQuest;
    const hasCrystal = gameState.player.backpack.includes('crystal');
    if (questStatus === 'rewarded') return 'quest_rewarded';
    if (questStatus === 'completed' && hasCrystal) return 'quest_hand_over';
    if (questStatus === 'accepted' || (questStatus === 'completed' && !hasCrystal)) return 'quest_in_progress';
  }

  // New Quest: Mysterious Note
  if (character.id === 'mysterious_figure') {
    const questStatus = gameState.quests.mysteriousNoteQuest;
    const hasNote = gameState.player.backpack.includes('mysterious_note');
    if (questStatus === 'rewarded') return 'quest_rewarded';
    if (questStatus === 'completed' && hasNote) return 'quest_hand_over';
    if (questStatus === 'accepted' || (questStatus === 'completed' && !hasNote)) return 'quest_in_progress';
  }

  // Default state if no specific quest dialogue applies
  return 'start';
}

// === GAME LOOP ===
let lastTime = 0; // Timestamp of the previous frame

/**
 * The main game loop, called continuously using requestAnimationFrame.
 * @param {DOMHighResTimeStamp} timestamp - The current time provided by requestAnimationFrame.
 */
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime; // Calculate time elapsed since last frame
  lastTime = timestamp; // Update lastTime for the next frame

  update(deltaTime); // Update game state
  draw(); // Redraw game elements
  requestAnimationFrame(gameLoop); // Request next frame
}

/**
 * Updates the game state based on elapsed time.
 * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
 */
function update(deltaTime) {
  // Decrease the player's movement timer
  gameState.player.moveTimer -= deltaTime;

  // If the player has a path and the move timer has expired
  if (gameState.player.path.length > 0 && gameState.player.moveTimer <= 0) {
    gameState.player.moveTimer = gameState.player.speed; // Reset move timer
    // Clear dialogue box if it was open
    document.getElementById('dialogueBox').classList.add('hidden');
    const nextStep = gameState.player.path.shift(); // Get the next step in the path

    // Move the player to the next tile
    gameState.player.x = nextStep.x;
    gameState.player.y = nextStep.y;

    checkTransition(); // Check if the player has moved onto a transition tile
  }
}

/**
 * Checks if the player has moved onto a transition tile and updates the map accordingly.
 */
function checkTransition() {
  const map = maps[gameState.currentMap]; // Get the current map data
  // Find if the player's current position matches any transition point on the map
  const transition = map.transitions.find(t => t.x === gameState.player.x && t.y === gameState.player.y);

  if (transition) {
    // If a transition is found, update the game state to the target map and position
    gameState.currentMap = transition.targetMap;
    gameState.player.x = transition.targetX;
    gameState.player.y = transition.targetY;
    gameState.player.path = []; // Clear the player's path
    gameState.clickMarker.x = -1; // Reset click marker
    gameState.clickMarker.y = -1;
  }
}

// === EVENT LISTENERS ===
/**
 * Initializes all necessary event listeners for user interaction.
 */
function initializeEventListeners() {
  // Event listener for closing the dialogue box
  document.getElementById('closeDialogue').addEventListener('click', closeDialogue);

  // Event listener for clicks on the game canvas
  canvas.addEventListener('click', (event) => {
    // CLose any open dialogue box when clicking on the canvas
    closeDialogue();

    // Get canvas position and calculate clicked tile coordinates
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let tileX = Math.floor(mouseX / TILE_SIZE);
    let tileY = Math.floor(mouseY / TILE_SIZE);

    // Update click marker to show where the user clicked
    gameState.clickMarker.x = tileX;
    gameState.clickMarker.y = tileY;
    gameState.clickMarker.type = 'normal'; // Default type

    const map = maps[gameState.currentMap]; // Get current map data

    // Check for character interaction
    const character = (characters[gameState.currentMap] || []).find(c => c.x === tileX && c.y === tileY);
    if (character) {
      gameState.clickMarker.type = 'interactive'; // Mark as interactive
      // If the character is adjacent, show dialogue. Otherwise, move to an adjacent tile.
      if (isAdjacent(gameState.player.x, gameState.player.y, tileX, tileY)) {
        const dialogueState = getDialogueState(character);
        showDialogue(character, dialogueState);
      } else {
        // Find the closest adjacent walkable tile to the character for movement
        const adjacentTiles = getAdjacentWalkableTiles(tileX, tileY, map);
        if (adjacentTiles.length > 0) {
          const closestTile = adjacentTiles.sort((a, b) => {
            return heuristic(gameState.player, a) - heuristic(gameState.player, b);
          })[0]; // Sort by heuristic (distance) and pick the closest

          const path = aStar({ x: gameState.player.x, y: gameState.player.y }, closestTile, map);
          if (path.length > 0) {
            path.shift(); // Remove starting position
            gameState.player.path = path;
            gameState.player.moveTimer = 0;
          }
        }
      }
      return; // Stop further processing after character interaction
    }

    // Check for transition markers (doors)
    const transition = map.transitions.find(t => t.x === tileX && t.y === tileY);
    if (transition) {
      gameState.clickMarker.type = 'interactive'; // Mark as interactive
      // If a transition tile is clicked, the player should move directly onto it.
      const path = aStar({ x: gameState.player.x, y: gameState.player.y }, { x: tileX, y: tileY }, map);
      if (path.length > 0) {
        path.shift(); // Remove starting position (player's current tile)
        gameState.player.path = path;
        gameState.player.moveTimer = 0;
      }
      return; // Stop further processing after transition interaction
    }

    // If no interactive element is clicked, move to the clicked tile directly
    const path = aStar({ x: gameState.player.x, y: gameState.player.y }, { x: tileX, y: tileY }, map);
    if (path.length > 0) {
      path.shift(); // Remove starting position
      gameState.player.path = path;
      gameState.player.moveTimer = 0;
    }
  });
}

/**
 * Checks if a diagonal movement is blocked by adjacent non-walkable tiles.
 * @param {number} currentX - X-coordinate of the starting tile.
 * @param {number} currentY - Y-coordinate of the starting tile.
 * @param {number} targetX - X-coordinate of the target diagonal tile.
 * @param {number} targetY - Y-coordinate of the target diagonal tile.
 * @param {object} map - The current map object.
 * @returns {boolean} - True if the diagonal movement is blocked, false otherwise.
 */
function isDiagonalMovementBlocked(currentX, currentY, targetX, targetY, map) {
    // Calculate the difference in coordinates
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    // This function only applies to diagonal movements
    if (Math.abs(dx) !== 1 || Math.abs(dy) !== 1) {
        return false;
    }

    // Check the two cardinal tiles that are adjacent to both current and target
    // These are the "blocking" tiles for diagonal movement.
    const tile1X = currentX + dx; // Tile in the same column as target, same row as current
    const tile1Y = currentY;

    const tile2X = currentX;     // Tile in the same row as target, same column as current
    const tile2Y = currentY + dy;

    // Check if either of these cardinal tiles are non-walkable (type 1 or 2)
    // You'll need an `isWalkable` helper or direct checks.
    // Assuming map.tiles is a 1D array representing the map grid.
    const isTile1Walkable = isWalkable(tile1X, tile1Y, map);
    const isTile2Walkable = isWalkable(tile2X, tile2Y, map);

    // If both cardinal tiles are non-walkable, the diagonal movement is blocked
    return !isTile1Walkable && !isTile2Walkable;
}

/**
 * Helper function to check if a tile at given coordinates is walkable.
 * This function is assumed to be used by the pathfinding algorithm.
 * @param {number} x - X-coordinate of the tile.
 * @param {number} y - Y-coordinate of the tile.
 * @param {object} map - The current map object.
 * @returns {boolean} - True if the tile is walkable, false otherwise.
 */
function isWalkable(x, y, map) {
    // Check map bounds
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
        return false;
    }
    const tileIndex = y * map.width + x;
    // Assuming tile types 1 and 2 are unwalkable (walls, trees etc.)
    return map.tiles[tileIndex] !== 1 && map.tiles[tileIndex] !== 2;
}

/**
 * Returns an array of walkable tiles adjacent to a given target tile.
 * This is used to find a tile for the player to move to before interacting.
 * @param {number} targetX - X-coordinate of the target interactive tile.
 * @param {number} targetY - Y-coordinate of the target interactive tile.
 * @param {object} map - The current map object.
 * @returns {Array<object>} - An array of adjacent walkable tile coordinates {x, y}.
 */
function getAdjacentWalkableTiles(targetX, targetY, map) {
  const walkableTiles = [];
  // Iterate through all 8 possible adjacent tiles
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      // Exclude the target tile itself
      if (dx === 0 && dy === 0) continue;

      const newX = targetX + dx;
      const newY = targetY + dy;

      // Check if the new coordinates are within map bounds
      if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
        const tileIndex = newY * map.width + newX;
        // Check if the tile is walkable (not a wall or obstacle)
        isWalkable(newX, newY, map) && !isDiagonalMovementBlocked(targetX, targetY, newX, newY, map) && walkableTiles.push({ x: newX, y: newY });
        // The isWalkable function checks if the tile is not a wall (type 1 or 2)
        // The isDiagonalMovementBlocked function checks if the diagonal movement is blocked by adjacent non-walkable tiles
        // This ensures that the player can only move to tiles that are walkable and not blocked by adjacent obstacles.
      }
    }
  }
  return walkableTiles;
}


// Start the game loop when the window loads
window.onload = function () {
  initializeEventListeners();
  requestAnimationFrame(gameLoop);
}
