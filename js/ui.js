import { OFFICIAL_CHANNELS, MODE_COPY, MODE_DISTRIBUTION, resolvedDefaultMode } from './config.js';
import { gameState } from './state.js';
import { cardImgHtml, createCardElement } from './cards.js';
import { cardPool } from './data.js';
import { esc, fmtNum, genderLabel, getGradeClass } from './utils.js';
import { playBGM } from './audio.js';
import { renderShareBar } from './share.js';
import { fetchBoard, rankNote, submitRun } from './ranking.js';
import { indexCards, pickSpotlight, readSharedQuery, spotlightLabel } from './rank-core.js';

let rankMode = resolvedDefaultMode();

export function showScreen(id) {
  document.querySelectorAll('.section').forEach((section) => section.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);

  if (id === 'main-screen') playBGM('main');
  else if (id === 'choice-screen' || id === 'deck-screen') playBGM('select');
  else if (id === 'battle-screen') playBGM('battle');
  else if (id === 'result-screen') playBGM('result');
}

export function renderChannels(container) {
  if (!container) return;
  const links = OFFICIAL_CHANNELS.filter((item) => typeof item?.url === 'string' && item.url.startsWith('https://'));
  container.replaceChildren();
  if (!links.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  const label = document.createElement('p');
  label.className = 'channel-label';
  label.textContent = '공식 채널';
  container.appendChild(label);
  const row = document.createElement('div');
  row.className = 'channel-row';
  links.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.label || item.id || '채널';
    row.appendChild(link);
  });
  container.appendChild(row);
}

export function renderSharedBanner() {
  const banner = document.getElementById('shared-banner');
  if (!banner) return;
  const record = readSharedQuery(location.search);
  if (!record) {
    banner.hidden = true;
    return;
  }
  const card = cardPool.find((item) => item.id === record.id);
  banner.hidden = false;
  banner.textContent = card
    ? `공유된 기록 · ${record.wins}승 ${record.loses}패 ${record.draws}무 · ${card.name}`
    : `공유된 기록 · ${record.wins}승 ${record.loses}패 ${record.draws}무`;
}

export function renderModeCards() {
  const root = document.getElementById('mode-list');
  if (!root) return;
  const fallback = resolvedDefaultMode();
  root.replaceChildren();
  Object.keys(MODE_DISTRIBUTION).map(Number).sort((a, b) => a - b).forEach((mode) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mode-card';
    button.dataset.mode = String(mode);
    if (mode === fallback) button.classList.add('is-default');
    const copy = MODE_COPY[mode] || { title: `${mode} VS ${mode}`, blurb: '' };
    const rows = Object.entries(MODE_DISTRIBUTION[mode]).filter(([, count]) => count > 0);
    button.innerHTML = `
      ${mode === fallback ? '<span class="mode-flag">기본</span>' : ''}
      <span class="mode-title">${esc(copy.title)}</span>
      <span class="mode-blurb">${esc(copy.blurb)}</span>
      <span class="mode-dist">
        ${rows.map(([grade, count]) => `<span><b>${esc(grade)}</b> ${count}</span>`).join('')}
      </span>
    `;
    button.addEventListener('click', () => window.selectGameMode(mode));
    root.appendChild(button);
  });
}

export function showDeckScreen() {
  showScreen('deck-screen');
  document.getElementById('mode-badge').textContent = `${gameState.mode} VS ${gameState.mode}`;
  document.getElementById('change-count').textContent = `${gameState.changeCount}/3`;
  document.getElementById('change-btn').disabled = gameState.changeCount <= 0;
  renderDeckGrid();
}

export function renderDeckGrid() {
  const grid = document.getElementById('deck-grid');
  grid.replaceChildren();
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
  document.getElementById('vs-idle')?.classList.remove('hidden');
  document.getElementById('vs-battle')?.classList.add('hidden');
  document.getElementById('battle-result-stamp')?.classList.add('hidden');
  const mine = document.getElementById('vs-my-card');
  const opp = document.getElementById('vs-opp-card');
  if (mine) {
    mine.innerHTML = '';
    mine.className = 'vs-slot';
  }
  if (opp) {
    opp.innerHTML = '';
    opp.className = 'vs-slot';
  }
}

export function updateBattleUI() {
  const left = gameState.remainingPlayer.length;
  const progress = document.getElementById('battle-progress');
  if (progress) {
    progress.textContent = `${String(Math.min(gameState.mode, gameState.mode - left + 1)).padStart(2, '0')} / ${gameState.mode}`;
  }
  document.getElementById('win-count').textContent = fmtNum(gameState.wins);
  document.getElementById('lose-count').textContent = fmtNum(gameState.loses);
  document.getElementById('draw-count').textContent = fmtNum(gameState.draws);
  document.getElementById('hand-count').textContent = `${left}장 남음`;
}

let handPowerDesc = true;

export function toggleHandSort() {
  handPowerDesc = !handPowerDesc;
  renderMyHand();
}

export function renderMyHand() {
  const container = document.getElementById('my-hand');
  const sortBtn = document.getElementById('hand-sort');
  if (sortBtn) {
    sortBtn.textContent = handPowerDesc ? 'POWER ↓' : 'POWER ↑';
    sortBtn.setAttribute('aria-pressed', handPowerDesc ? 'true' : 'false');
  }
  container.replaceChildren();
  const cards = [...gameState.remainingPlayer].sort((a, b) => {
    const delta = handPowerDesc ? b.power - a.power : a.power - b.power;
    return delta || String(a.id).localeCompare(String(b.id));
  });
  cards.forEach((card) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `hand-card ${getGradeClass(card.grade)}`;
    if (card.id === gameState.selectedCardId) el.classList.add('is-selected');
    el.setAttribute('aria-pressed', card.id === gameState.selectedCardId ? 'true' : 'false');
    el.innerHTML = `
      <span class="hand-art">${cardImgHtml(card.id, { alt: card.name })}</span>
      <span class="hand-name">${esc(card.name)}</span>
    `;
    el.addEventListener('click', () => {
      gameState.selectedCardId = card.id;
      renderMyHand();
      showDeployBar(card);
    });
    container.appendChild(el);
  });
}

export function showDeployBar(card) {
  document.getElementById('deploy-bar')?.remove();
  const bar = document.createElement('div');
  bar.id = 'deploy-bar';
  bar.innerHTML = `
    <div class="deploy-inner">
      <div class="deploy-copy">
        <div class="deploy-name">${esc(card.name)}</div>
      </div>
      <button type="button" id="info-btn" class="btn-ghost">상세정보</button>
      <button type="button" id="deploy-btn" class="btn-deploy">제출</button>
      <button type="button" id="cancel-btn" class="btn-text">취소</button>
    </div>
  `;
  document.body.appendChild(bar);
  document.body.classList.add('deploying');
  document.getElementById('info-btn').addEventListener('click', () => showCardModal(card));
  document.getElementById('deploy-btn').addEventListener('click', () => {
    import('./battle.js').then((mod) => mod.deploySelectedCard());
  });
  document.getElementById('cancel-btn').addEventListener('click', () => {
    gameState.selectedCardId = null;
    bar.remove();
    document.body.classList.remove('deploying');
    renderMyHand();
  });
}

function usedChip(card) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `used-chip ${card.draw ? 'is-draw' : card.win ? 'is-win' : 'is-lose'}`;
  button.innerHTML = cardImgHtml(card.id, { alt: card.name });
  button.addEventListener('click', () => showCardModal(card));
  return button;
}

export function renderOppRemaining() {
  const container = document.getElementById('opp-remaining');
  container.replaceChildren();
  gameState.remainingOpp.forEach(() => {
    const back = document.createElement('div');
    back.className = 'opp-back';
    back.textContent = 'VR';
    container.appendChild(back);
  });
}

export function renderUsedCards() {
  const oppUsed = document.getElementById('opp-used');
  const myUsed = document.getElementById('my-used');
  oppUsed.replaceChildren();
  myUsed.replaceChildren();
  gameState.usedOpp.slice(0, 8).forEach((card) => oppUsed.appendChild(usedChip(card)));
  gameState.usedPlayer.slice(0, 8).forEach((card) => myUsed.appendChild(usedChip(card)));
}

export function showCardModal(card) {
  if (!card) return;
  const modal = document.getElementById('card-modal');
  const content = document.getElementById('modal-content');
  if (!modal || !content) return;
  const gender = genderLabel(card.gender);
  content.innerHTML = `
    <div class="modal-art">
      ${cardImgHtml(card.id, { full: true, alt: card.name, eager: true })}
      <span class="grade-pill">${esc(card.grade)}</span>
      <div class="modal-nameblock">
        <div class="modal-name">${esc(card.name)}</div>
        <div class="modal-sub">${esc([gender, card.region].filter(Boolean).join(' · '))}</div>
      </div>
    </div>
    <div class="modal-sheet">
      <div class="power-row"><span>POWER</span><b>${fmtNum(card.power)}</b></div>
      <div class="stat-pair">
        <div><span>CLASS</span><b>${esc(card.class || '-')}</b></div>
        <div><span>ATTRIBUTE</span><b>${esc(card.attribute || '-')}</b></div>
      </div>
      <div class="stat-grid">
        ${['HP', 'ATK', 'DEF', 'PHY', 'MEN', 'MOR'].map((key) => `<div><span>${key}</span><b>${fmtNum(card[key.toLowerCase()] || 0)}</b></div>`).join('')}
      </div>
      <button type="button" id="modal-close" class="btn-ghost btn-block">닫기</button>
    </div>
  `;
  document.getElementById('modal-close').addEventListener('click', hideCardModal);
  modal.classList.remove('hidden');
  modal.classList.add('open');
}

export function hideCardModal() {
  const modal = document.getElementById('card-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('open');
}

window.hideCardModal = hideCardModal;

export function renderBattleLog() {
  const container = document.getElementById('battle-log');
  container.replaceChildren();
  if (!gameState.battleLog.length) {
    container.textContent = '기록이 없습니다.';
    return;
  }
  gameState.battleLog.forEach((log) => {
    const row = document.createElement('div');
    row.className = 'log-row';
    const verdict = log.draw ? '무승부' : log.win ? 'WIN' : 'LOSE';
    const tone = log.draw ? 'draw' : log.win ? 'win' : 'lose';
    row.innerHTML = `
      <span class="log-num">#${log.battleNum}</span>
      <span class="log-face my"></span>
      <span class="log-side">
        <b>${esc(log.myCard.name)}</b>
        <small>POWER ${fmtNum(log.myCard.power)}</small>
      </span>
      <span class="log-verdict ${tone}">${verdict}</span>
      <span class="log-side right">
        <b>${esc(log.oppCard.name)}</b>
        <small>POWER ${fmtNum(log.oppCard.power)}</small>
      </span>
      <span class="log-face opp"></span>
    `;
    const mine = row.querySelector('.log-face.my');
    const opp = row.querySelector('.log-face.opp');
    mine.innerHTML = cardImgHtml(log.myCard.id, { alt: log.myCard.name });
    opp.innerHTML = cardImgHtml(log.oppCard.id, { alt: log.oppCard.name });
    mine.addEventListener('click', () => showCardModal(log.myCard));
    opp.addEventListener('click', () => showCardModal(log.oppCard));
    container.appendChild(row);
  });
}

function resultRecord() {
  const byId = indexCards(cardPool);
  gameState.battleLog.forEach((log) => {
    byId.set(log.myCard.id, log.myCard);
    byId.set(log.oppCard.id, log.oppCard);
  });
  const rounds = gameState.battleLog.map((log) => ({
    myId: log.myCard.id,
    oppId: log.oppCard.id,
    myWin: !!log.win,
    draw: !!log.draw
  }));
  const spot = pickSpotlight(rounds, byId);
  return { spot };
}

export async function finishGame() {
  showScreen('result-screen');
  const isWin = gameState.wins > gameState.loses;
  const finalText = document.getElementById('final-result-text');
  if (gameState.wins === gameState.loses) finalText.innerHTML = '<span class="draw">DRAW</span>';
  else if (isWin) finalText.innerHTML = '<span class="win">VICTORY</span>';
  else finalText.innerHTML = '<span class="lose">DEFEAT</span>';

  document.getElementById('final-score').textContent =
    `${fmtNum(gameState.wins)}승 · ${fmtNum(gameState.loses)}패 · ${fmtNum(gameState.draws)}무`;

  const { spot } = resultRecord();
  const frame = document.getElementById('result-frame');
  const hero = document.getElementById('result-hero');
  if (spot.card && frame && hero) {
    hero.hidden = false;
    frame.innerHTML = cardImgHtml(spot.card.id, { full: true, alt: spot.card.name, eager: true, className: 'result-face' });
    document.getElementById('result-kicker').textContent = spotlightLabel(spot);
    document.getElementById('result-name').textContent = spot.card.name;
    document.getElementById('result-power').textContent = `POWER ${fmtNum(spot.card.power)}`;
  } else if (hero) {
    hero.hidden = true;
  }

  renderShareBar(document.getElementById('share-bar'), {
    mode: gameState.mode,
    wins: gameState.wins,
    loses: gameState.loses,
    draws: gameState.draws,
    name: spot.card?.name || '',
    power: spot.card?.power,
    id: spot.card?.id || ''
  });
  renderChannels(document.getElementById('channels-result'));
  renderBattleLog();

  const note = document.getElementById('rank-note');
  if (note) note.textContent = '기록을 올리는 중…';
  const posted = await submitRun(
    gameState.mode,
    gameState.battleLog.map((log) => ({ my: log.myCard.id, opp: log.oppCard.id }))
  );
  if (note) note.textContent = rankNote(posted);
  rankMode = gameState.mode;
}

export async function showRankScreen(mode = rankMode) {
  rankMode = MODE_DISTRIBUTION[mode] ? mode : resolvedDefaultMode();
  showScreen('rank-screen');
  const switcher = document.getElementById('rank-modes');
  switcher.replaceChildren();
  [5, 10, 20].forEach((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = value === rankMode ? 'is-on' : '';
    button.textContent = `${value}장`;
    button.addEventListener('click', () => showRankScreen(value));
    switcher.appendChild(button);
  });

  const status = document.getElementById('rank-status');
  const list = document.getElementById('rank-list');
  status.textContent = '불러오는 중…';
  list.replaceChildren();
  const board = await fetchBoard(rankMode);
  if (!board?.ok) {
    status.textContent = '순위를 불러오지 못했습니다. 배틀은 그대로 할 수 있습니다.';
    return;
  }
  const rows = board.top || [];
  status.textContent = rows.length
    ? '승패와 카드만 남습니다. 이름, 계정, 기기는 저장하지 않습니다.'
    : '아직 이 길이의 기록이 없습니다. 배틀은 그대로 할 수 있습니다.';
  rows.forEach((row, index) => {
    const item = document.createElement('li');
    item.className = 'rank-row';
    const face = document.createElement('span');
    face.className = 'rank-face';
    if (row.heroineId) face.innerHTML = cardImgHtml(row.heroineId, { alt: row.heroineName || '' });
    const copy = document.createElement('span');
    copy.className = 'rank-copy';
    const name = document.createElement('b');
    name.textContent = row.heroineName || '기록';
    const meta = document.createElement('small');
    meta.textContent = `${row.wins}승 ${row.loses}패 ${row.draws}무 · 파워 차 +${fmtNum(row.margin)}`;
    copy.append(name, meta);
    const place = document.createElement('span');
    place.className = 'rank-place';
    place.textContent = String(index + 1);
    item.append(place, face, copy);
    list.appendChild(item);
  });
}
