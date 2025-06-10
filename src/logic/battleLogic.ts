// src/logic/battleLogic.ts
import type { GameState, BattleState, BattleAction } from '../types/game';
import { BATTLE_ACTIONS } from '../constants/game';

// This function will take an action and the current state, and return the updated state.
export const handleBattleAction = (actionId: string, currentState: GameState): GameState => {
  if (!currentState.battle) return currentState;

  const playerAction = BATTLE_ACTIONS.find(a => a.id === actionId);
  const { player, battle } = currentState;

  if (!playerAction) return currentState; // Invalid action

  if (player.energy < playerAction.cost) {
    return {
      ...currentState,
      battle: {
        ...battle,
        log: [...battle.log, "You don't have enough energy for that!"].slice(-5),
      },
    };
  }

  const newState = { ...currentState };
  const newBattleState: BattleState = { ...battle };
  const playerLog: string[] = [];
  const opponentLog: string[] = [];

  // --- Player's Turn ---
  const playerDamage = Math.random() <= playerAction.accuracy
    ? Math.floor(playerAction.power * (1 + player.skills[playerAction.skill] / 10))
    : 0;

  newBattleState.opponent.hp -= playerDamage;
  playerLog.push(playerDamage > 0 ? `You used ${playerAction.name} and dealt ${playerDamage} damage!` : `Your ${playerAction.name} missed!`);
  newState.player.energy -= playerAction.cost;

  // --- Check for Player Victory ---
  if (newBattleState.opponent.hp <= 0) {
    newState.player.reputation += 10;
    newState.player.exp += 50;
    newState.dialogue = {
      title: "Victory!",
      text: "You won the critique! Gained 10 Reputation and 50 EXP.",
      options: [{ text: "Sweet!", action: () => {}}] // Action will be replaced by closeDialogue
    };
    newState.battle = null;
    return newState;
  }

  // --- Opponent's Turn (Simple AI) ---
  const opponentAction = BATTLE_ACTIONS[Math.floor(Math.random() * BATTLE_ACTIONS.length)];
  const opponentDamage = Math.floor(opponentAction.power * 0.7); // Opponent is a bit weaker
  
  newBattleState.player.hp -= opponentDamage;
  opponentLog.push(`Your opponent uses ${opponentAction.name} and deals ${opponentDamage} damage!`);
  
  // --- Check for Opponent Victory ---
    if (newBattleState.player.hp <= 0) {
    newState.player.reputation -= 5;
    newState.dialogue = {
      title: "Defeat!",
      text: "Your argument was dismantled. Lost 5 Reputation.",
      options: [{ text: "Ouch.", action: () => {}}] // Action will be replaced by closeDialogue
    };
    newState.battle = null;
    return newState;
  }

  newBattleState.log = [...battle.log, ...playerLog, ...opponentLog].slice(-5);
  newState.battle = newBattleState;

  return newState;
};