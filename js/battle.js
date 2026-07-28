import { gameState } from './state.js';
import { renderVsCard } from './cards.js';
import {
  updateBattleUI,
  renderMyHand,
  renderOppRemaining,
  renderUsedCards,
  finishGame
} from './ui.js';

export async function deploySelectedCard() {
  if (!gameState.selectedCardId || gameState.isBattling) return;

  const myCard = gameState.remainingPlayer.find(c => c.id === gameState.selectedCardId);
  if (!myCard) return;

  document.getElementById('deploy-bar')?.remove();
  gameState.isBattling = true;
  gameState.remainingPlayer = gameState.remainingPlayer.filter(c => c.id !== myCard.id);
  renderMyHand();

  if (gameState.remainingOpp.length === 0) {
    gameState.isBattling = false;
    return;
  }

  const oppCard = gameState.remainingOpp.splice(
    Math.floor(Math.random() * gameState.remainingOpp.length),
    1
  )[0];

  // Countdown
  document.getElementById('vs-idle').classList.add('hidden');
  document.getElementById('vs-countdown').classList.remove('hidden');
  document.getElementById('vs-battle').classList.add('hidden');

  const numEl = document.getElementById('countdown-num');
  for (let i = 3; i >= 1; i--) {
    numEl.innerText = i;
    await new Promise(r => setTimeout(r, 600));
  }

  // Show VS
  document.getElementById('vs-countdown').classList.add('hidden');
  document.getElementById('vs-battle').classList.remove('hidden');
  renderVsCard('vs-my-card', myCard);
  renderVsCard('vs-opp-card', oppCard);

  const myWin = myCard.power > oppCard.power;
  const stamp = document.getElementById('battle-result-stamp');
  const resultText = document.getElementById('result-text');
  stamp.classList.remove('hidden');

  if (myWin) {
    resultText.innerHTML = `<span class="text-emerald-400">WIN</span>`;
    document.getElementById('vs-my-card').classList.add('gold-glow');
    document.getElementById('vs-opp-card').classList.add('cracked');
    gameState.wins++;
  } else {
    resultText.innerHTML = `<span class="text-red-500">LOSE</span>`;
    document.getElementById('vs-my-card').classList.add('cracked');
    document.getElementById('vs-opp-card').classList.add('gold-glow');
    gameState.loses++;
  }

  gameState.usedPlayer.unshift({ ...myCard, win: myWin });
  gameState.usedOpp.unshift({ ...oppCard, win: !myWin });

  gameState.battleLog.push({
    battleNum: gameState.battleLog.length + 1,
    myCard: { ...myCard },
    oppCard: { ...oppCard },
    win: myWin
  });

  updateBattleUI();
  renderUsedCards();
  renderOppRemaining();

  await new Promise(r => setTimeout(r, 2200));

  // Reset
  stamp.classList.add('hidden');
  document.getElementById('vs-my-card').innerHTML = '';
  document.getElementById('vs-opp-card').innerHTML = '';
  document.getElementById('vs-my-card').className = 'rounded-2xl overflow-hidden border-2 border-emerald-500';
  document.getElementById('vs-opp-card').className = 'rounded-2xl overflow-hidden border-2 border-red-500';
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
