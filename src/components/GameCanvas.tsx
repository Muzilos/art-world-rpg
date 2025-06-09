import { useRef, useEffect, useState } from 'react';
import type { GameState, GameMap, MenuType } from '../types/game';
import { SPRITES, TILE_COLORS } from '../constants/game';
import { wrapAndDrawText, getWrappedLines } from '../utils/gameLogic';

interface GameCanvasProps {
  gameState: GameState;
  currentMap: GameMap;
  onCanvasClick: (x: number, y: number, menu?: MenuType) => void;
  setGameState: (updater: (prev: GameState) => GameState) => void;
}

export const GameCanvas = ({ gameState, currentMap, onCanvasClick, setGameState }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiClickableElementsRef = useRef<Array<{ x: number; y: number; width: number; height: number; action: () => void }>>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const createArtwork = (
    energyCost: number,
    moneyCost: number,
    questId: string,
    questTitle: string,
    questDescription: string,
    dialogueTitle: string,
    dialogueText: string
  ) => {
    const isFirstTime = !gameState.player.quests.some(q => q.id === questId);
    if (gameState.player.energy - energyCost < 0) {
      showMessage('Not enough energy', 'Rest to regain energy.');
      return;
    } else if (gameState.player.money - moneyCost < 0) {
      showMessage('Not enough money', 'Sell art to gain money.');
      return;
    }
    // Update player stats
    const updatedPlayer = {
      ...gameState.player,
      energy: gameState.player.energy - energyCost,
      skills: {
        ...gameState.player.skills,
        artistic: gameState.player.skills.artistic + 1
      },
      money: gameState.player.money - moneyCost,
      reputation: gameState.player.reputation + 1,
      level: gameState.player.level + 1,
      title: 'Artist'
    };

    // If it's the first time, add the quest
    if (isFirstTime) {
      updatedPlayer.quests = [
        ...updatedPlayer.quests,
        {
          id: questId,
          title: questTitle,
          description: questDescription,
          reward: {
            money: 100,
            reputation: 5
          },
          completed: true
        }
      ];

      // Show dialogue for first time
      setGameState(prev => ({
        ...prev,
        player: updatedPlayer,
        dialogue: {
          title: dialogueTitle,
          text: dialogueText,
          options: [{ text: 'Continue', action: () => {
            setGameState(p => ({ ...p, dialogue: null }));
          } }]
        }
      }));
    } else {
      // Just update player stats without dialogue
      setGameState(prev => ({
        ...prev,
        player: updatedPlayer
      }));
    }
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: string,
    stroke: { color: string; width: number } | null = null
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.stroke();
    }
  };

  const addClickable = (x: number, y: number, width: number, height: number, action: () => void) => {
    uiClickableElementsRef.current.push({ x, y, width, height, action });
  };

  // Add a helper to close the menu
  const closeMenu = () => {
    // Simulate a click outside or call a prop if you have one
    // For now, trigger onCanvasClick with a special value
    onCanvasClick(-999, -999);
  };

  // Refactor drawing logic into a function
  const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Clear clickable elements for this frame
    uiClickableElementsRef.current = [];

    // Set canvas size
    canvas.width = 480;
    canvas.height = 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    const TILE_SIZE = 32;
    const RENDER_WIDTH_TILES = 15;
    const RENDER_HEIGHT_TILES = 15;

    // Camera setup
    const camX = gameState.player.x - canvas.width / 2 + TILE_SIZE / 2;
    const camY = gameState.player.y - canvas.height / 2 + TILE_SIZE / 2;
    const clampedCamX = Math.max(0, Math.min(camX, currentMap.width * TILE_SIZE - canvas.width));
    const clampedCamY = Math.max(0, Math.min(camY, currentMap.height * TILE_SIZE - canvas.height));

    ctx.save();
    ctx.translate(-clampedCamX, -clampedCamY);

    // Render Tiles
    const startCol = Math.floor(clampedCamX / TILE_SIZE);
    const endCol = startCol + RENDER_WIDTH_TILES + 1;
    const startRow = Math.floor(clampedCamY / TILE_SIZE);
    const endRow = startRow + RENDER_HEIGHT_TILES + 1;

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

    // Draw map objects
    currentMap.objects.forEach(obj => {
      const sprite = SPRITES[obj.data.sprite as keyof typeof SPRITES];
      if (typeof sprite === 'string') {
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sprite, obj.x + TILE_SIZE / 2, obj.y + TILE_SIZE / 2);
      }
    });

    // Draw player
    const playerSprite = SPRITES.player[gameState.player.facing][gameState.player.sprite];
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerSprite, gameState.player.x + TILE_SIZE / 2, gameState.player.y + TILE_SIZE / 2);

    // Draw hover indicator if mouse is over a tile (moved after all other rendering)
    if (mousePos) {
      const mouseTileX = Math.floor((mousePos.x + clampedCamX) / TILE_SIZE);
      const mouseTileY = Math.floor((mousePos.y + clampedCamY) / TILE_SIZE);

      // Check if the tile is valid and not a wall
      if (mouseTileX >= 0 && mouseTileX < currentMap.width &&
        mouseTileY >= 0 && mouseTileY < currentMap.height) {

        // Check if there's an interactive object on this exact tile
        const isOnInteractiveObject = currentMap.objects.some(obj => {
          const objTileX = Math.floor(obj.x / TILE_SIZE);
          const objTileY = Math.floor(obj.y / TILE_SIZE);
          const isInteractive = ['exit', 'npc', 'shop', 'create_art', 'rest', 'study'].includes(obj.data.interaction);
          return objTileX === mouseTileX && objTileY === mouseTileY && isInteractive;
        });

        // Only proceed if either on an interactive object or a valid movement tile
        if (isOnInteractiveObject || !currentMap.collision[mouseTileY][mouseTileX]) {
          const x = mouseTileX * TILE_SIZE;
          const y = mouseTileY * TILE_SIZE;

          // Draw outer glow (more subtle)
          ctx.shadowColor = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.shadowBlur = 8;
          ctx.fillStyle = isOnInteractiveObject ? 'rgba(239, 68, 68, 0.1)' : 'rgba(250, 204, 21, 0.1)';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Draw border
          ctx.shadowBlur = 0;
          ctx.strokeStyle = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Draw corner accents (smaller and more subtle)
          const accentSize = 3;
          ctx.fillStyle = isOnInteractiveObject ? '#EF4444' : '#FACC15';

          // Top-left corner
          ctx.fillRect(x, y, accentSize, accentSize);
          // Top-right corner
          ctx.fillRect(x + TILE_SIZE - accentSize, y, accentSize, accentSize);
          // Bottom-left corner
          ctx.fillRect(x, y + TILE_SIZE - accentSize, accentSize, accentSize);
          // Bottom-right corner
          ctx.fillRect(x + TILE_SIZE - accentSize, y + TILE_SIZE - accentSize, accentSize, accentSize);
        }
      }
    }

    ctx.restore();

    // Draw player stats at the top of the canvas
    const statsPadding = 10;
    const statsHeight = 30;
    const statsY = canvas.height - statsHeight - statsPadding;

    // Draw stats background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    drawRoundedRect(ctx, statsPadding, statsY, canvas.width - statsPadding * 2, statsHeight, 5, ctx.fillStyle);

    // Draw stats text
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Money
    ctx.fillStyle = '#4ADE80';
    ctx.fillText(`$ ${gameState.player.money}`, statsPadding + 10, statsY + statsHeight / 2);

    // Energy
    ctx.fillStyle = '#FACC15';
    ctx.fillText(`⚡ ${gameState.player.energy}/100`, statsPadding + 100, statsY + statsHeight / 2);

    // Reputation
    ctx.fillStyle = '#F87171';
    ctx.fillText(`⭐ ${gameState.player.reputation}`, statsPadding + 200, statsY + statsHeight / 2);

    // Time
    ctx.fillStyle = '#A78BFA';
    ctx.fillText(`${gameState.time.toString().padStart(2, '0')}:00`, statsPadding + 300, statsY + statsHeight / 2);

    // Draw UI icons
    const iconSize = 40;
    const padding = 10;
    const icons = [
      { icon: '📊', menu: 'status', x: padding, y: padding },
      { icon: '🎒', menu: 'inventory', x: padding + iconSize + padding, y: padding },
      { icon: '📜', menu: 'quests', x: padding + (iconSize + padding) * 2, y: padding },
      { icon: '💰', menu: 'market', x: padding + (iconSize + padding) * 3, y: padding }
    ];

    icons.forEach(({ icon, menu, x, y }) => {
      // Draw icon background
      ctx.fillStyle = gameState.menu === menu ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)';
      drawRoundedRect(ctx, x, y, iconSize, iconSize, 8, ctx.fillStyle, { color: 'white', width: 1 });

      // Draw icon
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(icon, x + iconSize / 2, y + iconSize / 2);

      // Add clickable area
      addClickable(x, y, iconSize, iconSize, () => {
        onCanvasClick(-999, -999); // Special value to indicate UI click
        if (gameState.menu === menu) {
          onCanvasClick(-1000, -1000); // Special value to close menu
        } else {
          onCanvasClick(-1001, -1001, menu as MenuType); // Special value to open menu
        }
      });
    });

    // Draw menu if present
    if (gameState.menu) {
      const boxWidth = canvas.width * 0.9;
      const boxHeight = canvas.height * 0.85;
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = (canvas.height - boxHeight) / 2;
      const padding = 20;
      const lineHeight = 20;
      const buttonHeight = 40;
      const buttonMargin = 8;
      let currentY = boxY + padding;

      // Draw menu background
      ctx.fillStyle = 'rgba(15,23,42,0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10, 'rgba(30,41,59,0.98)', { color: 'rgba(71,85,105,1)', width: 2 });

      // Draw menu title
      const drawMenuTitle = (title: string) => {
        wrapAndDrawText(ctx, title, boxX + padding, currentY + 10, boxWidth - padding * 2, 28, { fillStyle: '#A78BFA', font: 'bold 24px Noto Sans', textAlign: 'center' as CanvasTextAlign });
        currentY += 45;
      };

      // Draw menu text
      const drawMenuText = (text: string, color = '#CBD5E1', size = '15px', align: CanvasTextAlign = 'left', isBold = false, customMaxWidth = null) => {
        const textMaxWidth = customMaxWidth || boxWidth - padding * 2;
        const textX = align === 'center' ? boxX + (boxWidth - textMaxWidth) / 2 : boxX + padding;
        currentY += wrapAndDrawText(ctx, text, textX, currentY, textMaxWidth, lineHeight, {
          fillStyle: color,
          font: `${isBold ? 'bold ' : ''}${size} Noto Sans`,
          textAlign: align
        });
      };

      // Draw menu button (refactored for clarity)
      const drawMenuButton = (text: string, action: () => void, color = '#3B82F6', disabled = false) => {
        const btnWidth = boxWidth - padding * 2;
        const btnX = boxX + padding;
        const btnY = currentY;
        ctx.font = 'bold 14px Noto Sans';
        const lines = getWrappedLines(ctx, text, btnWidth, ctx.font);
        const textHeight = lines.length * lineHeight;
        const textY = btnY + (buttonHeight - textHeight) / 2 + lineHeight * 0.85;
        // Hover effect
        let isHovered = false;
        if (mousePos &&
          mousePos.x >= btnX && mousePos.x <= btnX + btnWidth &&
          mousePos.y >= btnY && mousePos.y <= btnY + buttonHeight &&
          !disabled
        ) {
          isHovered = true;
        }
        const bgColor = disabled ? '#64748B' : isHovered ? '#2563EB' : color;
        const textColor = isHovered ? '#FACC15' : '#FFFFFF';
        drawRoundedRect(ctx, btnX, btnY, btnWidth, buttonHeight, 5, bgColor);
        lines.forEach((line: string, i: number) => {
          wrapAndDrawText(ctx, line, btnX, textY + i * lineHeight, btnWidth, lineHeight, {
            fillStyle: textColor,
            font: 'bold 14px Noto Sans',
            textAlign: 'center' as CanvasTextAlign
          });
        });
        if (!disabled) {
          addClickable(btnX, btnY, btnWidth, buttonHeight, () => {
            action();
            closeMenu();
          });
        }
        currentY += buttonHeight + buttonMargin;
      };

      // Draw menu content based on type
      switch (gameState.menu) {
        case 'status':
          drawMenuTitle('Status');
          drawMenuText(`Level ${gameState.player.level} ${gameState.player.title}`, '#A78BFA', '18px', 'center', true);
          currentY += 10;
          drawMenuText(`Money: $${gameState.player.money}`, '#4ADE80');
          drawMenuText(`Energy: ${gameState.player.energy}/100`, '#FACC15');
          drawMenuText(`Reputation: ${gameState.player.reputation}`, '#F87171');
          currentY += 10;
          drawMenuText('Skills:', '#A78BFA', '16px', 'left', true);
          drawMenuText(`Artistic: ${gameState.player.skills.artistic.toFixed(1)}`, '#CBD5E1');
          drawMenuText(`Networking: ${gameState.player.skills.networking.toFixed(1)}`, '#CBD5E1');
          drawMenuText(`Business: ${gameState.player.skills.business.toFixed(1)}`, '#CBD5E1');
          drawMenuText(`Curating: ${gameState.player.skills.curating.toFixed(1)}`, '#CBD5E1');
          break;

        case 'inventory':
          drawMenuTitle('Inventory');
          drawMenuText('Equipment:', '#A78BFA', '16px', 'left', true);
          drawMenuText(`Brush: ${gameState.player.equipment.brush}`, '#CBD5E1');
          drawMenuText(`Outfit: ${gameState.player.equipment.outfit}`, '#CBD5E1');
          currentY += 10;
          drawMenuText('Items:', '#A78BFA', '16px', 'left', true);
          Object.entries(gameState.player.inventory).forEach(([item, count]) => {
            drawMenuText(`${item}: ${count}`, '#CBD5E1');
          });
          break;

        case 'quests':
          drawMenuTitle('Quests');
          if (gameState.player.quests.length === 0) {
            drawMenuText('No active quests', '#CBD5E1', '16px', 'center');
          } else {
            gameState.player.quests.forEach(quest => {
              drawMenuText(quest.title.toString(), '#CBD5E1', '16px', 'left', true);
              drawMenuText(quest.description.toString(), '#CBD5E1', '14px', 'left', false);
              drawMenuText(`Reward: $${quest.reward.money}`, '#CBD5E1', '14px', 'left', false);
              drawMenuText(`Rep: ${quest.reward.reputation}`, '#CBD5E1', '14px', 'left', false);
            });
          }
          break;

        case 'create_art':
          drawMenuTitle('Create Art');
          drawMenuText(`Energy: ${gameState.player.energy}/100 | Artistic: ${gameState.player.skills.artistic.toFixed(1)}`, '#CBD5E1', '15px', 'center');
          currentY += 30;

          drawMenuButton('Paint (25 EGY, Skill 1+)', () => {
            createArtwork(
              25, // energy cost
              25, // money cost
              'first_painting',
              'First Painting',
              'Create your first painting.',
              'First Painting',
              'You created your first painting!'
            );
          }, '#3B82F6');

          drawMenuButton('Sculpt (40 EGY, Skill 3+)', () => {
            createArtwork(
              40, // energy cost
              40, // money cost
              'first_sculpture',
              'First Sculpture',
              'Create your first sculpture.',
              'First Sculpture',
              'You created your first sculpture!'
            );
          }, '#22C55E', gameState.player.skills.artistic < 3);

          drawMenuButton('Digital Art (20 EGY, Skill 5+)', () => {
            createArtwork(
              20, // energy cost
              20, // money cost
              'first_digital_art',
              'First Digital Art',
              'Create your first digital art.',
              'First Digital Art',
              'You created your first digital art!'
            );
          }, '#8B5CF6', gameState.player.skills.artistic < 5);
          break;

        case 'rest':
          drawMenuTitle('Rest');
          drawMenuText(`Time: ${gameState.time}:00, Day ${gameState.day} | Energy: ${gameState.player.energy}/100`, '#CBD5E1', '15px', 'center');
          currentY += 30;
          drawMenuButton('Nap (2 Hrs, +30 Energy)', () => {
            // Calculate new time (2 hours later)
            let newTime = gameState.time + 2;
            let newDay = gameState.day;
            
            // If time goes past 24, move to next day
            if (newTime >= 24) {
              newTime = newTime % 24;
              newDay += 1;
            }

            // Update game state with new time, day, and energy
            setGameState(prev => ({
              ...prev,
              time: newTime,
              day: newDay,
              player: {
                ...prev.player,
                energy: Math.min(100, prev.player.energy + 30)
              }
            }));
          }, '#38BDF8');

          drawMenuButton('Sleep (Until 8 AM, +100 Energy)', () => {
            // Calculate time until 8 AM
            let hoursUntil8AM = 8 - gameState.time;
            if (hoursUntil8AM <= 0) {
              hoursUntil8AM += 24; // If it's past 8 AM, sleep until next day
            }

            // Update game state with new time, day, and energy
            setGameState(prev => ({
              ...prev,
              time: 8, // Always wake up at 8 AM
              day: prev.day + 1,
              player: {
                ...prev.player,
                energy: 100 // Full energy after sleep
              }
            }));
          }, gameState.time < 21 ? '#64748B' : '#3B82F6', gameState.time < 21); // Use blue color when enabled
          break;
      }

      // Add close button
      const closeBtnWidth = 120;
      const closeBtnHeight = 30;
      const closeBtnX = boxX + boxWidth - closeBtnWidth - padding;
      const closeBtnY = boxY + boxHeight - closeBtnHeight - padding;
      // Hover effect for close button
      let closeHovered = false;
      if (mousePos &&
        mousePos.x >= closeBtnX && mousePos.x <= closeBtnX + closeBtnWidth &&
        mousePos.y >= closeBtnY && mousePos.y <= closeBtnY + closeBtnHeight
      ) {
        closeHovered = true;
      }
      const closeBgColor = closeHovered ? '#6D28D9' : '#7C3AED';
      const closeTextColor = closeHovered ? '#FACC15' : '#FFFFFF';
      drawRoundedRect(ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, 5, closeBgColor);
      // Center text vertically and horizontally
      ctx.font = 'bold 14px Noto Sans';
      const closeLines = getWrappedLines(ctx, 'Close', closeBtnWidth, ctx.font);
      const closeTextHeight = closeLines.length * lineHeight;
      const closeTextY = closeBtnY + (closeBtnHeight - closeTextHeight) / 2 + lineHeight * 0.85;
      closeLines.forEach((line: string, i: number) => {
        wrapAndDrawText(ctx, line, closeBtnX, closeTextY + i * lineHeight, closeBtnWidth, lineHeight, {
          fillStyle: closeTextColor,
          font: 'bold 14px Noto Sans',
          textAlign: 'center' as CanvasTextAlign
        });
      });
      addClickable(closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, () => {
        onCanvasClick(-1000, -1000); // Consistent close menu action
      });
    }

    // Draw dialogue if present
    if (gameState.dialogue) {
      const boxX = 40;
      const boxY = 320;
      const boxWidth = 400;
      const boxHeight = 120;
      const padding = 20;
      const lineHeight = 24;

      // Draw dialogue box
      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10, '#1E293B', { color: '#7C3AED', width: 2 });

      // Draw title
      wrapAndDrawText(
        ctx,
        gameState.dialogue.title,
        boxX + padding,
        boxY + padding,
        boxWidth - padding * 2,
        lineHeight,
        { fillStyle: '#A78BFA', font: 'bold 18px Noto Sans', textAlign: 'left' }
      );

      // Draw text
      wrapAndDrawText(
        ctx,
        gameState.dialogue.text,
        boxX + padding,
        boxY + padding + lineHeight * 1.5,
        boxWidth - padding * 2,
        lineHeight,
        { fillStyle: '#CBD5E1', font: '16px Noto Sans', textAlign: 'left' }
      );

      // Draw options
      let currentY = boxY + boxHeight - 40;
      // Reverse the options array to draw from bottom to top
      [...gameState.dialogue.options].reverse().forEach(option => {
        const btnWidth = boxWidth - padding * 2;
        const btnX = boxX + padding;
        const btnHeight = 30;

        // Hover effect
        let isHovered = false;
        if (mousePos &&
          mousePos.x >= btnX && mousePos.x <= btnX + btnWidth &&
          mousePos.y >= currentY && mousePos.y <= currentY + btnHeight
        ) {
          isHovered = true;
        }
        const bgColor = isHovered ? '#6D28D9' : '#7C3AED';
        const textColor = isHovered ? '#FACC15' : '#FFFFFF';

        drawRoundedRect(ctx, btnX, currentY, btnWidth, btnHeight, 5, bgColor);
        wrapAndDrawText(
          ctx,
          option.text,
          btnX,
          currentY + btnHeight / 2,
          btnWidth,
          lineHeight,
          { fillStyle: textColor, font: 'bold 14px Noto Sans', textAlign: 'center' }
        );

        addClickable(btnX, currentY, btnWidth, btnHeight, option.action);
        currentY -= btnHeight + 10;
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGame(ctx, canvas);
  }, [gameState, currentMap, mousePos]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Redraw and register clickables for this click
    drawGame(ctx, canvas);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check UI elements first
    for (const element of uiClickableElementsRef.current) {
      if (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      ) {
        element.action();
        return;
      }
    }

    // If a menu is open, close it if click is outside the menu box
    if (gameState.menu) {
      const boxWidth = canvas.width * 0.9;
      const boxHeight = canvas.height * 0.85;
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = (canvas.height - boxHeight) / 2;
      if (
        x < boxX ||
        x > boxX + boxWidth ||
        y < boxY ||
        y > boxY + boxHeight
      ) {
        onCanvasClick(-1000, -1000); // Close menu
        return;
      }
    }

    // If no UI element was clicked, handle game world click
    const TILE_SIZE = 32;
    const camX = gameState.player.x - canvas.width / 2 + TILE_SIZE / 2;
    const camY = gameState.player.y - canvas.height / 2 + TILE_SIZE / 2;
    const clampedCamX = Math.max(0, Math.min(camX, currentMap.width * TILE_SIZE - canvas.width));
    const clampedCamY = Math.max(0, Math.min(camY, currentMap.height * TILE_SIZE - canvas.height));

    // Convert click position to world coordinates
    const worldX = x + clampedCamX;
    const worldY = y + clampedCamY;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    // Check if clicked on an interactive object
    const clickedObject = currentMap.objects.find(obj => {
      const objTileX = Math.floor(obj.x / TILE_SIZE);
      const objTileY = Math.floor(obj.y / TILE_SIZE);
      return objTileX === tileX && objTileY === tileY &&
        ['exit', 'npc', 'shop', 'create_art', 'rest', 'study'].includes(obj.data.interaction);
    });

    if (clickedObject) {
      // For doors (exits), set up the pending interaction and move to the object
      if (clickedObject.data.interaction === 'exit') {
        setGameState(prev => ({
          ...prev,
          pendingInteraction: {
            x: clickedObject.x,
            y: clickedObject.y,
            type: 'exit',
            data: clickedObject.data
          }
        }));
        onCanvasClick(worldX, worldY);
      } else {
        // For other interactive objects, trigger their menu
        onCanvasClick(-1001, -1001, clickedObject.data.interaction as MenuType);
      }
    } else if (tileX >= 0 && tileX < currentMap.width &&
      tileY >= 0 && tileY < currentMap.height &&
      !currentMap.collision[tileY][tileX]) {
      // If clicked on a valid movement tile, move there
      onCanvasClick(worldX, worldY);
    }
  };

  // Add mouse move and leave handlers
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
  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const showMessage = (title: string, text: string, options = [{ text: "Okay", action: () => {
    setGameState(prev => ({
      ...prev,
      dialogue: null,
      menu: null
    }));
  } }]) => {
    setGameState(prev => ({
      ...prev,
      dialogue: { title, text, options, scroll: 0 }
    }));
  };

  const scrollDialogue = (direction: number) => {
    setGameState(prev => {
      if (!prev.dialogue) return prev;
      const newScroll = (prev.dialogue.scroll || 0) + direction;
      return {
        ...prev,
        dialogue: { ...prev.dialogue, scroll: newScroll }
      };
    });
  };

  const closeDialogue = () => setGameState(prev => ({ ...prev, dialogue: null, menu: null }));

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full cursor-pointer"
    />
  );
};

export default GameCanvas;