const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let previousStats = null;
let previousBackpack = null;
let previousHP = null;
let previousMoney = null;
let previousEnergy = null; // New: Track previous energy for updates

// Global variables to manage item selection for crafting
let selectedCraftingItem1 = null; // Stores the ID of the first selected item
const craftingGuideModal = document.getElementById('craftingGuideModal'); // Get reference to the new modal
const closeCraftingGuideBtn = document.getElementById('closeCraftingGuide'); // Get close button for the modal


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

  // Draw entities (gallery owner, supply store owner, barista, master artist)
  (map.entities || []).forEach(char => {
    let color = entities[char.id].sprite || '#6b7280'; // Default gray
    ctx.fillStyle = color;
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
  ctx.fillStyle = gameState.player.sprite || '#ff0000'; // Player color
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
  updateEnergyBar(); // New: Update Energy Bar
  updateMoneyDisplay();
  // Update stats and backpack panels only if they have changed
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

// New: Function to update the Energy Bar
function updateEnergyBar() {
  const player = gameState.player;
  const currentEnergy = { energy: player.energy, maxEnergy: player.maxEnergy };

  if (!previousEnergy || previousEnergy.energy !== currentEnergy.energy || previousEnergy.maxEnergy !== currentEnergy.maxEnergy) {
    const energyRatio = player.energy / player.maxEnergy;
    const energyFill = document.getElementById('energyFill');
    const energyText = document.getElementById('energyText');

    energyFill.style.width = (energyRatio * 100) + '%';
    energyText.textContent = `${player.energy}/${player.maxEnergy}`;

    previousEnergy = { ...currentEnergy };
  }
}


function updateMoneyDisplay() {
  const currentMoney = gameState.player.money;

  if (!previousMoney || previousMoney !== currentMoney) {
    const moneyText = document.getElementById('moneyText');
    if (moneyText) {
      moneyText.textContent = `${currentMoney}`;
    }
    previousMoney = currentMoney;
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
      skillRow.dataset.skillId = skill; // Add data attribute for click handling

      skillRow.innerHTML = `
        <span class="skill-name">${abbrev.icon} ${abbrev.abbr}</span>
        <span class="skill-level">L${skillData.level}</span>
        <span class="skill-xp">${skillData.xp}/${skillData.xpToNextLevel}</span>
      `;

      // Make skill row clickable
      skillRow.addEventListener('click', () => {
        openCraftingGuide(skill);
      });

      skillList.appendChild(skillRow);
    });

    previousStats = currentStats;
  }
}

function updateBackpackPanel() {
  const backpack = gameState.player.backpack;
  const currentBackpack = JSON.stringify(backpack);

  if (previousBackpack !== currentBackpack) {
    const backpackList = document.getElementById('backpackList');
    backpackList.innerHTML = '';

    const itemKeys = Object.keys(backpack);
    if (itemKeys.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.textContent = 'Empty';
      emptyDiv.style.opacity = '0.6';
      emptyDiv.style.fontStyle = 'italic';
      backpackList.appendChild(emptyDiv);
    } else {
      itemKeys.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'backpack-item';
        itemDiv.dataset.itemId = item; // Add data attribute for item ID

        // Highlight if this item is currently selected for crafting
        if (selectedCraftingItem1 === item) {
          itemDiv.classList.add('selected'); // Add a CSS class for highlighting
        } else {
          itemDiv.classList.remove('selected');
        }

        const displayName = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const quantity = backpack[item];
        itemDiv.textContent = quantity !== 1 ? `${displayName} (${quantity})` : displayName;

        // Add click listener for item selection
        itemDiv.addEventListener('click', () => {
          handleBackpackItemClick(item);
        });

        backpackList.appendChild(itemDiv);
      });
    }

    previousBackpack = currentBackpack;
  }
}

/**
 * Handles clicks on items in the backpack for crafting selection.
 * @param {string} clickedItemId The ID of the item that was clicked.
 */
function handleBackpackItemClick(clickedItemId) {
  if (!selectedCraftingItem1) {
    // No item selected yet, so this is the first item
    selectedCraftingItem1 = clickedItemId;
    showGameMessage(`Selected ${clickedItemId} as first item. Click another item to combine.`, 'info');
  } else if (selectedCraftingItem1 === clickedItemId) {
    // Same item clicked again, deselect it
    selectedCraftingItem1 = null;
    showGameMessage(`Deselected ${clickedItemId}.`, 'info');
  } else {
    // A second different item is clicked, attempt to combine
    showGameMessage(`Attempting to combine ${selectedCraftingItem1} with ${clickedItemId}...`, 'info');
    const success = tryCombineItems(selectedCraftingItem1, clickedItemId);
    selectedCraftingItem1 = null; // Reset selection after attempt
    // showGameMessage will handle specific success/failure messages
  }
  updateBackpackPanel(); // Re-render backpack to update selection highlight
}

/**
 * Opens the crafting guide modal for a specific skill.
 * @param {string} skillId The ID of the skill to display crafting recipes for.
 */
function openCraftingGuide(skillId) {
  const skillData = gameState.player.stats.skills[skillId];
  const skillAbbrev = skillAbbreviations[skillId];

  document.getElementById('craftingSkillIcon').textContent = skillAbbrev.icon;
  document.getElementById('craftingSkillName').textContent = `${skillAbbrev.abbr} Skill`;
  document.getElementById('craftingSkillLevel').textContent = `Level: ${skillData.level} (XP: ${skillData.xp}/${skillData.xpToNextLevel})`;

  const recipesListElement = document.getElementById('craftingRecipesList');
  recipesListElement.innerHTML = ''; // Clear previous recipes

  const relevantRecipes = craftingRecipes.filter(recipe => recipe.skill === skillId && recipe.unlocked);

  if (relevantRecipes.length === 0) {
    recipesListElement.innerHTML = '<p class="dialogue-text">No recipes found for this skill yet.</p>';
  } else {
    relevantRecipes.forEach(recipe => {
      const canCraftRecipe =
        gameState.player.stats.skills[recipe.skill].level >= recipe.minLevel &&
        gameState.player.energy >= recipe.energyCost &&
        hasItemInBackpack(recipe.input1, recipe.consume1) &&
        hasItemInBackpack(recipe.input2, recipe.consume2);

      const recipeDiv = document.createElement('div');
      recipeDiv.className = 'dialogue-option';
      recipeDiv.style.flexDirection = 'column'; // Stack content vertically within the option

      const recipeInfo = `
        <strong>${recipe.name} (Lvl ${recipe.minLevel})</strong><br>
        Requires: ${recipe.input1} (x${recipe.consume1}), ${recipe.input2} (x${recipe.consume2})<br>
        Output: ${recipe.output} (x${recipe.outputQuantity})<br>
        Cost: ${recipe.energyCost} Energy, Earn: $${recipe.value}
      `;
      recipeDiv.innerHTML = recipeInfo;

      const craftButton = document.createElement('button');
      craftButton.textContent = 'Craft';
      craftButton.style.marginTop = '8px';
      craftButton.style.padding = '6px 12px';
      craftButton.style.fontSize = '0.85em';
      craftButton.style.backgroundColor = canCraftRecipe ? '#48bb78' : '#718096'; // Green if craftable, gray if not
      craftButton.style.cursor = canCraftRecipe ? 'pointer' : 'not-allowed';
      craftButton.disabled = !canCraftRecipe;
      craftButton.title = canCraftRecipe ? 'Click to craft this item' : 'Missing requirements to craft this.';

      craftButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the parent recipeDiv's click handler from firing
        const result = tryCombineItems(recipe.input1, recipe.input2);
        if (result) {
            closeCraftingGuide(); // Close guide on successful craft, or re-render if staying open
        } else {
            // Error messages are handled by tryCombineItems
        }
        openCraftingGuide(skillId); // Re-render the guide to update craftable status
      });
      recipeDiv.appendChild(craftButton);
      recipesListElement.appendChild(recipeDiv);
    });
  }

  craftingGuideModal.classList.remove('hidden');
}

/**
 * Closes the crafting guide modal.
 */
function closeCraftingGuide() {
  craftingGuideModal.classList.add('hidden');
  selectedCraftingItem1 = null; // Clear selection when closing
  updateBackpackPanel(); // Update backpack to clear highlights
}

// Event listener for closing the crafting guide modal
closeCraftingGuideBtn.addEventListener('click', closeCraftingGuide);