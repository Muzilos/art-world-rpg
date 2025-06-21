// Migration 10: Fix crafting progress bar flickering
// Add this after migration9

// Override the crafting functions to fix progress bar issues
let craftingProgressInterval = null;

// Enhanced updateCraftingStatus that preserves progress bars
function updateCraftingStatus(message) {
  const statusDiv = document.getElementById('craftingStatus');
  
  // Check if there's an active progress bar
  const existingProgress = statusDiv.querySelector('#craftingProgress');
  
  if (existingProgress && isCrafting) {
    // If there's a progress bar and we're crafting, only update text message
    const textElement = statusDiv.querySelector('.crafting-message');
    if (textElement) {
      textElement.textContent = message;
    } else {
      // Add message above progress bar
      const messageDiv = document.createElement('div');
      messageDiv.className = 'crafting-message';
      messageDiv.style.cssText = 'font-size: 10px; margin-bottom: 4px; text-align: center;';
      messageDiv.textContent = message;
      statusDiv.insertBefore(messageDiv, statusDiv.firstChild);
    }
  } else {
    // No progress bar active, safe to replace content
    statusDiv.innerHTML = message;
  }
}

// Enhanced progress bar creation
function createCraftingProgressBar(duration) {
  const statusDiv = document.getElementById('craftingStatus');
  
  // Clear any existing intervals
  if (craftingProgressInterval) {
    clearInterval(craftingProgressInterval);
  }
  
  statusDiv.innerHTML = `
    <div class="crafting-message" style="font-size: 10px; margin-bottom: 4px; text-align: center;">Crafting...</div>
    <div style="margin-top: 4px;">
      <div style="background: rgba(26, 32, 44, 0.8); border: 1px solid rgba(113, 128, 150, 0.3); border-radius: 4px; height: 12px; overflow: hidden; position: relative;">
        <div id="craftingProgress" style="background: linear-gradient(90deg, #4299e1, #3182ce); height: 100%; width: 0%; transition: width 0.1s ease; border-radius: 3px;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9px; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); z-index: 1;" id="progressText">0%</div>
      </div>
    </div>
  `;

  // Animate progress bar with better timing
  let progress = 0;
  const totalSteps = duration * 10; // 10 updates per second
  const progressStep = 100 / totalSteps;
  
  craftingProgressInterval = setInterval(() => {
    progress += progressStep;
    const progressBar = document.getElementById('craftingProgress');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
      const clampedProgress = Math.min(progress, 100);
      progressBar.style.width = clampedProgress + '%';
      progressText.textContent = Math.round(clampedProgress) + '%';
    }

    if (progress >= 100) {
      clearInterval(craftingProgressInterval);
      craftingProgressInterval = null;
    }
  }, 100);
}

// Enhanced cancelCrafting to clean up properly
function cancelCrafting() {
  if (craftingTimer) {
    clearTimeout(craftingTimer);
    craftingTimer = null;
  }
  
  if (craftingProgressInterval) {
    clearInterval(craftingProgressInterval);
    craftingProgressInterval = null;
  }
  
  isCrafting = false;
  updateCraftingStatus('Crafting cancelled.');
  updateCraftingUI();

  setTimeout(() => {
    if (!isCrafting) { // Only clear if still not crafting
      updateCraftingStatus('');
    }
  }, 2000);
}

// Enhanced completeCrafting
function completeCrafting(recipe) {
  // Clear the progress interval
  if (craftingProgressInterval) {
    clearInterval(craftingProgressInterval);
    craftingProgressInterval = null;
  }

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
  updateCraftingStatus(`✅ Completed ${recipe.name}! Sold for $${recipe.value} (+${xpGained} XP)`);

  // Reset crafting state
  isCrafting = false;
  updateCraftingUI();

  // Clear status after 4 seconds
  setTimeout(() => {
    if (!isCrafting) { // Only clear if still not crafting
      updateCraftingStatus('');
    }
  }, 4000);

  craftingTimer = null;
}

// Override the global functions
window.updateCraftingStatus = updateCraftingStatus;
window.createCraftingProgressBar = createCraftingProgressBar;
window.cancelCrafting = cancelCrafting;
window.completeCrafting = completeCrafting;

console.log('🔧 Crafting progress bar flickering fixed!');

// Migration 11: Fix progress bar timing to match actual crafting duration
// Add this after migration10

// Fixed progress bar creation with correct timing
function createCraftingProgressBar(duration) {
  const statusDiv = document.getElementById('craftingStatus');
  
  // Clear any existing intervals
  if (craftingProgressInterval) {
    clearInterval(craftingProgressInterval);
  }
  
  statusDiv.innerHTML = `
    <div class="crafting-message" style="font-size: 10px; margin-bottom: 4px; text-align: center;">Crafting...</div>
    <div style="margin-top: 4px;">
      <div style="background: rgba(26, 32, 44, 0.8); border: 1px solid rgba(113, 128, 150, 0.3); border-radius: 4px; height: 12px; overflow: hidden; position: relative;">
        <div id="craftingProgress" style="background: linear-gradient(90deg, #4299e1, #3182ce); height: 100%; width: 0%; transition: width 0.1s ease; border-radius: 3px;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9px; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); z-index: 1;" id="progressText">0%</div>
      </div>
    </div>
  `;

  // Calculate correct timing - the actual crafting time is duration * 100 milliseconds
  const actualCraftingTimeMs = duration * 100;
  const updateIntervalMs = 100; // Update every 100ms
  const totalUpdates = actualCraftingTimeMs / updateIntervalMs;
  const progressStepPerUpdate = 100 / totalUpdates;
  
  let progress = 0;
  
  craftingProgressInterval = setInterval(() => {
    progress += progressStepPerUpdate;
    const progressBar = document.getElementById('craftingProgress');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
      const clampedProgress = Math.min(progress, 100);
      progressBar.style.width = clampedProgress + '%';
      progressText.textContent = Math.round(clampedProgress) + '%';
    }

    if (progress >= 100) {
      clearInterval(craftingProgressInterval);
      craftingProgressInterval = null;
    }
  }, updateIntervalMs);
}

// Override the global function
window.createCraftingProgressBar = createCraftingProgressBar;

console.log('⏱️ Progress bar timing fixed! Now matches actual crafting duration.');