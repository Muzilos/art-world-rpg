import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { useGame } from './hooks/useGame';
import './App.css';
import { MAPS } from './constants/maps';
import { createCloseDialogue } from './logic/closeDialogueLogic';

function App() {
  const {
    gameState,
    handleCanvasClick,
    setGameState,
    handleKeyDown,
    handleKeyUp,
    createArt,
  } = useGame();

  React.useEffect(() => {
    const cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return cleanup;
  }, [handleKeyDown, handleKeyUp]);

  const currentMapData = MAPS[gameState.currentMap];
  const closeDialogue = createCloseDialogue(setGameState);

  return (
    <div className="App">
      <div className="game-container">
        <GameUI />
        <div className="relative mx-auto w-[480px] h-[480px] border-2 border-purple-500/70 rounded-lg overflow-hidden shadow-2xl bg-black cursor-pointer">
          <GameCanvas
            gameState={gameState}
            currentMap={currentMapData}
            onCanvasClick={handleCanvasClick}
            setGameState={setGameState}
            createArt={createArt}
            closeDialogue={closeDialogue}
          />
        </div>
      </div>
    </div>
  );
}

export default App;