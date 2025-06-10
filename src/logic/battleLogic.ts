// src/logic/battleLogic.ts
import type { GameState, BattleState, BattleAction } from '../types/game';
import { BATTLE_ACTIONS } from '../constants/game';

export const handleBattleAction = (actionId: string, currentState: GameState): GameState => {
  if (!currentState.battle) {
    console.error("handleBattleAction called without an active battle.");
    return currentState;
  }

  const playerAction = BATTLE_ACTIONS.find(a => a.id === actionId);
  const { player, battle } = currentState;

  if (!playerAction) {
    console.error(`Invalid battle action ID: ${actionId}`);
    return currentState; 
  }

  if (player.energy < playerAction.cost) {
    return {
      ...currentState,
      battle: {
        ...battle,
        log: ["You don't have enough energy for that!"], // Replace log instead of adding
      },
    };
  }

  const newState = JSON.parse(JSON.stringify(currentState));
  const newBattleState: BattleState = newState.battle;
  const turnLogs: string[] = []; // This will hold the logs for THIS turn only

  // --- Player's Turn ---
  newState.player.energy -= playerAction.cost;
  const accuracyRoll = Math.random();
  if (accuracyRoll <= playerAction.accuracy) {
    const playerDamage = Math.floor(playerAction.power * (1 + player.skills[playerAction.skill] / 10));
    newBattleState.opponent.hp -= playerDamage;
    turnLogs.push(`You used ${playerAction.name} and dealt ${playerDamage} damage!`);
  } else {
    turnLogs.push(`Your ${playerAction.name} missed!`);
  }

  // Check for Player Victory
  if (newBattleState.opponent.hp <= 0) {

    newState.player.reputation += 10;
    newState.player.exp += 50;
    newState.dialogue = {
      title: "Victory!",
      text: "You won the critique! Gained 10 Reputation and 50 EXP.",
      options: [{ text: "Sweet!", action: () => {} }] // This action will be replaced by closeDialogue in the hook
    };
    newState.battle = null; // End the battle
    return newState;
  }

  // --- Opponent's Turn (Simple AI) ---
  // The critic picks a random move to use against the player.
  const opponentAction = BATTLE_ACTIONS[Math.floor(Math.random() * BATTLE_ACTIONS.length)];
  const opponentDamage = Math.floor(opponentAction.power * 0.7); // Let's make the opponent a bit weaker for now
  
  newBattleState.player.hp -= opponentDamage;
  turnLogs.push(`${newBattleState.opponent.name} uses ${opponentAction.name}, dealing ${opponentDamage} damage!`);
  
  // --- Check for Opponent Victory ---
  if (newBattleState.player.hp <= 0) {
    newState.player.reputation = Math.max(0, newState.player.reputation - 5); // Prevent negative rep
    newState.dialogue = {
      title: "Defeat!",
      text: "Your argument was dismantled. Lost 5 Reputation.",
      options: [{ text: "Ouch.", action: () => {}}] // This will be replaced
    };
    newState.battle = null; // End the battle
    return newState;
  }

  // Update battle log and return the new state
  // CRITICAL CHANGE: Replace the entire log with just this turn's events
  newBattleState.log = turnLogs; 
  newState.battle = newBattleState;

  return newState;
};
