import { loadRealData } from './data.js';
import { gameState, resetGameState } from './state.js';
import { dealCards } from './cards.js';
import {
  showScreen,
  showDeckScreen,
  showBattleScreen,
  renderDeckGrid
} from './ui.js';
import { shuffle } from './utils.js';
import { unlockAudio, playBGM, toggleMute, getMuted } from './audio.js';

// 전역 함수로 노출 (HTML onclick에서 사용)
window.startGame = function () {
  unlockAudio();
  showScreen('choice-screen');
};

window.selectGameMode = function (m) {
  resetGameState(m);
  gameState.playerDeck = dealCards(m);
  gameState.opponentDeck = dealCards(m);
  gameState.remainingPlayer = [...gameState.playerDeck];
  gameState.remainingOpp = [...gameState.opponentDeck];
  showDeckScreen();
};

window.changeDeck = function () {
  if (gameState.changeCount <= 0) return;
  gameState.changeCount--;
  gameState.playerDeck = dealCards(gameState.mode);
  document.getElementById('change-count').innerText = `${gameState.changeCount}/3`;
  document.getElementById('change-btn').disabled = gameState.changeCount <= 0;
  renderDeckGrid();
};

window.confirmDeck = function () {
  gameState.remainingPlayer = [...gameState.playerDeck];
  gameState.remainingOpp = shuffle([...gameState.opponentDeck]);
  showBattleScreen();
};

window.restartGame = function () {
  location.reload();
};

window.toggleMuteBtn = function () {
  const muted = toggleMute();
  const btn = document.getElementById('mute-btn');
  if (btn) {
    btn.innerHTML = muted
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
    btn.classList.toggle('muted', muted);
  }
};

async function init() {
  await loadRealData();
  showScreen('main-screen');

  // 키 입력으로 시작 + 오디오 잠금 해제
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('main-screen').classList.contains('active')) {
      unlockAudio();
      window.startGame();
    }
  });

  // 메인 화면 클릭 시 오디오 잠금 해제 + 메인 BGM 재생
  document.getElementById('main-screen')?.addEventListener('click', () => {
    unlockAudio();
    if (document.getElementById('main-screen').classList.contains('active')) {
      playBGM('main');
    }
  }, { once: true });

  // 우클릭 방지
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 개발자도구 단축키 일부 차단
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) e.preventDefault();
    if (e.ctrlKey && e.key === 'u') e.preventDefault();
  });
}

window.onload = init;
