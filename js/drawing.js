const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let previousStats = null;
let previousBackpack = null;
let previousHP = null;

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

}


/**
 * Updates the content and visibility of the DOM-based UI overlay elements.
 * Only updates when data has actually changed to preserve hover states.
 */
function updateUIOverlay() {
  updateHPBar();
  updateStatsPanel();
  updateBackpackPanel();
}

function updateHPBar() {
  const stats = gameState.player.stats;
  const currentHP = { hp: stats.hp, maxHp: stats.maxHp };

  // Only update if HP has changed
  if (!previousHP || previousHP.hp !== currentHP.hp || previousHP.maxHp !== currentHP.maxHp) {
    const hpRatio = stats.hp / stats.maxHp;
    const hpFill = document.getElementById('hpFill');
    const hpText = document.getElementById('hpText');

    hpFill.style.width = (hpRatio * 100) + '%';
    hpText.textContent = `${stats.hp}/${stats.maxHp}`;

    // Color based on HP level
    if (hpRatio > 0.6) {
      hpFill.style.background = 'linear-gradient(90deg, #48bb78, #38a169)';
    } else if (hpRatio > 0.3) {
      hpFill.style.background = 'linear-gradient(90deg, #ed8936, #dd6b20)';
    } else {
      hpFill.style.background = 'linear-gradient(90deg, #f56565, #e53e3e)';
    }

    previousHP = { ...currentHP };
  }
}

function updateStatsPanel() {
  const stats = gameState.player.stats;
  const currentStats = JSON.stringify(stats.skills);

  // Only update if stats have changed
  if (previousStats !== currentStats) {
    const skillList = document.getElementById('skillList');
    skillList.innerHTML = '';

    Object.keys(stats.skills).forEach(skill => {
      const skillData = stats.skills[skill];
      const abbrev = skillAbbreviations[skill];

      const skillRow = document.createElement('div');
      skillRow.className = 'skill-row';

      skillRow.innerHTML = `
        <span class="skill-name">${abbrev.icon} ${abbrev.abbr}</span>
        <span class="skill-level">L${skillData.level}</span>
        <span class="skill-xp">${skillData.xp}/${skillData.xpToNextLevel}</span>
      `;

      skillList.appendChild(skillRow);
    });

    previousStats = currentStats;
  }
}

function updateBackpackPanel() {
  const backpack = gameState.player.backpack;
  const currentBackpack = JSON.stringify(backpack);

  // Only update if backpack has changed
  if (previousBackpack !== currentBackpack) {
    const backpackList = document.getElementById('backpackList');
    backpackList.innerHTML = '';

    if (backpack.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.textContent = 'Empty';
      emptyDiv.style.opacity = '0.6';
      emptyDiv.style.fontStyle = 'italic';
      backpackList.appendChild(emptyDiv);
    } else {
      backpack.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'backpack-item';
        itemDiv.textContent = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        backpackList.appendChild(itemDiv);
      });
    }

    previousBackpack = currentBackpack;
  }
}
