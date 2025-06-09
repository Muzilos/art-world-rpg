import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { useGame } from './hooks/useGame';

function App() {
  const { gameState, currentMap, handleCanvasClick, setGameState } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 select-none font-sans">
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
        <GameUI/>
        <div className="relative mx-auto w-[480px] h-[480px] border-2 border-purple-500/70 rounded-lg overflow-hidden shadow-2xl bg-black cursor-pointer">
          <GameCanvas
            gameState={gameState}
            currentMap={currentMap}
            onCanvasClick={handleCanvasClick}
            setGameState={setGameState}
          />
        </div>
      </div>
    </div>
  );
}

export default App;