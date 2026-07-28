import { IMAGE_BASE, MODE_DISTRIBUTION } from './config.js';
import { cardPool } from './data.js';
import { shuffle, getGradeBorder } from './utils.js';

export function dealCards(mode) {
  const dist = MODE_DISTRIBUTION[mode];
  let dealt = [];
  let avail = [...cardPool];

  Object.keys(dist).forEach(gr => {
    let need = dist[gr];
    if (!need) return;

    let pool = shuffle(avail.filter(c => c.grade === gr));
    for (let i = 0; i < Math.min(need, pool.length); i++) {
      dealt.push({ ...pool[i] });
      avail = avail.filter(c => c.id !== pool[i].id);
    }
  });

  // 부족하면 랜덤 채우기
  while (dealt.length < mode && avail.length) {
    const idx = Math.floor(Math.random() * avail.length);
    dealt.push({ ...avail[idx] });
    avail.splice(idx, 1);
  }

  return shuffle(dealt);
}

export function createCardElement(card, onClick = null) {
  const el = document.createElement('div');
  el.className = `card bg-zinc-900 border-2 ${getGradeBorder(card.grade)} rounded-2xl overflow-hidden cursor-pointer`;
  const imgSrc = `${IMAGE_BASE}${card.id}.jpg`;
  const placeholder = `https://picsum.photos/id/${(parseInt(card.id) % 200) + 29}/300/380`;

  el.innerHTML = `
    <div class="relative">
      <img src="${imgSrc}" class="w-full h-44 object-cover" onerror="this.src='${placeholder}'">
      <div class="absolute top-2 right-2 px-2.5 py-0.5 text-[10px] font-bold bg-black/70 rounded border border-white/20">
        ${card.grade}
      </div>
    </div>
    <div class="p-3">
      <div class="font-bold text-lg leading-tight">${card.name}</div>
      <div class="text-xs text-zinc-400 mt-0.5">${card.age}세 • ${card.region}</div>
    </div>
  `;

  if (onClick) {
    el.onclick = () => onClick(card);
  }
  return el;
}

export function renderVsCard(containerId, card) {
  const container = document.getElementById(containerId);
  const imgSrc = `${IMAGE_BASE}${card.id}.jpg`;
  container.innerHTML = `
    <div class="relative">
      <img src="${imgSrc}" class="w-full h-52 object-cover" onerror="this.src='https://picsum.photos/id/29/300/380'">
      <div class="absolute top-2 right-2 px-2.5 py-0.5 text-xs font-bold bg-black/70 rounded">${card.grade}</div>
      <div class="p-3 bg-zinc-900">
        <div class="font-bold text-lg">${card.name}</div>
        <div class="text-xs text-zinc-400 mt-0.5">${card.class} • ${card.region}</div>
      </div>
    </div>
  `;
}
