import { CARD_DATA } from './cards-data.js';
import { INCLUDE_MALE_CARDS } from './config.js';

function publish(raw) {
  return {
    id: String(raw.id),
    name: raw.name,
    gender: raw.gender,
    region: raw.region || '',
    grade: raw.grade,
    class: raw.class || '',
    attribute: raw.attribute || '',
    power: Math.trunc(Number(raw.power)) || 0,
    hp: Number(raw.hp) || 0,
    atk: Number(raw.atk) || 0,
    def: Number(raw.def) || 0,
    phy: Number(raw.phy) || 0,
    men: Number(raw.men) || 0,
    mor: Number(raw.mor) || 0,
  };
}

export let cardPool = CARD_DATA
  .map(publish)
  .filter((card) => INCLUDE_MALE_CARDS || card.gender !== 'MALE');

export function loadRealData() {
  return Promise.resolve(cardPool);
}
