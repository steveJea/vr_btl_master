import { CSV_URL } from './config.js';

export let cardPool = [];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ? vals[i].trim() : '';
    });

    // Case-insensitive getter
    const get = (key) => {
      if (obj[key] !== undefined) return obj[key];
      const lower = key.toLowerCase();
      if (obj[lower] !== undefined) return obj[lower];
      const upper = key.toUpperCase();
      if (obj[upper] !== undefined) return obj[upper];
      return '';
    };

    return {
      id: get('id'),
      name: get('name'),
      gender: get('gender'),
      age: parseInt(get('age')) || 0,
      region: get('region'),
      grade: get('grade'),
      class: get('class'),
      attribute: get('attribute'),
      power: parseInt(get('power')) || 0,
      hp: parseInt(get('HP') || get('hp')) || 0,
      atk: parseInt(get('ATK') || get('atk')) || 0,
      def: parseInt(get('DEF') || get('def')) || 0,
      phy: parseInt(get('PHY') || get('phy')) || 0,
      men: parseInt(get('MEN') || get('men')) || 0,
      mor: parseInt(get('MOR') || get('mor')) || 0
    };
  });
}

export async function loadRealData() {
  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();
    cardPool = parseCSV(text);
    console.log(`[성공] ${cardPool.length}장 로드 완료`);
    return cardPool;
  } catch (e) {
    console.error('데이터 로드 실패', e);
    return [];
  }
}
