import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { useGame } from './hooks/useGame';
import './App.css';
import { MAPS } from './constants/maps';
import { UIOverlay } from './components/UIOverlay';

function App() {
  const {
    gameState,
    setGameState,
    handleCanvasClick,
    createArt,
    performBattleAction,
    closeDialogue,
    showMessage
  } = useGame();

  const currentMapData = MAPS[gameState.currentMap];

  return (
    <div className="App">
      <div className="game-container">
        <GameUI />
        <div className="relative mx-auto w-[480px] h-[480px] border-2 border-purple-500/70 rounded-lg overflow-hidden shadow-2xl bg-black cursor-pointer">
          <GameCanvas
            gameState={gameState}
            currentMap={currentMapData}
            onCanvasClick={handleCanvasClick}
          />
          <UIOverlay 
            gameState={gameState}
            setGameState={setGameState}
            createArt={createArt}
            performBattleAction={performBattleAction}
            closeDialogue={closeDialogue}
            showMessage={showMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;