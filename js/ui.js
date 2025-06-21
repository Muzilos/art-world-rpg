// Define closeDialogue first, as showDialogue might reference it
const closeDialogue = () => { // Changed to const arrow function
  document.getElementById('dialogueBox').classList.add('hidden');
  gameState.clickMarker.x = -1;
  gameState.clickMarker.y = -1;
};

// Now define showDialogue
const showDialogue = (entity, stateKey) => { // Changed to const arrow function
  const dialogueNode = entity.dialogue[stateKey];
  if (!dialogueNode) { closeDialogue(); return; } // closeDialogue is now defined

  // Update header
  // const entityIcon = document.getElementById('entityIcon');
  // if (entityIcon) entityIcon.textContent = entityInfo.icon;
  const entityName = document.getElementById('entityName');
  if (entityName) entityName.textContent = entity.name || "Entity";

  // Update dialogue
  document.getElementById('dialogueText').textContent = dialogueNode.text;
  const optionsContainer = document.getElementById('dialogueOptions');
  const closeButton = document.getElementById('closeDialogue');

  optionsContainer.innerHTML = '';

  if (dialogueNode.options && dialogueNode.options.length > 0) {
    closeButton.classList.add('hidden');
    dialogueNode.options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.text;
      button.className = 'w-full text-left px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500';
      button.onclick = () => {
        // Execute actions if defined, then change state or close dialogue
        if (option.actions) {
          // Ensure actions are not halted by a previous action
          let halted = false;
          option.actions.forEach(actionObj => {
            if (halted) return; // Stop processing if halted
            // Ensure actionObj is not null/undefined
            if (!actionObj) {
              console.warn("Skipping null/undefined actionObj in game execution.");
              return;
            }

            // Retrieve the action definition from gameActionMetadata
            const actionDef = gameActionMetadata[actionObj.id];
            if (actionDef) {
              try {
                if (actionObj.id === 'customAction') {
                  const customCode = actionObj.params.code;
                  const func = new Function('gameState', 'entities', customCode);
                  func(gameState, entities);
                } else if (actionObj.id === 'none') {
                  return;
                } else {
                  const actionFunctionCreator = gameActions[actionObj.id];

                  if (typeof actionFunctionCreator === 'function') {
                    let orderedParams;
                    if (actionObj.id === 'gainXp') {
                      orderedParams = [
                        actionObj.params.amounts || [],
                        actionObj.params.skills || []
                      ];
                    } else {
                      orderedParams = actionDef.parameters.map(param => actionObj.params[param.name]);
                    }

                    const executableAction = actionFunctionCreator(...orderedParams);

                    if (typeof executableAction === 'function') {
                      const success = executableAction(gameState, entities);
                      if (!success) {
                        // halt execution of subsequent actions
                        console.warn(`Game execution Warning: Action '${actionObj.id}' did not execute successfully. Halting further actions.`);
                        halted = true;
                        return;
                      }
                    } else {
                      console.warn(`Game execution Warning: Action '${actionObj.id}' did not return an executable function.`);
                    }
                  } else {
                    console.warn(`Game execution Warning: Action function '${actionObj.id}' not found in gameActions.`);
                  }
                }
              } catch (e) {
                console.error(`Error executing action '${actionObj.id}':`, e);
                showDialogue({ id: 'SYSTEM', dialogue: { 'error': { text: `An error occurred: ${e.message}`, options: [{ text: "OK", nextState: 'end' }] } } }, 'error');
              }
            } else {
              console.warn(`Action metadata for ID '${actionObj.id}' not found. Skipping action.`);
            }
          });
        }
        option.nextState === 'end' ? closeDialogue() : showDialogue(entity, option.nextState);
      };
      optionsContainer.appendChild(button);
    });
  } else {
    closeButton.classList.remove('hidden');
  }

  document.getElementById('dialogueBox').classList.remove('hidden');
};

