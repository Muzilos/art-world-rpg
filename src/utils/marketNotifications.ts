// utils/marketNotifications.ts
import type { MarketConditions, Player } from '../types/game';

export interface MarketNotification {
  id: string;
  title: string;
  message: string;
  type: 'market_boom' | 'market_crash' | 'trend_change' | 'demand_shift';
  artType: 'paintings' | 'sculptures' | 'digitalArt';
  timestamp: number;
}

// Check for significant market changes and generate notifications
export const checkForMarketNotifications = (
  previousConditions: MarketConditions | null,
  currentConditions: MarketConditions,
  player: Player
): MarketNotification[] => {
  const notifications: MarketNotification[] = [];
  
  if (!previousConditions) return notifications;
  
  const artTypes: Array<'paintings' | 'sculptures' | 'digitalArt'> = 
    ['paintings', 'sculptures', 'digitalArt'];
  
  artTypes.forEach(artType => {
    const prev = previousConditions[artType];
    const current = currentConditions[artType];
    
    // Check for trend changes
    if (prev.marketTrend !== current.marketTrend) {
      let message = '';
      let type: MarketNotification['type'] = 'trend_change';
      
      switch (current.marketTrend) {
        case 'rising':
          message = `${artType} market is trending upward! Great time to sell.`;
          if (current.demandLevel === 'high') {
            type = 'market_boom';
            message = `${artType} market is BOOMING! 📈 Prices are at their peak!`;
          }
          break;
        case 'falling':
          message = `${artType} market is declining. Consider holding your pieces.`;
          if (current.demandLevel === 'low') {
            type = 'market_crash';
            message = `${artType} market has crashed! 📉 Prices are very low.`;
          }
          break;
        case 'stable':
          message = `${artType} market has stabilized after recent volatility.`;
          break;
      }
      
      // Only notify if player has relevant artwork or skills
      const hasRelevantArt = player.inventory[artType]?.quantity > 0;
      const hasRelevantSkill = (artType === 'paintings' && player.skills.artistic >= 1) ||
                              (artType === 'sculptures' && player.skills.artistic >= 3) ||
                              (artType === 'digitalArt' && player.skills.artistic >= 5);
      
      if (hasRelevantArt || hasRelevantSkill || player.skills.business >= 3) {
        notifications.push({
          id: `${artType}_trend_${Date.now()}`,
          title: 'Market Alert',
          message,
          type,
          artType,
          timestamp: Date.now()
        });
      }
    }
    
    // Check for demand level changes
    if (prev.demandLevel !== current.demandLevel) {
      let message = '';
      
      if (current.demandLevel === 'high' && prev.demandLevel !== 'high') {
        message = `High demand for ${artType}! Collectors are actively seeking pieces.`;
      } else if (current.demandLevel === 'low' && prev.demandLevel !== 'low') {
        message = `Low demand for ${artType}. Market interest has cooled.`;
      }
      
      if (message && (player.inventory[artType]?.quantity > 0 || player.skills.business >= 2)) {
        notifications.push({
          id: `${artType}_demand_${Date.now()}`,
          title: 'Demand Update',
          message,
          type: 'demand_shift',
          artType,
          timestamp: Date.now()
        });
      }
    }
  });
  
  return notifications;
};

// Get market advice based on player's situation
export const getMarketAdvice = (
  marketConditions: MarketConditions,
  player: Player
): string => {
  const artTypes: Array<'paintings' | 'sculptures' | 'digitalArt'> = 
    ['paintings', 'sculptures', 'digitalArt'];
  
  let advice = 'Market Advisor Tips:\n\n';
  
  // Find best opportunities
  const opportunities = artTypes
    .map(artType => ({
      type: artType,
      score: calculateOpportunityScore(marketConditions[artType], player, artType),
      market: marketConditions[artType]
    }))
    .sort((a, b) => b.score - a.score);
  
  const bestOpportunity = opportunities[0];
  
  if (bestOpportunity.score > 7) {
    advice += `🌟 BEST OPPORTUNITY: ${bestOpportunity.type}\n`;
    advice += `Market is ${bestOpportunity.market.marketTrend} with ${bestOpportunity.market.demandLevel} demand.\n\n`;
  }
  
  // Provide specific advice based on player's inventory
  artTypes.forEach(artType => {
    const hasArt = player.inventory[artType]?.quantity > 0;
    const market = marketConditions[artType];
    
    if (hasArt) {
      if (market.marketTrend === 'rising' && market.demandLevel === 'high') {
        advice += `💰 ${artType}: SELL NOW! Perfect conditions.\n`;
      } else if (market.marketTrend === 'falling') {
        advice += `⏳ ${artType}: HOLD. Wait for better prices.\n`;
      } else {
        advice += `📊 ${artType}: Fair conditions for selling.\n`;
      }
    }
  });
  
  // Skill-based advice
  if (player.skills.business >= 5) {
    advice += '\n📈 Advanced Analysis:\n';
    const volatileMarkets = artTypes.filter(type => 
      Math.abs(marketConditions[type].currentValue - marketConditions[type].baseValue) > 50
    );
    
    if (volatileMarkets.length > 0) {
      advice += `Markets showing volatility: ${volatileMarkets.join(', ')}\n`;
      advice += 'Consider timing your trades carefully.\n';
    }
  }
  
  return advice;
};

const calculateOpportunityScore = (
  market: any,
  player: Player,
  artType: 'paintings' | 'sculptures' | 'digitalArt'
): number => {
  let score = 5; // Base score
  
  // Market trend scoring
  if (market.marketTrend === 'rising') score += 3;
  if (market.marketTrend === 'falling') score -= 2;
  
  // Demand scoring
  if (market.demandLevel === 'high') score += 3;
  if (market.demandLevel === 'low') score -= 2;
  
  // Player capability scoring
  const skillRequirements = {
    paintings: 1,
    sculptures: 3,
    digitalArt: 5
  };
  
  if (player.skills.artistic >= skillRequirements[artType]) {
    score += 2;
  }
  
  // Existing inventory bonus
  if (player.inventory[artType]?.quantity > 0) {
    score += 1;
  }
  
  return Math.max(0, Math.min(10, score));
};