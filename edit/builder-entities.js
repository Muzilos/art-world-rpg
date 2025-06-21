// Ensure global variables from builder-utils.js are accessible

// Entity specific DOM elements
const entityListContainer = document.getElementById('entityListContainer');
const entitiesList = document.getElementById('entitiesList');
const addNewEntityBtn = document.getElementById('addNewEntity');
const entityEditor = document.getElementById('entityEditor');
const currentEntityIdDisplay = document.getElementById('currentEntityIdDisplay');
const entityIdInput = document.getElementById('entityIdInput');
const entityXInput = document.getElementById('entityXInput');
const entityYInput = document.getElementById('entityYInput');
const entitySpriteInput = document.getElementById('entitySpriteInput');
const saveEntityChangesBtn = document.getElementById('saveEntityChanges');
const cancelEntityEditingBtn = document.getElementById('cancelEntityEditing');

const dialogueStatesList = document.getElementById('dialogueStatesList');
const addDialogueStateBtn = document.getElementById('addDialogueState');
const dialogueLogicRulesList = document.getElementById('dialogueLogicRulesList');
const addDialogueLogicRuleBtn = document.getElementById('addDialogueLogicRule');

// Dialogue Modals
const dialogueStateModal = document.getElementById('dialogueStateModal');
const modalDialogueStateId = document.getElementById('modalDialogueStateId');
const modalStateTextInput = document.getElementById('modalStateTextInput');
const modalDialogueOptionsList = document.getElementById('modalDialogueOptionsList');
const addDialogueOptionBtn = document.getElementById('addDialogueOption');
const saveDialogueStateBtn = document.getElementById('saveDialogueState');
const cancelDialogueStateEditingBtn = document.getElementById('cancelDialogueStateEditing');

const dialogueOptionModal = document.getElementById('dialogueOptionModal');
const modalOptionTextInput = document.getElementById('modalOptionTextInput');
const modalOptionNextStateInput = document.getElementById('modalOptionNextStateInput');
const modalOptionActionsList = document.getElementById('modalOptionActionsList');
const addOptionActionBtn = document.getElementById('addOptionAction');
const saveDialogueOptionBtn = document.getElementById('saveDialogueOption');
const cancelDialogueOptionEditingBtn = document.getElementById('cancelDialogueOptionEditing');

const actionModal = document.getElementById('actionModal');
const actionTypeSelect = document.getElementById('actionTypeSelect');
const actionParametersDiv = document.getElementById('actionParameters');
const saveActionBtn = document.getElementById('saveAction');
const cancelActionEditingBtn = document.getElementById('cancelActionEditing');

const logicRuleModal = document.getElementById('logicRuleModal');
const logicRuleTargetStateInput = document.getElementById('logicRuleTargetStateInput');
const logicRuleConditionsList = document.getElementById('logicRuleConditionsList');
const addLogicRuleConditionBtn = document.getElementById('addLogicRuleCondition');
const saveLogicRuleBtn = document.getElementById('saveLogicRule');
const cancelLogicRuleEditingBtn = document.getElementById('cancelLogicRuleEditing');

const conditionModal = document.getElementById('conditionModal');
const conditionTypeSelect = document.getElementById('conditionTypeSelect');
const conditionParametersDiv = document.getElementById('conditionParameters');
const saveConditionBtn = document.getElementById('saveCondition');
const cancelConditionEditingBtn = document.getElementById('cancelConditionEditing');


// Dialogue Simulator elements
const dialogueSimulator = document.getElementById('dialogueSimulator');
const simulatorOutput = document.getElementById('simulatorOutput');
const simulatorOptions = document.getElementById('simulatorOptions');
const startDialogueSimulationBtn = document.getElementById('startDialogueSimulation');
const resetDialogueSimulationBtn = document.getElementById('resetDialogueSimulation');

// Variables to keep track of what's being edited in modals
let currentEditingDialogueStateId = null;
let currentEditingOptionIndex = null;
let currentEditingActionIndex = null; // For an action within an option
let currentEditingLogicRuleIndex = null;
let currentEditingConditionIndex = null; // For a condition within a logic rule

// --- Entity Builder Functions ---

/**
 * Renders the list of entities in the Entity Builder section.
 * Global `builderEntities` is used here.
 */
function renderEntityList() {
    entitiesList.innerHTML = ''; // Clear existing list
    entityEditor.style.display = 'none'; // Hide editor when list is shown
    entityListContainer.style.display = 'block'; // Show list container

    if (Object.keys(builderEntities).length === 0) {
        entitiesList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No entities defined yet.</p>';
        return;
    }

    for (const entityId in builderEntities) {
        const entity = builderEntities[entityId]; /* */
        const listItem = createListItem(
            `${entityId} (Sprite: ${entity.sprite || 'Default'})`, /* */
            () => editEntity(entityId),
            () => deleteEntity(entityId),
            entityId
        );
        entitiesList.appendChild(listItem);
    }
}

/**
 * Initializes the entity editor with the selected entity's data.
 * @param {string} entityId The ID of the entity to edit.
 */
function editEntity(entityId) {
    currentEditingEntityId = entityId;
    const entityData = builderEntities[entityId]; /* */

    if (!entityData) {
        console.error("Entity data not found for ID:", entityId);
        return;
    }

    entityListContainer.style.display = 'none'; // Hide list
    entityEditor.style.display = 'block'; // Show editor

    currentEntityIdDisplay.textContent = entityId;
    entityIdInput.value = entityId;
    entityXInput.value = entityData.x !== undefined ? entityData.x : ''; /* */
    entityYInput.value = entityData.y !== undefined ? entityData.y : ''; /* */
    entitySpriteInput.value = entityData.sprite || '#6b7280'; /* */

    renderDialogueStates(); // Render dialogue states for this entity
    renderDialogueLogicRules(); // Render dialogue logic rules for this entity
    resetDialogueSimulator(); // Reset simulator on entity change

    console.log(`Editing entity: ${entityId}`);
}

/**
 * Deletes an entity from the builder data.
 * @param {string} entityId The ID of the entity to delete.
 */
function deleteEntity(entityId) {
    if (confirm(`Are you sure you want to delete entity "${entityId}"? This will remove it from all maps and dialogues.`)) {
        delete builderEntities[entityId]; /* */
        // Also need to clean up references in maps
        for (const mapId in builderMaps) {
            builderMaps[mapId].entities = (builderMaps[mapId].entities || []).filter(
                e => e.id !== entityId
            ); /* */
        }
        renderEntityList();
        if (currentEditingMapId) {
            drawMapEditorCanvas();
        }
    }
}

// --- Dialogue State Editor Functions ---

/**
 * Renders the list of dialogue states for the current entity.
 */
function renderDialogueStates() {
    dialogueStatesList.innerHTML = '';
    const entity = builderEntities[currentEditingEntityId]; /* */
    if (!entity || !entity.dialogue || Object.keys(entity.dialogue).length === 0) { /* */
        dialogueStatesList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No dialogue states defined yet.</p>';
        return;
    }

    for (const stateId in entity.dialogue) {
        const listItem = createListItem(
            `State: ${stateId}`,
            () => openDialogueStateModal(stateId),
            () => deleteDialogueState(stateId),
            stateId
        );
        dialogueStatesList.appendChild(listItem);
    }
}

/**
 * Opens the modal for editing a dialogue state.
 * @param {string} stateId The ID of the dialogue state to edit (optional, for new states).
 */
function openDialogueStateModal(stateId = null) {
    currentEditingDialogueStateId = stateId;
    const entity = builderEntities[currentEditingEntityId]; /* */
    const dialogueState = stateId ? entity.dialogue[stateId] : { text: '', options: [] }; /* */

    modalDialogueStateId.textContent = stateId || 'New State';
    modalStateTextInput.value = dialogueState.text; /* */
    
    // Render options for this state
    renderDialogueOptionsInModal(dialogueState.options);

    dialogueStateModal.style.display = 'flex'; // Show modal
}

/**
 * Renders the list of options within the dialogue state modal.
 * @param {Array} options The array of options for the current state.
 */
function renderDialogueOptionsInModal(options) {
    modalDialogueOptionsList.innerHTML = '';
    if (!options || options.length === 0) {
        modalDialogueOptionsList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No options defined for this state.</p>';
        return;
    }

    options.forEach((option, index) => {
        const listItem = createListItem(
            `"${option.text}" -> ${option.nextState}`, /* */
            () => openDialogueOptionModal(index),
            () => deleteDialogueOption(index),
            index // Use index for list item ID
        );
        modalDialogueOptionsList.appendChild(listItem);
    });
}

/**
 * Saves changes made in the dialogue state modal.
 */
function saveDialogueState() {
    const entity = builderEntities[currentEditingEntityId]; /* */
    const newStateId = currentEditingDialogueStateId;
    const newText = modalStateTextInput.value;

    if (!newStateId) {
        alert("Cannot save: Dialogue State ID is missing.");
        return;
    }

    if (!entity.dialogue[newStateId]) {
        // This case should ideally be handled by addDialogueStateBtn, but as a safeguard
        entity.dialogue[newStateId] = { text: newText, options: [] }; /* */
    } else {
        entity.dialogue[newStateId].text = newText; /* */
    }
    
    // Options are modified directly in the dialogueOptionModal

    closeModal(dialogueStateModal);
    renderDialogueStates(); // Refresh the list in the main entity editor
    console.log(`Dialogue state "${newStateId}" saved for entity "${currentEditingEntityId}".`);
}

/**
 * Handles deleting a specific dialogue state.
 * @param {string} stateId
 */
function deleteDialogueState(stateId) {
    const entity = builderEntities[currentEditingEntityId]; /* */
    if (confirm(`Are you sure you want to delete dialogue state "${stateId}" from entity "${currentEditingEntityId}"?`)) {
        delete entity.dialogue[stateId]; /* */
        // TODO: Advanced: Check if any options or logic rules point to this state and warn/fix.
        renderDialogueStates();
        renderDialogueLogicRules(); // Re-render in case a rule was affected
    }
}

// --- Dialogue Option Editor Functions ---

/**
 * Opens the modal for editing a dialogue option.
 * @param {number} optionIndex The index of the option within the current dialogue state.
 */
function openDialogueOptionModal(optionIndex = null) {
    currentEditingOptionIndex = optionIndex;
    const entity = builderEntities[currentEditingEntityId]; /* */
    const dialogueState = entity.dialogue[currentEditingDialogueStateId]; /* */
    const optionData = optionIndex !== null ? dialogueState.options[optionIndex] : { text: '', nextState: 'end', actions: [] }; /* */

    modalOptionTextInput.value = optionData.text; /* */
    populateNextStateDropdown(optionData.nextState); // Populate dropdown with available states and select current
    renderActionsInModal(optionData.actions); // Render actions for this option

    dialogueOptionModal.style.display = 'flex';
}

/**
 * Populates the "Next State" dropdown in the option modal.
 * @param {string} selectedStateId The ID of the state to pre-select.
 */
function populateNextStateDropdown(selectedStateId) {
    modalOptionNextStateInput.innerHTML = '';
    const entity = builderEntities[currentEditingEntityId]; /* */
    
    // Add an empty/default option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'end'; // Conventionally 'end' or similar
    defaultOption.textContent = '-- End Conversation --';
    modalOptionNextStateInput.appendChild(defaultOption);

    for (const stateId in entity.dialogue) { /* */
        const optionElement = document.createElement('option');
        optionElement.value = stateId;
        optionElement.textContent = stateId;
        modalOptionNextStateInput.appendChild(optionElement);
    }
    modalOptionNextStateInput.value = selectedStateId;
}

/**
 * Renders the list of actions within the dialogue option modal.
 * @param {Array} actions The array of actions for the current option.
 */
function renderActionsInModal(actions) {
    modalOptionActionsList.innerHTML = '';
    if (!actions || actions.length === 0) {
        modalOptionActionsList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No actions defined for this option.</p>';
        return;
    }

    actions.forEach((action, index) => {
        const actionMeta = gameActionMetadata[action.id] || { name: action.id, parameters: [] }; /* */
        const paramsSummary = Object.keys(action.params || {}).map(key => `${key}: ${JSON.stringify(action.params[key])}`).join(', '); /* */
        const listItem = createListItem(
            `${actionMeta.name} (${paramsSummary || 'No params'})`,
            () => openActionModal(index),
            () => deleteOptionAction(index),
            index
        );
        modalOptionActionsList.appendChild(listItem);
    });
}

/**
 * Saves changes made in the dialogue option modal.
 */
function saveDialogueOption() {
    const entity = builderEntities[currentEditingEntityId]; /* */
    const dialogueState = entity.dialogue[currentEditingDialogueStateId]; /* */

    const newOptionText = modalOptionTextInput.value;
    const newNextState = modalOptionNextStateInput.value;
    // Actions are modified directly via openActionModal/saveAction

    if (!newOptionText) {
        alert("Option text cannot be empty.");
        return;
    }

    let optionToSave = {
        text: newOptionText,
        nextState: newNextState, /* */
        actions: dialogueState.options[currentEditingOptionIndex]?.actions || [] // Retain existing actions if editing
    };

    if (currentEditingOptionIndex !== null) {
        dialogueState.options[currentEditingOptionIndex] = optionToSave; /* */
    } else {
        dialogueState.options.push(optionToSave); /* */
    }

    closeModal(dialogueOptionModal);
    renderDialogueOptionsInModal(dialogueState.options); // Refresh options in state modal
    console.log(`Dialogue option saved for state "${currentEditingDialogueStateId}".`);
}

/**
 * Deletes an option from the current dialogue state.
 * @param {number} optionIndex
 */
function deleteDialogueOption(optionIndex) {
    const entity = builderEntities[currentEditingEntityId]; /* */
    const dialogueState = entity.dialogue[currentEditingDialogueStateId]; /* */
    if (confirm(`Are you sure you want to delete this option?`)) {
        dialogueState.options.splice(optionIndex, 1); /* */
        renderDialogueOptionsInModal(dialogueState.options);
    }
}

// --- Action Editor Functions ---

/**
 * Opens the modal for editing an action.
 * @param {number} actionIndex The index of the action within the current option.
 */
function openActionModal(actionIndex = null) {
    currentEditingActionIndex = actionIndex;
    const entity = builderEntities[currentEditingEntityId]; /* */
    const dialogueState = entity.dialogue[currentEditingDialogueStateId]; /* */
    const option = dialogueState.options[currentEditingOptionIndex]; /* */
    const actionData = actionIndex !== null ? option.actions[actionIndex] : { id: 'none', params: {} }; /* */

    populateActionTypeDropdown(actionData.id);
    renderActionParameters(actionData.id, actionData.params);

    actionModal.style.display = 'flex';
}

/**
 * Populates the Action Type dropdown.
 * @param {string} selectedActionId The ID of the action type to pre-select.
 */
function populateActionTypeDropdown(selectedActionId) {
    actionTypeSelect.innerHTML = '';
    for (const actionId in gameActionMetadata) { /* */
        const optionElement = document.createElement('option');
        optionElement.value = actionId;
        optionElement.textContent = gameActionMetadata[actionId].name; /* */
        actionTypeSelect.appendChild(optionElement);
    }
    actionTypeSelect.value = selectedActionId;
}

/**
 * Renders dynamic parameter inputs for the selected action type.
 * @param {string} actionId The ID of the selected action type.
 * @param {object} params The current parameters for the action.
 */
function renderActionParameters(actionId, params = {}) {
    actionParametersDiv.innerHTML = '';
    const actionMeta = gameActionMetadata[actionId]; /* */
    if (!actionMeta || !actionMeta.parameters) { /* */
        actionParametersDiv.innerHTML = '<p>No parameters for this action type.</p>';
        return;
    }

    actionMeta.parameters.forEach(param => { /* */
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = param.label + ':'; /* */
        formGroup.appendChild(label);

        let inputElement;
        switch (param.type) { /* */
            case 'text':
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = params[param.name] || param.defaultValue || ''; /* */
                break;
            case 'number':
                inputElement = document.createElement('input');
                inputElement.type = 'number';
                inputElement.value = params[param.name] || param.defaultValue || 0; /* */
                break;
            case 'textarea':
                inputElement = document.createElement('textarea');
                inputElement.value = params[param.name] || param.defaultValue || ''; /* */
                break;
            case 'select':
                inputElement = document.createElement('select');
                // Options can be a direct array or a function that returns an array
                const options = typeof param.options === 'function' ? param.options() : param.options; /* */
                options.forEach(optValue => {
                    const option = document.createElement('option');
                    option.value = optValue;
                    option.textContent = optValue;
                    inputElement.appendChild(option);
                });
                inputElement.value = params[param.name] || '';
                break;
            case 'list(number)': // For XP amounts
            case 'list(string)': // For skills
                // This is a simplified representation. For a real builder, this would be a sub-editor
                // allowing adding/removing items from the list. For now, a comma-separated string.
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.placeholder = `Comma-separated ${param.type.replace('list(', '').replace(')', '')}s`;
                inputElement.value = (params[param.name] || []).join(', ');
                // Add a hidden element to store the parsed array
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.className = `hidden-list-param-${param.name}`;
                inputElement.addEventListener('input', (e) => {
                    hiddenInput.value = e.target.value.split(',').map(s => s.trim());
                    if (param.type === 'list(number)') {
                        hiddenInput.value = hiddenInput.value.map(Number).filter(n => !isNaN(n));
                    }
                });
                // Initialize hidden value if 'params' already has it
                hiddenInput.value = JSON.stringify(params[param.name] || []);
                formGroup.appendChild(inputElement);
                formGroup.appendChild(hiddenInput);
                break;
            default:
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = params[param.name] || '';
                break;
        }
        if (param.type !== 'list(number)' && param.type !== 'list(string)') {
             inputElement.id = `action-param-${param.name}`;
             inputElement.name = param.name; // Use name for easy retrieval later
             formGroup.appendChild(inputElement);
        }

        actionParametersDiv.appendChild(formGroup);
    });
}

/**
 * Saves changes made in the action modal.
 */
function saveAction() {
    const entity = builderEntities[currentEditingEntityId]; /* */
    const dialogueState = entity.dialogue[currentEditingDialogueStateId]; /* */
    const option = dialogueState.options[currentEditingOptionIndex]; /* */

    const newActionId = actionTypeSelect.value;
    const newParams = {};

    const actionMeta = gameActionMetadata[newActionId]; /* */
    if (actionMeta && actionMeta.parameters) { /* */
        actionMeta.parameters.forEach(param => { /* */
            if (param.type === 'list(number)' || param.type === 'list(string)') {
                // Retrieve from the hidden input for list types
                const hiddenInput = actionParametersDiv.querySelector(`.hidden-list-param-${param.name}`);
                if (hiddenInput && hiddenInput.value) {
                    newParams[param.name] = JSON.parse(hiddenInput.value);
                } else {
                    newParams[param.name] = [];
                }
            } else {
                const inputElement = actionParametersDiv.querySelector(`[name="${param.name}"]`);
                if (inputElement) {
                    newParams[param.name] = (param.type === 'number') ? Number(inputElement.value) : inputElement.value;
                }
            }
        });
    }

    const actionToSave = { id: newActionId, params: newParams }; /* */

    if (currentEditingActionIndex !== null) {
        option.actions[currentEditingActionIndex] = actionToSave; /* */
    } else {
        option.actions.push(actionToSave); /* */
    }

    closeModal(actionModal);
    renderActionsInModal(option.actions); // Refresh actions in option modal
    console.log(`Action saved for option "${currentEditingOptionIndex}" in state "${currentEditingDialogueStateId}".`);
}

/**
 * Deletes an action from the current dialogue option.
 * @param {number} actionIndex
 */
function deleteOptionAction(actionIndex) {
    const entity = builderEntities[currentEditingEntityId]; /* */
    const dialogueState = entity.dialogue[currentEditingDialogueStateId]; /* */
    const option = dialogueState.options[currentEditingOptionIndex]; /* */
    if (confirm(`Are you sure you want to delete this action?`)) {
        option.actions.splice(actionIndex, 1); /* */
        renderActionsInModal(option.actions);
    }
}

// --- Dialogue Logic Rule Editor Functions ---

/**
 * Renders the list of dialogue logic rules for the current entity.
 */
function renderDialogueLogicRules() {
    dialogueLogicRulesList.innerHTML = '';
    const entity = builderEntities[currentEditingEntityId]; /* */
    if (!entity || !entity.dialogueLogic || entity.dialogueLogic.length === 0) { /* */
        dialogueLogicRulesList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No dialogue logic rules defined yet.</p>';
        return;
    }

    entity.dialogueLogic.forEach((rule, index) => { /* */
        const conditionsSummary = rule.conditions.map(c => { /* */
            if (c.type === 'questStatus') return `Quest '${c.questId}' is '${c.status}'`; /* */
            if (c.type === 'hasItem') return `Has '${c.itemId}'`; /* */
            return `Type: ${c.type}`;
        }).join(', ');
        const ruleText = `Target: ${rule.targetState} (Conditions: ${conditionsSummary || 'None'})`; /* */

        const listItem = createListItem(
            ruleText,
            () => openLogicRuleModal(index),
            () => deleteDialogueLogicRule(index),
            index
        );
        dialogueLogicRulesList.appendChild(listItem);
    });
}

/**
 * Opens the modal for editing a dialogue logic rule.
 * @param {number} ruleIndex The index of the rule to edit.
 */
function openLogicRuleModal(ruleIndex = null) {
    currentEditingLogicRuleIndex = ruleIndex;
    const entity = builderEntities[currentEditingEntityId]; /* */
    const ruleData = ruleIndex !== null ? entity.dialogueLogic[ruleIndex] : { conditions: [], targetState: '' }; /* */

    populateLogicRuleTargetStateDropdown(ruleData.targetState);
    renderConditionsInModal(ruleData.conditions);

    logicRuleModal.style.display = 'flex';
}

/**
 * Populates the "Target State" dropdown in the logic rule modal.
 * @param {string} selectedStateId The ID of the state to pre-select.
 */
function populateLogicRuleTargetStateDropdown(selectedStateId) {
    logicRuleTargetStateInput.innerHTML = '';
    const entity = builderEntities[currentEditingEntityId]; /* */
    
    // Add an empty/default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Target State --';
    logicRuleTargetStateInput.appendChild(defaultOption);

    for (const stateId in entity.dialogue) { /* */
        const optionElement = document.createElement('option');
        optionElement.value = stateId;
        optionElement.textContent = stateId;
        logicRuleTargetStateInput.appendChild(optionElement);
    }
    logicRuleTargetStateInput.value = selectedStateId;
}

/**
 * Renders the list of conditions within the dialogue logic rule modal.
 * @param {Array} conditions The array of conditions for the current rule.
 */
function renderConditionsInModal(conditions) {
    logicRuleConditionsList.innerHTML = '';
    if (!conditions || conditions.length === 0) {
        logicRuleConditionsList.innerHTML = '<p style="opacity: 0.7; font-style: italic;">No conditions defined for this rule.</p>';
        return;
    }

    conditions.forEach((condition, index) => {
        let summary = 'Unknown Condition';
        if (condition.type === 'questStatus') {
            summary = `Quest '${condition.questId}' is '${condition.status}'`; /* */
        } else if (condition.type === 'hasItem') {
            summary = `Has '${condition.itemId}' (${condition.quantity || 1})`; /* */
        }

        const listItem = createListItem(
            summary,
            () => openConditionModal(index),
            () => deleteLogicRuleCondition(index),
            index
        );
        logicRuleConditionsList.appendChild(listItem);
    });
}

/**
 * Saves changes made in the dialogue logic rule modal.
 */
function saveLogicRule() {
    const entity = builderEntities[currentEditingEntityId]; /* */
    
    const newTargetState = logicRuleTargetStateInput.value;
    // Conditions are modified directly via openConditionModal/saveCondition

    if (!newTargetState) {
        alert("Target state cannot be empty for a logic rule.");
        return;
    }
    if (!entity.dialogue[newTargetState]) { /* */
        alert("Target state does not exist in this entity's dialogue.");
        return;
    }

    let ruleToSave = {
        conditions: entity.dialogueLogic[currentEditingLogicRuleIndex]?.conditions || [], // Retain existing conditions
        targetState: newTargetState /* */
    };

    if (currentEditingLogicRuleIndex !== null) {
        entity.dialogueLogic[currentEditingLogicRuleIndex] = ruleToSave; /* */
    } else {
        entity.dialogueLogic.push(ruleToSave); /* */
    }

    closeModal(logicRuleModal);
    renderDialogueLogicRules(); // Refresh rules in main entity editor
    console.log(`Dialogue logic rule saved for entity "${currentEditingEntityId}".`);
}

/**
 * Deletes a dialogue logic rule.
 * @param {number} ruleIndex
 */
function deleteDialogueLogicRule(ruleIndex) {
    const entity = builderEntities[currentEditingEntityId]; /* */
    if (confirm(`Are you sure you want to delete this dialogue logic rule?`)) {
        entity.dialogueLogic.splice(ruleIndex, 1); /* */
        renderDialogueLogicRules();
    }
}

// --- Condition Editor Functions ---

/**
 * Opens the modal for editing a condition.
 * @param {number} conditionIndex The index of the condition within the current logic rule.
 */
function openConditionModal(conditionIndex = null) {
    currentEditingConditionIndex = conditionIndex;
    const entity = builderEntities[currentEditingEntityId]; /* */
    const logicRule = entity.dialogueLogic[currentEditingLogicRuleIndex]; /* */
    const conditionData = conditionIndex !== null ? logicRule.conditions[conditionIndex] : { type: '', /* */ params: {} };

    // Populate condition type dropdown
    conditionTypeSelect.innerHTML = `
        <option value="">-- Select Type --</option>
        <option value="questStatus">Quest Status</option>
        <option value="hasItem">Has Item</option>
    `;
    conditionTypeSelect.value = conditionData.type || '';
    
    // Render dynamic parameters based on selected type
    renderConditionParameters(conditionData.type, conditionData);

    conditionModal.style.display = 'flex';
}

/**
 * Renders dynamic parameter inputs for the selected condition type.
 * @param {string} conditionType The type of the condition.
 * @param {object} conditionData The current condition data (e.g., {type: 'hasItem', itemId: 'paint'}).
 */
function renderConditionParameters(conditionType, conditionData = {}) {
    conditionParametersDiv.innerHTML = '';

    if (conditionType === 'questStatus') { /* */
        conditionParametersDiv.innerHTML = `
            <div class="form-group">
                <label for="questIdInput">Quest ID:</label>
                <select id="questIdInput" name="questId">
                    ${Object.keys(builderQuests).map(q => `<option value="${q}">${q}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="questStatusValueInput">Status:</label>
                <select id="questStatusValueInput" name="status">
                    <option value="not_started">not_started</option>
                    <option value="accepted">accepted</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                    <option value="rewarded">rewarded</option>
                </select>
            </div>
        `;
        document.getElementById('questIdInput').value = conditionData.questId || ''; /* */
        document.getElementById('questStatusValueInput').value = conditionData.status || ''; /* */
    } else if (conditionType === 'hasItem') { /* */
        conditionParametersDiv.innerHTML = `
            <div class="form-group">
                <label for="itemIdInput">Item ID:</label>
                <input type="text" id="itemIdInput" name="itemId" placeholder="e.g., canvas">
            </div>
            <div class="form-group">
                <label for="itemQuantityInput">Quantity (default 1):</label>
                <input type="number" id="itemQuantityInput" name="quantity" value="1" min="1">
            </div>
        `;
        document.getElementById('itemIdInput').value = conditionData.itemId || ''; /* */
        document.getElementById('itemQuantityInput').value = conditionData.quantity || 1; /* */
    } else {
        conditionParametersDiv.innerHTML = '<p>Select a condition type to see parameters.</p>';
    }
}

/**
 * Saves changes made in the condition modal.
 */
function saveCondition() {
    const entity = builderEntities[currentEditingEntityId]; /* */
    const logicRule = entity.dialogueLogic[currentEditingLogicRuleIndex]; /* */
    
    const newCondition = { type: conditionTypeSelect.value }; /* */

    if (newCondition.type === 'questStatus') { /* */
        newCondition.questId = document.getElementById('questIdInput').value; /* */
        newCondition.status = document.getElementById('questStatusValueInput').value; /* */
        if (!newCondition.questId || !newCondition.status) {
            alert("Quest ID and status are required for questStatus condition.");
            return;
        }
    } else if (newCondition.type === 'hasItem') { /* */
        newCondition.itemId = document.getElementById('itemIdInput').value; /* */
        newCondition.quantity = parseInt(document.getElementById('itemQuantityInput').value) || 1; /* */
        if (!newCondition.itemId) {
            alert("Item ID is required for hasItem condition.");
            return;
        }
    } else {
        alert("Please select a valid condition type.");
        return;
    }

    if (currentEditingConditionIndex !== null) {
        logicRule.conditions[currentEditingConditionIndex] = newCondition; /* */
    } else {
        logicRule.conditions.push(newCondition); /* */
    }

    closeModal(conditionModal);
    renderConditionsInModal(logicRule.conditions); // Refresh conditions in logic rule modal
    console.log(`Condition saved for logic rule "${currentEditingLogicRuleIndex}".`);
}

/**
 * Deletes a condition from the current logic rule.
 * @param {number} conditionIndex
 */
function deleteLogicRuleCondition(conditionIndex) {
    const entity = builderEntities[currentEditingEntityId]; /* */
    const logicRule = entity.dialogueLogic[currentEditingLogicRuleIndex]; /* */
    if (confirm(`Are you sure you want to delete this condition?`)) {
        logicRule.conditions.splice(conditionIndex, 1); /* */
        renderConditionsInModal(logicRule.conditions);
    }
}


// --- Modal Utility Functions ---
function closeModal(modalElement) {
    modalElement.style.display = 'none';
}

// Global event listener for closing modals (using event delegation)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-button')) {
        const modalId = e.target.dataset.modalId;
        closeModal(document.getElementById(modalId));
        // Reset specific editing contexts
        if (modalId === 'dialogueStateModal') currentEditingDialogueStateId = null;
        if (modalId === 'dialogueOptionModal') currentEditingOptionIndex = null;
        if (modalId === 'actionModal') currentEditingActionIndex = null;
        if (modalId === 'logicRuleModal') currentEditingLogicRuleIndex = null;
        if (modalId === 'conditionModal') currentEditingConditionIndex = null;
    } else if (e.target.classList.contains('modal')) { // Click outside content
        e.target.style.display = 'none';
    }
});


// --- Dialogue Simulation Functions ---

// Mock game state for simulation purposes
let simulatedGameState = {
    quests: {},
    player: {
        backpack: {},
        money: 0,
        energy: 0,
        maxEnergy: 0,
        stats: {
            hp: 100, maxHp: 100,
            skills: {}
        }
    }
};

/**
 * Resets the dialogue simulator to its initial state.
 */
function resetDialogueSimulator() {
    simulatorOutput.innerHTML = '';
    simulatorOptions.innerHTML = '';
    startDialogueSimulationBtn.style.display = 'block';
    resetDialogueSimulationBtn.style.display = 'none';
    dialogueSimulator.style.background = '#313d4f'; // Default background

    // Reset simulated game state based on current builder data
    simulatedGameState.quests = JSON.parse(JSON.stringify(builderQuests)); /* */
    simulatedGameState.player.backpack = JSON.parse(JSON.stringify(gameState.player.backpack)); /* */
    simulatedGameState.player.money = gameState.player.money; /* */
    simulatedGameState.player.energy = gameState.player.energy; /* */
    simulatedGameState.player.maxEnergy = gameState.player.maxEnergy; /* */
    simulatedGameState.player.stats.skills = JSON.parse(JSON.stringify(gameState.player.stats.skills)); /* */
    
    appendSimulationMessage("Simulation ready. Click 'Start Simulation'.");
}

/**
 * Appends a message to the simulator output.
 * @param {string} message The message to display.
 * @param {string} type Optional type (e.g., 'dialogue', 'action', 'error') for styling.
 */
function appendSimulationMessage(message, type = 'info') {
    const p = document.createElement('p');
    p.style.marginBottom = '5px';
    p.style.padding = '3px';
    p.style.borderRadius = '3px';
    p.style.fontSize = '0.9em';

    switch(type) {
        case 'dialogue': p.style.color = '#e2e8f0'; break;
        case 'option': p.style.color = '#90cdf4'; break; // Light blue
        case 'action': p.style.color = '#48bb78'; break; // Green
        case 'info': p.style.color = '#a0aec0'; p.style.fontStyle = 'italic'; break;
        case 'error': p.style.color = '#f56565'; p.style.fontWeight = 'bold'; break;
        case 'condition-met': p.style.color = '#a0aec0'; p.style.fontStyle = 'italic'; break;
        case 'condition-not-met': p.style.color = '#f56565'; p.style.fontStyle = 'italic'; break;
        default: p.style.color = '#e2e8f0'; break;
    }
    p.textContent = message;
    simulatorOutput.appendChild(p);
    simulatorOutput.scrollTop = simulatorOutput.scrollHeight; // Scroll to bottom
}

/**
 * Starts the dialogue simulation for the current entity.
 */
function startDialogueSimulation() {
    if (!currentEditingEntityId) {
        appendSimulationMessage("No entity selected to simulate.", 'error');
        return;
    }
    const entity = builderEntities[currentEditingEntityId]; /* */
    if (!entity || !entity.dialogue) { /* */
        appendSimulationMessage("Selected entity has no dialogue defined.", 'error');
        return;
    }

    startDialogueSimulationBtn.style.display = 'none';
    resetDialogueSimulationBtn.style.display = 'block';
    dialogueSimulator.style.background = '#1a202c'; // Active simulation background

    simulateDialogueState('start'); // Start from the 'start' state
}

/**
 * Simulates a single dialogue state.
 * @param {string} stateId The ID of the dialogue state to simulate.
 */
function simulateDialogueState(stateId) {
    simulatorOptions.innerHTML = ''; // Clear previous options
    const entity = builderEntities[currentEditingEntityId]; /* */
    
    if (!entity.dialogue[stateId]) { /* */
        appendSimulationMessage(`Error: Dialogue state '${stateId}' not found for entity '${currentEditingEntityId}'. Ending simulation.`, 'error');
        return;
    }

    // First, check dialogue logic rules
    const applicableRule = (entity.dialogueLogic || []).find(rule => { /* */
        // Evaluate conditions for the rule
        return (rule.conditions || []).every(condition => { /* */
            let result = false;
            if (condition.type === 'questStatus') { /* */
                result = (simulatedGameState.quests[condition.questId] === condition.status); /* */
                appendSimulationMessage(`  Condition: Quest '${condition.questId}' is '${condition.status}' -> ${result ? 'MET' : 'NOT MET'}`, result ? 'condition-met' : 'condition-not-met'); /* */
            } else if (condition.type === 'hasItem') { /* */
                result = ((simulatedGameState.player.backpack[condition.itemId] || 0) >= (condition.quantity || 1)); /* */
                appendSimulationMessage(`  Condition: Has '${condition.itemId}' (x${condition.quantity || 1}) -> ${result ? 'MET' : 'NOT MET'}`, result ? 'condition-met' : 'condition-not-met'); /* */
            }
            return result;
        });
    });

    let currentState = entity.dialogue[stateId]; /* */
    if (applicableRule) {
        if (entity.dialogue[applicableRule.targetState]) { /* */
             appendSimulationMessage(`Logic rule matched! Redirecting to state: ${applicableRule.targetState}`, 'info'); /* */
             currentState = entity.dialogue[applicableRule.targetState]; /* */
        } else {
             appendSimulationMessage(`Warning: Logic rule target state '${applicableRule.targetState}' not found. Falling through to original state.`, 'error'); /* */
        }
    }


    appendSimulationMessage(`[${currentEditingEntityId}] says: "${currentState.text}"`, 'dialogue'); /* */

    if (!currentState.options || currentState.options.length === 0) { /* */
        appendSimulationMessage("No options. Dialogue ends.", 'info');
        resetDialogueSimulationBtn.textContent = 'End Simulation'; // Change button text to reflect ending
        return;
    }

    currentState.options.forEach((option, index) => { /* */
        const optionButton = document.createElement('button');
        optionButton.textContent = option.text; /* */
        optionButton.style.marginRight = '10px';
        optionButton.style.marginBottom = '10px';
        optionButton.addEventListener('click', () => {
            appendSimulationMessage(`  Player chooses: "${option.text}"`, 'option'); /* */
            // Execute actions
            (option.actions || []).forEach(action => { /* */
                const actionMeta = gameActionMetadata[action.id]; /* */
                if (actionMeta) {
                    appendSimulationMessage(`    Executing Action: ${actionMeta.name}`, 'action'); /* */
                    // Simulate action effect on temp state
                    simulateGameAction(action.id, action.params); /* */
                } else {
                    appendSimulationMessage(`    Warning: Unknown action ID: ${action.id}`, 'error'); /* */
                }
            });
            // Move to next state
            if (option.nextState) { /* */
                simulateDialogueState(option.nextState); /* */
            } else {
                appendSimulationMessage("No next state defined. Dialogue ends.", 'info');
                resetDialogueSimulationBtn.textContent = 'End Simulation';
            }
        });
        simulatorOptions.appendChild(optionButton);
    });
}

/**
 * Simulates the effect of a game action on the `simulatedGameState`.
 * This is a *mock* of the actual gameActions logic, specifically for the builder.
 * @param {string} actionId The ID of the action to simulate.
 * @param {object} params The parameters for the action.
 */
function simulateGameAction(actionId, params) {
    let message = `      (Simulated) `;
    switch (actionId) {
        case 'addItemToBackpack': /* */
            const item = params.item; /* */
            const quantity = params.quantity || 1;
            simulatedGameState.player.backpack[item] = (simulatedGameState.player.backpack[item] || 0) + quantity; /* */
            message += `Added ${quantity}x '${item}' to backpack. Backpack: ${JSON.stringify(simulatedGameState.player.backpack)}`; /* */
            break;
        case 'removeItemFromBackpack': /* */
            const rItem = params.item; /* */
            const rQuantity = params.quantity || 1;
            if ((simulatedGameState.player.backpack[rItem] || 0) >= rQuantity) { /* */
                simulatedGameState.player.backpack[rItem] -= rQuantity; /* */
                if (simulatedGameState.player.backpack[rItem] <= 0) { /* */
                    delete simulatedGameState.player.backpack[rItem]; /* */
                }
                message += `Removed ${rQuantity}x '${rItem}' from backpack. Backpack: ${JSON.stringify(simulatedGameState.player.backpack)}`; /* */
            } else {
                message += `Failed to remove '${rItem}': not enough in backpack.`;
            }
            break;
        case 'changeQuestState': /* */
            const questId = params.questId; /* */
            const newState = params.newState; /* */
            if (simulatedGameState.quests.hasOwnProperty(questId)) { /* */
                simulatedGameState.quests[questId] = newState; /* */
                message += `Quest '${questId}' state changed to '${newState}'.`; /* */
            } else {
                message += `Quest '${questId}' not found.`;
            }
            break;
        case 'addMoney': /* */
            const amount = params.amount; /* */
            simulatedGameState.player.money += amount; /* */
            message += `Gained $${amount}. Current money: $${simulatedGameState.player.money}`; /* */
            break;
        case 'spendMoney': /* */
            const spendAmount = params.amount; /* */
            if (simulatedGameState.player.money >= spendAmount) { /* */
                simulatedGameState.player.money -= spendAmount; /* */
                message += `Spent $${spendAmount}. Remaining money: $${simulatedGameState.player.money}`; /* */
            } else {
                message += `Failed to spend $${spendAmount}: Not enough money ($${simulatedGameState.player.money}).`; /* */
            }
            break;
        case 'restoreEnergy': /* */
            const energyAmount = params.amount; /* */
            simulatedGameState.player.energy = Math.min(simulatedGameState.player.maxEnergy, simulatedGameState.player.energy + energyAmount); /* */
            message += `Restored ${energyAmount} energy. Current energy: ${simulatedGameState.player.energy}/${simulatedGameState.player.maxEnergy}`; /* */
            break;
        case 'gainXp': /* */
            const amounts = params.amounts || []; /* */
            const skills = params.skills || []; /* */
            amounts.forEach((amt, i) => {
                const skill = skills[i];
                if (simulatedGameState.player.stats.skills[skill]) { /* */
                    simulatedGameState.player.stats.skills[skill].xp += amt; /* */
                    message += `Gained ${amt} XP in ${skill}. (Current XP: ${simulatedGameState.player.stats.skills[skill].xp}).`; /* */
                    // Simulate level up if applicable, but keep it simple for now
                } else {
                    message += `Skill '${skill}' not found.`;
                }
            });
            break;
        case 'showGameSystemHint': /* */
            message += `Game Hint: "${params.message}"`; /* */
            break;
        case 'removeEntity': /* */
             message += `Entity '${params.entityId}' would be removed from '${params.mapId}'. (No actual removal in simulation)`; /* */
             break;
        case 'boostStat': /* */
             message += `Player stat '${params.stat}' would be boosted by '${params.amount}'. (No actual boost in simulation)`; /* */
             break;
        case 'customAction': /* */
             message += `Custom JS action would run: "${params.code.substring(0, 50)}..."`; /* */
             break;
        case 'none':
            message += `No action specified.`;
            break;
        default:
            message += `Unknown action type: ${actionId}.`;
            break;
    }
    appendSimulationMessage(message, 'action');
    // Display current simulated state after action
    appendSimulationMessage(`      (Sim State) Money: $${simulatedGameState.player.money}, Backpack: ${JSON.stringify(simulatedGameState.player.backpack)}, Quests: ${JSON.stringify(simulatedGameState.quests)}`, 'info'); /* */
}


// --- Event Listeners for new modal elements (moved and added) ---

// Listeners for Dialogue State Modal
addDialogueStateBtn.addEventListener('click', () => openDialogueStateModal());
saveDialogueStateBtn.addEventListener('click', saveDialogueState);
cancelDialogueStateEditingBtn.addEventListener('click', () => closeModal(dialogueStateModal));

// Listeners for Dialogue Option Modal
addDialogueOptionBtn.addEventListener('click', () => openDialogueOptionModal());
saveDialogueOptionBtn.addEventListener('click', saveDialogueOption);
cancelDialogueOptionEditingBtn.addEventListener('click', () => closeModal(dialogueOptionModal));

// Listeners for Action Modal
addOptionActionBtn.addEventListener('click', () => openActionModal());
actionTypeSelect.addEventListener('change', (e) => renderActionParameters(e.target.value));
saveActionBtn.addEventListener('click', saveAction);
cancelActionEditingBtn.addEventListener('click', () => closeModal(actionModal));

// Listeners for Logic Rule Modal
addDialogueLogicRuleBtn.addEventListener('click', () => openLogicRuleModal());
saveLogicRuleBtn.addEventListener('click', saveLogicRule);
cancelLogicRuleEditingBtn.addEventListener('click', () => closeModal(logicRuleModal));

// Listeners for Condition Modal
addLogicRuleConditionBtn.addEventListener('click', () => openConditionModal());
conditionTypeSelect.addEventListener('change', (e) => renderConditionParameters(e.target.value));
saveConditionBtn.addEventListener('click', saveCondition);
cancelConditionEditingBtn.addEventListener('click', () => closeModal(conditionModal));


// Listeners for Dialogue Simulator
startDialogueSimulationBtn.addEventListener('click', startDialogueSimulation);
resetDialogueSimulationBtn.addEventListener('click', resetDialogueSimulator);