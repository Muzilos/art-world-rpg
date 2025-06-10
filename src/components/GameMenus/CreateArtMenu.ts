// components/GameMenus/CreateArtMenu.ts
import type { CreateArtMenuProps } from '../../types/game';

export const CreateArtMenu = ({
  currentY,
  gameState,
  createArt,
  drawMenuButtonHelper,
  drawMenuTextHelper,
  drawMenuTitleHelper,
}: CreateArtMenuProps): number => {
  drawMenuTitleHelper('Create Art');

  drawMenuTextHelper(`Energy: ${gameState.player.energy}/100 | Artistic: ${gameState.player.skills.artistic.toFixed(1)}`, '#CBD5E1', '15px', 'center');
  currentY += 30;

  // Add vertical spacing between buttons
  const buttonSpacing = 10;

  // Paint button - check energy and skill
  const canPaint = gameState.player.energy >= 25 && gameState.player.skills.artistic >= 1;
  drawMenuButtonHelper(
    'Paint (25⚡, Skill 1+)', 
    () => createArt('painting'), 
    '#3B82F6',
    !canPaint
  );
  currentY += 40 + buttonSpacing; // Button height + spacing

  // Sculpt button - check energy and skill
  const canSculpt = gameState.player.energy >= 40 && gameState.player.skills.artistic >= 3;
  drawMenuButtonHelper(
    'Sculpt (40⚡, Skill 3+)', 
    () => createArt('sculpture'), 
    '#22C55E',
    !canSculpt
  );
  currentY += 40 + buttonSpacing;

  // Digital Art button - check energy and skill
  const canDoDigital = gameState.player.energy >= 20 && gameState.player.skills.artistic >= 5;
  drawMenuButtonHelper(
    'Digital Art (20⚡, Skill 5+)', 
    () => createArt('digital'), 
    '#8B5CF6',
    !canDoDigital
  );
  currentY += 40 + buttonSpacing;

  return currentY;
};