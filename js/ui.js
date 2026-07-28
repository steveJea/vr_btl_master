import { IMAGE_BASE } from './config.js';
import { gameState } from './state.js';
import { createCardElement } from './cards.js';
import { getGradeBorder } from './utils.js';
import { playBGM } from './audio.js';

export function showScreen(id) {
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.style.setProperty('display', 'none', 'important');
  });
  const t = document.getElementById(id);
  if (t) {
    t.classList.add('active');
    t.style.setProperty('display', 'block', 'important');
  }

  // 화면별 배경음 전환
  switch (id) {
    case 'main-screen':
      playBGM('main');
      break;
    case 'choice-screen':
    case 'deck-screen':
      playBGM('select');
      break;
    case 'battle-screen':
      playBGM('battle');
      break;
    case 'result-screen':
      playBGM('result');
      break;
  }
}

export function showDeckScreen() {
  showScreen('deck-screen');
  document.getElementById('mode-badge').innerText = `${gameState.mode} VS ${gameState.mode}`;
  document.getElementById('change-count').innerText = `${gameState.changeCount}/3`;
  document.getElementById('change-btn').disabled = gameState.changeCount <= 0;
  renderDeckGrid();
}

export function renderDeckGrid() {
  const grid = document.getElementById('deck-grid');
  grid.innerHTML = '';
  gameState.playerDeck.forEach(card => {
    grid.appendChild(createCardElement(card, showCardModal));
  });
}

export function showBattleScreen() {
  showScreen('battle-screen');
  updateBattleUI();
  renderMyHand();
  renderOppRemaining();
  renderUsedCards();
  document.getElementById('vs-idle').classList.remove('hidden');
  document.getElementById('vs-countdown').classList.add('hidden');
  document.getElementById('vs-battle').classList.add('hidden');
}

export function updateBattleUI() {
  const rem = gameState.remainingPlayer.length;
  document.getElementById('battle-progress').innerText =
    `${String(gameState.mode - rem + 1).padStart(2, '0')} / ${gameState.mode}`;
  document.getElementById('win-count').innerText = gameState.wins;
  document.getElementById('lose-count').innerText = gameState.loses;
  document.getElementById('hand-count').innerText = `${rem} cards left`;
}

export function renderMyHand() {
  const container = document.getElementById('my-hand');
  container.innerHTML = '';

  gameState.remainingPlayer.forEach(card => {
    const el = document.createElement('div');
    el.className = `card flex-shrink-0 w-36 bg-zinc-900 border-2 ${getGradeBorder(card.grade)} rounded-2xl overflow-hidden cursor-pointer`;
    const imgSrc = `${IMAGE_BASE}${card.id}.jpg`;

    el.innerHTML = `
      <div class="relative h-28">
        <img src="${imgSrc}" class="w-full h-full object-cover" onerror="this.src='https://picsum.photos/id/29/300/380'">
        <div class="absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] font-bold bg-black/70 rounded">${card.grade.split(' ')[0]}</div>
      </div>
      <div class="px-2.5 py-2">
        <div class="font-bold text-sm truncate">${card.name}</div>
      </div>
    `;

    el.onclick = () => {
      gameState.selectedCardId = card.id;
      showDeployBar(card);
    };
    container.appendChild(el);
  });
}

export function showDeployBar(card) {
  const old = document.getElementById('deploy-bar');
  if (old) old.remove();

  const bar = document.createElement('div');
  bar.id = 'deploy-bar';
  bar.className = 'fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-yellow-500/40 p-4 z-40';
  bar.innerHTML = `
    <div class="max-w-lg mx-auto flex items-center gap-4">
      <div class="flex-1">
        <div class="text-xs text-yellow-400">선택됨</div>
        <div class="font-bold">${card.name}</div>
      </div>
      <button id="info-btn" class="px-5 py-3 border border-white/30 hover:bg-zinc-800 rounded-xl text-sm">
        Info
      </button>
      <button id="deploy-btn" class="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-xl">
        DEPLOY
      </button>
      <button id="cancel-btn" class="px-4 py-3 text-sm text-zinc-400">취소</button>
    </div>
  `;
  document.body.appendChild(bar);

  document.getElementById('info-btn').onclick = () => showCardModal(card);
  document.getElementById('deploy-btn').onclick = () => {
    import('./battle.js').then(m => m.deploySelectedCard());
  };
  document.getElementById('cancel-btn').onclick = () => {
    document.getElementById('deploy-bar')?.remove();
  };
}

export function renderOppRemaining() {
  const c = document.getElementById('opp-remaining');
  c.innerHTML = '';
  gameState.remainingOpp.forEach(() => {
    const d = document.createElement('div');
    d.className = 'w-10 h-14 bg-zinc-800 border border-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0';
    d.innerHTML = `<i class="fa-solid fa-question text-red-600/60 text-xl"></i>`;
    c.appendChild(d);
  });
}

export function renderUsedCards() {
  // Opponent used
  const oppUsed = document.getElementById('opp-used');
  oppUsed.innerHTML = '';
  gameState.usedOpp.slice(0, 6).forEach(u => {
    const d = document.createElement('div');
    d.className = `w-10 h-12 rounded-lg overflow-hidden border cursor-pointer ${u.win ? 'border-emerald-400' : 'border-red-600'}`;
    d.style.background = `url('${IMAGE_BASE}${u.id}.jpg') center/cover`;
    d.onclick = () => showCardModal(u);
    oppUsed.appendChild(d);
  });

  // My used
  const myUsed = document.getElementById('my-used');
  myUsed.innerHTML = '';
  gameState.usedPlayer.slice(0, 8).forEach(u => {
    const d = document.createElement('div');
    d.className = `w-10 h-12 rounded-lg overflow-hidden border cursor-pointer ${u.win ? 'border-emerald-400' : 'border-red-600'}`;
    d.style.background = `url('${IMAGE_BASE}${u.id}.jpg') center/cover`;
    d.onclick = () => showCardModal(u);
    myUsed.appendChild(d);
  });
}

export function showCardModal(card) {
  if (!card) return;

  const modal = document.getElementById('card-modal');
  const content = document.getElementById('modal-content');

  if (!modal || !content) {
    console.error('모달 요소를 찾을 수 없습니다.');
    return;
  }

  const imgSrc = `${IMAGE_BASE}${card.id}.jpg`;

  content.innerHTML = `
    <div class="relative h-80">
      <img src="${imgSrc}" class="w-full h-full object-cover object-top" onerror="this.src='https://picsum.photos/id/29/300/380'">
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
      <div class="absolute top-4 right-4">
        <span class="px-3 py-1 text-sm font-bold bg-black/60 rounded-full border border-white/20">${card.grade}</span>
      </div>
      <div class="absolute bottom-4 left-4 right-4">
        <div class="text-3xl font-black">${card.name}</div>
        <div class="text-white/70 text-sm">${card.age}세 • ${card.gender} • ${card.region}</div>
      </div>
    </div>
    <div class="p-5">
      <div class="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <div class="text-xs text-zinc-400">CLASS</div>
          <div class="font-bold text-lg">${card.class || '-'}</div>
        </div>
        <div>
          <div class="text-xs text-zinc-400">ATTRIBUTE</div>
          <div class="font-bold text-lg text-emerald-400">${card.attribute || '-'}</div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 mb-5">
        <div class="bg-zinc-800/80 rounded-xl p-2.5 text-center border border-zinc-700">
          <div class="text-[10px] text-zinc-400 tracking-wider">HP</div>
          <div class="font-bold text-lg text-red-400">${card.hp || 0}</div>
        </div>
        <div class="bg-zinc-800/80 rounded-xl p-2.5 text-center border border-zinc-700">
          <div class="text-[10px] text-zinc-400 tracking-wider">ATK</div>
          <div class="font-bold text-lg text-orange-400">${card.atk || 0}</div>
        </div>
        <div class="bg-zinc-800/80 rounded-xl p-2.5 text-center border border-zinc-700">
          <div class="text-[10px] text-zinc-400 tracking-wider">DEF</div>
          <div class="font-bold text-lg text-blue-400">${card.def || 0}</div>
        </div>
        <div class="bg-zinc-800/80 rounded-xl p-2.5 text-center border border-zinc-700">
          <div class="text-[10px] text-zinc-400 tracking-wider">PHY</div>
          <div class="font-bold text-lg text-emerald-400">${card.phy || 0}</div>
        </div>
        <div class="bg-zinc-800/80 rounded-xl p-2.5 text-center border border-zinc-700">
          <div class="text-[10px] text-zinc-400 tracking-wider">MEN</div>
          <div class="font-bold text-lg text-violet-400">${card.men || 0}</div>
        </div>
        <div class="bg-zinc-800/80 rounded-xl p-2.5 text-center border border-zinc-700">
          <div class="text-[10px] text-zinc-400 tracking-wider">MOR</div>
          <div class="font-bold text-lg text-amber-400">${card.mor || 0}</div>
        </div>
      </div>
      <button onclick="window.hideCardModal()" class="w-full py-3 border border-white/30 hover:bg-white/5 rounded-2xl">닫기</button>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function hideCardModal() {
  const modal = document.getElementById('card-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// 전역에서도 접근 가능하게
window.hideCardModal = hideCardModal;
window.showCardModal = showCardModal;

export function renderBattleLog() {
  const container = document.getElementById('battle-log');
  container.innerHTML = '';

  if (!gameState.battleLog || gameState.battleLog.length === 0) {
    container.innerHTML = `<div class="text-zinc-500 text-sm">기록이 없습니다.</div>`;
    return;
  }

  gameState.battleLog.forEach((log) => {
    const el = document.createElement('div');
    el.className = `bg-zinc-950 border border-zinc-700 rounded-2xl p-3 flex items-center gap-3 hover:border-zinc-500 transition`;

    const myWinClass = log.win ? 'border-emerald-500' : 'border-red-600';
    const oppWinClass = log.win ? 'border-red-600' : 'border-emerald-500';

    const myCardImg = document.createElement('div');
    myCardImg.className = `w-14 h-14 rounded-xl overflow-hidden border-2 ${myWinClass} flex-shrink-0 cursor-pointer`;
    myCardImg.style.backgroundImage = `url('${IMAGE_BASE}${log.myCard.id}.jpg')`;
    myCardImg.style.backgroundSize = 'cover';
    myCardImg.style.backgroundPosition = 'center';
    myCardImg.onclick = () => showCardModal(log.myCard);

    const oppCardImg = document.createElement('div');
    oppCardImg.className = `w-14 h-14 rounded-xl overflow-hidden border-2 ${oppWinClass} flex-shrink-0 cursor-pointer`;
    oppCardImg.style.backgroundImage = `url('${IMAGE_BASE}${log.oppCard.id}.jpg')`;
    oppCardImg.style.backgroundSize = 'cover';
    oppCardImg.style.backgroundPosition = 'center';
    oppCardImg.onclick = () => showCardModal(log.oppCard);

    el.innerHTML = `
      <div class="text-xs text-zinc-500 w-10 text-center">#${log.battleNum}</div>
      <div class="my-card-slot"></div>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-sm truncate">${log.myCard.name}</div>
        <div class="text-xs text-zinc-400">${log.myCard.grade}</div>
      </div>
      <div class="px-3 text-center">
        <div class="text-xs font-black ${log.win ? 'text-emerald-400' : 'text-red-400'}">
          ${log.win ? 'WIN' : 'LOSE'}
        </div>
      </div>
      <div class="flex-1 min-w-0 text-right">
        <div class="font-bold text-sm truncate">${log.oppCard.name}</div>
        <div class="text-xs text-zinc-400">${log.oppCard.grade}</div>
      </div>
      <div class="opp-card-slot"></div>
    `;

    el.querySelector('.my-card-slot').replaceWith(myCardImg);
    el.querySelector('.opp-card-slot').replaceWith(oppCardImg);

    container.appendChild(el);
  });
}

export function finishGame() {
  showScreen('result-screen');

  const isWin = gameState.wins > gameState.loses;
  const finalText = document.getElementById('final-result-text');

  if (isWin) {
    finalText.innerHTML = `YOUR <span class="text-emerald-400">VICTORY</span>`;
  } else {
    finalText.innerHTML = `CITY <span class="text-red-500">DEFEAT</span>`;
  }

  document.getElementById('final-score').innerText = `${gameState.wins} WINS — ${gameState.loses} LOSES`;
  renderBattleLog();

  // 화면별 배경음 전환
switch (id) {
  case 'main-screen':   playBGM('main'); break;
  case 'choice-screen':
  case 'deck-screen':   playBGM('select'); break;
  case 'battle-screen': playBGM('battle'); break;
  case 'result-screen': playBGM('result'); break;
}
}
