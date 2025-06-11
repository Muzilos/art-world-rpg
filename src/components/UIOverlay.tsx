// src/components/UIOverlay.tsx
// This is the new central hub for all your game's UI.
// It decides which menu or dialogue to show based on the game state.
import type { GameState, MenuType } from '../types/game';
import { DialogueBox } from './ui/DialogueBox';
import { MenuContainer } from './ui/MenuContainer';
import { InventoryMenu } from './ui/menus/InventoryMenu';
import { BattleMenu } from './ui/menus/BattleMenu';
import { QuestMenu } from './ui/menus/QuestMenu';
import { CreateArtMenu } from './ui/menus/CreateArtMenu';
import { RestMenu } from './ui/menus/RestMenu';
import { StudyMenu } from './ui/menus/StudyMenu';

interface UIOverlayProps {
  gameState: GameState;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  closeDialogue: () => void;
  createArt: (artType: string) => void;
  performBattleAction: (actionId: string) => void;
  showMessage: (title: string, text: string) => void;
}

export const UIOverlay = ({ gameState, setGameState, createArt, performBattleAction, showMessage }: UIOverlayProps) => {
  const { menu, dialogue } = gameState;

  // If there's no UI to show, render nothing.
  if (!menu && !dialogue) {
    return null;
  }

  const handleCloseMenu = () => {
    setGameState(prev => ({ ...prev, menu: null, menuData: undefined }));
  };

  const renderMenuContent = () => {
    if (!menu) return null;

    switch (menu) {
      case 'inventory':
        return <InventoryMenu gameState={gameState} setGameState={setGameState} />;
      case 'battle':
        // Battle menu is special and doesn't use the container for a more immersive feel
        return <BattleMenu gameState={gameState} performBattleAction={performBattleAction} setGameState={setGameState} />;
      case 'quests':
        return <QuestMenu gameState={gameState} />;
      case 'create_art':
        return <CreateArtMenu gameState={gameState} createArt={createArt} onClose={handleCloseMenu} />;
      case 'rest':
        return <RestMenu gameState={gameState} setGameState={setGameState} onClose={handleCloseMenu} />;
      case 'study':
        return <StudyMenu gameState={gameState} setGameState={setGameState} onClose={handleCloseMenu} showMessage={showMessage}/>;
      default:
        return <div className="p-4">Menu for "{menu}" not implemented yet.</div>;
    }
  };
  
  const getMenuTitle = (menuType: MenuType): string => {
      if (!menuType) return '';
      const titles: Record<string, string> = {
          'battle': 'Critique Battle!',
          'inventory': 'Inventory',
          'quests': 'Quest Journal',
          'create_art': 'Create Art',
          'rest': 'Rest',
          'study': 'Study'
      }
      return titles[menuType] || 'Menu';
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10 p-4" onClick={!dialogue ? handleCloseMenu : undefined}>
        {/* We stop propagation on the content so clicking it doesn't close the overlay */}
        <div onClick={(e) => e.stopPropagation()}>
          {dialogue && <DialogueBox dialogue={dialogue} />}
          {menu && (
              menu === 'battle' ? (
                <div className="bg-slate-900/90 backdrop-blur-sm border-2 border-red-500/70 rounded-lg overflow-hidden shadow-2xl w-[480px] h-[480px] flex flex-col animate-fade-in">
                    {renderMenuContent()}
                </div>
              ) : (
                <MenuContainer title={getMenuTitle(menu)} onClose={handleCloseMenu}>
                    {renderMenuContent()}
                </MenuContainer>
              )
          )}
        </div>
    </div>
  );
};
