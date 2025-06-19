function showDialogue(entity, stateKey) {
  const dialogueNode = entity.dialogue[stateKey];
  if (!dialogueNode) { closeDialogue(); return; }

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
          option.actions.forEach(actionObj => {
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
                  // For custom actions, the 'code' parameter contains the raw JavaScript function body.
                  // This function is expected to take (gameState, entities, showDialogue) as arguments.
                  const customCode = actionObj.params.code;
                  // Create a function from the raw code and execute it.
                  // Pass the actual gameState, entities, and showDialogue from the game environment.
                  const func = new Function('gameState', 'entities', 'showDialogue', customCode);
                  func(gameState, entities, showDialogue);
                } else if (actionObj.id === 'none') {
                  // Do nothing for 'none' action type
                  return;
                } else {
                  // Get the factory function from the global gameActions object
                  const actionFunctionCreator = gameActions[actionObj.id];

                  if (typeof actionFunctionCreator === 'function') {
                    // Map parameters from the actionObj.params to arguments for the factory function
                    const orderedParams = actionDef.parameters.map(param => actionObj.params[param.name]);

                    // Call the factory function (e.g., gameActions.addItemToBackpack('item'))
                    const executableAction = actionFunctionCreator(...orderedParams);

                    // Then execute the returned function, passing the actual game state and environment
                    if (typeof executableAction === 'function') {
                      executableAction(gameState, entities, showDialogue);
                    } else {
                      console.warn(`Game execution Warning: Action '${actionObj.id}' did not return an executable function.`);
                    }
                  } else {
                    console.warn(`Game execution Warning: Action function '${actionObj.id}' not found in gameActions.`);
                  }
                }
              } catch (e) {
                console.error(`Error executing action '${actionObj.id}':`, e);
                // Optionally, display an in-game error message
                // showDialogue({id: 'SYSTEM', dialogue: {'error': {text: `An error occurred: ${e.message}`, options: [{text: "OK", nextState: 'end'}]}}}, 'error');
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
}

function closeDialogue() {
  document.getElementById('dialogueBox').classList.add('hidden');
  gameState.clickMarker.x = -1;
  gameState.clickMarker.y = -1;
}
