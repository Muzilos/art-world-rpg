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
                    // Collect parameters dynamically based on metadata for the action
                    const actionParams = actionDef.parameters.map(param => actionObj.params[param.name]);
                    
                    const executableAction = actionFunctionCreator(...actionParams);

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

/**
 * Displays a game message in the message log.
 * @param {string} message The message text.
 * @param {string} type The type of message ('info', 'success', 'warning', 'error').
 */
function showGameMessage(message, type = 'info') {
  const messageLog = document.getElementById('gameMessageLog');
  if (!messageLog) {
    console.warn("Game message log element not found.", message);
    return;
  }

  const msgElement = document.createElement('div');
  msgElement.textContent = message;
  msgElement.className = `game-message ${type}`;

  // Prepend to show latest message at the top, but CSS uses column-reverse for visual bottom-up
  messageLog.prepend(msgElement); 

  // Limit number of messages to prevent overflow
  const maxMessages = 10;
  while (messageLog.children.length > maxMessages) {
    messageLog.removeChild(messageLog.lastChild);
  }

  // Optional: fade out after some time
  setTimeout(() => {
    msgElement.style.opacity = '0';
    setTimeout(() => {
      if (msgElement.parentNode) {
        msgElement.parentNode.removeChild(msgElement);
      }
    }, 500); // Remove after fade out transition
  }, 5000); // Fade out after 5 seconds
}