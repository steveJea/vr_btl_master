import { gameState } from './state.js';
import { renderVsCard } from './cards.js';
import {
  updateBattleUI,
  renderMyHand,
  renderOppRemaining,
  renderUsedCards,
  finishGame,
} from './ui.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deploySelectedCard() {
  if (!gameState.selectedCardId || gameState.isBattling) return;

  const myCard = gameState.remainingPlayer.find((card) => card.id === gameState.selectedCardId);
  if (!myCard || gameState.remainingOpp.length === 0) return;

  document.getElementById('deploy-bar')?.remove();
  gameState.isBattling = true;
  gameState.remainingPlayer = gameState.remainingPlayer.filter((card) => card.id !== myCard.id);
  renderMyHand();

  const oppIndex = Math.floor(Math.random() * gameState.remainingOpp.length);
  const oppCard = gameState.remainingOpp.splice(oppIndex, 1)[0];

  document.getElementById('vs-idle').classList.add('hidden');
  document.getElementById('vs-countdown').classList.remove('hidden');
  document.getElementById('vs-battle').classList.add('hidden');

  const numEl = document.getElementById('countdown-num');
  for (let i = 3; i >= 1; i -= 1) {
    numEl.textContent = String(i);
    await wait(450);
  }

  document.getElementById('vs-countdown').classList.add('hidden');
  document.getElementById('vs-battle').classList.remove('hidden');
  renderVsCard('vs-my-card', myCard);
  renderVsCard('vs-opp-card', oppCard);

  const myWin = myCard.power > oppCard.power;
  const isDraw = myCard.power === oppCard.power;
  const stamp = document.getElementById('battle-result-stamp');
  const resultText = document.getElementById('result-text');
  stamp.classList.remove('hidden');

  if (isDraw) {
    resultText.textContent = '무승부';
    resultText.className = 'stamp draw';
    gameState.draws += 1;
  } else if (myWin) {
    resultText.textContent = 'WIN';
    resultText.className = 'stamp win';
    document.getElementById('vs-my-card').classList.add('gold-glow');
    document.getElementById('vs-opp-card').classList.add('cracked');
    gameState.wins += 1;
  } else {
    resultText.textContent = 'LOSE';
    resultText.className = 'stamp lose';
    document.getElementById('vs-my-card').classList.add('cracked');
    document.getElementById('vs-opp-card').classList.add('gold-glow');
    gameState.loses += 1;
  }

  gameState.usedPlayer.unshift({ ...myCard, win: myWin, draw: isDraw });
  gameState.usedOpp.unshift({ ...oppCard, win: !myWin && !isDraw, draw: isDraw });
  gameState.battleLog.push({
    battleNum: gameState.battleLog.length + 1,
    myCard: { ...myCard },
    oppCard: { ...oppCard },
    win: myWin,
    draw: isDraw,
  });

  updateBattleUI();
  renderUsedCards();
  renderOppRemaining();
  await wait(1600);

  stamp.classList.add('hidden');
  document.getElementById('vs-my-card').innerHTML = '';
  document.getElementById('vs-opp-card').innerHTML = '';
  document.getElementById('vs-my-card').className = '';
  document.getElementById('vs-opp-card').className = '';
  gameState.isBattling = false;
  gameState.selectedCardId = null;

  if (gameState.remainingPlayer.length > 0) {
    document.getElementById('vs-idle').classList.remove('hidden');
    document.getElementById('vs-battle').classList.add('hidden');
    renderMyHand();
  } else {
    finishGame();
  }
}
