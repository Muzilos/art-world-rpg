import { useRef, useEffect, useState } from 'react';
import type { GameState, GameMap, MenuType, NPCData, ObjectData } from '../types/game';
import { SPRITES, TILE_COLORS } from '../constants/game';
import { wrapAndDrawText, getWrappedLines } from '../utils/gameLogic';
import { BATTLE_ACTIONS } from '../constants/game';
import { QUEST_DEFINITIONS } from '../quests/questDefinitions';
import { MAPS } from '../constants/maps';

const TILE_SIZE = 32;

interface GameCanvasProps {
  gameState: GameState;
  currentMap: GameMap;
  onCanvasClick: (x: number, y: number, menu?: MenuType) => void;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  createArt: (artType: string) => void;
  closeDialogue: () => void;
}

export const GameCanvas = ({ gameState, currentMap, onCanvasClick, setGameState, createArt, closeDialogue }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiClickableElementsRef = useRef<Array<{ x: number; y: number; width: number; height: number; action: () => void }>>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const questDefinitions: Record<string, { name: string; reward: { exp: number; money: number; reputation: number } }> = {
    first_painting: {
      name: 'First Painting',
      reward: { exp: 50, money: 100, reputation: 5 }
    },
    first_sculpture: {
      name: 'First Sculpture',
      reward: { exp: 75, money: 150, reputation: 8 }
    },
    first_digital_art: {
      name: 'First Digital Art',
      reward: { exp: 100, money: 200, reputation: 10 }
    }
  };

  type MenuType = 'status' | 'inventory' | 'quests' | 'market' | 'create_art' | 'rest' | 'study' | 'dialogue' | 'exit' | 'teach_artist' | 'talk_npc' | 'judge_gallerist' | 'battle' | 'buy_coffee' | 'buy_supplies' | 'influencer' | 'dealer' | 'historian' | 'curator' | 'shop';

  type ShopNPC = {
    name: string;
    description: string;
    reputationChange: number;
    sale: {
      id: string;
      name: string;
      type: 'art' | 'equipment' | 'consumable';
      description: string;
      price: number;
    };
  };

  const sellArt = (artKey: string, price: number, collectorName: string) => {
    setGameState(prev => {
      const newState = { ...prev };
      if (newState.player.inventory[artKey]) {
        newState.player.money += price;
        newState.player.reputation += 5;
        newState.player.inventory[artKey].quantity--;
        if (newState.player.inventory[artKey].quantity <= 0) {
          delete newState.player.inventory[artKey];
        }
        showMessage(
          "Artwork Sold!",
          `You sold your artwork to ${collectorName} for $${price}.`,
          [{ text: "Great!", action: closeDialogue }]
        );
      }
      return newState;
    });
  };

  const completeQuest = (questId: string) => {
    setGameState(prev => {
      const quest = questDefinitions[questId];
      if (!quest || prev.player.completedQuests.includes(questId)) return prev;
      let rewardText = `Quest Complete: ${quest.name}!`;
      const playerUpdate = { ...prev.player };
      playerUpdate.exp += quest.reward.exp || 0;
      if (quest.reward.exp) rewardText += `\n+${quest.reward.exp} EXP`;
      playerUpdate.money += quest.reward.money || 0;
      if (quest.reward.money) rewardText += `\n+$${quest.reward.money}`;
      playerUpdate.reputation += quest.reward.reputation || 0;
      if (quest.reward.reputation) rewardText += `\n+${quest.reward.reputation} Rep`;
      return {
        ...prev,
        player: playerUpdate,
        dialogue: {
          title: "Quest Complete!",
          text: rewardText,
          options: [{ text: "Excellent!", action: closeDialogue }]
        }
      };
    });
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

  const closeMenu = () => {
    onCanvasClick(-999, -999);
  };

  const showMessage = (title: string, text: string, options: { text: string; action: () => void }[] = [{ text: "Okay", action: closeDialogue }]) => {
    setGameState(prev => ({
      ...prev,
      dialogue: {
        title,
        text,
        options
      }
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

  const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Clear clickable elements for this frame
    uiClickableElementsRef.current = [];

    // Set canvas size
    canvas.width = 480;
    canvas.height = 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
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
        const isOnInteractiveObject = Object.entries(currentMap.objects).some(([key, obj]) => {
          const [objTileX, objTileY] = key.split(',').map(Number);
          const isInteractive = ['exit', 'npc', 'shop', 'create_art', 'rest', 'study', 'buy_coffee', 'buy_supplies', 'shop_fashion_boutique', 'network_wine_bar', 'enter_luxury_gallery', 'enter_warehouse', 'shop_thrift_store', 'talk_npc', 'teach_artist', 'battle_critic', 'judge_gallerist', 'enter_gallery_pace', 'enter_gallery_rising', 'check_events'].includes(obj.interaction);
          return objTileX === mouseTileX && objTileY === mouseTileY && isInteractive;
        });

        // Only proceed if either on an interactive object or a valid movement tile
        if (isOnInteractiveObject || currentMap.tiles[mouseTileY][mouseTileX] !== 1) {
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
          addClickable(btnX, btnY, btnWidth, buttonHeight, action);
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

        case 'inventory': {
          drawMenuTitle('Inventory');
          drawMenuText('Equipment:', '#A78BFA', '16px', 'left', true);
          drawMenuText(`Brush: ${gameState.player.equipment.brush}`, '#CBD5E1');
          drawMenuText(`Outfit: ${gameState.player.equipment.outfit}`, '#CBD5E1');
          currentY += 10;
          drawMenuText('Items:', '#A78BFA', '16px', 'left', true);
          Object.entries(gameState.player.inventory).forEach(([itemId, item]) => {
            drawMenuText(`${item.name} x${item.quantity}`, '#CBD5E1');
            if (item.type === 'consumable' && item.quantity > 0) {
              drawMenuButton(`Use (${item.name})`, () => {
                setGameState(prev => {
                  const newPlayer = { ...prev.player };
                  if (itemId === 'coffee') {
                    newPlayer.energy = Math.min(100, newPlayer.energy + 30);
                  }
                  newPlayer.inventory = { ...newPlayer.inventory, [itemId]: { ...item, quantity: item.quantity - 1 } };
                  return { ...prev, player: newPlayer };
                });
              });
            }
          });
          break;
        }

        case 'quests':
          drawMenuTitle('Quests');
          if (gameState.player.quests.length === 0) {
            drawMenuText('No active quests', '#CBD5E1', '16px', 'center');
          } else {
            gameState.player.quests.forEach(questId => {
              const quest = QUEST_DEFINITIONS[questId];
              if (!quest) return;

              const isCompleted = gameState.player.completedQuests.includes(questId);
              const textColor = isCompleted ? '#9CA3AF' : '#CBD5E1';
              const titleColor = isCompleted ? '#6B7280' : '#CBD5E1';

              drawMenuText(quest.name, titleColor, '16px', 'left', true);
              drawMenuText(quest.description, textColor, '14px', 'left', false);

              if (quest.reward.money) {
                drawMenuText(`Reward: $${quest.reward.money}`, textColor, '14px', 'left', false);
              }
              if (quest.reward.reputation) {
                drawMenuText(`Rep: ${quest.reward.reputation}`, textColor, '14px', 'left', false);
              }
              if (quest.reward.exp) {
                drawMenuText(`EXP: ${quest.reward.exp}`, textColor, '14px', 'left', false);
              }
              if (quest.reward.item) {
                Object.entries(quest.reward.item).forEach(([item, amount]) => {
                  drawMenuText(`Item: ${amount}x ${item}`, textColor, '14px', 'left', false);
                });
              }

              if (isCompleted) {
                drawMenuText('✓ Completed', '#22C55E', '14px', 'left', true);
              }
            });
          }
          break;

        case 'create_art':
          drawMenuTitle('Create Art');
          drawMenuText(`Energy: ${gameState.player.energy}/100 | Artistic: ${gameState.player.skills.artistic.toFixed(1)}`, '#CBD5E1', '15px', 'center');
          currentY += 30;

          drawMenuButton('Paint (25 EGY, Skill 1+)', () => {
            createArt('painting');
          }, '#3B82F6');

          drawMenuButton('Sculpt (40 EGY, Skill 3+)', () => {
            createArt('sculpture');
          }, '#22C55E', gameState.player.skills.artistic < 3);

          drawMenuButton('Digital Art (20 EGY, Skill 5+)', () => {
            createArt('digital');
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

        case 'talk_npc': {
          const npcData = gameState.menuData as NPCData;
          console.log(gameState);
          if (!npcData) return;

          drawMenuTitle(npcData.name);
          const player = gameState.player;
          const relationshipLevel = player.relationships?.[npcData.name] || 0;
          let dialogueText = "";
          let dialogueOptions = [];

          switch (npcData.type) {
            case 'npc_collector': {
              const totalArt = Object.values(player.inventory)
                .filter(item => item.type === 'art')
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
              
              if (totalArt === 0) {
                dialogueText = "No art to show? Come back when you have something to sell.";
                dialogueOptions = [{ text: "OK", action: closeDialogue }];
              } else if (player.reputation < 5 && relationshipLevel < 3) {
                dialogueText = "You need to make more of a name for yourself before I consider your work.";
                dialogueOptions = [{ text: "OK", action: closeDialogue }];
              } else {
                dialogueText = `Ah, ${player.title}. Do you have something exquisite for my collection?`;
                dialogueOptions = [
                  { text: "Sell Art", action: () => openSellArtMenu(npcData) },
                  { text: "Network", action: () => { network(npcData.name, 'collector'); closeDialogue(); } },
                  { text: "Goodbye", action: closeDialogue }
                ];
              }
              break;
            }
            case 'npc_influencer': {
              if (player.reputation < 10 && relationshipLevel < 2) {
                dialogueText = "I only work with established artists. Build your reputation first.";
                dialogueOptions = [{ text: "OK", action: closeDialogue }];
              } else {
                dialogueText = "Looking to boost your social media presence?";
                dialogueOptions = [
                  { 
                    text: 'Promote Artwork', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 20) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 20 energy to promote your artwork.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        const repGain = 15 + Math.floor(player.skills.networking * 2);
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 20,
                            reputation: player.reputation + repGain,
                            exp: player.exp + 30,
                            skills: {
                              ...player.skills,
                              networking: Math.min(10, player.skills.networking + 0.2)
                            }
                          },
                          dialogue: {
                            title: "Promotion Successful!",
                            text: `Your artwork is trending!\n+${repGain} Reputation\n+30 EXP\n+0.2 Networking`,
                            options: [{ text: "Great!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { 
                    text: 'Collaborate', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 40) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 40 energy for a collaboration.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        const repGain = 30 + Math.floor(player.skills.networking * 3);
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 40,
                            reputation: player.reputation + repGain,
                            exp: player.exp + 50,
                            skills: {
                              ...player.skills,
                              networking: Math.min(10, player.skills.networking + 0.4)
                            }
                          },
                          dialogue: {
                            title: "Collaboration Successful!",
                            text: `Your collaboration went viral!\n+${repGain} Reputation\n+50 EXP\n+0.4 Networking`,
                            options: [{ text: "Amazing!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { text: 'Goodbye', action: closeDialogue }
                ];
              }
              break;
            }
            case 'npc_dealer': {
              if (player.reputation < 15 && relationshipLevel < 3) {
                dialogueText = "I only deal with artists who have proven themselves in the market.";
                dialogueOptions = [{ text: "OK", action: closeDialogue }];
              } else {
                dialogueText = "Interested in the art market?";
                dialogueOptions = [
                  { 
                    text: 'Learn Market Trends', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 15) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 15 energy to learn market trends.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 15,
                            skills: {
                              ...player.skills,
                              business: Math.min(10, player.skills.business + 0.5)
                            }
                          },
                          dialogue: {
                            title: "Market Knowledge Gained!",
                            text: "You've learned valuable insights about the art market.\n+0.5 Business Skill",
                            options: [{ text: "Thanks!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { 
                    text: 'Commission Work', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 50) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 50 energy to take on a commission.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        const quality = Math.min(10, Math.max(1, Math.random() * 5 + player.skills.artistic));
                        const price = Math.floor(500 * (quality / 5));
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 50,
                            money: player.money + price,
                            reputation: player.reputation + 20,
                            skills: {
                              ...player.skills,
                              artistic: Math.min(10, player.skills.artistic + 0.3)
                            }
                          },
                          dialogue: {
                            title: "Commission Complete!",
                            text: `You created a quality ${quality.toFixed(1)}/10 piece.\n+$${price}\n+20 Reputation\n+0.3 Artistic Skill`,
                            options: [{ text: "Excellent!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { text: 'Goodbye', action: closeDialogue }
                ];
              }
              break;
            }
            case 'npc_historian': {
              if (player.skills.artistic < 2 && relationshipLevel < 2) {
                dialogueText = "Your understanding of art history is too basic. Come back when you've developed your craft.";
                dialogueOptions = [{ text: "OK", action: closeDialogue }];
              } else {
                dialogueText = "Fascinated by art history?";
                dialogueOptions = [
                  { 
                    text: 'Art History Lesson', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 20) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 20 energy for an art history lesson.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 20,
                            exp: player.exp + 20,
                            skills: {
                              ...player.skills,
                              curating: Math.min(10, player.skills.curating + 0.5)
                            }
                          },
                          dialogue: {
                            title: "Lesson Learned!",
                            text: "You've gained valuable insights into art history.\n+20 EXP\n+0.5 Curating Skill",
                            options: [{ text: "Fascinating!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { 
                    text: 'Research Project', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 40) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 40 energy for a research project.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 40,
                            exp: player.exp + 40,
                            skills: {
                              ...player.skills,
                              curating: Math.min(10, player.skills.curating + 1)
                            }
                          },
                          dialogue: {
                            title: "Research Complete!",
                            text: "Your research has deepened your understanding of art.\n+40 EXP\n+1.0 Curating Skill",
                            options: [{ text: "Enlightening!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { text: 'Goodbye', action: closeDialogue }
                ];
              }
              break;
            }
            case 'npc_curator': {
              if (player.reputation < 20 && relationshipLevel < 3) {
                dialogueText = "I only work with artists who have established themselves in the art world.";
                dialogueOptions = [{ text: "OK", action: closeDialogue }];
              } else {
                dialogueText = "Looking to showcase your work?";
                dialogueOptions = [
                  { 
                    text: 'Exhibition Proposal', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 30) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 30 energy to prepare an exhibition proposal.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 30,
                            exp: player.exp + 25,
                            skills: {
                              ...player.skills,
                              curating: Math.min(10, player.skills.curating + 0.5)
                            }
                          },
                          dialogue: {
                            title: "Proposal Submitted!",
                            text: "Your exhibition proposal has been received.\n+25 EXP\n+0.5 Curating Skill",
                            options: [{ text: "Great!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { 
                    text: 'Group Show', 
                    action: () => {
                      setGameState(prev => {
                        const player = prev.player;
                        if (player.energy < 60) {
                          return {
                            ...prev,
                            dialogue: {
                              title: "Too Tired",
                              text: "You need 60 energy to participate in a group show.",
                              options: [{ text: "OK", action: closeDialogue }]
                            }
                          };
                        }
                        const repGain = 20 + Math.floor(player.skills.curating * 2);
                        return {
                          ...prev,
                          player: {
                            ...player,
                            energy: player.energy - 60,
                            reputation: player.reputation + repGain,
                            skills: {
                              ...player.skills,
                              curating: Math.min(10, player.skills.curating + 0.5),
                              networking: Math.min(10, player.skills.networking + 0.5)
                            }
                          },
                          dialogue: {
                            title: "Group Show Success!",
                            text: `Your work was well received!\n+${repGain} Reputation\n+0.5 Curating Skill\n+0.5 Networking Skill`,
                            options: [{ text: "Wonderful!", action: closeDialogue }]
                          }
                        };
                      });
                    }
                  },
                  { text: 'Goodbye', action: closeDialogue }
                ];
              }
              break;
            }
            case 'npc_critic': {
              if (player.skills.artistic < 2 && relationshipLevel < 2) {
                dialogueText = "A bit derivative, don't you think? Develop your craft.";
                dialogueOptions = [{ text: "OK", action: closeDialogue }];
              } else if (player.reputation < 10 && relationshipLevel < 4) {
                dialogueText = "I've heard whispers about you. Are you prepared to defend your work?";
                dialogueOptions = [
                  { text: "Discuss (Battle!)", action: () => startCritiqueBattle({ name: npcData.name, type: npcData.type }) },
                  { text: "Not now.", action: closeDialogue }
                ];
              } else {
                dialogueText = `Ah, ${player.title}, always a pleasure. Shall we delve into the nuances of your latest endeavors?`;
                dialogueOptions = [
                  { text: "Debate! (Battle)", action: () => startCritiqueBattle({ name: npcData.name, type: npcData.type }) },
                  { text: "Later.", action: closeDialogue }
                ];
              }
              break;
            }
            default: {
              dialogueText = `"${npcData.name} looks at you. ${relationshipLevel <= 1 ? 'Sizing up.' : relationshipLevel <= 5 ? 'Polite nod.' : `Greets warmly, '${player.title}!'`}"`;
              dialogueOptions = [{ text: "Goodbye.", action: closeDialogue }];
            }
          }

          drawMenuText(dialogueText, '#CBD5E1', '16px', 'left');
          currentY += 20;
          dialogueOptions.forEach(option => {
            drawMenuButton(option.text, option.action);
          });
          break;
        }
        case 'judge_gallerist':
          drawMenuTitle('Gallerist Judgement');
          const repChange = gameState.menuData?.reputationChange || 0;
          const sale = gameState.menuData?.sale;
          drawMenuText(repChange > 0 ? `The gallerist is impressed! Reputation +${repChange}` : `The gallerist is unimpressed. Reputation ${repChange}`, '#CBD5E1', '16px', 'center');
          if (sale) {
            drawMenuText(`You made a sale! +$${sale.amount}`, '#4ADE80', '16px', 'center');
          }
          drawMenuButton('Continue', () => {
            setGameState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                reputation: prev.player.reputation + repChange,
                money: sale ? prev.player.money + sale.amount : prev.player.money
              },
              menu: null
            }));
          });
          break;
        case 'battle':
          drawMenuTitle('Critic Battle');
          const battle = gameState.battle;
          if (!battle) return;

          drawMenuText(`Opponent: ${battle.opponent.name} (${battle.opponent.hp}/${battle.opponent.maxHp} HP)`, '#F87171', '16px', 'center');
          drawMenuText(`You: ${battle.player.hp}/${battle.player.maxHp} HP`, '#4ADE80', '16px', 'center');

          battle.log.slice(-5).forEach((entry: string) => drawMenuText(entry, '#CBD5E1', '14px', 'left'));

          if (battle.turn === 'player') {
            BATTLE_ACTIONS.forEach(action => {
              drawMenuButton(action.name, () => {
                const hit = Math.random() < action.accuracy;
                const newLog = [...battle.log];

                if (hit) {
                  battle.opponent.hp -= action.power;
                  newLog.push(`You used ${action.name}! It hit for ${action.power} damage.`);
                } else {
                  newLog.push(`You used ${action.name}, but missed!`);
                }

                if (battle.opponent.hp <= 0) {
                  newLog.push('You won the battle! Reputation +10');
                  setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, reputation: prev.player.reputation + 10 },
                    battle: null,
                    menu: null
                  }));
                  return;
                }

                setGameState(prev => ({
                  ...prev,
                  battle: { ...battle, log: newLog, turn: 'opponent' }
                }));

                setTimeout(() => {
                  const oppHit = Math.random() < 0.8;
                  const newLog2 = [...newLog];

                  if (oppHit) {
                    battle.player.hp -= 15;
                    newLog2.push('Critic attacks! You lose 15 HP.');
                  } else {
                    newLog2.push('Critic attacks but misses!');
                  }

                  if (battle.player.hp <= 0) {
                    newLog2.push('You lost the battle! Reputation -5');
                    setGameState(prev => ({
                      ...prev,
                      player: { ...prev.player, reputation: Math.max(0, prev.player.reputation - 5) },
                      battle: null,
                      menu: null
                    }));
                    return;
                  }

                  setGameState(prev => ({
                    ...prev,
                    battle: { ...battle, log: newLog2, turn: 'player' }
                  }));
                }, 1000);
              });
            });
          } else {
            drawMenuText('Opponent is thinking...', '#CBD5E1', '16px', 'center');
          }
          break;
        case 'buy_coffee':
          drawMenuTitle('Coffee Shop');
          drawMenuText('Buy a coffee for $10? Restores 30 energy.', '#CBD5E1', '16px', 'center');
          drawMenuButton('Buy Coffee ($10)', () => {
            if (gameState.player.money >= 10) {
              setGameState(prev => {
                const inv = { ...prev.player.inventory };
                if (inv.coffee) {
                  inv.coffee = {
                    ...inv.coffee,
                    quantity: inv.coffee.quantity + 1
                  };
                } else {
                  inv.coffee = { id: 'coffee', name: 'Coffee', type: 'consumable', quantity: 1, description: 'Restores 30 energy.' };
                }
                return {
                  ...prev,
                  player: {
                    ...prev.player,
                    money: prev.player.money - 10,
                    inventory: inv
                  },
                  dialogue: {
                    title: "Coffee!",
                    text: "You bought an artisanal coffee.",
                    options: [{
                      text: "Nice!", action: () => {
                        setGameState(p => ({
                          ...p,
                          dialogue: null
                        }));
                      }
                    }]
                  }
                };
              });
            } else {
              showMessage('Not enough money', 'You need $10 for coffee.');
            }
          });
          break;
        case 'buy_supplies':
          drawMenuTitle('Art Supplies');
          drawMenuText('Buy art supplies for $25? Needed for creating art.', '#CBD5E1', '16px', 'center');
          drawMenuButton('Buy Supplies ($25)', () => {
            if (gameState.player.money >= 25) {
              setGameState(prev => {
                const inv = { ...prev.player.inventory };
                if (inv.supplies) {
                  inv.supplies = {
                    ...inv.supplies,
                    quantity: inv.supplies.quantity + 1
                  };
                } else {
                  inv.supplies = { id: 'supplies', name: 'Art Supplies', type: 'consumable', quantity: 1, description: 'Needed for creating art.' };
                }
                return {
                  ...prev,
                  player: {
                    ...prev.player,
                    money: prev.player.money - 25,
                    inventory: inv
                  },
                  menu: null
                };
              });
            } else {
              showMessage('Not enough money', 'You need $25 for supplies.');
            }
          });
          break;
        case 'shop': {
          const npc = currentMap.objects.find(obj => obj.data.interaction === 'shop')?.data as unknown as ShopNPC;
          if (npc) {
            drawMenuTitle(npc.name);
            drawMenuText(npc.description, '#CBD5E1');
            currentY += 20;
            drawMenuButton(`Buy ${npc.sale.name} ($${npc.sale.price})`, () => {
              setGameState(prev => {
                if (prev.player.money < npc.sale.price) {
                  return {
                    ...prev,
                    dialogue: {
                      title: "Not Enough Money",
                      text: `You need $${npc.sale.price} to buy this item.`,
                      options: [{ text: "OK", action: closeDialogue }]
                    }
                  };
                }
                const newPlayer = { ...prev.player };
                newPlayer.money -= npc.sale.price;
                newPlayer.reputation += npc.reputationChange;
                newPlayer.inventory = {
                  ...newPlayer.inventory,
                  [npc.sale.id]: {
                    ...newPlayer.inventory[npc.sale.id],
                    id: npc.sale.id,
                    name: npc.sale.name,
                    type: npc.sale.type,
                    description: npc.sale.description,
                    quantity: (newPlayer.inventory[npc.sale.id]?.quantity || 0) + 1
                  }
                };
                return {
                  ...prev,
                  player: newPlayer,
                  dialogue: {
                    title: "Purchase Successful",
                    text: `You bought ${npc.sale.name} for $${npc.sale.price}.`,
                    options: [{ text: "OK", action: closeDialogue }]
                  }
                };
              });
            });
          }
          break;
        }
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
        event.stopPropagation(); // Stop event propagation
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
    const clickedObject = Object.entries(currentMap.objects).find(([key, obj]) => {
      const [objTileX, objTileY] = key.split(',').map(Number);
      return objTileX === tileX && objTileY === tileY &&
        ['exit', 'npc', 'shop', 'create_art', 'rest', 'study', 'buy_coffee', 'buy_supplies', 'shop_fashion_boutique', 'network_wine_bar', 'enter_luxury_gallery', 'enter_warehouse', 'shop_thrift_store', 'talk_npc', 'teach_artist', 'battle_critic', 'judge_gallerist', 'enter_gallery_pace', 'enter_gallery_rising', 'check_events'].includes(obj.interaction);
    });

    if (clickedObject) {
      const [key, obj] = clickedObject;
      const [objX, objY] = key.split(',').map(Number);
      const objectData: ObjectData = {
        sprite: obj.type,
        interaction: obj.interaction,
        name: obj.name,
        type: obj.type,
        x: objX * TILE_SIZE,
        y: objY * TILE_SIZE
      };

      // For doors (exits), set up the pending interaction and move to the object
      if (obj.interaction === 'exit') {
        setGameState(prev => ({
          ...prev,
          pendingInteraction: {
            x: objX * TILE_SIZE,
            y: objY * TILE_SIZE,
            type: 'exit',
            data: objectData
          }
        }));
        onCanvasClick(worldX, worldY);
      } else {
        // For other interactive objects, trigger their menu
        onCanvasClick(-1001, -1001, obj.interaction as MenuType);
      }
    } else if (tileX >= 0 && tileX < currentMap.width &&
      tileY >= 0 && tileY < currentMap.height &&
      currentMap.tiles[tileY][tileX] !== 1) {
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

  const openSellArtMenu = (collectorData: NPCData) => {
    setGameState(prev => {
      const player = prev.player;
      const artItems = Object.entries(player.inventory)
        .filter(([_, item]) => item.type === 'art')
        .map(([key, item]) => ({
          text: `Sell ${item.name} for $${item.value || 0}`,
          action: () => sellArt(key, item.value || 0, collectorData.name)
        }));

      if (artItems.length > 0) {
        return {
          ...prev,
          dialogue: {
            title: "Sell Artwork",
            text: "What would you like to sell?",
            options: artItems
          }
        };
      } else {
        return {
          ...prev,
          dialogue: {
            title: "No Artwork",
            text: "You don't have any artwork to sell.",
            options: [{ text: "OK", action: closeDialogue }]
          }
        };
      }
    });
  };

  const network = (npcName: string, npcType: string) => {
    setGameState(prev => {
      const player = prev.player;
      if (player.energy < 10) {
        showMessage(
          "Too Tired",
          "Need 10 energy.",
          [{ text: "OK", action: closeDialogue }]
        );
        return prev;
      }

      let repGain = 1 + Math.floor(player.skills.networking * 0.5);
      let expGain = 10;
      if (npcType === 'influencer') repGain *= 2;
      if (npcType === 'dealer') repGain += player.skills.business;

      return {
        ...prev,
        player: {
          ...player,
          energy: player.energy - 10,
          reputation: player.reputation + repGain,
          exp: player.exp + expGain,
          skills: {
            ...player.skills,
            networking: Math.min(10, player.skills.networking + 0.1)
          }
        },
        dialogue: {
          title: "Networking Success!",
          text: `Chatted with ${npcName}.\n+${repGain} Rep, +${expGain} EXP.`,
          options: [{ text: "Cool!", action: closeDialogue }]
        }
      };
    });
  };

  const startCritiqueBattle = (criticData: NPCData) => {
    setGameState(prev => ({
      ...prev,
      battle: {
        type: 'critic',
        player: {
          hp: 100,
          maxHp: 100,
          energy: prev.player.energy
        },
        opponent: {
          name: criticData.name,
          hp: 100,
          maxHp: 100,
          type: 'critic'
        },
        turn: 1,
        log: [`${criticData.name} challenges you to a critique battle!`]
      }
    }));
  };

  const handleNPCTalk = (npcData: NPCData) => {
    setGameState(prev => {
      const player = prev.player;
      const npcName = npcData.name;
      const newRelationships = { ...player.relationships, [npcName]: (player.relationships[npcName] || 0) + 1 };
      const relationshipLevel = newRelationships[npcName];
      let dialogueText = `"${npcName} looks at you. `;
      let dialogueOptions = [{ text: "Goodbye.", action: closeDialogue }];

      if (relationshipLevel <= 1) dialogueText += `Sizing up."`;
      else if (relationshipLevel <= 5) dialogueText += `Polite nod."`;
      else dialogueText += `Greets warmly, '${player.title}!'."`;

      // If NPC has specific options, use those instead of default dialogue
      if (npcData.options) {
        dialogueText = npcData.dialogue || `"${npcName} looks at you expectantly."`;
        dialogueOptions = npcData.options.map(option => ({
          text: option.text,
          action: () => {
            if (player.money < option.cost) {
              showMessage(
                "Not Enough Money",
                `You need $${option.cost} for this option.`,
                [{ text: "OK", action: closeDialogue }]
              );
              return;
            }

            setGameState(prev => {
              const newPlayer = { ...prev.player };
              newPlayer.money -= option.cost;

              if (option.reward.money) newPlayer.money += option.reward.money;
              if (option.reward.reputation) newPlayer.reputation += option.reward.reputation;
              if (option.reward.exp) newPlayer.exp += option.reward.exp;

              // Handle skill rewards
              if (option.reward.artistic) newPlayer.skills.artistic = Math.min(10, newPlayer.skills.artistic + option.reward.artistic);
              if (option.reward.networking) newPlayer.skills.networking = Math.min(10, newPlayer.skills.networking + option.reward.networking);
              if (option.reward.business) newPlayer.skills.business = Math.min(10, newPlayer.skills.business + option.reward.business);
              if (option.reward.curating) newPlayer.skills.curating = Math.min(10, newPlayer.skills.curating + option.reward.curating);

              let rewardText = "Success!\n";
              if (option.reward.money) rewardText += `+$${option.reward.money}\n`;
              if (option.reward.reputation) rewardText += `+${option.reward.reputation} Rep\n`;
              if (option.reward.exp) rewardText += `+${option.reward.exp} EXP\n`;
              if (option.reward.artistic) rewardText += `+${option.reward.artistic} Artistic\n`;
              if (option.reward.networking) rewardText += `+${option.reward.networking} Networking\n`;
              if (option.reward.business) rewardText += `+${option.reward.business} Business\n`;
              if (option.reward.curating) rewardText += `+${option.reward.curating} Curating\n`;

              return {
                ...prev,
                player: newPlayer,
                dialogue: {
                  title: "Success!",
                  text: rewardText,
                  options: [{ text: "Great!", action: closeDialogue }]
                }
              };
            });
          }
        }));
        dialogueOptions.push({ text: "Goodbye", action: closeDialogue });
      } else {
        // Handle specific NPC types without options
        switch (npcData.type) {
          case 'npc_collector':
            const totalArt = Object.values(player.inventory)
              .filter(item => item.type === 'art')
              .reduce((sum, item) => sum + (item.quantity || 0), 0);

            if (totalArt === 0) {
              dialogueText = `"No art to show? Come back when you have something to sell."`;
            } else if (player.reputation < 5 && relationshipLevel < 3) {
              dialogueText = `"You need to make more of a name for yourself before I consider your work."`;
            } else {
              dialogueText = `"Ah, ${player.title}. Do you have something exquisite for my collection?"`;
              dialogueOptions = [
                { text: "Sell Art", action: () => openSellArtMenu(npcData) },
                { text: "Network", action: () => { network(npcName, 'collector'); closeDialogue(); } },
                { text: "Bye", action: closeDialogue }
              ];
            }
            break;
          case 'npc_critic':
            if (player.skills.artistic < 2 && relationshipLevel < 2) {
              dialogueText = "A bit derivative, don't you think? Develop your craft.";
              dialogueOptions = [{ text: "OK", action: closeDialogue }];
            } else if (player.reputation < 10 && relationshipLevel < 4) {
              dialogueText = "I've heard whispers about you. Are you prepared to defend your work?";
              dialogueOptions = [
                { text: "Discuss (Battle!)", action: () => startCritiqueBattle(npcData) },
                { text: "Not now.", action: closeDialogue }
              ];
            } else {
              dialogueText = `Ah, ${player.title}, always a pleasure. Shall we delve into the nuances of your latest endeavors?`;
              dialogueOptions = [
                { text: "Debate! (Battle)", action: () => startCritiqueBattle(npcData) },
                { text: "Later.", action: closeDialogue }
              ];
            }
            break;
        }
      }

      return {
        ...prev,
        player: { ...prev.player, relationships: newRelationships },
        dialogue: { title: npcName, text: dialogueText, options: dialogueOptions }
      };
    });
  };

  const handleInteraction = (obj: ObjectData) => {
    const currentMapData = MAPS[gameState.currentMap];
    if (!currentMapData) return;

    // Handle NPC interactions
    if (obj.type.startsWith('npc_')) {
      const npcType = obj.type;
      const player = gameState.player;
      const relationshipLevel = player.relationships?.[obj.name] || 0;
      let dialogueText = "";
      let dialogueOptions = [];

      switch (npcType) {
        case 'npc_collector': {
          const totalArt = Object.values(player.inventory)
            .filter(item => item.type === 'art')
            .reduce((sum, item) => sum + (item.quantity || 0), 0);
          
          if (totalArt === 0) {
            dialogueText = "No art to show? Come back when you have something to sell.";
            dialogueOptions = [{ text: "OK", action: closeDialogue }];
          } else if (player.reputation < 5 && relationshipLevel < 3) {
            dialogueText = "You need to make more of a name for yourself before I consider your work.";
            dialogueOptions = [{ text: "OK", action: closeDialogue }];
          } else {
            dialogueText = `Ah, ${player.title}. Do you have something exquisite for my collection?`;
            dialogueOptions = [
              { text: "Sell Art", action: () => openSellArtMenu({ name: obj.name, type: npcType }) },
              { text: "Network", action: () => { network(obj.name, 'collector'); closeDialogue(); } },
              { text: "Goodbye", action: closeDialogue }
            ];
          }
          break;
        }
        case 'npc_influencer': {
          if (player.reputation < 10 && relationshipLevel < 2) {
            dialogueText = "I only work with established artists. Build your reputation first.";
            dialogueOptions = [{ text: "OK", action: closeDialogue }];
          } else {
            dialogueText = "Looking to boost your social media presence?";
            dialogueOptions = [
              { 
                text: 'Promote Artwork', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 20) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 20 energy to promote your artwork.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    const repGain = 15 + Math.floor(player.skills.networking * 2);
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 20,
                        reputation: player.reputation + repGain,
                        exp: player.exp + 30,
                        skills: {
                          ...player.skills,
                          networking: Math.min(10, player.skills.networking + 0.2)
                        }
                      },
                      dialogue: {
                        title: "Promotion Successful!",
                        text: `Your artwork is trending!\n+${repGain} Reputation\n+30 EXP\n+0.2 Networking`,
                        options: [{ text: "Great!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { 
                text: 'Collaborate', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 40) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 40 energy for a collaboration.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    const repGain = 30 + Math.floor(player.skills.networking * 3);
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 40,
                        reputation: player.reputation + repGain,
                        exp: player.exp + 50,
                        skills: {
                          ...player.skills,
                          networking: Math.min(10, player.skills.networking + 0.4)
                        }
                      },
                      dialogue: {
                        title: "Collaboration Successful!",
                        text: `Your collaboration went viral!\n+${repGain} Reputation\n+50 EXP\n+0.4 Networking`,
                        options: [{ text: "Amazing!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { text: 'Goodbye', action: closeDialogue }
            ];
          }
          break;
        }
        case 'npc_dealer': {
          if (player.reputation < 15 && relationshipLevel < 3) {
            dialogueText = "I only deal with artists who have proven themselves in the market.";
            dialogueOptions = [{ text: "OK", action: closeDialogue }];
          } else {
            dialogueText = "Interested in the art market?";
            dialogueOptions = [
              { 
                text: 'Learn Market Trends', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 15) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 15 energy to learn market trends.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 15,
                        skills: {
                          ...player.skills,
                          business: Math.min(10, player.skills.business + 0.5)
                        }
                      },
                      dialogue: {
                        title: "Market Knowledge Gained!",
                        text: "You've learned valuable insights about the art market.\n+0.5 Business Skill",
                        options: [{ text: "Thanks!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { 
                text: 'Commission Work', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 50) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 50 energy to take on a commission.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    const quality = Math.min(10, Math.max(1, Math.random() * 5 + player.skills.artistic));
                    const price = Math.floor(500 * (quality / 5));
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 50,
                        money: player.money + price,
                        reputation: player.reputation + 20,
                        skills: {
                          ...player.skills,
                          artistic: Math.min(10, player.skills.artistic + 0.3)
                        }
                      },
                      dialogue: {
                        title: "Commission Complete!",
                        text: `You created a quality ${quality.toFixed(1)}/10 piece.\n+$${price}\n+20 Reputation\n+0.3 Artistic Skill`,
                        options: [{ text: "Excellent!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { text: 'Goodbye', action: closeDialogue }
            ];
          }
          break;
        }
        case 'npc_historian': {
          if (player.skills.artistic < 2 && relationshipLevel < 2) {
            dialogueText = "Your understanding of art history is too basic. Come back when you've developed your craft.";
            dialogueOptions = [{ text: "OK", action: closeDialogue }];
          } else {
            dialogueText = "Fascinated by art history?";
            dialogueOptions = [
              { 
                text: 'Art History Lesson', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 20) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 20 energy for an art history lesson.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 20,
                        exp: player.exp + 20,
                        skills: {
                          ...player.skills,
                          curating: Math.min(10, player.skills.curating + 0.5)
                        }
                      },
                      dialogue: {
                        title: "Lesson Learned!",
                        text: "You've gained valuable insights into art history.\n+20 EXP\n+0.5 Curating Skill",
                        options: [{ text: "Fascinating!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { 
                text: 'Research Project', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 40) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 40 energy for a research project.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 40,
                        exp: player.exp + 40,
                        skills: {
                          ...player.skills,
                          curating: Math.min(10, player.skills.curating + 1)
                        }
                      },
                      dialogue: {
                        title: "Research Complete!",
                        text: "Your research has deepened your understanding of art.\n+40 EXP\n+1.0 Curating Skill",
                        options: [{ text: "Enlightening!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { text: 'Goodbye', action: closeDialogue }
            ];
          }
          break;
        }
        case 'npc_curator': {
          if (player.reputation < 20 && relationshipLevel < 3) {
            dialogueText = "I only work with artists who have established themselves in the art world.";
            dialogueOptions = [{ text: "OK", action: closeDialogue }];
          } else {
            dialogueText = "Looking to showcase your work?";
            dialogueOptions = [
              { 
                text: 'Exhibition Proposal', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 30) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 30 energy to prepare an exhibition proposal.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 30,
                        exp: player.exp + 25,
                        skills: {
                          ...player.skills,
                          curating: Math.min(10, player.skills.curating + 0.5)
                        }
                      },
                      dialogue: {
                        title: "Proposal Submitted!",
                        text: "Your exhibition proposal has been received.\n+25 EXP\n+0.5 Curating Skill",
                        options: [{ text: "Great!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { 
                text: 'Group Show', 
                action: () => {
                  setGameState(prev => {
                    const player = prev.player;
                    if (player.energy < 60) {
                      return {
                        ...prev,
                        dialogue: {
                          title: "Too Tired",
                          text: "You need 60 energy to participate in a group show.",
                          options: [{ text: "OK", action: closeDialogue }]
                        }
                      };
                    }
                    const repGain = 20 + Math.floor(player.skills.curating * 2);
                    return {
                      ...prev,
                      player: {
                        ...player,
                        energy: player.energy - 60,
                        reputation: player.reputation + repGain,
                        skills: {
                          ...player.skills,
                          curating: Math.min(10, player.skills.curating + 0.5),
                          networking: Math.min(10, player.skills.networking + 0.5)
                        }
                      },
                      dialogue: {
                        title: "Group Show Success!",
                        text: `Your work was well received!\n+${repGain} Reputation\n+0.5 Curating Skill\n+0.5 Networking Skill`,
                        options: [{ text: "Wonderful!", action: closeDialogue }]
                      }
                    };
                  });
                }
              },
              { text: 'Goodbye', action: closeDialogue }
            ];
          }
          break;
        }
        case 'npc_critic': {
          if (player.skills.artistic < 2 && relationshipLevel < 2) {
            dialogueText = "A bit derivative, don't you think? Develop your craft.";
            dialogueOptions = [{ text: "OK", action: closeDialogue }];
          } else if (player.reputation < 10 && relationshipLevel < 4) {
            dialogueText = "I've heard whispers about you. Are you prepared to defend your work?";
            dialogueOptions = [
              { text: "Discuss (Battle!)", action: () => startCritiqueBattle(npcData) },
              { text: "Not now.", action: closeDialogue }
            ];
          } else {
            dialogueText = `Ah, ${player.title}, always a pleasure. Shall we delve into the nuances of your latest endeavors?`;
            dialogueOptions = [
              { text: "Debate! (Battle)", action: () => startCritiqueBattle(npcData) },
              { text: "Later.", action: closeDialogue }
            ];
          }
          break;
        }
        default: {
          dialogueText = `"${obj.name} looks at you. ${relationshipLevel <= 1 ? 'Sizing up.' : relationshipLevel <= 5 ? 'Polite nod.' : `Greets warmly, '${player.title}!'`}"`;
          dialogueOptions = [{ text: "Goodbye.", action: closeDialogue }];
        }
      }

      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          relationships: {
            ...prev.player.relationships,
            [obj.name]: (prev.player.relationships[obj.name] || 0) + 1
          }
        },
        dialogue: {
          title: obj.name,
          text: dialogueText,
          options: dialogueOptions
        }
      }));
      return;
    }

    // Handle other interactions
    switch (obj.interaction) {
      case 'exit': {
        const exitKey = `${Math.floor(obj.x / 32)},${Math.floor(obj.y / 32)}`;
        const exitData = currentMapData.exits?.[exitKey];
        if (exitData) {
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              x: exitData.x * 32,
              y: exitData.y * 32,
              path: []
            },
            currentMap: exitData.to
          }));
        }
        break;
      }
      case 'create_art':
        setGameState(prev => ({
          ...prev,
          menu: 'create_art',
          menuData: {
            energy: prev.player.energy,
            skills: prev.player.skills
          }
        }));
        break;
      case 'rest':
        setGameState(prev => ({
          ...prev,
          menu: 'rest',
          menuData: {
            energy: prev.player.energy,
            cost: 10
          }
        }));
        break;
      case 'study':
        setGameState(prev => ({
          ...prev,
          menu: 'study',
          menuData: {
            energy: prev.player.energy,
            skills: prev.player.skills
          }
        }));
        break;
      case 'teach_artist':
        setGameState(prev => ({
          ...prev,
          menu: 'teach_artist',
          menuData: {
            cost: 50,
            skill: 'artistic',
            amount: 1
          }
        }));
        break;
      case 'judge_gallerist':
        setGameState(prev => ({
          ...prev,
          menu: 'judge_gallerist',
          menuData: {
            reputationChange: Math.random() > 0.5 ? 5 : -3,
            sale: Math.random() > 0.7 ? { amount: 200 } : null
          }
        }));
        break;
      case 'buy_coffee':
        setGameState(prev => ({
          ...prev,
          menu: 'buy_coffee',
          menuData: {
            item: { id: 'coffee', name: 'Coffee', type: 'consumable', value: 1, description: 'Restores 30 energy.' },
            price: 10,
            energyRestore: 30
          }
        }));
        break;
      case 'buy_supplies':
        setGameState(prev => ({
          ...prev,
          menu: 'buy_supplies',
          menuData: {
            item: { id: 'supplies', name: 'Art Supplies', type: 'consumable', value: 1, description: 'Needed for creating art.' },
            price: 25
          }
        }));
        break;
      case 'talk_npc':
        handleNPCTalk(npcData);
        break;
    }
  };

  const handleNPCOption = (npcName: string, cost: number, rewards: {
    reputation?: number;
    exp?: number;
    money?: number;
    artistic?: number;
    networking?: number;
    business?: number;
    curating?: number;
  }) => {
    setGameState(prev => {
      const player = prev.player;
      if (player.money < cost) {
        return {
          ...prev,
          dialogue: {
            title: "Not Enough Money",
            text: `You need $${cost} for this option.`,
            options: [{ text: "OK", action: closeDialogue }]
          }
        };
      }

      const newPlayer = { ...player };
      newPlayer.money -= cost;
      
      if (rewards.money) newPlayer.money += rewards.money;
      if (rewards.reputation) newPlayer.reputation += rewards.reputation;
      if (rewards.exp) newPlayer.exp += rewards.exp;
      
      // Handle skill rewards
      if (rewards.artistic) newPlayer.skills.artistic = Math.min(10, newPlayer.skills.artistic + rewards.artistic);
      if (rewards.networking) newPlayer.skills.networking = Math.min(10, newPlayer.skills.networking + rewards.networking);
      if (rewards.business) newPlayer.skills.business = Math.min(10, newPlayer.skills.business + rewards.business);
      if (rewards.curating) newPlayer.skills.curating = Math.min(10, newPlayer.skills.curating + rewards.curating);

      let rewardText = "Success!\n";
      if (rewards.money) rewardText += `+$${rewards.money}\n`;
      if (rewards.reputation) rewardText += `+${rewards.reputation} Rep\n`;
      if (rewards.exp) rewardText += `+${rewards.exp} EXP\n`;
      if (rewards.artistic) rewardText += `+${rewards.artistic} Artistic\n`;
      if (rewards.networking) rewardText += `+${rewards.networking} Networking\n`;
      if (rewards.business) rewardText += `+${rewards.business} Business\n`;
      if (rewards.curating) rewardText += `+${rewards.curating} Curating\n`;

      return {
        ...prev,
        player: newPlayer,
        dialogue: {
          title: "Success!",
          text: rewardText,
          options: [{ text: "Great!", action: closeDialogue }]
        }
      };
    });
  };

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