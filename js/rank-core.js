// 랭킹·결과 얼굴 계산. 브라우저와 Worker가 같은 규칙을 쓴다.
// 나이는 받지 않고, 기록에도 넣지 않는다.

const MODES = new Set([5, 10, 20]);

export function indexCards(list) {
  const map = new Map();
  for (const card of list || []) {
    if (card && card.id != null) map.set(String(card.id), card);
  }
  return map;
}

export function pickSpotlight(rounds, byId) {
  let wins = 0;
  let loses = 0;
  const winners = [];

  for (const round of rounds) {
    if (round.draw) continue;
    if (round.myWin) wins += 1;
    else loses += 1;
    const id = round.myWin ? round.myId : round.oppId;
    const card = byId.get(String(id));
    if (!card) continue;
    winners.push({ card, playerSide: !!round.myWin });
  }

  const outcome = wins === loses ? 'draw' : wins > loses ? 'win' : 'loss';
  const femaleWinners = winners.filter((entry) => entry.card.gender === 'FEMALE');
  let pool = femaleWinners;
  let heroine = femaleWinners.length > 0;

  if (outcome === 'win') {
    const side = femaleWinners.filter((entry) => entry.playerSide);
    if (side.length) pool = side;
  } else if (outcome === 'loss') {
    const side = femaleWinners.filter((entry) => !entry.playerSide);
    if (side.length) pool = side;
  }

  if (!pool.length) {
    pool = winners;
    heroine = false;
  }

  if (!pool.length) {
    const all = [];
    for (const round of rounds) {
      for (const id of [round.myId, round.oppId]) {
        const card = byId.get(String(id));
        if (card) all.push({ card, playerSide: String(id) === String(round.myId) });
      }
    }
    const females = all.filter((entry) => entry.card.gender === 'FEMALE');
    pool = females.length ? females : all;
    heroine = females.length > 0;
  }

  pool.sort((a, b) => {
    const delta = (b.card.power || 0) - (a.card.power || 0);
    if (delta) return delta;
    return String(a.card.id).localeCompare(String(b.card.id));
  });

  const card = pool[0]?.card || null;
  if (!card || card.gender !== 'FEMALE') heroine = false;
  return { outcome, card, heroine };
}

export function settleRounds(rounds, byId) {
  const settled = rounds.map((round) => {
    const mine = byId.get(String(round.my));
    const opp = byId.get(String(round.opp));
    const myWin = mine.power > opp.power;
    const draw = mine.power === opp.power;
    return {
      myId: String(mine.id),
      oppId: String(opp.id),
      myWin,
      draw,
      margin: myWin ? mine.power - opp.power : 0
    };
  });

  const wins = settled.filter((round) => round.myWin && !round.draw).length;
  const draws = settled.filter((round) => round.draw).length;
  const loses = settled.length - wins - draws;
  const margin = settled.reduce((sum, round) => sum + round.margin, 0);
  const spotlight = pickSpotlight(settled, byId);

  return { wins, loses, draws, margin, spotlight, settled };
}

export function validateSubmission(body, byId) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body' };
  const mode = Number(body.mode);
  if (!MODES.has(mode)) return { ok: false, error: 'mode' };
  if (!Array.isArray(body.rounds) || body.rounds.length !== mode) return { ok: false, error: 'rounds' };

  const seenMine = new Set();
  const seenOpp = new Set();
  const clean = [];

  for (const round of body.rounds) {
    const mine = String(round?.my ?? '');
    const opp = String(round?.opp ?? '');
    if (!/^\d{5}$/.test(mine) || !/^\d{5}$/.test(opp)) return { ok: false, error: 'id' };
    if (seenMine.has(mine) || seenOpp.has(opp)) return { ok: false, error: 'dup' };
    if (!byId.has(mine) || !byId.has(opp)) return { ok: false, error: 'unknown' };
    seenMine.add(mine);
    seenOpp.add(opp);
    clean.push({ my: mine, opp });
  }

  const result = settleRounds(clean, byId);
  return { ok: true, mode, ...result };
}

export function spotlightLabel(spotlight) {
  if (!spotlight?.card) return '이 판의 기록';
  if (spotlight.heroine) return '이 판의 히로인';
  return '이 판을 가져간 카드';
}

export function buildShareText({ mode, wins, loses, draws, name, power, fmt }) {
  const face = name ? `이 판의 얼굴 ${name}` : '문이 닫힌 기록';
  const powerText = power == null || power === '' ? '' : ` · POWER ${fmt ? fmt(power) : power}`;
  return `VR Battle Masters · ${mode}장 · ${wins}승 ${loses}패 ${draws}무 · ${face}${powerText}`;
}

export function buildShareUrl(href, record) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('m', String(record.mode));
  url.searchParams.set('w', String(record.wins));
  url.searchParams.set('l', String(record.loses));
  url.searchParams.set('d', String(record.draws));
  if (record.id) url.searchParams.set('c', String(record.id));
  return url.toString();
}

const DEFAULT_DESCRIPTION = '어비스게이트의 느낌을 살린 카드 배틀입니다. 여러분만의 덱을 완성해보세요!';

export function previewMeta({ search, origin, byId, featuredName, cardImage }) {
  const fallback = {
    title: 'VR Battle Masters',
    description: DEFAULT_DESCRIPTION,
    image: new URL('/img/og.jpg', origin).href,
    width: '1200',
    height: '630',
    alt: featuredName || ''
  };
  const record = readSharedQuery(search || '');
  if (!record?.id) return fallback;
  const card = byId.get(String(record.id));
  if (!card) return fallback;
  return {
    title: `VR Battle Masters · ${card.name}`,
    description: `${card.name} · ${record.wins}승 ${record.loses}패 ${record.draws}무`,
    image: cardImage(card.id),
    width: '832',
    height: '1248',
    alt: card.name
  };
}

export function readSharedQuery(search) {
  const params = new URLSearchParams(search);
  const mode = Number(params.get('m'));
  const wins = Number(params.get('w'));
  const loses = Number(params.get('l'));
  const draws = Number(params.get('d'));
  const id = params.get('c') || '';
  if (![5, 10, 20].includes(mode)) return null;
  if (![wins, loses, draws].every((n) => Number.isInteger(n) && n >= 0 && n <= mode)) return null;
  if (wins + loses + draws !== mode) return null;
  if (id && !/^\d{5}$/.test(id)) return null;
  return { mode, wins, loses, draws, id };
}
