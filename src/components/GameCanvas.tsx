import { useRef, useEffect, useState } from 'react';
import type { GameState, GameMap, MenuType, NPCData, ObjectData } from '../types/game';
import { INTERACTION_TYPES, SPRITES, TILE_COLORS } from '../constants/game';
import { wrapAndDrawText, getWrappedLines } from '../utils/gameLogic';
import { QUEST_DEFINITIONS } from '../quests/questDefinitions';
import { MAPS } from '../constants/maps';
import { getMarketSummary, calculateArtworkValue, generateMarketAnalysis } from '../utils/marketLogic';
import { InventoryMenu } from './GameMenus/InventoryMenu';
import { QuestMenu } from './GameMenus/QuestMenu';
import { CreateArtMenu } from './GameMenus/CreateArtMenu';
import { RestMenu } from './GameMenus/RestMenu';
import { StudyMenu } from './GameMenus/StudyMenu';
import { BattleMenu } from './GameMenus/BattleMenu';
import { ArtSuppliesMenu } from './GameMenus/ArtSuppliesMenu';
import { CoffeeShopMenu } from './GameMenus/CoffeeShopMenu';
import { NPCDialogueMenu } from './GameMenus/NpcDialogueMenu';
import { getNPCDialogue } from '../logic/npcDialogueLogic';
import { drawRoundedRect } from '../logic/canvasUIHelpers';

const TILE_SIZE = 32;

interface GameCanvasProps {
  gameState: GameState;
  currentMap: GameMap;
  onCanvasClick: (x: number, y: number, menu?: MenuType) => void;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  createArt: (artType: string) => void;
  closeDialogue: () => void;
  performBattleAction: (actionId: string) => void; // Added for battle logic
}

// Helper types
interface DialogueOption {
  text: string;
  action: () => void;
}

export const GameCanvas = ({
  gameState,
  currentMap,
  onCanvasClick,
  setGameState,
  createArt,
  closeDialogue,
  performBattleAction
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiClickableElementsRef = useRef<Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    action: () => void
  }>>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // UI Helper Functions
  const addClickable = (x: number, y: number, width: number, height: number, action: () => void) => {
    if (typeof action === 'function') {
      uiClickableElementsRef.current.push({ x, y, width, height, action });
    } else {
      console.error('Attempted to add clickable without valid action function');
    }
  };

  const showMessage = (
    title: string,
    text: string,
    options: DialogueOption[] = [{ text: "Okay", action: closeDialogue }]
  ) => {
    setGameState(prev => ({
      ...prev,
      dialogue: { title, text, options }
    }));
  };

  // Game Logic Functions
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

        // Add achievement for the first sale
        if (!newState.player.achievements.includes('first_artwork_sold')) {
          newState.player.achievements.push('first_artwork_sold');
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
      const quest = QUEST_DEFINITIONS[questId];
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

  const network = (npcName: string, npcType: string) => {
    setGameState(prev => {
      const player = prev.player;
      if (player.energy < 10) {
        showMessage("Too Tired", "Need 10 energy.", [{ text: "OK", action: closeDialogue }]);
        return prev;
      }

      let repGain = 1 + Math.floor(player.skills.networking * 0.5);
      const expGain = 10;
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

  const startCritiqueBattle = (criticData: NPCData) => {
    setGameState(prev => ({
      ...prev,
      dialogue: null, // Clear any active dialogue before starting battle
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
        turn: 'player',
        log: [`${criticData.name} challenges you to a critique battle!`]
      },
      menu: 'battle'
    }));
  };

  // Drawing Functions
  const drawMenuButton = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    action: () => void,
    color = '#3B82F6',
    disabled = false
  ) => {
    const lineHeight = 10;
    ctx.font = 'bold 10px Noto Sans';
    const lines = getWrappedLines(ctx, text, width, ctx.font);
    const textHeight = lines.length * lineHeight;
    const textY = y + (height - textHeight) / 2 + lineHeight * 0.85;

    // Hover effect
    let isHovered = false;
    if (mousePos &&
      mousePos.x >= x && mousePos.x <= x + width &&
      mousePos.y >= y && mousePos.y <= y + height &&
      !disabled
    ) {
      isHovered = true;
    }

    const bgColor = disabled ? '#64748B' : isHovered ? '#2563EB' : color;
    const textColor = isHovered ? '#FACC15' : '#FFFFFF';

    drawRoundedRect(ctx, x, y, width, height, 5, bgColor);

    lines.forEach((line: string, i: number) => {
      wrapAndDrawText(ctx, line, x, textY + i * lineHeight, width, lineHeight, {
        fillStyle: textColor,
        font: 'bold 12px Noto Sans',
        textAlign: 'center' as CanvasTextAlign
      });
    });

    if (!disabled) {
      addClickable(
        x,
        y,
        width,
        height,
        action,
      );
    }
  };

  const drawMenu = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!gameState.menu) return;

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
    drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10, 'rgba(30,41,59,0.98)', {
      color: 'rgba(71,85,105,1)',
      width: 2
    });

    // Helper functions for menu drawing
    const drawMenuTitle = (title: string) => {
      wrapAndDrawText(ctx, title, boxX + padding, currentY + 10, boxWidth - padding * 2, 28, {
        fillStyle: '#A78BFA',
        font: 'bold 24px Noto Sans',
        textAlign: 'center' as CanvasTextAlign
      });
      currentY += 45;
    };

    const drawMenuText = (
      text: string,
      color = '#CBD5E1',
      size = '15px',
      align: CanvasTextAlign = 'left',
      isBold = false
    ) => {
      const textMaxWidth = boxWidth - padding * 2;
      const textX = align === 'center' ? boxX + (boxWidth - textMaxWidth) / 2 : boxX + padding;
      currentY += wrapAndDrawText(ctx, text, textX, currentY, textMaxWidth, lineHeight, {
        fillStyle: color,
        font: `${isBold ? 'bold ' : ''}${size} Noto Sans`,
        textAlign: align
      });
    };

    const drawMenuButtonHelper = (text: string, action: () => void, color = '#3B82F6', disabled = false,
      pushY: boolean = true, btnX = boxX + padding, btnWidth = boxWidth - padding * 2) => {
      const buttonY = currentY; // <-- capture before using it
      drawMenuButton(ctx, text, btnX, buttonY, btnWidth, buttonHeight, action, color, disabled);
      if (pushY) currentY += buttonHeight + buttonMargin;
    };

    const drawMenuTextHelper = (text: string, color?: string, size?: string, align?: CanvasTextAlign, isBold?: boolean) => {
      drawMenuText(text, color, size, align, isBold);
    };

    const drawMenuTitleHelper = (title: string) => {
      drawMenuTitle(title);
    };

    // Draw menu content based on type
    switch (gameState.menu) {
      case 'inventory':
        currentY = InventoryMenu({
          currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
        });
        break;
      case 'quests':
        currentY = QuestMenu({
          currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
        });
        break;
      case 'create_art':
        currentY = CreateArtMenu({
          currentY, gameState, setGameState, createArt, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
        });
        break;
      case 'rest':
        currentY = RestMenu({
          currentY, gameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage, setGameState
        });
        break;
      case 'study':
        currentY = StudyMenu({
          currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage,
        });
        break;
      case 'battle':
        currentY = BattleMenu({
          currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage,
          performBattleAction,
          // Pass down the necessary props for custom drawing
          ctx: ctx,
          boxX: boxX,
          boxWidth: boxWidth,
          padding: padding,
          buttonMargin: buttonMargin,
          addClickable: addClickable,
          mousePos: mousePos
        });
        break;
      case 'talk_npc':
        currentY = NPCDialogueMenu({
          currentY, gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
        });
        break;
      case 'buy_coffee':
        currentY = CoffeeShopMenu({
          currentY,
          gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
        });
        break;
      case 'buy_supplies':
        currentY = ArtSuppliesMenu({
          currentY,
          gameState, setGameState, drawMenuButtonHelper, drawMenuTextHelper, drawMenuTitleHelper, showMessage
        });
        break;
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
      case 'teach_artist':
        drawMenuTitle('Master Artist');
        drawMenuText('Learn advanced techniques from a master artist.', '#CBD5E1', '15px', 'center');
        currentY += 20;
        drawMenuButtonHelper('Learn Techniques ($50, +1 Artistic)', () => {
          if (gameState.player.money >= 50) {
            setGameState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                money: prev.player.money - 50,
                skills: {
                  ...prev.player.skills,
                  artistic: Math.min(10, prev.player.skills.artistic + 1)
                }
              },
              dialogue: {
                title: "Lesson Complete!",
                text: "You learned valuable techniques!\n+1 Artistic Skill",
                options: [{ text: "Excellent!", action: closeDialogue }]
              }
            }));
          } else {
            showMessage('Not enough money', 'You need $50 for this lesson.');
          }
        });
        break;

      case 'judge_gallerist':
        {
          drawMenuTitle('Gallerist Judgement');
          const repChange = gameState.menuData?.reputationChange || 0;
          const sale = gameState.menuData?.sale;
          drawMenuText(
            repChange > 0
              ? `The gallerist is impressed! Reputation +${repChange}`
              : `The gallerist is unimpressed. Reputation ${repChange}`,
            '#CBD5E1',
            '16px',
            'center'
          );
          if (sale) {
            drawMenuText(`You made a sale! +${sale.amount}`, '#4ADE80', '16px', 'center');
          }
          drawMenuButtonHelper('Continue', () => {
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
        }

      case 'market':
        {
          drawMenuTitle('Art Market');

          // Display current market conditions
          if (gameState.marketConditions) {
            drawMenuText('Market Conditions:', '#A78BFA', '16px', 'left', true);
            const marketSummary = getMarketSummary(gameState.marketConditions);
            drawMenuText(marketSummary, '#CBD5E1', '14px', 'left');
            currentY += 15;
          }

          drawMenuText('Your Artwork:', '#A78BFA', '16px', 'left', true);

          // Show available artwork with current values
          const artworks = Object.entries(gameState.player.inventory)
            .filter(([_, item]) => item.type === 'art' && item.quantity > 0);

          if (artworks.length > 0) {
            artworks.forEach(([key, item]) => {
              const artKey = key as 'paintings' | 'sculptures' | 'digitalArt';
              let currentValue = item.value || 0;

              // Recalculate current market value if market conditions exist
              if (gameState.marketConditions) {
                currentValue = calculateArtworkValue(artKey, gameState.player, gameState.marketConditions);
              }

              const marketData = gameState.marketConditions?.[artKey];
              const trendIcon = marketData ? {
                rising: '📈',
                stable: '➡️',
                falling: '📉'
              }[marketData.marketTrend] : '';

              const demandIcon = marketData ? {
                low: '🔻',
                medium: '🔸',
                high: '🔥'
              }[marketData.demandLevel] : '';

              drawMenuText(`${item.name} x${item.quantity}`, '#CBD5E1', '15px', 'left', true);
              drawMenuText(`Value: $${currentValue} ${trendIcon} ${demandIcon}`, '#4ADE80', '14px', 'left');

              // Add sell button for each artwork type
              if (item.quantity > 0) {
                drawMenuButtonHelper(`Sell ${item.name} ($${currentValue})`, () => {
                  setGameState(prev => {
                    const newInventory = { ...prev.player.inventory };
                    newInventory[key] = {
                      ...newInventory[key],
                      quantity: newInventory[key].quantity - 1
                    };

                    // Remove from inventory if quantity reaches 0
                    if (newInventory[key].quantity <= 0) {
                      delete newInventory[key];
                    }

                    return {
                      ...prev,
                      player: {
                        ...prev.player,
                        money: prev.player.money + currentValue,
                        reputation: prev.player.reputation + Math.floor(currentValue / 50),
                        inventory: newInventory
                      },
                      dialogue: {
                        title: "Artwork Sold!",
                        text: `You sold your ${item.name} for $${currentValue}!\n+${Math.floor(currentValue / 50)} Reputation`,
                        options: [{ text: "Excellent!", action: closeDialogue }]
                      }
                    };
                  });
                }, '#22C55E');
              }
            });
          } else {
            drawMenuText('No artwork to sell. Create some art first!', '#CBD5E1', '15px', 'center');
          }

          currentY += 20;

          // Market analysis button
          drawMenuButtonHelper('Market Analysis (Business Skill)', () => {
            if (gameState.player.skills.business < 2) {
              showMessage('Business Skill Too Low', 'You need at least level 2 Business skill for market analysis.');
              return;
            }

            if (!gameState.marketConditions) {
              showMessage('No Market Data', 'Market conditions are not available.');
              return;
            }

            const analysis = generateMarketAnalysis(gameState.player, gameState.marketConditions);
            showMessage('Market Analysis', analysis);
          }, '#8B5CF6', gameState.player.skills.business < 2);

          break;
        }
      case 'shop': {
        const shopData = gameState.menuData?.shop;
        if (shopData) {
          drawMenuTitle(shopData.name);
          drawMenuText(shopData.description, '#CBD5E1');
          currentY += 20;
          drawMenuButtonHelper(`Buy ${shopData.sale.name} (${shopData.sale.price})`, () => {
            if (gameState.player.money >= shopData.sale.price) {
              setGameState(prev => {
                const newPlayer = { ...prev.player };
                newPlayer.money -= shopData.sale.price;
                newPlayer.reputation += shopData.reputationChange || 0;
                newPlayer.inventory = {
                  ...newPlayer.inventory,
                  [shopData.sale.id]: {
                    id: shopData.sale.id,
                    name: shopData.sale.name,
                    type: shopData.sale.type,
                    description: shopData.sale.description,
                    quantity: (newPlayer.inventory[shopData.sale.id]?.quantity || 0) + 1,
                    value: shopData.sale.value
                  }
                };
                return {
                  ...prev,
                  player: newPlayer,
                  dialogue: {
                    title: "Purchase Successful",
                    text: `You bought ${shopData.sale.name} for ${shopData.sale.price}.`,
                    options: [{ text: "OK", action: closeDialogue }]
                  }
                };
              });
            } else {
              showMessage('Not enough money', `You need ${shopData.sale.price} for this item.`);
            }
          });
        }
        break;
      }
    }

    // Add close button, but not for the battle menu
    if (gameState.menu !== 'battle') {
      const closeBtnWidth = 120;
      const closeBtnHeight = 30;
      const closeBtnX = boxX + boxWidth - closeBtnWidth - padding;
      const closeBtnY = boxY + boxHeight - closeBtnHeight - padding;

      drawMenuButton(ctx, 'Close', closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, () => {
        onCanvasClick(-1000, -1000);
      }, '#7C3AED');
    }
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

    // Draw hover indicator if mouse is over a tile
    if (mousePos) {
      const mouseTileX = Math.floor((mousePos.x + clampedCamX) / TILE_SIZE);
      const mouseTileY = Math.floor((mousePos.y + clampedCamY) / TILE_SIZE);

      if (mouseTileX >= 0 && mouseTileX < currentMap.width &&
        mouseTileY >= 0 && mouseTileY < currentMap.height) {

        const isOnInteractiveObject = Object.entries(currentMap.objects).some(([key, obj]) => {
          const [objTileX, objTileY] = key.split(',').map(Number);
          const isInteractive = Object.values(INTERACTION_TYPES).includes(obj.interaction as keyof typeof INTERACTION_TYPES);
          return objTileX === mouseTileX && objTileY === mouseTileY && isInteractive;
        });

        if (isOnInteractiveObject || currentMap.tiles[mouseTileY][mouseTileX] !== 1) {
          const x = mouseTileX * TILE_SIZE;
          const y = mouseTileY * TILE_SIZE;

          ctx.shadowColor = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.shadowBlur = 8;
          ctx.fillStyle = isOnInteractiveObject ? 'rgba(239, 68, 68, 0.1)' : 'rgba(250, 204, 21, 0.1)';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          ctx.shadowBlur = 0;
          ctx.strokeStyle = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          const accentSize = 3;
          ctx.fillStyle = isOnInteractiveObject ? '#EF4444' : '#FACC15';
          ctx.fillRect(x, y, accentSize, accentSize);
          ctx.fillRect(x + TILE_SIZE - accentSize, y, accentSize, accentSize);
          ctx.fillRect(x, y + TILE_SIZE - accentSize, accentSize, accentSize);
          ctx.fillRect(x + TILE_SIZE - accentSize, y + TILE_SIZE - accentSize, accentSize, accentSize);
        }
      }
    }

    ctx.restore();

    // Draw player stats at the bottom
    const statsPadding = 10;
    const statsHeight = 30;
    const statsY = canvas.height - statsHeight - statsPadding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    drawRoundedRect(ctx, statsPadding, statsY, canvas.width - statsPadding * 2, statsHeight, 5, ctx.fillStyle);

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
      ctx.fillStyle = gameState.menu === menu ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)';
      drawRoundedRect(ctx, x, y, iconSize, iconSize, 8, ctx.fillStyle, { color: 'white', width: 1 });

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(icon, x + iconSize / 2, y + iconSize / 2);

      addClickable(x, y, iconSize, iconSize, () => {
        onCanvasClick(-999, -999);
        if (gameState.menu === menu) {
          onCanvasClick(-1000, -1000);
        } else {
          onCanvasClick(-1001, -1001, menu as MenuType);
        }
      });
    });

    // Draw menu
    drawMenu(ctx, canvas);

    // Draw dialogue if present
    if (gameState.dialogue) {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Dynamic sizing based on content
      const maxWidth = canvasWidth * 0.85;
      const minHeight = 150;
      const padding = 24;
      const titleLineHeight = 30; // Increased for better spacing
      const textLineHeight = 24;  // Increased for better spacing
      const buttonHeight = 36;
      const buttonSpacing = 10;   // Increased spacing between buttons
      const sectionSpacing = 20;  // Space between title, text, and buttons

      // Pre-calculate text dimensions with proper fonts
      ctx.font = 'bold 18px Noto Sans';
      const titleLines = getWrappedLines(ctx, gameState.dialogue.title, maxWidth - padding * 2, ctx.font);

      ctx.font = '16px Noto Sans';
      const textLines = getWrappedLines(ctx, gameState.dialogue.text, maxWidth - padding * 2, ctx.font);

      // Calculate actual heights needed
      const titleHeight = titleLines.length * titleLineHeight;
      const textHeight = textLines.length * textLineHeight;
      const buttonsHeight = gameState.dialogue.options.length * (buttonHeight + buttonSpacing) - buttonSpacing;

      // Total content height with proper spacing
      const contentHeight = titleHeight + sectionSpacing + textHeight + sectionSpacing + buttonsHeight;
      const boxHeight = Math.max(minHeight, contentHeight + padding * 2);
      const boxWidth = Math.min(maxWidth, Math.max(350, canvasWidth * 0.75)); // Minimum width increased

      // Center the dialogue box
      const boxX = (canvasWidth - boxWidth) / 2;
      const boxY = Math.max(20, (canvasHeight - boxHeight) / 2);

      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw main dialogue box with enhanced styling
      const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
      gradient.addColorStop(0, '#1E293B');
      gradient.addColorStop(1, '#0F172A');

      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 12, gradient, {
        color: '#7C3AED',
        width: 3
      });

      // Add inner shadow effect
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(ctx, boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4, 10, 'rgba(30, 41, 59, 0.8)');
      ctx.restore();

      let currentY = boxY + padding;

      // Draw title with enhanced styling and proper positioning
      ctx.save();
      ctx.shadowColor = 'rgba(167, 139, 250, 0.5)';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 18px Noto Sans';
      ctx.fillStyle = '#A78BFA';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      titleLines.forEach((line, i) => {
        const lineY = currentY + (i * titleLineHeight);
        ctx.fillText(line, boxX + padding, lineY);
      });
      ctx.restore();

      currentY += titleHeight + sectionSpacing;

      // Draw separator line
      const separatorY = currentY - (sectionSpacing / 2);
      const separatorGradient = ctx.createLinearGradient(boxX + padding, separatorY, boxX + boxWidth - padding, separatorY);
      separatorGradient.addColorStop(0, 'rgba(124, 58, 237, 0)');
      separatorGradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.6)');
      separatorGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

      ctx.strokeStyle = separatorGradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boxX + padding, separatorY);
      ctx.lineTo(boxX + boxWidth - padding, separatorY);
      ctx.stroke();

      // Draw text content with proper spacing and positioning
      ctx.save();
      ctx.font = '16px Noto Sans';
      ctx.fillStyle = '#CBD5E1';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      textLines.forEach((line, i) => {
        const lineY = currentY + (i * textLineHeight);
        ctx.fillText(line, boxX + padding, lineY);
      });
      ctx.restore();

      currentY += textHeight + sectionSpacing;

      // Draw buttons with improved layout and no overlap
      gameState.dialogue.options.forEach((option, index) => {
        const btnWidth = boxWidth - padding * 2;
        const btnX = boxX + padding;
        const isLastButton = index === gameState.dialogue.options.length - 1;
        const buttonColor = isLastButton ? '#059669' : '#7C3AED';

        // Check for hover state
        let isHovered = false;
        if (mousePos &&
          mousePos.x >= btnX && mousePos.x <= btnX + btnWidth &&
          mousePos.y >= currentY && mousePos.y <= currentY + buttonHeight
        ) {
          isHovered = true;
        }

        const finalButtonColor = isHovered ? (isLastButton ? '#047857' : '#6D28D9') : buttonColor;

        // Draw button with enhanced styling
        ctx.save();
        if (isHovered) {
          ctx.shadowColor = isLastButton ? 'rgba(5, 150, 105, 0.5)' : 'rgba(124, 58, 237, 0.5)';
          ctx.shadowBlur = 8;
        }

        // Custom button drawing to ensure no text overlap
        drawRoundedRect(ctx, btnX, currentY, btnWidth, buttonHeight, 6, finalButtonColor);

        // Draw button text with proper centering
        ctx.font = 'bold 14px Noto Sans';
        ctx.fillStyle = isHovered ? '#FACC15' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Ensure text fits in button
        const maxTextWidth = btnWidth - 20; // 10px padding on each side
        let buttonText = option.text;
        let textWidth = ctx.measureText(buttonText).width;

        // Truncate text if too long
        while (textWidth > maxTextWidth && buttonText.length > 3) {
          buttonText = buttonText.slice(0, -4) + '...';
          textWidth = ctx.measureText(buttonText).width;
        }

        ctx.fillText(buttonText, btnX + btnWidth / 2, currentY + buttonHeight / 2);

        // Add clickable area
        addClickable(btnX, currentY, btnWidth, buttonHeight, option.action);

        ctx.restore();

        currentY += buttonHeight + buttonSpacing;
      });

      // Add a subtle pulsing border effect for important dialogues
      if (gameState.dialogue.title.includes('Quest') || gameState.dialogue.title.includes('Complete')) {
        ctx.save();
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = Date.now() * 0.01; // Animated dash
        ctx.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);
        ctx.restore();
      }
    }
  };

  const handleInteraction = (obj: ObjectData) => {
    const npcData: NPCData = {
      name: obj.name || '',
      type: obj.type || '',
      x: obj.x,
      y: obj.y
    };

    // Handle NPC interactions with unified system
    if (obj.type.startsWith('npc_')) {
      const player = gameState.player;
      const relationshipLevel = player.relationships?.[npcData.name] || 0;
      const dialogue = getNPCDialogue(npcData, player, relationshipLevel, {
        setGameState,
        showMessage,
        network,
        openSellArtMenu,
        startCritiqueBattle
      });

      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          relationships: {
            ...prev.player.relationships,
            [npcData.name]: (prev.player.relationships[npcData.name] || 0) + 1
          }
        },
        dialogue: {
          title: npcData.name,
          text: dialogue.text,
          options: dialogue.options
        }
      }));
      return;
    }

    // Handle other interactions
    switch (obj.interaction) {
      case INTERACTION_TYPES.EXIT: {
        const currentMapData = MAPS[gameState.currentMap];
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
      case INTERACTION_TYPES.CREATE_ART:
        setGameState(prev => ({ ...prev, menu: INTERACTION_TYPES.CREATE_ART }));
        break;
      case INTERACTION_TYPES.REST:
        setGameState(prev => ({ ...prev, menu: INTERACTION_TYPES.REST }));
        break;
      case INTERACTION_TYPES.BUY_COFFEE:
        setGameState(prev => ({ ...prev, menu: INTERACTION_TYPES.BUY_COFFEE }));
        break;
      case INTERACTION_TYPES.BUY_SUPPLIES:
        setGameState(prev => ({ ...prev, menu: INTERACTION_TYPES.BUY_SUPPLIES }));
        break;
      case INTERACTION_TYPES.TALK_NPC:
        setGameState(prev => ({ ...prev, menu: INTERACTION_TYPES.TALK_NPC, menuData: npcData }));
        break;
      case INTERACTION_TYPES.STUDY:
        setGameState(prev => ({ ...prev, menu: 'study' }));
        break;
      case 'teach_artist':
        setGameState(prev => ({ ...prev, menu: 'teach_artist' }));
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
      case 'shop': {
        // Get shop data from the object
        const shopObject = Object.entries(currentMap.objects).find(([key, o]) => {
          const [oX, oY] = key.split(',').map(Number);
          return oX * TILE_SIZE === obj.x && oY * TILE_SIZE === obj.y;
        });

        if (shopObject) {
          const shopData = shopObject[1].data;
          setGameState(prev => ({
            ...prev,
            menu: 'shop',
            menuData: { shop: shopData }
          }));
        }
        break;
      }
    }
  };

  // Handle pending interactions (like exits)
  useEffect(() => {
    if (gameState.pendingInteraction &&
      gameState.player.x === gameState.pendingInteraction.x &&
      gameState.player.y === gameState.pendingInteraction.y) {
      if (gameState.pendingInteraction.type === INTERACTION_TYPES.EXIT) {
        handleInteraction(gameState.pendingInteraction.data);
      }
      setGameState(prev => ({ ...prev, pendingInteraction: null }));
    }
  }, [gameState.player.x, gameState.player.y, gameState.pendingInteraction]);

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

    // Don't redraw here - use the current clickable elements
    // drawGame(ctx, canvas);

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
        if (typeof element.action === 'function') {
          element.action();
          event.stopPropagation();
          return;
        } else {
          console.error('Clickable element has invalid action:', element);
        }
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
        onCanvasClick(-1000, -1000);
        return;
      }
    }

    // Handle game world click
    const camX = gameState.player.x - canvas.width / 2 + TILE_SIZE / 2;
    const camY = gameState.player.y - canvas.height / 2 + TILE_SIZE / 2;
    const clampedCamX = Math.max(0, Math.min(camX, currentMap.width * TILE_SIZE - canvas.width));
    const clampedCamY = Math.max(0, Math.min(camY, currentMap.height * TILE_SIZE - canvas.height));

    const worldX = x + clampedCamX;
    const worldY = y + clampedCamY;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    // Check if clicked on an interactive object
    const clickedObject = Object.entries(currentMap.objects).find(([key, obj]) => {
      const [objTileX, objTileY] = key.split(',').map(Number);
      return objTileX === tileX && objTileY === tileY &&
        Object.values(INTERACTION_TYPES).includes(obj.interaction as keyof typeof INTERACTION_TYPES);
    });

    if (clickedObject) {
      const [key, obj] = clickedObject;
      const [objX, objY] = key.split(',').map(Number);
      const objectData: ObjectData = {
        interaction: obj.interaction,
        name: obj.name,
        type: obj.type,
        x: objX * TILE_SIZE,
        y: objY * TILE_SIZE
      };

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
      } else if (obj.type.startsWith('npc_')) {
        handleInteraction(objectData);
      } else {
        onCanvasClick(-1001, -1001, obj.interaction as MenuType);
      }
    } else if (tileX >= 0 && tileX < currentMap.width &&
      tileY >= 0 && tileY < currentMap.height &&
      currentMap.tiles[tileY][tileX] !== 1) {
      onCanvasClick(worldX, worldY);
    }
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

  const handleMouseLeave = () => {
    setMousePos(null);
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