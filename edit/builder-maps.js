// Ensure global variables from builder-utils.js are accessible
// Assume TILE_SIZE, tileColors are globally available from maps.js (per instructions)

// Map specific DOM Elements (get them once here)
const mapListContainer = document.getElementById('mapListContainer');
const mapsList = document.getElementById('mapsList');
const addNewMapBtn = document.getElementById('addNewMap');
const mapEditor = document.getElementById('mapEditor');
const currentMapIdDisplay = document.getElementById('currentMapIdDisplay');
const mapIdInput = document.getElementById('mapIdInput');
const mapWidthInput = document.getElementById('mapWidthInput');
const mapHeightInput = document.getElementById('mapHeightInput');
const tilePalette = document.getElementById('tilePalette');
const mapEditorCanvas = document.getElementById('mapEditorCanvas');
const saveMapChangesBtn = document.getElementById('saveMapChanges');
const cancelMapEditingBtn = document.getElementById('cancelMapEditing');
const addTransitionBtn = document.getElementById('addTransition');
const transitionsList = document.getElementById('transitionsList');
const addEntityOnMapBtn = document.getElementById('addEntityOnMap');
const mapEntitiesList = document.getElementById('mapEntitiesList');


/**
 * Renders the list of maps in the Map Builder section.
 * Global `builderMaps` is used here.
 */
function renderMapList() {
  mapsList.innerHTML = ''; // Clear existing list
  mapEditor.style.display = 'none'; // Hide editor when list is shown
  mapListContainer.style.display = 'block'; // Show list container

  for (const mapId in builderMaps) {
    const map = builderMaps[mapId];
    const listItem = createListItem(
      `${mapId} (${map.width}x${map.height})`,
      () => editMap(mapId),
      () => deleteMap(mapId),
      mapId // Pass mapId as the item ID
    );
    mapsList.appendChild(listItem);
  }
}

/**
 * Initializes the map editor with the selected map's data.
 * @param {string} mapId The ID of the map to edit.
 */
function editMap(mapId) {
  currentEditingMapId = mapId;
  const mapData = builderMaps[mapId];

  if (!mapData) {
    console.error("Map data not found for ID:", mapId);
    return;
  }

  mapListContainer.style.display = 'none'; // Hide list
  mapEditor.style.display = 'block'; // Show editor

  currentMapIdDisplay.textContent = mapId;
  mapIdInput.value = mapId;
  mapWidthInput.value = mapData.width;
  mapHeightInput.value = mapData.height;

  // Set up canvas dimensions
  mapEditorCanvas.width = mapData.width * TILE_SIZE;
  mapEditorCanvas.height = mapData.height * TILE_SIZE;
  ctx = mapEditorCanvas.getContext('2d');

  renderTilePalette();
  drawMapEditorCanvas();
  renderMapTransitions();
  renderMapEntities();
}

/**
 * Draws the current map on the editor canvas.
 */
function drawMapEditorCanvas() {
  if (!ctx || !currentEditingMapId) return;

  const map = builderMaps[currentEditingMapId];
  ctx.clearRect(0, 0, mapEditorCanvas.width, mapEditorCanvas.height);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileIndex = y * map.width + x;
      const tileType = map.tiles[tileIndex];
      ctx.fillStyle = tileColors[tileType] || '#000';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // Draw transitions
  (map.transitions || []).forEach(transition => {
    ctx.strokeStyle = '#ff00ff'; // Magenta for transitions
    ctx.lineWidth = 2;
    ctx.strokeRect(transition.x * TILE_SIZE + 1, transition.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  });

  // Draw entities on map
  (map.entities || []).forEach(entityOnMap => {
    const entityDef = builderEntities[entityOnMap.id];
    if (entityDef) {
      ctx.fillStyle = entityDef.sprite || '#6b7280'; // Use entity's sprite color or default gray
      ctx.beginPath();
      ctx.arc(
        entityOnMap.x * TILE_SIZE + TILE_SIZE / 2,
        entityOnMap.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE / 2 - 2,
        0, Math.PI * 2
      );
      ctx.fill();
      // Optionally, draw entity ID
      ctx.fillStyle = '#e2e8f0'; // Light text
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(entityOnMap.id, entityOnMap.x * TILE_SIZE + TILE_SIZE / 2, entityOnMap.y * TILE_SIZE + TILE_SIZE / 2 + 3);
    }
  });

  // Highlight selected tile type in palette
  document.querySelectorAll('.map-tile-palette-item').forEach(item => {
    if (parseInt(item.dataset.tileType) === selectedTileType) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

/**
 * Renders the tile palette for the map editor.
 */
function renderTilePalette() {
  tilePalette.innerHTML = '';
  for (const type in tileColors) {
    const item = document.createElement('div');
    item.className = 'map-tile-palette-item';
    item.style.backgroundColor = tileColors[type];
    item.dataset.tileType = type;
    item.title = `Tile Type ${type}`; // Add a tooltip
    if (parseInt(type) === selectedTileType) {
      item.classList.add('selected');
    }
    tilePalette.appendChild(item);
  }
}

/**
 * Renders the list of transitions for the current map.
 */
function renderMapTransitions() {
  transitionsList.innerHTML = '<h4>Transitions</h4>';
  const map = builderMaps[currentEditingMapId];
  if (!map.transitions || map.transitions.length === 0) {
    transitionsList.innerHTML += '<p style="opacity: 0.7; font-style: italic;">No transitions defined for this map.</p>';
  } else {
    map.transitions.forEach((trans, index) => {
      const div = createListItem(
        `(${trans.x},${trans.y}) &rarr; ${trans.targetMap} (${trans.targetX},${trans.targetY})`,
        null, // No direct edit function via ID for transitions, will need a modal
        () => deleteTransition(index),
        index // Use index as the item ID for deletion
      );
      transitionsList.appendChild(div);
    });
  }
}

/**
 * Deletes a transition from the current map.
 * @param {number} index The index of the transition to delete.
 */
function deleteTransition(index) {
  const map = builderMaps[currentEditingMapId];
  if (confirm(`Are you sure you want to delete this transition?`)) {
    map.transitions.splice(index, 1);
    renderMapTransitions();
    drawMapEditorCanvas();
  }
}

/**
 * Renders the list of entities placed on the current map.
 */
function renderMapEntities() {
  mapEntitiesList.innerHTML = '<h4>Entities on Map</h4>';
  const map = builderMaps[currentEditingMapId];
  if (!map.entities || map.entities.length === 0) {
    mapEntitiesList.innerHTML += '<p style="opacity: 0.7; font-style: italic;">No entities placed on this map.</p>';
  } else {
    map.entities.forEach((entity, index) => {
      const div = createListItem(
        `${entity.id} at (${entity.x},${entity.y})`,
        null, // No direct edit function via ID for map entities, will need a modal
        () => deleteMapEntity(index),
        index // Use index as the item ID for deletion
      );
      mapEntitiesList.appendChild(div);
    });
  }
}

/**
 * Deletes an entity from the current map.
 * @param {number} index The index of the entity to delete.
 */
function deleteMapEntity(index) {
  const map = builderMaps[currentEditingMapId];
  if (confirm(`Are you sure you want to remove this entity from the map?`)) {
    map.entities.splice(index, 1);
    renderMapEntities();
    drawMapEditorCanvas();
  }
}

/**
 * Deletes a map from the builder data.
 * @param {string} mapId The ID of the map to delete.
 */
function deleteMap(mapId) {
  if (confirm(`Are you sure you want to delete map "${mapId}"? This will also remove any transitions leading to/from it and entities placed on it.`)) {
    delete builderMaps[mapId];

    // Also clean up transitions from other maps that point to this deleted map
    for (const otherMapId in builderMaps) {
      builderMaps[otherMapId].transitions = (builderMaps[otherMapId].transitions || []).filter(
        t => t.targetMap !== mapId
      );
    }
    renderMapList();
  }
}

// --- Map Event Listeners (moved from builder.js) ---

mapsList.addEventListener('click', (e) => {
  // Event delegation using data-attributes
  const targetButton = e.target.closest('button');
  if (!targetButton) return;

  const mapId = targetButton.dataset.id; // Using data-id from createListItem

  if (targetButton.classList.contains('edit-btn')) {
    editMap(mapId);
  } else if (targetButton.classList.contains('delete-btn')) {
    deleteMap(mapId);
  }
});

addNewMapBtn.addEventListener('click', () => {
  const newMapId = prompt("Enter a unique ID for the new map:");
  if (newMapId) {
    if (builderMaps[newMapId]) {
      alert("Map ID already exists!");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newMapId)) {
      alert("Map ID must contain only letters, numbers, and underscores.");
      return;
    }

    builderMaps[newMapId] = {
      width: 25,
      height: 19,
      tiles: new Array(25 * 19).fill(0), // Default to all walkable tiles
      transitions: [],
      entities: []
    };
    editMap(newMapId);
  }
});

mapEditorCanvas.addEventListener('click', (e) => {
  if (!ctx || !currentEditingMapId) return; // Ensure canvas and map are active

  const rect = mapEditorCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
  const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

  const map = builderMaps[currentEditingMapId];
  // Check if the click is within the current map dimensions
  if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
    const tileIndex = y * map.width + x;
    map.tiles[tileIndex] = selectedTileType;
    drawMapEditorCanvas(); // Redraw with the new tile
  }
});

tilePalette.addEventListener('click', (e) => {
  const target = e.target.closest('.map-tile-palette-item');
  if (target) {
    selectedTileType = parseInt(target.dataset.tileType);
    drawMapEditorCanvas(); // Redraw to highlight new selection
  }
});

saveMapChangesBtn.addEventListener('click', () => {
  if (currentEditingMapId) {
    const map = builderMaps[currentEditingMapId];
    const newWidth = parseInt(mapWidthInput.value);
    const newHeight = parseInt(mapHeightInput.value);

    if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
      alert("Map width and height must be positive numbers.");
      return;
    }

    const oldWidth = map.width;
    const oldHeight = map.height;

    map.width = newWidth;
    map.height = newHeight;

    // Handle tile array resizing carefully
    if (newWidth !== oldWidth || newHeight !== oldHeight) {
      const newTiles = new Array(newWidth * newHeight).fill(0); // Default to walkable tiles
      for (let y = 0; y < Math.min(oldHeight, newHeight); y++) {
        for (let x = 0; x < Math.min(oldWidth, newWidth); x++) {
          const oldIndex = y * oldWidth + x;
          const newIndex = y * newWidth + x;
          if (map.tiles[oldIndex] !== undefined) { // Only copy if old tile existed
            newTiles[newIndex] = map.tiles[oldIndex];
          }
        }
      }
      map.tiles = newTiles;
    }

    // Update canvas dimensions to match new map size
    mapEditorCanvas.width = map.width * TILE_SIZE;
    mapEditorCanvas.height = map.height * TILE_SIZE;
    drawMapEditorCanvas(); // Redraw after potential resize

    alert(`Map "${currentEditingMapId}" changes saved!`);
    currentEditingMapId = null; // Exit editing mode
    renderMapList(); // Go back to map list
  }
});

cancelMapEditingBtn.addEventListener('click', () => {
  currentEditingMapId = null;
  loadGameData(); // Reload original data to discard unsaved changes
  renderMapList(); // Go back to map list
});

addTransitionBtn.addEventListener('click', () => {
  if (!currentEditingMapId) return;
  const map = builderMaps[currentEditingMapId];

  // For a better UX, this would ideally be a modal. For now, sequential prompts.
  const transitionX = prompt("Enter current map X coordinate:");
  const transitionY = prompt("Enter current map Y coordinate:");
  const targetMapId = prompt("Enter target map ID:");
  const targetX = prompt("Enter target map X coordinate:");
  const targetY = prompt("Enter target map Y coordinate:");

  const newTransition = {
    x: parseInt(transitionX),
    y: parseInt(transitionY),
    targetMap: targetMapId,
    targetX: parseInt(targetX),
    targetY: parseInt(targetY)
  };

  // Basic validation
  if (isNaN(newTransition.x) || isNaN(newTransition.y) || isNaN(newTransition.targetX) || isNaN(newTransition.targetY) || !builderMaps[newTransition.targetMap]) {
    alert("Invalid input for transition. Please ensure coordinates are numbers and target map ID exists.");
    return;
  }

  if (!map.transitions) {
    map.transitions = []; // Ensure the array exists
  }
  map.transitions.push(newTransition);
  renderMapTransitions();
  drawMapEditorCanvas(); // Redraw to show new transition highlight
});

transitionsList.addEventListener('click', (e) => {
  const targetButton = e.target.closest('button');
  if (!targetButton) return;

  if (targetButton.classList.contains('delete-btn')) {
    const index = parseInt(targetButton.dataset.id); // Using data-id from createListItem
    deleteTransition(index);
  }
  // TODO: Implement edit transition functionality with a modal
});

addEntityOnMapBtn.addEventListener('click', () => {
  if (!currentEditingMapId) return;
  const map = builderMaps[currentEditingMapId];

  const entityId = prompt(`Enter the ID of the entity to place:\n\nAvailable: ${Object.keys(builderEntities).join(', ')}`);
  if (!entityId || !builderEntities[entityId]) {
    alert("Invalid or non-existent entity ID.");
    return;
  }

  const x = prompt("Enter X coordinate for entity:");
  const y = prompt("Enter Y coordinate for entity:");

  const entityX = parseInt(x);
  const entityY = parseInt(y);

  if (isNaN(entityX) || isNaN(entityY)) {
    alert("Invalid coordinates.");
    return;
  }

  if (!map.entities) {
    map.entities = [];
  }
  map.entities.push({ id: entityId, x: entityX, y: entityY });
  renderMapEntities();
  drawMapEditorCanvas();
});

mapEntitiesList.addEventListener('click', (e) => {
  const targetButton = e.target.closest('button');
  if (!targetButton) return;

  if (targetButton.classList.contains('delete-btn')) {
    const index = parseInt(targetButton.dataset.id); // Using data-id from createListItem
    deleteMapEntity(index);
  }
  // TODO: Implement edit entity on map functionality with a modal
});