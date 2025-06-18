function showDialogue(character, stateKey) {
  const dialogueNode = character.dialogue[stateKey];
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
        if (option.action) option.action();
        option.nextState === 'end' ? closeDialogue() : showDialogue(character, option.nextState);
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
