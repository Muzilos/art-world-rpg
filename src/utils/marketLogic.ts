// utils/marketLogic.ts
import type { Player, GameState } from '../types/game';

export interface ArtworkValue {
  baseValue: number;
  currentValue: number;
  qualityMultiplier: number;
  marketTrend: 'rising' | 'stable' | 'falling';
  demandLevel: 'low' | 'medium' | 'high';
}

export interface MarketConditions {
  paintings: ArtworkValue;
  sculptures: ArtworkValue;
  digitalArt: ArtworkValue;
  lastUpdate: number;
}

// Base market values for each art type
const BASE_VALUES = {
  paintings: 150,
  sculptures: 300, 
  digitalArt: 200
};

// Calculate artwork value based on player stats and market conditions
export const calculateArtworkValue = (
  artType: 'paintings' | 'sculptures' | 'digitalArt',
  player: Player,
  marketConditions: MarketConditions,
  quality?: number
): number => {
  const baseValue = BASE_VALUES[artType];
  const marketData = marketConditions[artType];
  
  // Player skill multipliers
  const artisticMultiplier = 1 + (player.skills.artistic - 1) * 0.15; // 15% per skill level above 1
  const reputationMultiplier = 1 + (player.reputation * 0.008); // 0.8% per reputation point
  const businessMultiplier = 1 + (player.skills.business - 1) * 0.05; // 5% business skill bonus
  
  // Quality multiplier (if provided, e.g., when creating art)
  const qualityMultiplier = quality ? (quality / 5) : 1; // Quality 1-10, normalized to 0.2-2.0
  
  // Market trend multipliers
  const trendMultipliers = {
    rising: 1.3,
    stable: 1.0,
    falling: 0.7
  };
  
  // Demand multipliers
  const demandMultipliers = {
    low: 0.8,
    medium: 1.0,
    high: 1.4
  };
  
  // Art type specific bonuses
  const typeMultipliers = {
    paintings: player.equipment.brush === 'Pro Brush Set' ? 1.2 : 1.0,
    sculptures: player.skills.artistic >= 5 ? 1.15 : 1.0,
    digitalArt: player.skills.artistic >= 7 ? 1.25 : 1.0
  };
  
  const finalValue = Math.floor(
    baseValue *
    artisticMultiplier *
    reputationMultiplier *
    businessMultiplier *
    qualityMultiplier *
    trendMultipliers[marketData.marketTrend] *
    demandMultipliers[marketData.demandLevel] *
    typeMultipliers[artType]
  );
  
  return Math.max(10, finalValue); // Minimum value of $10
};

// Generate random market conditions that change over time
export const updateMarketConditions = (
  currentConditions: MarketConditions | null,
  gameTick: number
): MarketConditions => {
  // Update market every 500 ticks (roughly every 25 seconds at 20Hz)
  const shouldUpdate = !currentConditions || 
    (gameTick - currentConditions.lastUpdate) >= 500;
  
  if (!shouldUpdate && currentConditions) {
    return currentConditions;
  }
  
  const artTypes: Array<'paintings' | 'sculptures' | 'digitalArt'> = 
    ['paintings', 'sculptures', 'digitalArt'];
  
  const newConditions: MarketConditions = {
    lastUpdate: gameTick,
    paintings: generateArtTypeMarket('paintings', currentConditions?.paintings),
    sculptures: generateArtTypeMarket('sculptures', currentConditions?.sculptures),
    digitalArt: generateArtTypeMarket('digitalArt', currentConditions?.digitalArt)
  };
  
  return newConditions;
};

export const generateArtTypeMarket = (
  artType: 'paintings' | 'sculptures' | 'digitalArt',
  previous?: ArtworkValue
): ArtworkValue => {
  // Market trends have some persistence but can change
  let marketTrend: 'rising' | 'stable' | 'falling';
  
  if (previous) {
    // 70% chance to keep same trend, 30% to change
    if (Math.random() < 0.7) {
      marketTrend = previous.marketTrend;
    } else {
      const trends: Array<'rising' | 'stable' | 'falling'> = ['rising', 'stable', 'falling'];
      marketTrend = trends[Math.floor(Math.random() * trends.length)];
    }
  } else {
    const trends: Array<'rising' | 'stable' | 'falling'> = ['rising', 'stable', 'falling'];
    marketTrend = trends[Math.floor(Math.random() * trends.length)];
  }
  
  // Demand levels
  const demands: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  const demandLevel = demands[Math.floor(Math.random() * demands.length)];
  
  // Base and current values
  const baseValue = BASE_VALUES[artType];
  const variationMultiplier = 0.8 + Math.random() * 0.4; // ±20% variation
  const currentValue = Math.floor(baseValue * variationMultiplier);
  
  return {
    baseValue,
    currentValue,
    qualityMultiplier: 1.0,
    marketTrend,
    demandLevel
  };
};

// Get market summary for display
export const getMarketSummary = (conditions: MarketConditions): string => {
  const summaries: string[] = [];
  
  const artTypes = [
    { key: 'paintings' as const, name: 'Paintings' },
    { key: 'sculptures' as const, name: 'Sculptures' },
    { key: 'digitalArt' as const, name: 'Digital Art' }
  ];
  
  artTypes.forEach(({ key, name }) => {
    const market = conditions[key];
    const trendIcon = {
      rising: '📈',
      stable: '➡️',
      falling: '📉'
    }[market.marketTrend];
    
    const demandIcon = {
      low: '🔻',
      medium: '🔸',
      high: '🔥'
    }[market.demandLevel];
    
    summaries.push(`${name}: ${trendIcon} ${demandIcon}`);
  });
  
  return summaries.join('\n');
};

// Update artwork values in player inventory
export const updateInventoryValues = (
  player: Player,
  marketConditions: MarketConditions
): Player => {
  const updatedInventory = { ...player.inventory };
  
  // Update art pieces with current market values
  ['paintings', 'sculptures', 'digitalArt'].forEach(artType => {
    if (updatedInventory[artType]) {
      const artKey = artType as 'paintings' | 'sculptures' | 'digitalArt';
      const newValue = calculateArtworkValue(artKey, player, marketConditions);
      
      updatedInventory[artType] = {
        ...updatedInventory[artType],
        value: newValue
      };
    }
  });
  
  return {
    ...player,
    inventory: updatedInventory
  };
};

export const generateMarketAnalysis = (player: any, marketConditions: any): string => {
  const artTypes = ['paintings', 'sculptures', 'digitalArt'] as const;
  let analysis = 'Market Analysis Report:\n\n';
  
  artTypes.forEach(artType => {
    const market = marketConditions[artType];
    const playerValue = calculateArtworkValue(artType, player, marketConditions);
    
    analysis += `${artType.charAt(0).toUpperCase() + artType.slice(1)}:\n`;
    analysis += `• Trend: ${market.marketTrend.toUpperCase()}\n`;
    analysis += `• Demand: ${market.demandLevel.toUpperCase()}\n`;
    analysis += `• Your potential value: $${playerValue}\n\n`;
    
    // Business skill provides additional insights
    if (player.skills.business >= 5) {
      const recommendation = market.marketTrend === 'rising' && market.demandLevel === 'high' 
        ? 'STRONG BUY - Great time to create and sell!'
        : market.marketTrend === 'falling' && market.demandLevel === 'low'
        ? 'HOLD - Wait for better conditions'
        : 'NEUTRAL - Moderate opportunity';
      analysis += `• Recommendation: ${recommendation}\n\n`;
    }
  });
  
  return analysis;
};
