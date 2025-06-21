let craftingTimer = null;
let isCrafting = false;

const crafting = {
  recipes: [
    {
      id: 'pencil_sketch',
      name: 'Pencil Sketch',
      materials: { 'pencil': 0.1, 'paper': 1 },
      time: 30,
      skill: 'drawing',
      minLevel: 1,
      value: 10,
      energy: 15,
      unlocked: true,
    },
    {
      id: 'watercolor_painting',
      name: 'Watercolor Painting',
      materials: { 'watercolor': 0.2, 'canvas': 1, 'brush': 0.1 },
      time: 120,
      skill: 'painting',
      minLevel: 2,
      value: 45,
      energy: 35,
      unlocked: true,
    },
    {
      id: 'oil_painting',
      name: 'Oil Painting',
      materials: { 'oil_paint': 0.2, 'canvas': 1, 'brush': 0.2, 'palette': 1 },
      time: 300,
      skill: 'painting',
      minLevel: 3,
      value: 150,
      energy: 50,
      unlocked: true,
    },
    {
      id: 'clay_sculpture',
      name: 'Clay Sculpture',
      materials: { 'clay': 1, 'sculpting_tools': 1 },
      time: 180,
      skill: 'sculpting',
      minLevel: 1,
      value: 80,
      energy: 40,
      unlocked: true,
    },
    {
      id: 'charcoal_sketch',
      name: 'Charcoal Sketch',
      materials: { 'charcoal': 0.5, 'paper': 1 },
      time: 45,
      skill: 'drawing',
      minLevel: 2,
      value: 25,
      energy: 20,
      unlocked: true,
    },
    {
      id: 'field_painting',
      name: 'Plein Air Painting',
      materials: { 'field_easel': 1, 'oil_paint': 0.3, 'canvas': 1 },
      time: 180,
      skill: 'painting',
      minLevel: 2,
      value: 120,
      energy: 40,
      unlocked: true,
    },
    {
      id: 'clay_pottery',
      name: 'Clay Pottery',
      materials: { 'clay': 0.8, 'sculpting_tools': 0.5 },
      time: 150,
      skill: 'sculpting',
      minLevel: 2,
      value: 65,
      energy: 35,
      unlocked: true,
    }
  ]
}

function canCraft(recipe) {
  if (!recipe) return { canCraft: false, reason: "Recipe not found" };

  // Check skill level
  if (gameState.player.stats.skills[recipe.skill].level < recipe.minLevel) {
    return {
      canCraft: false,
      reason: `Need ${recipe.skill} level ${recipe.minLevel} (you have ${gameState.player.stats.skills[recipe.skill].level})`
    };
  }

  // Check energy
  if (gameState.player.energy < recipe.energy) {
    return {
      canCraft: false,
      reason: `Need ${recipe.energy} energy (you have ${gameState.player.energy})`
    };
  }

  // Check materials with quantities
  const missingMaterials = [];
  Object.keys(recipe.materials).forEach(material => {
    const required = recipe.materials[material];
    const available = gameState.player.backpack[material] || 0;
    if (available < required) {
      missingMaterials.push(`${material} (need ${required}, have ${available})`);
    }
  });

  if (missingMaterials.length > 0) {
    return {
      canCraft: false,
      reason: `Missing: ${missingMaterials.join(', ')}`
    };
  }

  return { canCraft: true, reason: "" };
}

function updateCraftingUI() {
  const recipes = crafting.recipes.filter(item => item.unlocked === true);

  recipes.forEach(recipe => {
    const button = document.getElementById(`craft_${recipe.id}`);
    if (!button) return;

    const craftCheck = canCraft(recipe);

    if (isCrafting) {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
    } else if (craftCheck.canCraft) {
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
      button.style.background = 'rgba(74, 85, 104, 0.8)';
    } else {
      button.disabled = false;
      button.style.opacity = '0.7';
      button.style.cursor = 'pointer';
      button.style.background = 'rgba(113, 128, 150, 0.5)';
    }

    // Update button tooltip
    button.title = craftCheck.canCraft ?
      `Create ${recipe.name} - ${recipe.value} - ${recipe.energy} energy` :
      craftCheck.reason;
  });
}

function startCrafting(recipeId) {
  if (isCrafting) {
    updateCraftingStatus("Already crafting something!");
    return;
  }

  const recipe = crafting.recipes.filter(r => r.unlocked === true).find(r => r.id === recipeId);
  if (!recipe) return;

  const craftCheck = canCraft(recipe);
  if (!craftCheck.canCraft) {
    updateCraftingStatus(craftCheck.reason);
    return;
  }

  // Start crafting
  isCrafting = true;
  updateCraftingStatus(`Creating ${recipe.name}...`);
  updateCraftingUI();

  // Remove materials with quantities
  Object.keys(recipe.materials).forEach(material => {
    const required = recipe.materials[material];
    gameState.player.backpack[material] -= required;
    if (gameState.player.backpack[material] <= 0) {
      delete gameState.player.backpack[material];
    }
  });

  // Use energy
  gameState.player.energy -= recipe.energy;

  // Create progress bar
  createCraftingProgressBar(recipe.time);

  // Set timer
  craftingTimer = setTimeout(() => {
    completeCrafting(recipe);
  }, recipe.time * 100);
}

function createCraftingProgressBar(duration) {
  const statusDiv = document.getElementById('craftingStatus');
  statusDiv.innerHTML = `
        <div style="margin-top: 8px;">
          <div style="background: rgba(26, 32, 44, 0.8); border-radius: 4px; height: 8px; overflow: hidden;">
            <div id="craftingProgress" style="background: linear-gradient(90deg, #4299e1, #3182ce); height: 100%; width: 0%; transition: width 0.1s;"></div>
          </div>
          <div style="text-align: center; margin-top: 4px; font-size: 10px;">Crafting...</div>
        </div>
      `;

  // Animate progress bar
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 100 / (duration * 10);
    const progressBar = document.getElementById('craftingProgress');
    if (progressBar) {
      progressBar.style.width = Math.min(progress, 100) + '%';
    }

    if (progress >= 100) {
      clearInterval(progressInterval);
    }
  }, 100);
}

function completeCrafting(recipe) {
  // Add finished artwork to backpack
  if (gameState.player.backpack[recipe.id]) {
    gameState.player.backpack[recipe.id]++;
  } else {
    gameState.player.backpack[recipe.id] = 1;
  }

  // Gain XP
  const xpGained = 25 + (recipe.minLevel * 10);
  gameState.player.stats.skills[recipe.skill].xp += xpGained;

  // Gain money (auto-sell for now)
  gameState.player.money += recipe.value;

  // Show completion message
  updateCraftingStatus(`✅ Completed ${recipe.name}! Sold for ${recipe.value} (+${xpGained} XP)`);

  // Reset crafting state
  isCrafting = false;
  updateCraftingUI();

  // Clear status after 4 seconds
  setTimeout(() => {
    updateCraftingStatus('');
  }, 4000);

  craftingTimer = null;
}

function updateCraftingStatus(message) {
  const statusDiv = document.getElementById('craftingStatus');
  statusDiv.innerHTML = message;
}

function cancelCrafting() {
  if (craftingTimer) {
    clearTimeout(craftingTimer);
    craftingTimer = null;
  }
  isCrafting = false;
  updateCraftingStatus('Crafting cancelled.');
  updateCraftingUI();

  setTimeout(() => {
    updateCraftingStatus('');
  }, 2000);
}

// Update crafting UI periodically
setInterval(updateCraftingUI, 1000);
