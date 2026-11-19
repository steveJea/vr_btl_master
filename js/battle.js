import { gameState } from './state.js';
import { renderVsCard } from './cards.js';
import {
  updateBattleUI,
  renderMyHand,
  renderOppRemaining,
  renderUsedCards,
  finishGame
} from './ui.js';

let battleSeq = 0;

export function invalidateBattle() {
  battleSeq += 1;
  gameState.isBattling = false;
  gameState.selectedCardId = null;
  document.getElementById('deploy-bar')?.remove();
  document.body.classList.remove('deploying');
  clearClash();
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearClash() {
  const zone = document.getElementById('vs-zone');
  zone?.classList.remove('is-shake', 'is-flash');
  document.getElementById('vs-burst')?.classList.remove('is-on');
  document.getElementById('vs-burst')?.replaceChildren();
  ['vs-my-card', 'vs-opp-card'].forEach((id) => {
    const slot = document.getElementById(id);
    if (!slot) return;
    slot.className = 'vs-slot';
  });
}

function sparkBurst() {
  const burst = document.getElementById('vs-burst');
  if (!burst) return;
  burst.replaceChildren();
  burst.classList.remove('is-on');
  const count = 8;
  for (let i = 0; i < count; i += 1) {
    const shard = document.createElement('i');
    const angle = (Math.PI * 2 * i) / count;
    shard.style.setProperty('--x', `${Math.round(Math.cos(angle) * 72)}px`);
    shard.style.setProperty('--y', `${Math.round(Math.sin(angle) * 56)}px`);
    burst.appendChild(shard);
  }
  burst.getBoundingClientRect();
  burst.classList.add('is-on');
}

function disintegrate(slot) {
  const img = slot.querySelector('img');
  const src = img?.currentSrc || img?.src || '';
  if (!src || src.includes('card-fallback')) {
    slot.classList.add('is-dissolve');
    return;
  }
  const pieces = 6;
  const ash = document.createElement('div');
  ash.className = 'ash';
  for (let i = 0; i < pieces; i += 1) {
    const strip = document.createElement('span');
    strip.style.top = `${(100 / pieces) * i}%`;
    strip.style.height = `${100 / pieces + 0.6}%`;
    strip.style.backgroundImage = `url("${src.replace(/"/g, '')}")`;
    strip.style.backgroundSize = `auto ${pieces * 100}%`;
    strip.style.backgroundPosition = `center ${(pieces === 1 ? 0 : (i / (pieces - 1)) * 100)}%`;
    const dir = i % 2 === 0 ? -1 : 1;
    strip.style.setProperty('--dx', `${dir * (14 + i * 8)}px`);
    strip.style.setProperty('--dy', `${(i - 2) * 9}px`);
    ash.appendChild(strip);
  }
  slot.appendChild(ash);
  slot.classList.add('is-dissolve');
}

async function playClash(myWin, isDraw, alive) {
  const zone = document.getElementById('vs-zone');
  const mine = document.getElementById('vs-my-card');
  const opp = document.getElementById('vs-opp-card');
  const winner = isDraw ? null : (myWin ? mine : opp);
  const loser = isDraw ? null : (myWin ? opp : mine);

  if (reducedMotion()) {
    winner?.classList.add('is-winner');
    loser?.classList.add('is-gone');
    return;
  }

  mine.classList.add('is-rush', 'from-left');
  opp.classList.add('is-rush', 'from-right');
  mine.getBoundingClientRect();
  mine.classList.add('is-in');
  opp.classList.add('is-in');
  await wait(420);
  if (!alive()) return;

  zone?.classList.add('is-shake', 'is-flash');
  sparkBurst();
  await wait(160);
  if (!alive()) return;

  if (winner && loser) {
    winner.classList.add('is-winner');
    disintegrate(loser);
    await wait(560);
  } else {
    mine.classList.add('is-winner');
    opp.classList.add('is-winner');
    await wait(280);
  }
  if (!alive()) return;
  zone?.classList.remove('is-shake', 'is-flash');
}

export async function deploySelectedCard() {
  if (!gameState.selectedCardId || gameState.isBattling) return;

  const myCard = gameState.remainingPlayer.find((card) => card.id === gameState.selectedCardId);
  if (!myCard) return;

  document.getElementById('deploy-bar')?.remove();
  document.body.classList.remove('deploying');
  const token = ++battleSeq;
  const alive = () => token === battleSeq;
  gameState.isBattling = true;
  gameState.remainingPlayer = gameState.remainingPlayer.filter((card) => card.id !== myCard.id);
  renderMyHand();

  if (gameState.remainingOpp.length === 0) {
    gameState.isBattling = false;
    return;
  }

  const oppCard = gameState.remainingOpp.splice(
    Math.floor(Math.random() * gameState.remainingOpp.length),
    1
  )[0];

  clearClash();
  document.getElementById('vs-idle')?.classList.add('hidden');
  document.getElementById('vs-battle')?.classList.remove('hidden');
  document.getElementById('battle-result-stamp')?.classList.add('hidden');
  renderVsCard('vs-my-card', myCard);
  renderVsCard('vs-opp-card', oppCard);

  const myWin = myCard.power > oppCard.power;
  const isDraw = myCard.power === oppCard.power;

  await playClash(myWin, isDraw, alive);
  if (!alive()) return;

  const stamp = document.getElementById('battle-result-stamp');
  const resultText = document.getElementById('result-text');
  stamp?.classList.remove('hidden');
  stamp?.classList.toggle('is-pop', !reducedMotion());

  if (isDraw) {
    resultText.innerHTML = '<span class="draw">무승부</span>';
    gameState.draws += 1;
  } else if (myWin) {
    resultText.innerHTML = '<span class="win">WIN</span>';
    gameState.wins += 1;
  } else {
    resultText.innerHTML = '<span class="lose">LOSE</span>';
    gameState.loses += 1;
  }

  gameState.usedPlayer.unshift({ ...myCard, win: myWin, draw: isDraw });
  gameState.usedOpp.unshift({ ...oppCard, win: !myWin && !isDraw, draw: isDraw });
  gameState.battleLog.push({
    battleNum: gameState.battleLog.length + 1,
    myCard: { ...myCard },
    oppCard: { ...oppCard },
    win: myWin,
    draw: isDraw
  });

  updateBattleUI();
  renderUsedCards();
  renderOppRemaining();

  await wait(reducedMotion() ? 700 : 780);
  if (!alive()) return;

  stamp?.classList.add('hidden');
  stamp?.classList.remove('is-pop');
  clearClash();
  document.getElementById('vs-my-card').innerHTML = '';
  document.getElementById('vs-opp-card').innerHTML = '';
  gameState.isBattling = false;
  gameState.selectedCardId = null;

  if (gameState.remainingPlayer.length > 0) {
    document.getElementById('vs-idle')?.classList.remove('hidden');
    document.getElementById('vs-battle')?.classList.add('hidden');
    renderMyHand();
  } else {
    finishGame();
  }
}
