function updateStatsUI() {
  const stats = gameState.player.stats;
  document.getElementById('playerLevel').textContent = stats.level;
  document.getElementById('playerHP').textContent = stats.hp;
  document.getElementById('playerMaxHP').textContent = stats.maxHp;
  document.getElementById('playerAttack').textContent = stats.attack;
  document.getElementById('playerDefense').textContent = stats.defense;
  document.getElementById('playerXP').textContent = stats.xp;
  document.getElementById('xpToNextLevel').textContent = stats.xpToNextLevel;
  document.getElementById('levelUpButton').classList.toggle('hidden', stats.xp < stats.xpToNextLevel);
}
function updateBackpackUI() {
  const itemsList = document.getElementById('backpackItems');
  itemsList.innerHTML = ''; // Clear existing items
  if (gameState.player.backpack.length === 0) {
    const li = document.createElement('li');
    li.textContent = '(empty)';
    li.className = 'text-gray-500 italic';
    itemsList.appendChild(li);
  } else {
    gameState.player.backpack.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.charAt(0).toUpperCase() + item.slice(1); // Capitalize
      itemsList.appendChild(li);
    });
  }
}
function levelUp() {
  const stats = gameState.player.stats;
  if (stats.xp < stats.xpToNextLevel) return;
  stats.xp -= stats.xpToNextLevel;
  stats.level++;
  stats.xpToNextLevel = Math.floor(stats.xpToNextLevel * 1.5);
  stats.maxHp += 10;
  stats.hp = stats.maxHp;
  stats.attack += 2;
  stats.defense += 1;
  updateStatsUI();
}
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
function closeDialogue() { document.getElementById('dialogueBox').classList.add('hidden'); }
