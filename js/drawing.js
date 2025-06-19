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

  // Draw entities (chicken, crystal, and new mysterious figure)
  (entities[gameState.currentMap] || []).forEach(char => {
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
        color = 'purple'; // Default for other entities
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

  // Health bar
  const hpBarWidth = 120;
  const hpBarHeight = 12;
  const stats = gameState.player.stats; // Get player stats
  const hpRatio = stats.hp / stats.maxHp; // Current HP ratio

  ctx.fillStyle = '#4a5568'; // Background for HP bar (Tailwind gray-700)
  ctx.fillRect(10, 10, hpBarWidth, hpBarHeight); // Draw background bar
  // Fill HP bar with color based on HP ratio
  // Green if above 50%, orange if above 25%, red if below
  ctx.fillStyle = hpRatio > 0.5
    ? '#000078' : hpRatio > 0.25 ? '#0d8936' : '#056565'; // Blue, orange, or red
  ctx.fillRect(10, 10, hpBarWidth * hpRatio, hpBarHeight); // Draw filled HP bar

  ctx.fillStyle = '#e2e8f0'; // Text color (Tailwind gray-200)
  ctx.font = '12px Courier New'; // Font for UI text
  ctx.fillText(`HP: ${stats.hp}/${stats.maxHp}`, 10, 35); // Display HP text

  // Skill and Backpack UI is now handled by a separate DOM overlay.
  // The updateUIOverlay function is responsible for updating the content
  // and visibility of the DOM elements based on gameState.ui.statsPanelCollapsed.
}

/**
 * Updates the content and visibility of the DOM-based UI overlay elements.
 * This includes the stats panel (skills, backpack).
 */
function updateUIOverlay() {
  // Ensure UI elements are referenced (should be done in initializeEventListeners)
  const statsPanel = document.getElementById('statsPanel');
  const skillList = document.getElementById('skillList');
  const backpackList = document.getElementById('backpackList');

  if (!statsPanel || !skillList || !backpackList) {
    // console.error("UI overlay elements not found!"); // Avoid spamming console if elements aren't ready
    return; // Cannot update if elements aren't referenced yet
  }

  // Toggle collapsed class on the stats panel container
  if (gameState.ui.statsPanelCollapsed) {
    statsPanel.classList.add('collapsed');
  } else {
    statsPanel.classList.remove('collapsed');
  }

  // Update Skill List content (always update, CSS handles visibility/hover)
  const stats = gameState.player.stats;
  const skillNames = Object.keys(stats.skills); // Get skill names
  skillList.innerHTML = ''; // Clear current list
  skillNames.forEach((skill) => {
    const skillData = stats.skills[skill];
    // Create a container for each skill to handle hover
    const skillElement = document.createElement('div');
    skillElement.classList.add('skill-item'); // Add a class for styling/hover
    const nameSpan = document.createElement('span');
    const capitalizedSkill = skill.charAt(0).toUpperCase() + skill.slice(1);
    nameSpan.textContent = `${capitalizedSkill}: Level ${skillData.level}`;

    // Add a space node for better visual separation before the XP info when it appears
    nameSpan.appendChild(document.createTextNode(' '));

    const xpSpan = document.createElement('span');
    xpSpan.classList.add('xp-info');
    xpSpan.textContent = `(XP: ${skillData.xp}/${skillData.xpToNextLevel})`;

    skillElement.appendChild(nameSpan);
    skillElement.appendChild(xpSpan);
    skillList.appendChild(skillElement);
  });

  // Backpack content
  backpackList.innerHTML = ''; // Clear current list
  const backpackItems = gameState.player.backpack;
  const backpackHeader = document.createElement('div');
  backpackHeader.textContent = 'Backpack:';
  backpackList.appendChild(backpackHeader);

  if (backpackItems.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('empty-backpack'); // Add class for styling
    emptyMessage.textContent = '(empty)';
    backpackList.appendChild(emptyMessage);
  } else {
    backpackItems.forEach((item) => {
      const itemElement = document.createElement('div');
      itemElement.textContent = `• ${item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' ')}`;
      backpackList.appendChild(itemElement);
    });
  }
}
