import { CARD_DATA_URL, FEATURED_HEROINE_NAME, INCLUDE_MALE_CARDS } from './config.js?v=6';

export let cardPool = [];

function toCard(raw) {
  // 나이 필드는 공개 카드에 없다. 원본 CSV에만 남아 있고 여기로 오지 않는다.
  const card = {
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    gender: String(raw.gender || ''),
    region: String(raw.region || ''),
    grade: String(raw.grade || ''),
    class: String(raw.class || ''),
    attribute: String(raw.attribute || ''),
    power: Math.trunc(Number(raw.power) || 0),
    hp: Math.trunc(Number(raw.hp) || 0),
    atk: Math.trunc(Number(raw.atk) || 0),
    def: Math.trunc(Number(raw.def) || 0),
    phy: Math.trunc(Number(raw.phy) || 0),
    men: Math.trunc(Number(raw.men) || 0),
    mor: Math.trunc(Number(raw.mor) || 0)
  };
  delete card.age;
  return card;
}

export function findFeatured(list = cardPool) {
  return list.find((card) => card.name === FEATURED_HEROINE_NAME) || null;
}

export function visiblePool(list = cardPool) {
  if (INCLUDE_MALE_CARDS) return list;
  return list.filter((card) => card.gender !== 'MALE');
}

export async function loadRealData() {
  const res = await fetch(CARD_DATA_URL);
  if (!res.ok) throw new Error(`card data ${res.status}`);
  const json = await res.json();
  cardPool = (Array.isArray(json) ? json : []).map(toCard).filter((card) => card.id);
  console.log(JSON.stringify({ message: 'cards loaded', count: cardPool.length }));
  return cardPool;
}
