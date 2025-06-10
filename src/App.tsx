import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { useGame } from './hooks/useGame';
import { QuestLog } from './components/QuestLog';
import './App.css';
import { MAPS } from './constants/maps';

function App() {
  const {
    gameState,
    currentMap,
    handleCanvasClick,
    setGameState,
    createArt,
    closeDialogue,
    handleKeyDown,
    handleKeyUp,
    mapData
  } = useGame();

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="App">
      <div className="game-container">
        <GameUI />
        <div className="relative mx-auto w-[480px] h-[480px] border-2 border-purple-500/70 rounded-lg overflow-hidden shadow-2xl bg-black cursor-pointer">
          <GameCanvas
            gameState={gameState}
            currentMap={MAPS[gameState.currentMap]}
            onCanvasClick={handleCanvasClick}
            setGameState={setGameState}
            createArt={createArt}
            closeDialogue={closeDialogue}
          />
        </div>
        {gameState.menu === 'quests' && (
          <div className="menu-overlay">
            <QuestLog gameState={gameState} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;