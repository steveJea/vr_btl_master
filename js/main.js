import { findFeatured, loadRealData } from './data.js';
import { resolvedDefaultMode } from './config.js';
import { gameState, resetGameState } from './state.js';
import { dealCards } from './cards.js';
import {
  hideCardModal,
  renderChannels,
  renderDeckGrid,
  renderModeCards,
  renderSharedBanner,
  showBattleScreen,
  showDeckScreen,
  toggleHandSort,
  showRankScreen,
  showScreen
} from './ui.js';
import { invalidateBattle } from './battle.js';
import { shuffle } from './utils.js';
import { armMusic, toggleMute, unlockAudio } from './audio.js';

let cardsReady = false;

function setStartEnabled(ready, label) {
  const button = document.getElementById('start-btn');
  if (!button) return;
  button.disabled = !ready;
  if (label) button.textContent = label;
}

window.startDefaultGame = function startDefaultGame() {
  if (!cardsReady) return;
  unlockAudio();
  window.selectGameMode(resolvedDefaultMode());
};

window.selectGameMode = function selectGameMode(mode) {
  if (!cardsReady) return;
  armMusic();
  resetGameState(mode);
  gameState.playerDeck = dealCards(mode);
  gameState.opponentDeck = dealCards(mode);
  gameState.remainingPlayer = [...gameState.playerDeck];
  gameState.remainingOpp = [...gameState.opponentDeck];
  showDeckScreen();
};

window.changeDeck = function changeDeck() {
  if (gameState.changeCount <= 0) return;
  gameState.changeCount -= 1;
  gameState.playerDeck = dealCards(gameState.mode);
  document.getElementById('change-count').textContent = `${gameState.changeCount}/3`;
  document.getElementById('change-btn').disabled = gameState.changeCount <= 0;
  renderDeckGrid();
};

window.confirmDeck = function confirmDeck() {
  unlockAudio();
  gameState.remainingPlayer = [...gameState.playerDeck];
  gameState.remainingOpp = shuffle([...gameState.opponentDeck]);
  showBattleScreen();
};

window.goHome = function goHome() {
  invalidateBattle();
  hideCardModal();
  showScreen('main-screen');
};

window.toggleMuteBtn = function toggleMuteBtn() {
  unlockAudio();
  const muted = toggleMute();
  const button = document.getElementById('mute-btn');
  if (!button) return;
  button.textContent = muted ? '소리 끔' : '소리';
  button.classList.toggle('is-muted', muted);
  button.setAttribute('aria-pressed', muted ? 'true' : 'false');
};

function bind(id, handler) {
  document.getElementById(id)?.addEventListener('click', handler);
}

async function init() {
  renderModeCards();
  renderChannels(document.getElementById('channels'));
  showScreen('main-screen');
  setStartEnabled(false, '카드를 불러오는 중');

  try {
    await loadRealData();
    cardsReady = true;
    setStartEnabled(true, '배틀 시작');
    const featured = findFeatured();
    const art = document.getElementById('featured-art');
    if (featured && art) art.alt = featured.name;
    renderSharedBanner();
  } catch (error) {
    console.log(JSON.stringify({ message: 'card load failed', error: String(error) }));
    setStartEnabled(false, '카드를 불러오지 못했습니다');
  }

  bind('start-btn', () => window.startDefaultGame());
  bind('mode-other-btn', () => {
    showScreen('choice-screen');
  });
  bind('home-btn', () => window.goHome());
  bind('mute-btn', () => window.toggleMuteBtn());
  bind('change-btn', () => window.changeDeck());
  bind('confirm-btn', () => window.confirmDeck());
  bind('hand-sort', () => toggleHandSort());
  bind('rank-open-btn', () => window.showRank());
  bind('result-rank', () => window.showRank(gameState.mode));
  bind('result-home', () => window.goHome());
  bind('rank-back', () => window.goHome());
  document.getElementById('card-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'card-modal') hideCardModal();
  });

  window.showRank = (mode) => {
    unlockAudio();
    showRankScreen(mode);
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideCardModal();
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const main = document.getElementById('main-screen');
    if (!main?.classList.contains('active')) return;
    if (event.target.closest('button, a, input')) return;
    event.preventDefault();
    window.startDefaultGame();
  });
}

window.onload = init;
