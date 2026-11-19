import cards from './cards.json' with { type: 'json' };
import { evaluateRun, publicBoardRow } from '../shared/score.js';

const CARDS = new Map(Object.entries(cards));
const MAX_BODY = 8192;
const RATE_LIMIT = 8;
const RATE_WINDOW_SEC = 60 * 60;
const BOARD_LIMIT = 20;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

async function readJson(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY) return { error: 'too_large' };
  const text = await request.text();
  if (text.length > MAX_BODY) return { error: 'too_large' };
  try {
    return { value: JSON.parse(text) };
  } catch {
    return { error: 'json' };
  }
}

async function allowSubmit(request, env) {
  if (!env.RANK_KV) return true;
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const bucket = Math.floor(Date.now() / (RATE_WINDOW_SEC * 1000));
  const pepper = env.RATE_PEPPER || 'vr-battle-teaser-rate';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${pepper}|${bucket}|${ip}`),
  );
  const key = `rl:${[...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  const current = Number(await env.RANK_KV.get(key) || 0);
  if (current >= RATE_LIMIT) return false;
  await env.RANK_KV.put(key, String(current + 1), { expirationTtl: RATE_WINDOW_SEC * 2 });
  return true;
}

async function rankOf(env, row) {
  const { results } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM runs
     WHERE mode = ?
       AND (
         wins > ?
         OR (wins = ? AND draws > ?)
         OR (wins = ? AND draws = ? AND created_at < ?)
       )`,
  ).bind(row.mode, row.wins, row.wins, row.draws, row.wins, row.draws, row.created_at).all();
  return Number(results?.[0]?.n || 0) + 1;
}

async function board(env, mode) {
  const { results } = await env.DB.prepare(
    `SELECT wins, losses, draws, heroine_id, heroine_name
     FROM runs WHERE mode = ?
     ORDER BY wins DESC, draws DESC, created_at ASC
     LIMIT ?`,
  ).bind(mode, BOARD_LIMIT).all();
  return (results || []).map((row, index) => publicBoardRow(row, index + 1));
}

async function listRanking(url, env) {
  if (!env.DB) return json({ error: 'unavailable' }, 503);
  const mode = Number(url.searchParams.get('mode') || 5);
  if (![5, 10, 20].includes(mode)) return json({ error: 'mode' }, 400);
  return json({ mode, board: await board(env, mode) });
}

async function submit(request, env) {
  if (!env.DB) return json({ error: 'unavailable' }, 503);
  if (!(await allowSubmit(request, env))) return json({ error: 'rate_limited' }, 429);

  const parsed = await readJson(request);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const id = String(parsed.value?.id || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return json({ error: 'id' }, 400);
  }

  const existing = await env.DB.prepare(
    'SELECT id, mode, wins, losses, draws, heroine_id, heroine_name, created_at FROM runs WHERE id = ?',
  ).bind(id).first();
  if (existing) {
    const you = publicBoardRow(existing, await rankOf(env, existing));
    return json({ ok: true, stored: false, you, mode: existing.mode, board: await board(env, existing.mode) });
  }

  const evaluated = evaluateRun(parsed.value, CARDS);
  if (!evaluated.ok) return json({ error: evaluated.error }, 400);

  const createdAt = Date.now();
  await env.DB.prepare(
    `INSERT INTO runs (id, mode, wins, losses, draws, heroine_id, heroine_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    evaluated.mode,
    evaluated.wins,
    evaluated.losses,
    evaluated.draws,
    evaluated.heroine.id,
    evaluated.heroine.name,
    createdAt,
  ).run();

  const row = {
    mode: evaluated.mode,
    wins: evaluated.wins,
    losses: evaluated.losses,
    draws: evaluated.draws,
    heroine_id: evaluated.heroine.id,
    heroine_name: evaluated.heroine.name,
    created_at: createdAt,
  };
  console.log(JSON.stringify({
    event: 'rank_submit',
    mode: row.mode,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
  }));
  return json({
    ok: true,
    stored: true,
    you: publicBoardRow(row, await rankOf(env, row)),
    mode: row.mode,
    board: await board(env, row.mode),
  });
}

function preflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health') {
        return json({ ok: true, ranking: Boolean(env.DB) });
      }
      if (url.pathname === '/api/ranking') {
        if (request.method === 'OPTIONS') return preflight();
        if (request.method === 'GET') return listRanking(url, env);
        if (request.method === 'POST') return submit(request, env);
        return json({ error: 'method' }, 405);
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(JSON.stringify({ event: 'rank_error', message: error instanceof Error ? error.message : 'error' }));
      return json({ error: 'unavailable' }, 503);
    }
  },
};
