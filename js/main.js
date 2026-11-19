import { loadRealData } from './data.js';
import { DEFAULT_MODE } from './config.js';
import { gameState, resetGameState } from './state.js';
import { dealCards } from './cards.js';
import {
  showScreen,
  showDeckScreen,
  showBattleScreen,
  renderDeckGrid,
  markDefaultMode,
  renderChannels,
  hideCardModal,
  openRanking,
  bindRankingTabs,
} from './ui.js';
import { shuffle } from './utils.js';
import { unlockAudio, playBGM, toggleMute } from './audio.js';

function begin(mode) {
  unlockAudio();
  resetGameState(mode);
  gameState.playerDeck = dealCards(mode);
  gameState.opponentDeck = dealCards(mode);
  gameState.remainingPlayer = [...gameState.playerDeck];
  gameState.remainingOpp = [...gameState.opponentDeck];
  showDeckScreen();
}

function onTitle() {
  return document.getElementById('main-screen')?.classList.contains('active');
}

function bind() {
  document.getElementById('start-btn').addEventListener('click', () => begin(DEFAULT_MODE));
  document.getElementById('mode-link').addEventListener('click', () => {
    unlockAudio();
    playBGM('select');
    showScreen('choice-screen');
  });
  document.getElementById('rank-link').addEventListener('click', () => {
    unlockAudio();
    openRanking(DEFAULT_MODE);
  });
  document.getElementById('rank-from-result').addEventListener('click', () => openRanking(gameState.mode || DEFAULT_MODE));
  document.getElementById('home-from-rank').addEventListener('click', () => {
    showScreen('main-screen');
  });
  document.querySelectorAll('[data-mode-card]').forEach((button) => {
    button.addEventListener('click', () => begin(Number(button.dataset.modeCard)));
  });
  document.getElementById('change-btn').addEventListener('click', () => {
    if (gameState.changeCount <= 0) return;
    gameState.changeCount -= 1;
    gameState.playerDeck = dealCards(gameState.mode);
    document.getElementById('change-count').textContent = `${gameState.changeCount}/3`;
    document.getElementById('change-btn').disabled = gameState.changeCount <= 0;
    renderDeckGrid();
  });
  document.getElementById('confirm-btn').addEventListener('click', () => {
    unlockAudio();
    gameState.remainingPlayer = [...gameState.playerDeck];
    gameState.remainingOpp = shuffle([...gameState.opponentDeck]);
    showBattleScreen();
  });
  document.getElementById('home-btn').addEventListener('click', () => location.reload());
  document.getElementById('again-btn').addEventListener('click', () => location.reload());
  document.getElementById('mute-btn').addEventListener('click', () => {
    unlockAudio();
    const muted = toggleMute();
    const btn = document.getElementById('mute-btn');
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.querySelector('span').textContent = muted ? '소리 켜기' : '소리 끄기';
  });
  document.getElementById('card-modal').addEventListener('click', (event) => {
    if (event.target.id === 'card-modal') hideCardModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideCardModal();
    if ((event.key === 'Enter' || event.key === ' ') && onTitle() && event.target === document.body) {
      event.preventDefault();
      begin(DEFAULT_MODE);
    }
  });
  bindRankingTabs();
}

async function init() {
  await loadRealData();
  markDefaultMode();
  renderChannels(document.getElementById('title-channels'));
  showScreen('main-screen');
  bind();
}

init();
