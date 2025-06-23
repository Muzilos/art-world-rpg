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
 * Loads initial game data into the builder's internal state from game_data.json.
 * This is now asynchronous.
 * @returns {Promise<void>} A promise that resolves when data is loaded.
 */
async function loadGameData() {
  console.log("Attempting to load game data for builder...");
  // You might want a loading spinner here
  // const loadingScreen = document.getElementById('loadingScreen'); // Assuming loading screen exists in builder
  // if (loadingScreen) loadingScreen.style.display = 'flex';

  try {
    const response = await fetch('../game_data.json'); // Path relative to edit/
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Deep copy to prevent direct modification of original loaded objects during editing
    builderMaps = JSON.parse(JSON.stringify(data.maps || {}));
    builderEntities = JSON.parse(JSON.stringify(data.entities || {}));
    builderQuests = JSON.parse(JSON.stringify(data.gameStateQuests || {})); // Note: this came from gameState.quests
    builderSkillAbbreviations = JSON.parse(JSON.stringify(data.skillAbbreviations || {}));
    builderCraftingRecipes = JSON.parse(JSON.stringify(data.craftingRecipes || []));

    console.log("Game data loaded into builder successfully.", { builderMaps, builderEntities, builderQuests, builderSkillAbbreviations, builderCraftingRecipes });
  } catch (error) {
    console.error("Failed to load game data for builder:", error);
    alert("Failed to load game data. Please ensure 'game_data.json' exists in the root directory and your editor is served by a local web server (e.g., http-server). " + error.message);
    // if (loadingScreen) loadingScreen.style.display = 'none'; // Hide loading on error
    throw error; // Re-throw to propagate error for builder.js to catch
  } finally {
    // if (loadingScreen) loadingScreen.style.display = 'none'; // Hide loading regardless of success/fail
  }
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
 * Exports all builder data to a consolidated JSON file.
 */
function exportGameData() {
  const dataToExport = {
    maps: builderMaps,
    entities: builderEntities,
    gameStateQuests: builderQuests, // Note: Quests are part of gameState
    skillAbbreviations: builderSkillAbbreviations,
    craftingRecipes: builderCraftingRecipes
  };
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'game_data.json'; // Export as game_data.json
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("Game data exported successfully as 'game_data.json'!");
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