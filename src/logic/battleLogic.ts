// src/logic/battleLogic.ts
// Updated to generate floating text data for animations.
import type { GameState, BattleState, BattleAction, FloatingText } from '../types/game';
import { BATTLE_ACTIONS } from '../constants/game';

export const handleBattleAction = (actionId: string, currentState: GameState): GameState => {
  if (!currentState.battle) return currentState;

  const playerAction = BATTLE_ACTIONS.find(a => a.id === actionId);
  if (!playerAction) return currentState;

  const { player, battle } = currentState;

  if (player.energy < playerAction.cost) {
    return {
      ...currentState,
      battle: { ...battle, log: [...battle.log, "You don't have enough energy for that!"] },
    };
  }

  const newState = JSON.parse(JSON.stringify(currentState));
  const newBattleState: BattleState = newState.battle;
  const turnLogs: string[] = [];
  const floatingTexts: FloatingText[] = [];

  // --- Player's Turn ---
  newState.player.energy -= playerAction.cost;
  if (Math.random() <= playerAction.accuracy) {
    const playerDamage = Math.floor(playerAction.power * (1 + player.skills[playerAction.skill] / 10));
    newBattleState.opponent.hp -= playerDamage;
    turnLogs.push(`You used ${playerAction.name} and dealt ${playerDamage} damage!`);
    floatingTexts.push({ id: Date.now(), text: `-${playerDamage}`, color: 'text-red-500', x: 50, y: 15 });
  } else {
    turnLogs.push(`Your ${playerAction.name} missed!`);
    floatingTexts.push({ id: Date.now(), text: 'Miss', color: 'text-gray-400', x: 50, y: 15 });
  }

  // Check for Player Victory
  if (newBattleState.opponent.hp <= 0) {
    newState.player.reputation += 10;
    newState.player.exp += 50;
    newState.dialogue = {
      title: "Victory!",
      text: "You won the critique! Gained 10 Reputation and 50 EXP.",
      options: [{ text: "Sweet!", action: () => {} }]
    };
    newState.battle = null;
    return newState;
  }

  // --- Opponent's Turn (Simple AI) ---
  const opponentAction = BATTLE_ACTIONS[Math.floor(Math.random() * BATTLE_ACTIONS.length)];
  const opponentDamage = Math.floor(opponentAction.power * 0.7); 
  newBattleState.player.hp -= opponentDamage;
  turnLogs.push(`${newBattleState.opponent.name} uses ${opponentAction.name}, dealing ${opponentDamage} damage!`);
  floatingTexts.push({ id: Date.now() + 1, text: `-${opponentDamage}`, color: 'text-orange-500', x: 50, y: 75 });
  
  // --- Check for Opponent Victory ---
  if (newBattleState.player.hp <= 0) {
    newState.player.reputation = Math.max(0, newState.player.reputation - 5);
    newState.dialogue = {
      title: "Defeat!",
      text: "Your argument was dismantled. Lost 5 Reputation.",
      options: [{ text: "Ouch.", action: () => {}}]
    };
    newState.battle = null;
    return newState;
  }

  newBattleState.log = [...newBattleState.log, ...turnLogs].slice(-5); // Keep last 5 log entries
  newBattleState.floatingTexts = floatingTexts;
  newState.battle = newBattleState;

  return newState;
};