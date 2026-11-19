/** Pure result rules shared by the page and the ranking Worker. */

const MODES = new Set([5, 10, 20]);

export function bestOf(list) {
  return list.reduce((top, item) => (item.card.power > top.card.power ? item : top));
}

/**
 * @param {{ my: {id:string,name:string,gender:string,power:number}, opp: {id:string,name:string,gender:string,power:number} }[]} rounds
 */
export function summarize(rounds) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  const rows = rounds.map((round) => {
    const draw = round.my.power === round.opp.power;
    const win = round.my.power > round.opp.power;
    if (draw) draws += 1;
    else if (win) wins += 1;
    else losses += 1;
    return { my: round.my, opp: round.opp, win, draw };
  });

  const playerSide = wins >= losses;
  const pool = rows.map((row) => ({
    card: playerSide ? row.my : row.opp,
    win: playerSide ? row.win && !row.draw : !row.win && !row.draw,
  }));
  const females = pool.filter((item) => item.card.gender === 'FEMALE');
  const femaleWins = females.filter((item) => item.win);
  const winners = pool.filter((item) => item.win);
  const chosen = (femaleWins.length && bestOf(femaleWins))
    || (females.length && bestOf(females))
    || (winners.length && bestOf(winners))
    || bestOf(pool);

  return {
    wins,
    losses,
    draws,
    playerWon: wins > losses,
    drawMatch: wins === losses,
    heroine: chosen.card,
    heroineIsFemale: chosen.card.gender === 'FEMALE',
  };
}

/**
 * Validate a submitted run against the official card table.
 * Scores are recomputed here. The client total is ignored.
 */
export function evaluateRun(body, cardsById) {
  const mode = Number(body?.mode);
  const rounds = body?.rounds;
  if (!MODES.has(mode)) return { ok: false, error: 'mode' };
  if (!Array.isArray(rounds) || rounds.length !== mode) return { ok: false, error: 'rounds' };

  const seenMy = new Set();
  const seenOpp = new Set();
  const parsed = [];
  for (const round of rounds) {
    const myId = String(round?.my ?? '');
    const oppId = String(round?.opp ?? '');
    if (!/^\d{5}$/.test(myId) || !/^\d{5}$/.test(oppId)) return { ok: false, error: 'id' };
    if (seenMy.has(myId) || seenOpp.has(oppId)) return { ok: false, error: 'duplicate' };
    const my = cardsById.get(myId);
    const opp = cardsById.get(oppId);
    if (!my || !opp) return { ok: false, error: 'unknown' };
    seenMy.add(myId);
    seenOpp.add(oppId);
    parsed.push({
      my: { id: myId, name: my.name, gender: my.gender, power: my.power },
      opp: { id: oppId, name: opp.name, gender: opp.gender, power: opp.power },
    });
  }

  const summary = summarize(parsed);
  return { ok: true, mode, ...summary };
}

export function publicBoardRow(row, rank) {
  return {
    rank,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    heroine: row.heroine_name,
    heroineId: row.heroine_id,
  };
}
