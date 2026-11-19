import { OFFICIAL_CHANNELS, DEFAULT_MODE, MODE_BLURB } from './config.js';
import { gameState } from './state.js';
import { createCardElement, mountCardImage } from './cards.js';
import { gradeClass, fmtNum, esc } from './utils.js';
import { playBGM } from './audio.js';
import { activeShareTargets, runShare, sharePageUrl } from './share.js';
import { localSummary, submitRun, loadRanking } from './ranking.js';

const RANK_NOTE = '이름이나 계정은 저장하지 않습니다. 순위가 잠시 닫혀 있어도 배틀은 계속됩니다.';

export function showScreen(id) {
  document.querySelectorAll('.section').forEach((section) => section.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
  const bgm = {
    'main-screen': 'main',
    'choice-screen': 'select',
    'deck-screen': 'select',
    'battle-screen': 'battle',
    'result-screen': 'result',
    'ranking-screen': 'result',
  }[id];
  if (bgm) playBGM(bgm);
}

export function markDefaultMode() {
  document.querySelectorAll('[data-mode-card]').forEach((card) => {
    card.classList.toggle('is-default', Number(card.dataset.modeCard) === DEFAULT_MODE);
  });
  const label = document.getElementById('start-mode-label');
  if (label) label.textContent = `${DEFAULT_MODE}라운드`;
}

function channelLinks() {
  return OFFICIAL_CHANNELS.filter((channel) => /^https:\/\/\S+$/.test(channel.url || ''));
}

export function renderChannels(container) {
  if (!container) return;
  const links = channelLinks();
  container.hidden = links.length === 0;
  container.innerHTML = links.map((channel) => (
    `<a class="channel-link" href="${esc(channel.url)}" target="_blank" rel="noopener noreferrer">${esc(channel.label)}</a>`
  )).join('');
}

export function showDeckScreen() {
  showScreen('deck-screen');
  document.getElementById('mode-badge').textContent = `${gameState.mode} VS ${gameState.mode}`;
  document.getElementById('mode-blurb').textContent = MODE_BLURB[gameState.mode] || '';
  document.getElementById('change-count').textContent = `${gameState.changeCount}/3`;
  document.getElementById('change-btn').disabled = gameState.changeCount <= 0;
  renderDeckGrid();
}

export function renderDeckGrid() {
  const grid = document.getElementById('deck-grid');
  grid.innerHTML = '';
  gameState.playerDeck.forEach((card) => {
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
  document.getElementById('battle-result-stamp')?.classList.add('hidden');
}

export function updateBattleUI() {
  const remaining = gameState.remainingPlayer.length;
  const current = Math.min(gameState.mode, gameState.mode - remaining + 1);
  document.getElementById('battle-progress').textContent = `${String(current).padStart(2, '0')} / ${gameState.mode}`;
  document.getElementById('win-count').textContent = fmtNum(gameState.wins);
  document.getElementById('lose-count').textContent = fmtNum(gameState.loses);
  document.getElementById('draw-count').textContent = fmtNum(gameState.draws);
  document.getElementById('hand-count').textContent = `${remaining}장 남음`;
}

export function renderMyHand() {
  const container = document.getElementById('my-hand');
  container.innerHTML = '';
  gameState.remainingPlayer.forEach((card) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `hand-card ${gradeClass(card.grade)}`;
    el.innerHTML = `
      <span class="hand-art"><img alt=""></span>
      <span class="hand-name">${esc(card.name)}</span>
      <span class="hand-power">${fmtNum(card.power)}</span>
    `;
    mountCardImage(el.querySelector('img'), card);
    el.addEventListener('click', () => {
      gameState.selectedCardId = card.id;
      showDeployBar(card);
    });
    container.appendChild(el);
  });
}

export function showDeployBar(card) {
  document.getElementById('deploy-bar')?.remove();
  const bar = document.createElement('div');
  bar.id = 'deploy-bar';
  bar.className = 'deploy-bar';
  bar.innerHTML = `
    <div class="deploy-inner">
      <div class="deploy-name">
        <span>선택한 카드</span>
        <strong>${esc(card.name)}</strong>
      </div>
      <div class="deploy-actions">
        <button type="button" id="info-btn" class="btn btn-ghost">정보</button>
        <button type="button" id="deploy-btn" class="btn btn-gold">카드 내기</button>
        <button type="button" id="cancel-btn" class="btn btn-text">취소</button>
      </div>
    </div>
  `;
  document.body.appendChild(bar);
  document.getElementById('info-btn').addEventListener('click', () => showCardModal(card));
  document.getElementById('deploy-btn').addEventListener('click', () => {
    import('./battle.js').then((mod) => mod.deploySelectedCard());
  });
  document.getElementById('cancel-btn').addEventListener('click', () => bar.remove());
}

export function renderOppRemaining() {
  const container = document.getElementById('opp-remaining');
  container.innerHTML = '';
  gameState.remainingOpp.forEach(() => {
    const back = document.createElement('div');
    back.className = 'mini-back';
    back.textContent = 'VR';
    container.appendChild(back);
  });
}

function usedThumb(card) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `used-thumb ${card.draw ? 'is-draw' : card.win ? 'is-win' : 'is-lose'}`;
  const img = document.createElement('img');
  img.alt = '';
  mountCardImage(img, card);
  button.appendChild(img);
  button.addEventListener('click', () => showCardModal(card));
  return button;
}

export function renderUsedCards() {
  const oppUsed = document.getElementById('opp-used');
  const myUsed = document.getElementById('my-used');
  oppUsed.innerHTML = '';
  myUsed.innerHTML = '';
  gameState.usedOpp.slice(0, 8).forEach((card) => oppUsed.appendChild(usedThumb(card)));
  gameState.usedPlayer.slice(0, 8).forEach((card) => myUsed.appendChild(usedThumb(card)));
}

function statCell(label, value, tone) {
  return `<div class="stat ${tone}"><span>${label}</span><strong>${fmtNum(value || 0)}</strong></div>`;
}

export function showCardModal(card) {
  if (!card) return;
  const modal = document.getElementById('card-modal');
  const content = document.getElementById('modal-content');
  if (!modal || !content) return;
  content.innerHTML = `
    <div class="modal-art">
      <img alt="">
      <div class="modal-shade"></div>
      <span class="grade-pill">${esc(card.grade)}</span>
      <div class="modal-title">
        <div class="card-name">${esc(card.name)}</div>
        <div class="card-meta">${esc(card.region)}${card.class ? ` · ${esc(card.class)}` : ''}</div>
      </div>
    </div>
    <div class="modal-body">
      <div class="power-row"><span>POWER</span><strong>${fmtNum(card.power)}</strong></div>
      <div class="meta-row">
        <div><span>CLASS</span><strong>${esc(card.class || '-')}</strong></div>
        <div><span>ATTRIBUTE</span><strong>${esc(card.attribute || '-')}</strong></div>
      </div>
      <div class="stat-grid">
        ${statCell('HP', card.hp, 'hp')}${statCell('ATK', card.atk, 'atk')}${statCell('DEF', card.def, 'def')}
        ${statCell('PHY', card.phy, 'phy')}${statCell('MEN', card.men, 'men')}${statCell('MOR', card.mor, 'mor')}
      </div>
      <button type="button" id="modal-close" class="btn btn-ghost btn-block">닫기</button>
    </div>
  `;
  mountCardImage(content.querySelector('img'), card, { eager: true });
  content.querySelector('#modal-close').addEventListener('click', hideCardModal);
  modal.classList.remove('hidden');
}

export function hideCardModal() {
  document.getElementById('card-modal')?.classList.add('hidden');
}

function renderBoard(board) {
  if (!board?.length) {
    return '<p class="empty-note">아직 이 모드의 기록이 없습니다.</p>';
  }
  return `<ol class="board">${board.map((row) => `
    <li>
      <span class="board-rank">${row.rank}</span>
      <span class="board-face"><img alt="" data-id="${esc(row.heroineId)}"></span>
      <span class="board-main">
        <strong>${esc(row.heroine || '기록')}</strong>
        <em>${fmtNum(row.wins)}승 ${fmtNum(row.losses)}패 ${fmtNum(row.draws)}무</em>
      </span>
    </li>
  `).join('')}</ol>`;
}

function hydrateBoardImages(root) {
  root.querySelectorAll('img[data-id]').forEach((img) => {
    const id = img.getAttribute('data-id');
    mountCardImage(img, { id, name: '' });
  });
}

export function renderBattleLog() {
  const container = document.getElementById('battle-log');
  container.innerHTML = '';
  if (!gameState.battleLog.length) {
    container.innerHTML = '<p class="empty-note">기록이 없습니다.</p>';
    return;
  }
  gameState.battleLog.forEach((log) => {
    const row = document.createElement('div');
    row.className = 'log-row';
    const outcome = log.draw ? '무승부' : log.win ? 'WIN' : 'LOSE';
    const tone = log.draw ? 'draw' : log.win ? 'win' : 'lose';
    row.innerHTML = `
      <span class="log-num">#${log.battleNum}</span>
      <button type="button" class="log-face mine" data-side="my"><img alt=""></button>
      <span class="log-name">${esc(log.myCard.name)}<small>POWER ${fmtNum(log.myCard.power)}</small></span>
      <span class="log-out ${tone}">${outcome}</span>
      <span class="log-name right">${esc(log.oppCard.name)}<small>POWER ${fmtNum(log.oppCard.power)}</small></span>
      <button type="button" class="log-face opp" data-side="opp"><img alt=""></button>
    `;
    mountCardImage(row.querySelector('.mine img'), log.myCard);
    mountCardImage(row.querySelector('.opp img'), log.oppCard);
    row.querySelector('.mine').addEventListener('click', () => showCardModal(log.myCard));
    row.querySelector('.opp').addEventListener('click', () => showCardModal(log.oppCard));
    container.appendChild(row);
  });
}

function sharePayload(summary) {
  const who = summary.heroineIsFemale ? '히로인' : '에이스';
  const outcome = summary.drawMatch ? '무승부' : summary.playerWon ? '승리' : '패배';
  return {
    title: 'VR Battle Masters',
    text: `VR Battle Masters ${gameState.mode}라운드 ${outcome}. ${summary.wins}승 ${summary.losses}패. ${who} ${summary.heroine.name}.`,
    url: sharePageUrl(),
  };
}

function renderShare(summary) {
  const box = document.getElementById('share-box');
  const targets = activeShareTargets();
  box.innerHTML = targets.map((target) => (
    `<button type="button" class="btn btn-share" data-share="${esc(target.id)}">${esc(target.label)}</button>`
  )).join('') + '<p id="share-status" class="share-status" role="status"></p>';
  const payload = sharePayload(summary);
  box.querySelectorAll('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const status = document.getElementById('share-status');
      try {
        const result = await runShare(button.dataset.share, payload);
        status.textContent = result === 'copied' ? '링크를 복사했습니다.' : result === 'unavailable' ? '이 공유는 아직 열리지 않았습니다.' : '';
      } catch (error) {
        if (error?.name !== 'AbortError') status.textContent = '공유하지 못했습니다.';
      }
    });
  });
}

function applyRankingPayload(payload) {
  const board = document.getElementById('result-board');
  const you = document.getElementById('your-rank');
  board.innerHTML = renderBoard(payload.board);
  hydrateBoardImages(board);
  if (payload.you) {
    you.hidden = false;
    you.textContent = `이번 기록 ${payload.you.rank}위 · ${fmtNum(payload.you.wins)}승`;
  }
}

export async function openRanking(mode = DEFAULT_MODE) {
  showScreen('ranking-screen');
  const tabs = document.getElementById('rank-tabs');
  tabs.querySelectorAll('[data-rank-mode]').forEach((button) => {
    button.classList.toggle('is-on', Number(button.dataset.rankMode) === mode);
  });
  const list = document.getElementById('rank-list');
  const note = document.getElementById('rank-note');
  note.textContent = RANK_NOTE;
  list.innerHTML = '<p class="empty-note">순위를 불러오는 중…</p>';
  try {
    const payload = await loadRanking(mode);
    list.innerHTML = renderBoard(payload.board);
    hydrateBoardImages(list);
  } catch {
    list.innerHTML = '<p class="empty-note">순위를 불러오지 못했습니다. 배틀은 그대로 할 수 있습니다.</p>';
  }
}

export function finishGame() {
  showScreen('result-screen');
  document.getElementById('deploy-bar')?.remove();
  const summary = localSummary(gameState.battleLog);
  const headline = document.getElementById('final-result-text');
  const kicker = document.getElementById('final-kicker');
  if (summary.drawMatch) {
    kicker.textContent = 'DRAW';
    headline.textContent = '무승부';
    headline.className = 'result-title draw';
  } else if (summary.playerWon) {
    kicker.textContent = 'VICTORY';
    headline.textContent = '승리';
    headline.className = 'result-title win';
  } else {
    kicker.textContent = 'DEFEAT';
    headline.textContent = '패배';
    headline.className = 'result-title lose';
  }
  document.getElementById('final-score').textContent = `${fmtNum(summary.wins)}승 · ${fmtNum(summary.losses)}패 · ${fmtNum(summary.draws)}무`;
  document.getElementById('heroine-kicker').textContent = summary.heroineIsFemale ? '이번 판의 히로인' : '이번 판의 에이스';
  document.getElementById('heroine-name').textContent = summary.heroine.name;
  document.getElementById('heroine-meta').textContent = `${summary.heroine.grade} · POWER ${fmtNum(summary.heroine.power)}`;
  const portrait = document.getElementById('heroine-img');
  mountCardImage(portrait, summary.heroine, { eager: true });
  document.getElementById('heroine-card').className = `heroine-card ${gradeClass(summary.heroine.grade)}`;
  document.getElementById('your-rank').hidden = true;
  document.getElementById('result-board').innerHTML = '<p class="empty-note">순위를 기록하는 중…</p>';
  renderShare(summary);
  renderChannels(document.getElementById('result-channels'));
  renderBattleLog();

  submitRun(gameState).then(applyRankingPayload).catch((error) => {
    const board = document.getElementById('result-board');
    const offline = error?.status === 429
      ? '짧은 시간에 기록이 너무 많아 이번 판은 순위에 올리지 않았습니다.'
      : '순위 서버에 연결하지 못했습니다. 이 결과는 이 기기에만 남아 있습니다.';
    board.innerHTML = `<p class="empty-note">${offline}</p>`;
  });
}

export function bindRankingTabs() {
  document.getElementById('rank-tabs')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-rank-mode]');
    if (!button) return;
    openRanking(Number(button.dataset.rankMode));
  });
}
