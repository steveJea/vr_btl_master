import cards from '../data/cards.json';
import { FEATURED_HEROINE_NAME, IMAGE_BASE } from '../js/config.js';
import { indexCards, previewMeta, validateSubmission } from '../js/rank-core.js';

const byId = indexCards(cards);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function log(event, fields) {
  console.log(JSON.stringify({ event, ...fields }));
}

async function rateBucket(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const bucket = Math.floor(Date.now() / 60000);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${bucket}|rank`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 24);
}

async function allowSubmit(env, request) {
  if (!env.RATE_LIMIT) return true;
  const key = `b:${await rateBucket(request)}`;
  const current = Number(await env.RATE_LIMIT.get(key) || '0');
  if (current >= 6) return false;
  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 120 });
  return true;
}

async function board(env, mode, limit = 20) {
  const listed = await env.DB.prepare(
    `SELECT wins, loses, draws, margin, heroine_id AS heroineId, heroine_name AS heroineName
     FROM runs WHERE mode = ?
     ORDER BY wins DESC, margin DESC, created_at ASC
     LIMIT ?`
  ).bind(mode, limit).all();
  return listed.results || [];
}

async function placeOf(env, row) {
  const counted = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM runs
     WHERE mode = ?1 AND (
       wins > ?2 OR
       (wins = ?2 AND margin > ?3) OR
       (wins = ?2 AND margin = ?3 AND created_at < ?4)
     )`
  ).bind(row.mode, row.wins, row.margin, row.created_at).first();
  return Number(counted?.n || 0) + 1;
}

async function prune(env, mode) {
  await env.DB.prepare(
    `DELETE FROM runs WHERE mode = ?1 AND id NOT IN (
       SELECT id FROM runs WHERE mode = ?1
       ORDER BY wins DESC, margin DESC, created_at ASC
       LIMIT 300
     )`
  ).bind(mode).run();
}

async function handleRank(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const mode = Number(url.searchParams.get('mode') || '10');
    if (![5, 10, 20].includes(mode)) return json({ ok: false, error: 'mode' }, 400);
    if (!env.DB) return json({ ok: false, unavailable: true }, 503);
    try {
      const top = await board(env, mode);
      return json({ ok: true, mode, top }, 200);
    } catch (error) {
      log('rank_read_failed', { error: error instanceof Error ? error.message : String(error) });
      return json({ ok: false, unavailable: true }, 503);
    }
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  if (!env.DB) return json({ ok: false, unavailable: true }, 503);

  const rawLength = Number(request.headers.get('content-length') || '0');
  if (rawLength > 8000) return json({ ok: false, error: 'size' }, 413);
  let body;
  try {
    const text = await request.text();
    if (text.length > 8000) return json({ ok: false, error: 'size' }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'json' }, 400);
  }

  const parsed = validateSubmission(body, byId);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  try {
    if (!(await allowSubmit(env, request))) return json({ ok: false, error: 'rate' }, 429);
  } catch (error) {
    log('rate_limit_failed', { error: error instanceof Error ? error.message : String(error) });
  }

  const createdAt = Date.now();
  const id = crypto.randomUUID();
  const card = parsed.spotlight.card;
  const heroineId = card ? String(card.id) : '';
  const heroineName = card ? String(card.name).slice(0, 40) : '';

  try {
    await env.DB.prepare(
      `INSERT INTO runs (id, mode, wins, loses, draws, margin, heroine_id, heroine_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, parsed.mode, parsed.wins, parsed.loses, parsed.draws, parsed.margin, heroineId, heroineName, createdAt).run();
    const rank = await placeOf(env, {
      mode: parsed.mode,
      wins: parsed.wins,
      margin: parsed.margin,
      created_at: createdAt
    });
    if (ctx) ctx.waitUntil(prune(env, parsed.mode).catch((error) => {
      log('prune_failed', { error: error instanceof Error ? error.message : String(error) });
    }));
    log('rank_saved', { mode: parsed.mode, wins: parsed.wins });
    return json({
      ok: true,
      you: { rank, wins: parsed.wins, loses: parsed.loses, draws: parsed.draws, margin: parsed.margin }
    });
  } catch (error) {
    log('rank_write_failed', { error: error instanceof Error ? error.message : String(error) });
    return json({ ok: false, unavailable: true }, 503);
  }
}

class MetaTags {
  constructor(meta) {
    this.meta = meta;
  }

  element(element) {
    const key = element.getAttribute('property') || element.getAttribute('name');
    if (!key || this.meta[key] == null) return;
    element.setAttribute('content', this.meta[key]);
  }
}

function documentMeta(url) {
  const meta = previewMeta({
    search: url.search,
    origin: url.origin,
    byId,
    featuredName: FEATURED_HEROINE_NAME,
    cardImage: (id) => `${IMAGE_BASE}${id}.webp`
  });
  return {
    description: meta.description,
    'og:title': meta.title,
    'og:description': meta.description,
    'og:url': url.href,
    'og:image': meta.image,
    'og:image:width': meta.width,
    'og:image:height': meta.height,
    'og:image:alt': meta.alt,
    'twitter:title': meta.title,
    'twitter:description': meta.description,
    'twitter:image': meta.image,
    'twitter:image:alt': meta.alt
  };
}

async function rewriteDocument(request, env) {
  const asset = await env.ASSETS.fetch(request);
  const type = asset.headers.get('content-type') || '';
  if (!type.includes('text/html')) return asset;
  const url = new URL(request.url);
  return new HTMLRewriter().on('meta', new MetaTags(documentMeta(url))).transform(asset);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/rank') return handleRank(request, env, ctx);
    if ((url.pathname === '/' || url.pathname === '/index.html') && env.ASSETS) {
      return rewriteDocument(request, env);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('not found', { status: 404 });
  }
};
