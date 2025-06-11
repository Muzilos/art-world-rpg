import { useRef, useEffect, useState } from 'react';
import type { GameState, GameMap } from '../types/game';
import { SPRITES, TILE_COLORS, INTERACTION_TYPES } from '../constants/game';

const TILE_SIZE = 32;

interface GameCanvasProps {
  gameState: GameState;
  currentMap: GameMap;
  onCanvasClick: (x: number, y: number) => void;
}

export const GameCanvas = ({ gameState, currentMap, onCanvasClick }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!gameState.player) {
      return;
    }


    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Core Drawing Logic (Unchanged) ---
    canvas.width = 480;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const camX = gameState.player.x - canvas.width / 2 + TILE_SIZE / 2;
    const camY = gameState.player.y - canvas.height / 2 + TILE_SIZE / 2;
    const clampedCamX = Math.max(0, Math.min(camX, currentMap.width * TILE_SIZE - canvas.width));
    const clampedCamY = Math.max(0, Math.min(camY, currentMap.height * TILE_SIZE - canvas.height));

    ctx.save();
    ctx.translate(-clampedCamX, -clampedCamY);

    const startCol = Math.floor(clampedCamX / TILE_SIZE);
    const endCol = startCol + (canvas.width / TILE_SIZE) + 1;
    const startRow = Math.floor(clampedCamY / TILE_SIZE);
    const endRow = startRow + (canvas.height / TILE_SIZE) + 1;

    for (let r = startRow; r < Math.min(endRow, currentMap.height); r++) {
      for (let c = startCol; c < Math.min(endCol, currentMap.width); c++) {
        if (r < 0 || c < 0) continue;
        const tileVal = currentMap.tiles[r]?.[c];
        if (tileVal !== undefined) {
          ctx.fillStyle = TILE_COLORS[tileVal as keyof typeof TILE_COLORS] || '#FF00FF';
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    Object.entries(currentMap.objects).forEach(([key, obj]) => {
      const [x, y] = key.split(',').map(Number);
      const sprite = SPRITES[obj.type as keyof typeof SPRITES];
      if (typeof sprite === 'string') {
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sprite, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
      }
    });

    if (gameState.player) {
      const playerSprite = SPRITES.player[gameState.player.facing][gameState.player.sprite];
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(playerSprite, gameState.player.x + TILE_SIZE / 2, gameState.player.y + TILE_SIZE / 2);
    }

    if (mousePos) {
      const mouseTileX = Math.floor((mousePos.x + clampedCamX) / TILE_SIZE);
      const mouseTileY = Math.floor((mousePos.y + clampedCamY) / TILE_SIZE);

      if (mouseTileX >= 0 && mouseTileX < currentMap.width && mouseTileY >= 0 && mouseTileY < currentMap.height) {
        const isInteractive = !!currentMap.objects[`${mouseTileX},${mouseTileY}`];
        if (isInteractive || currentMap.tiles[mouseTileY][mouseTileX] !== 1) {
          ctx.strokeStyle = isInteractive ? '#EF4444' : '#FACC15';
          ctx.lineWidth = 2;
          ctx.strokeRect(mouseTileX * TILE_SIZE + 1, mouseTileY * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }

    ctx.restore();

    // Draw player stats at the bottom
    const statsPadding = 10;
    const statsHeight = 30;
    const statsY = canvas.height - statsHeight - statsPadding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(statsPadding, statsY, canvas.width - statsPadding * 2, statsHeight);

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#4ADE80';
    ctx.fillText(`$ ${gameState.player.money}`, statsPadding + 5, statsY + statsHeight / 2);

    ctx.fillStyle = '#FACC15';
    ctx.fillText(`⚡ ${gameState.player.energy}/100`, statsPadding + 100, statsY + statsHeight / 2);

    ctx.fillStyle = '#F87171';
    ctx.fillText(`⭐ ${Math.floor(gameState.player.reputation)}`, statsPadding + 180, statsY + statsHeight / 2);

    ctx.fillStyle = '#A78BFA';
    ctx.fillText(`🕐 ${(Math.floor(gameState.time / 60)).toString().padStart(2, '0')}:${(gameState.time % 60).toString().padStart(2, '0')}`,
      statsPadding + 260, statsY + statsHeight / 2);

    ctx.fillStyle = '#A78BFA';
    ctx.fillText(`🌅 Day ${gameState.day}`, statsPadding + 350, statsY + statsHeight / 2);


  }, [gameState, currentMap, mousePos]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // The click is simply passed to the game logic
    onCanvasClick(x, y);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    setMousePos({ x, y });
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(null)}
      className="w-full h-full"
    />
  );
};
