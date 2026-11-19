import { CARD_FALLBACK, IMAGE_BASE, INCLUDE_MALE_CARDS, MODE_DISTRIBUTION, THUMB_BASE } from './config.js?v=7';
import { cardPool } from './data.js?v=7';
import { esc, fmtNum, getGradeClass, shuffle } from './utils.js?v=7';

export function dealCards(mode) {
  const dist = MODE_DISTRIBUTION[mode];
  let dealt = [];
  let avail = cardPool.filter((card) => INCLUDE_MALE_CARDS || card.gender !== 'MALE');

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
    const idx = Math.floor(Math.random() * avail.length);
    dealt.push({ ...avail[idx] });
    avail.splice(idx, 1);
  }

  return shuffle(dealt);
}

export function onCardImgError(img) {
  if (!img || img.dataset.step === 'fb') return;
  if (img.dataset.full === '1' && img.dataset.step !== 'th' && img.dataset.thumb) {
    img.dataset.step = 'th';
    img.src = img.dataset.thumb;
    return;
  }
  img.dataset.step = 'fb';
  img.src = img.dataset.fallback || CARD_FALLBACK;
}

if (typeof window !== 'undefined') window.onCardImgError = onCardImgError;

export function cardImgHtml(id, { full = false, alt = '', className = '', eager = false } = {}) {
  const thumb = `${THUMB_BASE}${id}.webp`;
  const art = `${IMAGE_BASE}${id}.webp`;
  const src = full ? art : thumb;
  return `<img class="${className}" src="${esc(src)}" alt="${esc(alt)}" data-full="${full ? '1' : '0'}" data-thumb="${esc(thumb)}" data-fallback="${esc(CARD_FALLBACK)}" width="300" height="400" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} onerror="window.onCardImgError(this)">`;
}

export function createCardElement(card, onClick = null) {
  const el = document.createElement('article');
  el.className = `card ${getGradeClass(card.grade)}`;
  el.innerHTML = `
    <div class="card-art">
      ${cardImgHtml(card.id, { alt: card.name })}
      <span class="grade-pill">${esc(card.grade)}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${esc(card.name)}</div>
      <div class="card-meta">${esc(card.region)}</div>
      <div class="card-power">POWER ${fmtNum(card.power)}</div>
    </div>
  `;
  if (onClick) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.addEventListener('click', () => onClick(card));
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(card);
      }
    });
  }
  return el;
}

export function renderVsCard(containerId, card) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="vs-card ${getGradeClass(card.grade)}">
      <div class="vs-art">${cardImgHtml(card.id, { full: true, alt: card.name, eager: true })}</div>
      <div class="vs-meta">
        <div class="grade-pill">${esc(card.grade)}</div>
        <div class="card-name">${esc(card.name)}</div>
        <div class="card-meta">${esc(card.class)} · ${esc(card.region)}</div>
        <div class="card-power">POWER ${fmtNum(card.power)}</div>
      </div>
    </div>
  `;
}
