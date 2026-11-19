export const gameState = {
  mode: 5,
  runId: '',
  playerDeck: [],
  opponentDeck: [],
  remainingPlayer: [],
  remainingOpp: [],
  usedPlayer: [],
  usedOpp: [],
  changeCount: 3,
  wins: 0,
  loses: 0,
  draws: 0,
  selectedCardId: null,
  isBattling: false,
  battleLog: [],
};

function createRunId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function resetGameState(mode) {
  gameState.mode = mode;
  gameState.runId = createRunId();
  gameState.changeCount = 3;
  gameState.playerDeck = [];
  gameState.opponentDeck = [];
  gameState.remainingPlayer = [];
  gameState.remainingOpp = [];
  gameState.usedPlayer = [];
  gameState.usedOpp = [];
  gameState.wins = 0;
  gameState.loses = 0;
  gameState.draws = 0;
  gameState.selectedCardId = null;
  gameState.isBattling = false;
  gameState.battleLog = [];
}
