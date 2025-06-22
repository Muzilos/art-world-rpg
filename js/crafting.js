let craftingTimer = null;
let isCrafting = false; // Still useful for general crafting activity status

/**
 * Checks if a player has enough of a specific item.
 * @param {string} itemId The ID of the item to check.
 * @param {number} requiredQuantity The quantity needed.
 * @returns {boolean} True if the player has the required quantity, false otherwise.
 */
function hasItemInBackpack(itemId, requiredQuantity) {
    const available = gameState.player.backpack[itemId] || 0;
    return available >= requiredQuantity;
}

/**
 * Attempts to combine two selected items to craft a new item.
 * This function will be called when the player interacts with items in the backpack UI.
 * @param {string} itemId1 The ID of the first item selected.
 * @param {string} itemId2 The ID of the second item selected.
 * @returns {boolean} True if crafting was successful, false otherwise.
 */
function tryCombineItems(itemId1, itemId2) {
    if (isCrafting) {
        showGameMessage("You are already busy crafting something!", 'info');
        return false;
    }

    // Find a matching recipe where the inputs match in either order
    // Ensure that the recipe specifies the correct consumption for each input
    let recipe = null;
    let actualInput1 = itemId1;
    let actualInput2 = itemId2;
    let actualConsume1 = 0;
    let actualConsume2 = 0;

    for (const r of craftingRecipes) {
        if (r.unlocked) { // Only consider unlocked recipes
            if (r.input1 === itemId1 && r.input2 === itemId2) {
                recipe = r;
                actualConsume1 = r.consume1;
                actualConsume2 = r.consume2;
                break;
            } else if (r.input1 === itemId2 && r.input2 === itemId1) {
                recipe = r;
                actualInput1 = itemId2; // Swap to match recipe's input1
                actualInput2 = itemId1; // Swap to match recipe's input2
                actualConsume1 = r.consume1; // This consume applies to recipe.input1
                actualConsume2 = r.consume2; // This consume applies to recipe.input2
                break;
            }
        }
    }

    if (!recipe) {
        showGameMessage("These items don't seem to combine into anything.", 'warning');
        return false;
    }

    // Check skill level
    if (gameState.player.stats.skills[recipe.skill].level < recipe.minLevel) {
        showGameMessage(`Need ${skillAbbreviations[recipe.skill].abbr} level ${recipe.minLevel} (you have ${gameState.player.stats.skills[recipe.skill].level})`, 'error');
        return false;
    }

    // Check energy
    if (gameState.player.energy < recipe.energyCost) {
        showGameMessage(`Need ${recipe.energyCost} energy (you have ${gameState.player.energy})`, 'error');
        return false;
    }

    // Check materials with quantities, using actualInputs and consumes
    if (!hasItemInBackpack(actualInput1, actualConsume1) || !hasItemInBackpack(actualInput2, actualConsume2)) {
        // Provide more specific feedback if only one is missing or quantity is insufficient
        let missingMsg = "Missing materials: ";
        if (!hasItemInBackpack(actualInput1, actualConsume1)) {
            missingMsg += `${actualInput1} (need ${actualConsume1}, have ${gameState.player.backpack[actualInput1] || 0})`;
        }
        if (!hasItemInBackpack(actualInput2, actualConsume2)) {
            if (!hasItemInBackpack(actualInput1, actualConsume1)) missingMsg += ", ";
            missingMsg += `${actualInput2} (need ${actualConsume2}, have ${gameState.player.backpack[actualInput2] || 0})`;
        }
        showGameMessage(missingMsg, 'error');
        return false;
    }

    // All checks passed, start crafting process
    isCrafting = true;
    showGameMessage(`Attempting to craft ${recipe.name}...`, 'info');

    // Simulate crafting time (instant for now, but could be tied to a timer)
    // For a simple instant craft:
    // Consume materials
    gameState.player.backpack[actualInput1] -= actualConsume1;
    if (gameState.player.backpack[actualInput1] <= 0) {
        delete gameState.player.backpack[actualInput1];
    }
    gameState.player.backpack[actualInput2] -= actualConsume2;
    if (gameState.player.backpack[actualInput2] <= 0) {
        delete gameState.player.backpack[actualInput2];
    }

    // Consume energy
    gameState.player.energy -= recipe.energyCost;

    // Add output item
    if (gameState.player.backpack[recipe.output]) {
        gameState.player.backpack[recipe.output] += recipe.outputQuantity;
    } else {
        gameState.player.backpack[recipe.output] = recipe.outputQuantity;
    }

    // Gain XP
    const xpGained = 25 + (recipe.minLevel * 10);
    gameState.player.stats.skills[recipe.skill].xp += xpGained;

    // --- REMOVED AUTO-SELLING HERE ---
    // gameState.player.money += recipe.value;
    // showGameMessage(`Successfully crafted ${recipe.name}! Sold for $${recipe.value} (+${xpGained} ${skillAbbreviations[recipe.skill].abbr} XP)`, 'success');

    showGameMessage(`Successfully crafted ${recipe.name}! (+${xpGained} ${skillAbbreviations[recipe.skill].abbr} XP). You can now sell it to a collector.`, 'success');

    isCrafting = false; // Reset crafting state

    // Force UI updates after crafting
    updateUIOverlay();

    return true;
}