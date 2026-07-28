export const gameState = {
  mode: 5,
  playerDeck: [],
  opponentDeck: [],
  remainingPlayer: [],
  remainingOpp: [],
  usedPlayer: [],
  usedOpp: [],
  changeCount: 3,
  wins: 0,
  loses: 0,
  selectedCardId: null,
  isBattling: false,
  battleLog: []
};

export function resetGameState(mode) {
  gameState.mode = mode;
  gameState.changeCount = 3;
  gameState.playerDeck = [];
  gameState.opponentDeck = [];
  gameState.remainingPlayer = [];
  gameState.remainingOpp = [];
  gameState.usedPlayer = [];
  gameState.usedOpp = [];
  gameState.wins = 0;
  gameState.loses = 0;
  gameState.selectedCardId = null;
  gameState.isBattling = false;
  gameState.battleLog = [];
}
