// Import functions from other modules
// NOTE: In a real module system (e.g., ES Modules), you'd use import statements.
// For simple <script> tags, these functions become globally available,
// so explicit imports are not syntactically required but help in understanding dependencies.

// Ensure all global variables defined in builder-utils.js are accessible.

document.addEventListener('DOMContentLoaded', () => {
    loadGameData(); // From builder-utils.js
    switchSection(mapsSection, navMaps); // Initial render, from builder-utils.js

    // --- Global Event Listeners (remains in main builder.js) ---

    // Navigation (listeners remain here to control overall section switching)
    navMaps.addEventListener('click', () => switchSection(mapsSection, navMaps));
    navEntities.addEventListener('click', () => switchSection(entitiesSection, navEntities));
    navQuests.addEventListener('click', () => switchSection(questsSection, navQuests));
    navSkills.addEventListener('click', () => switchSection(skillsSection, navSkills));
    navCrafting.addEventListener('click', () => switchSection(craftingSection, navCrafting));

    // Export/Import
    exportDataBtn.addEventListener('click', exportGameData); // From builder-utils.js
    importDataInput.addEventListener('change', importGameData); // From builder-utils.js
});