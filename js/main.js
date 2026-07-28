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
import { unlockAudio, playBGM, toggleMute } from './audio.js';

// 전역 함수로 노출 (HTML onclick에서 사용)
window.startGame = function () {
  unlockAudio();          // 반드시 먼저
  playBGM('select');      // 바로 선택 화면 BGM 재생 (같은 제스처 안에서)
  showScreen('choice-screen');
};

window.selectGameMode = function (m) {
  unlockAudio();
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
  unlockAudio();
  gameState.remainingPlayer = [...gameState.playerDeck];
  gameState.remainingOpp = shuffle([...gameState.opponentDeck]);
  showBattleScreen();
};

window.restartGame = function () {
  location.reload();
};

window.toggleMuteBtn = function () {
  unlockAudio();
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

  // 키 입력으로 시작
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('main-screen')?.classList.contains('active')) {
      window.startGame();
    }
  });

  // 메인 화면 어디든 클릭하면 메인 BGM 시도
  document.getElementById('main-screen')?.addEventListener('click', (e) => {
    // START 버튼 클릭은 startGame에서 처리
    if (e.target.closest('button')) return;
    unlockAudio();
    playBGM('main');
  });

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
