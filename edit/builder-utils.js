// Global data objects for the builder (shared across modules)
let builderMaps = {};
let builderEntities = {};
let builderQuests = {};
let builderSkillAbbreviations = {};
let builderCraftingRecipes = [];

// Current state for editors
let currentEditingMapId = null;
let selectedTileType = 0; // Default selected tile type for painting
let currentEditingEntityId = null;

// DOM Element references (shared/common ones)
const mapsSection = document.getElementById('mapsSection');
const entitiesSection = document.getElementById('entitiesSection');
const questsSection = document.getElementById('questsSection');
const skillsSection = document.getElementById('skillsSection');
const craftingSection = document.getElementById('craftingSection');

const navMaps = document.getElementById('navMaps');
const navEntities = document.getElementById('navEntities');
const navQuests = document.getElementById('navQuests');
const navSkills = document.getElementById('navSkills');
const navCrafting = document.getElementById('navCrafting');

const exportDataBtn = document.getElementById('exportData');
const importDataInput = document.getElementById('importData');

let ctx; // Canvas rendering context (for map editor)

/**
 * Loads initial game data into the builder's internal state.
 * Assumes `maps`, `entities`, `gameState`, `skillAbbreviations`, `crafting` are globally available.
 */
function loadGameData() {
  // Deep copy to prevent direct modification of global game objects during editing
  builderMaps = JSON.parse(JSON.stringify(maps));
  builderEntities = JSON.parse(JSON.stringify(entities));
  builderQuests = JSON.parse(JSON.stringify(gameState.quests));
  builderSkillAbbreviations = JSON.parse(JSON.stringify(skillAbbreviations));
  builderCraftingRecipes = JSON.parse(JSON.stringify(crafting.recipes));
  console.log("Game data loaded into builder.", { builderMaps, builderEntities, builderQuests, builderSkillAbbreviations, builderCraftingRecipes });
}

/**
 * Switches the active section in the builder UI.
 * This function will now be called by the main builder.js but is defined here
 * because it depends on various section DOM elements.
 * @param {HTMLElement} sectionToActivate The DOM element of the section to show.
 * @param {HTMLElement} navButtonToActivate The DOM element of the navigation button to highlight.
 */
function switchSection(sectionToActivate, navButtonToActivate) {
  // Deactivate all sections and nav buttons
  document.querySelectorAll('.module-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('#sidebar button').forEach(button => button.classList.remove('active'));

  // Activate the selected section and nav button
  sectionToActivate.classList.add('active');
  navButtonToActivate.classList.add('active');

  // Call specific render function for the activated section
  if (sectionToActivate === mapsSection && typeof renderMapList === 'function') {
    renderMapList();
  } else if (sectionToActivate === entitiesSection && typeof renderEntityList === 'function') {
    renderEntityList();
  }
  // Add similar calls for other sections as they are implemented
}


/**
 * Exports all builder data to a JSON file.
 */
function exportGameData() {
  const dataToExport = {
    maps: builderMaps,
    entities: builderEntities,
    gameStateQuests: builderQuests,
    skillAbbreviations: builderSkillAbbreviations,
    craftingRecipes: builderCraftingRecipes
  };
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'art_rpg_game_data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("Game data exported successfully!");
}

/**
 * Imports game data from a JSON file.
 * @param {Event} event The change event from the file input.
 */
function importGameData(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Basic validation and assignment
        if (importedData.maps) builderMaps = importedData.maps;
        if (importedData.entities) builderEntities = importedData.entities;
        if (importedData.gameStateQuests) builderQuests = importedData.gameStateQuests;
        if (importedData.skillAbbreviations) builderSkillAbbreviations = importedData.skillAbbreviations;
        if (importedData.craftingRecipes) builderCraftingRecipes = importedData.craftingRecipes;

        alert("Game data imported successfully!");
        // Reset editor state and refresh UI
        currentEditingMapId = null;
        currentEditingEntityId = null;
        // Use a direct call to the map section as the default landing
        switchSection(mapsSection, navMaps);
      } catch (error) {
        alert("Failed to import data: Invalid JSON file. " + error.message);
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
  }
}

// Helper for common list item structure
function createListItem(text, editFn, deleteFn, id) {
  const listItem = document.createElement('div');
  listItem.className = 'list-item';
  listItem.innerHTML = `<span>${text}</span>`;

  const buttonContainer = document.createElement('div');
  if (editFn) {
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('edit-btn');
    editButton.dataset.id = id;
    editButton.addEventListener('click', () => editFn(id));
    buttonContainer.appendChild(editButton);
  }
  if (deleteFn) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-btn', 'delete');
    deleteButton.dataset.id = id;
    deleteButton.addEventListener('click', () => deleteFn(id));
    buttonContainer.appendChild(deleteButton);
  }
  listItem.appendChild(buttonContainer);
  return listItem;
}