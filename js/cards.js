import { IMAGE_BASE, FALLBACK_ART, MODE_DISTRIBUTION } from './config.js';
import { cardPool } from './data.js';
import { shuffle, gradeClass, fmtNum, esc, safeId } from './utils.js';

export function cardArtUrl(id) {
  const safe = safeId(id);
  return safe ? `${IMAGE_BASE}${safe}.webp` : FALLBACK_ART;
}

export function mountCardImage(img, card, { eager = false } = {}) {
  img.alt = card?.name ? `${card.name} 초상` : '카드 초상';
  img.decoding = 'async';
  img.loading = eager ? 'eager' : 'lazy';
  img.src = cardArtUrl(card?.id);
  img.addEventListener('error', () => {
    img.src = FALLBACK_ART;
  }, { once: true });
}

export function dealCards(mode) {
  const dist = MODE_DISTRIBUTION[mode];
  const dealt = [];
  let avail = [...cardPool];

  Object.keys(dist).forEach((grade) => {
    const need = dist[grade];
    if (!need) return;
    const pool = shuffle(avail.filter((card) => card.grade === grade));
    for (let i = 0; i < Math.min(need, pool.length); i += 1) {
      dealt.push({ ...pool[i] });
      avail = avail.filter((card) => card.id !== pool[i].id);
    }
  });

  while (dealt.length < mode && avail.length) {
    const index = Math.floor(Math.random() * avail.length);
    dealt.push({ ...avail[index] });
    avail.splice(index, 1);
  }

  return shuffle(dealt);
}

export function createCardElement(card, onClick = null) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `card ${gradeClass(card.grade)}`;
  el.innerHTML = `
    <div class="card-art">
      <img alt="">
      <span class="grade-pill">${esc(card.grade)}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${esc(card.name)}</div>
      <div class="card-meta">${esc(card.region)}</div>
      <div class="card-power">POWER ${fmtNum(card.power)}</div>
    </div>
  `;
  mountCardImage(el.querySelector('img'), card);
  if (onClick) el.addEventListener('click', () => onClick(card));
  return el;
}

export function renderVsCard(containerId, card) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="vs-card ${gradeClass(card.grade)}">
      <div class="vs-art"><img alt=""></div>
      <div class="vs-body">
        <div class="grade-pill">${esc(card.grade)}</div>
        <div class="card-name">${esc(card.name)}</div>
        <div class="card-meta">${esc(card.class)} · ${esc(card.region)}</div>
        <div class="card-power">POWER ${fmtNum(card.power)}</div>
      </div>
    </div>
  `;
  mountCardImage(container.querySelector('img'), card, { eager: true });
}
