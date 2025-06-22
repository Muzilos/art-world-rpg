// Ensure global variables from builder-utils.js are accessible
// Assume skillAbbreviations and crafting are globally available from game files

// Quests DOM elements
const questListContainer = document.getElementById('questListContainer');
const questsList = document.getElementById('questsList');
const addNewQuestBtn = document.getElementById('addNewQuest');
const questEditor = document.getElementById('questEditor');
const currentQuestIdDisplay = document.getElementById('currentQuestIdDisplay');
const questIdInputEditor = document.getElementById('questIdInputEditor');
const saveQuestChangesBtn = document.getElementById('saveQuestChanges');
const cancelQuestEditingBtn = document.getElementById('cancelQuestEditing');

// Skills DOM elements
const skillListContainer = document.getElementById('skillListContainer');
const skillsList = document.getElementById('skillsList');
const addNewSkillBtn = document.getElementById('addNewSkill');
const skillEditor = document.getElementById('skillEditor');
const currentSkillIdDisplay = document.getElementById('currentSkillIdDisplay');
const skillIdInputEditor = document.getElementById('skillIdInputEditor');
const skillAbbrInput = document.getElementById('skillAbbrInput');
const skillIconInput = document.getElementById('skillIconInput');
const saveSkillChangesBtn = document.getElementById('saveSkillChanges');
const cancelSkillEditingBtn = document.getElementById('cancelSkillEditing');

// Crafting DOM elements
const craftingRecipeListContainer = document.getElementById('craftingRecipeListContainer');
const craftingRecipesList = document.getElementById('craftingRecipesList');
const addNewRecipeBtn = document.getElementById('addNewRecipe');
const craftingRecipeEditor = document.getElementById('craftingRecipeEditor');
const currentRecipeIdDisplay = document.getElementById('currentRecipeIdDisplay');
const recipeIdInput = document.getElementById('recipeIdInput');
const recipeNameInput = document.getElementById('recipeNameInput');
const recipeTimeInput = document.getElementById('recipeTimeInput');
const recipeSkillSelect = document.getElementById('recipeSkillSelect');
const recipeMinLevelInput = document.getElementById('recipeMinLevelInput');
const recipeValueInput = document.getElementById('recipeValueInput');
const recipeEnergyInput = document.getElementById('recipeEnergyInput');
const recipeUnlockedCheckbox = document.getElementById('recipeUnlockedCheckbox');

// New crafting input/output fields
const recipeInput1IdInput = document.getElementById('recipeInput1IdInput');
const recipeConsume1Input = document.getElementById('recipeConsume1Input');
const recipeInput2IdInput = document.getElementById('recipeInput2IdInput');
const recipeConsume2Input = document.getElementById('recipeConsume2Input');
const recipeOutputIdInput = document.getElementById('recipeOutputIdInput');
const recipeOutputQuantityInput = document.getElementById('recipeOutputQuantityInput');

const saveRecipeChangesBtn = document.getElementById('saveRecipeChanges');
const cancelRecipeEditingBtn = document.getElementById('cancelRecipeEditing');


// Variables to track currently edited items
let currentEditingQuestId = null;
let currentEditingSkillId = null;
let currentEditingRecipeIndex = null; // Use index as recipes are an array


// --- Quests Builder Functions ---

function renderQuestList() {
    questsList.innerHTML = '';
    questEditor.style.display = 'none';
    questListContainer.style.display = 'block';

    if (Object.keys(builderQuests).length === 0) { /* */
        questsList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No quests defined yet.</p>';
        return;
    }

    for (const questId in builderQuests) { /* */
        const listItem = createListItem(
            `Quest: ${questId}`,
            () => editQuest(questId),
            () => deleteQuest(questId),
            questId
        );
        questsList.appendChild(listItem);
    }
}

function editQuest(questId) {
    currentEditingQuestId = questId;
    questListContainer.style.display = 'none';
    questEditor.style.display = 'block';

    currentQuestIdDisplay.textContent = questId;
    questIdInputEditor.value = questId;
}

function saveQuestChanges() {
    if (!currentEditingQuestId) return;
    alert(`Quest "${currentEditingQuestId}" changes saved!`);
    currentEditingQuestId = null;
    renderQuestList();
}

function deleteQuest(questId) {
    if (confirm(`Are you sure you want to delete quest "${questId}"? This will remove it permanently.`)) {
        delete builderQuests[questId]; /* */
        // TODO: Advanced: Warn or auto-fix dialogue logic/actions that reference this quest.
        renderQuestList();
    }
}

// --- Skills Builder Functions ---

function renderSkillList() {
    skillsList.innerHTML = '';
    skillEditor.style.display = 'none';
    skillListContainer.style.display = 'block';

    if (Object.keys(builderSkillAbbreviations).length === 0) { /* */
        skillsList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No skills defined yet.</p>';
        return;
    }

    for (const skillId in builderSkillAbbreviations) { /* */
        const skillAbbr = builderSkillAbbreviations[skillId]; /* */
        const listItem = createListItem(
            `${skillAbbr.icon} ${skillId} (${skillAbbr.abbr})`, /* */
            () => editSkill(skillId),
            () => deleteSkill(skillId),
            skillId
        );
        skillsList.appendChild(listItem);
    }
}

function editSkill(skillId) {
    currentEditingSkillId = skillId;
    skillListContainer.style.display = 'none';
    skillEditor.style.display = 'block';

    const skillData = builderSkillAbbreviations[skillId]; /* */
    currentSkillIdDisplay.textContent = skillId;
    skillIdInputEditor.value = skillId;
    skillAbbrInput.value = skillData.abbr || ''; /* */
    skillIconInput.value = skillData.icon || ''; /* */
}

function saveSkillChanges() {
    if (!currentEditingSkillId) return;

    const skillId = skillIdInputEditor.value; // It's readonly but kept for context
    const newAbbr = skillAbbrInput.value.trim().toUpperCase();
    const newIcon = skillIconInput.value.trim();

    if (!newAbbr || newAbbr.length > 3) {
        alert("Abbreviation is required and must be 1-3 characters.");
        return;
    }

    builderSkillAbbreviations[skillId].abbr = newAbbr; /* */
    builderSkillAbbreviations[skillId].icon = newIcon; /* */

    alert(`Skill "${skillId}" changes saved!`);
    currentEditingSkillId = null;
    renderSkillList();
}

function deleteSkill(skillId) {
    if (confirm(`Are you sure you want to delete skill "${skillId}"? This will remove it permanently.`)) {
        delete builderSkillAbbreviations[skillId]; /* */
        // TODO: Advanced: Warn or auto-fix crafting recipes and dialogue actions that reference this skill.
        renderSkillList();
    }
}

// --- Crafting Recipes Builder Functions ---

function renderCraftingRecipeList() {
    craftingRecipesList.innerHTML = '';
    craftingRecipeEditor.style.display = 'none';
    craftingRecipeListContainer.style.display = 'block';

    if (builderCraftingRecipes.length === 0) {
        craftingRecipesList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No crafting recipes defined yet.</p>';
        return;
    }

    builderCraftingRecipes.forEach((recipe, index) => {
        const listItem = createListItem(
            `${recipe.name} (ID: ${recipe.id})`,
            () => editCraftingRecipe(index),
            () => deleteCraftingRecipe(index),
            index // Use index as the identifier for list item
        );
        craftingRecipesList.appendChild(listItem);
    });
}

function editCraftingRecipe(index) {
    currentEditingRecipeIndex = index;
    craftingRecipeListContainer.style.display = 'none';
    craftingRecipeEditor.style.display = 'block';

    const recipe = builderCraftingRecipes[index];

    currentRecipeIdDisplay.textContent = recipe.id; /* */
    recipeIdInput.value = recipe.id; /* */
    recipeNameInput.value = recipe.name; /* */
    recipeTimeInput.value = recipe.time; /* */
    recipeMinLevelInput.value = recipe.minLevel; /* */
    recipeValueInput.value = recipe.value; /* */
    recipeEnergyInput.value = recipe.energy; /* */
    recipeUnlockedCheckbox.checked = recipe.unlocked; /* */

    // Populate skill dropdown
    recipeSkillSelect.innerHTML = '';
    for (const skillId in builderSkillAbbreviations) { /* */
        const option = document.createElement('option');
        option.value = skillId;
        option.textContent = skillId;
        recipeSkillSelect.appendChild(option);
    }
    recipeSkillSelect.value = recipe.skill; /* */

    // Populate new input/output fields
    recipeInput1IdInput.value = recipe.input1 || '';
    recipeConsume1Input.value = recipe.consume1 || 0;
    recipeInput2IdInput.value = recipe.input2 || '';
    recipeConsume2Input.value = recipe.consume2 || 0;
    recipeOutputIdInput.value = recipe.output || '';
    recipeOutputQuantityInput.value = recipe.outputQuantity || 1;
}

function saveRecipeChanges() {
    if (currentEditingRecipeIndex === null) return;

    const recipe = builderCraftingRecipes[currentEditingRecipeIndex];
    
    // Basic validation
    if (!recipeNameInput.value.trim()) {
        alert("Recipe name cannot be empty.");
        return;
    }
    if (isNaN(recipeTimeInput.value) || recipeTimeInput.value <= 0) {
        alert("Crafting time must be a positive number.");
        return;
    }
    if (isNaN(recipeValueInput.value) || recipeValueInput.value < 0) {
        alert("Sell Value must be a non-negative number.");
        return;
    }
    if (isNaN(recipeEnergyInput.value) || recipeEnergyInput.value < 0) {
        alert("Energy Cost must be a non-negative number.");
        return;
    }
    if (!recipeInput1IdInput.value.trim() || !recipeInput2IdInput.value.trim()) {
        alert("Both Input Item IDs are required.");
        return;
    }
    if (isNaN(recipeConsume1Input.value) || recipeConsume1Input.value < 0 || isNaN(recipeConsume2Input.value) || recipeConsume2Input.value < 0) {
        alert("Consumed Quantities must be non-negative numbers.");
        return;
    }
    if (!recipeOutputIdInput.value.trim()) {
        alert("Output Item ID is required.");
        return;
    }
    if (isNaN(recipeOutputQuantityInput.value) || recipeOutputQuantityInput.value <= 0) {
        alert("Output Quantity must be a positive number.");
        return;
    }


    recipe.name = recipeNameInput.value.trim(); /* */
    recipe.time = parseInt(recipeTimeInput.value); /* */
    recipe.skill = recipeSkillSelect.value; /* */
    recipe.minLevel = parseInt(recipeMinLevelInput.value); /* */
    recipe.value = parseInt(recipeValueInput.value); /* */
    recipe.energy = parseInt(recipeEnergyInput.value); /* */
    recipe.unlocked = recipeUnlockedCheckbox.checked; /* */

    // Update new input/output fields
    recipe.input1 = recipeInput1IdInput.value.trim();
    recipe.consume1 = parseFloat(recipeConsume1Input.value);
    recipe.input2 = recipeInput2IdInput.value.trim();
    recipe.consume2 = parseFloat(recipeConsume2Input.value);
    recipe.output = recipeOutputIdInput.value.trim();
    recipe.outputQuantity = parseInt(recipeOutputQuantityInput.value);


    alert(`Recipe "${recipe.name}" changes saved!`);
    currentEditingRecipeIndex = null;
    renderCraftingRecipeList();
}

function deleteCraftingRecipe(index) {
    if (confirm(`Are you sure you want to delete recipe "${builderCraftingRecipes[index].name}"?`)) {
        builderCraftingRecipes.splice(index, 1);
        renderCraftingRecipeList();
    }
}

// --- Event Listeners for new modules ---

// Quests
addNewQuestBtn.addEventListener('click', () => {
    const newQuestId = prompt("Enter a unique ID for the new quest:");
    if (newQuestId) {
        if (builderQuests[newQuestId]) { /* */
            alert("Quest ID already exists!");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(newQuestId)) {
            alert("Quest ID must contain only letters, numbers, and underscores.");
            return;
        }
        builderQuests[newQuestId] = 'not_started'; /* */
        editQuest(newQuestId);
    }
});
questsList.addEventListener('click', (e) => {
    const targetButton = e.target.closest('button');
    if (!targetButton) return;
    const questId = targetButton.dataset.id;
    if (targetButton.classList.contains('edit-btn')) {
        editQuest(questId);
    } else if (targetButton.classList.contains('delete-btn')) {
        deleteQuest(questId);
    }
});
saveQuestChangesBtn.addEventListener('click', saveQuestChanges);
cancelQuestEditingBtn.addEventListener('click', () => {
    currentEditingQuestId = null;
    renderQuestList();
});

// Skills
addNewSkillBtn.addEventListener('click', () => {
    const newSkillId = prompt("Enter a unique ID for the new skill:");
    if (newSkillId) {
        if (builderSkillAbbreviations[newSkillId]) { /* */
            alert("Skill ID already exists!");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(newSkillId)) {
            alert("Skill ID must contain only letters, numbers, and underscores.");
            return;
        }
        builderSkillAbbreviations[newSkillId] = { abbr: 'NEW', icon: '❓' }; /* */
        // Also add to player stats mock for consistency, though not strictly needed for basic skill info
        // if (!simulatedGameState.player.stats.skills[newSkillId]) {
        //     simulatedGameState.player.stats.skills[newSkillId] = { level: 0, xp: 0, xpToNextLevel: 100 };
        // }
        editSkill(newSkillId);
    }
});
skillsList.addEventListener('click', (e) => {
    const targetButton = e.target.closest('button');
    if (!targetButton) return;
    const skillId = targetButton.dataset.id;
    if (targetButton.classList.contains('edit-btn')) {
        editSkill(skillId);
    } else if (targetButton.classList.contains('delete-btn')) {
        deleteSkill(skillId);
    }
});
saveSkillChangesBtn.addEventListener('click', saveSkillChanges);
cancelSkillEditingBtn.addEventListener('click', () => {
    currentEditingSkillId = null;
    renderSkillList();
});


// Crafting
addNewRecipeBtn.addEventListener('click', () => {
    const newRecipeId = prompt("Enter a unique ID for the new recipe:");
    if (newRecipeId) {
        // Check for ID uniqueness across recipes
        if (builderCraftingRecipes.some(r => r.id === newRecipeId)) { /* */
            alert("Recipe ID already exists!");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(newRecipeId)) {
            alert("Recipe ID must contain only letters, numbers, and underscores.");
            return;
        }

        const newRecipe = {
            id: newRecipeId,
            name: `New Recipe (${newRecipeId})`, /* */
            input1: '', // New fields
            consume1: 0,
            input2: '',
            consume2: 0,
            output: '',
            outputQuantity: 1,
            time: 100, /* */
            skill: Object.keys(builderSkillAbbreviations)[0] || 'drawing', // Default to first skill or drawing
            minLevel: 1, /* */
            value: 20, /* */
            energy: 10, /* */
            unlocked: true, /* */
        };
        builderCraftingRecipes.push(newRecipe);
        editCraftingRecipe(builderCraftingRecipes.length - 1); // Edit the newly added one
    }
});
craftingRecipesList.addEventListener('click', (e) => {
    const targetButton = e.target.closest('button');
    if (!targetButton) return;
    const index = parseInt(targetButton.dataset.id);
    if (targetButton.classList.contains('edit-btn')) {
        editCraftingRecipe(index);
    } else if (targetButton.classList.contains('delete-btn')) {
        deleteCraftingRecipe(index);
    }
});

saveRecipeChangesBtn.addEventListener('click', saveRecipeChanges);
cancelRecipeEditingBtn.addEventListener('click', () => {
    currentEditingRecipeIndex = null;
    renderCraftingRecipeList();
});