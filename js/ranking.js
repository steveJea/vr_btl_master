import { RANK_API_BASE } from './config.js?v=7';

function endpoint(path) {
  return `${RANK_API_BASE}${path}`;
}

async function request(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  try {
    const res = await fetch(endpoint(path), { ...options, signal: ctrl.signal });
    const data = await res.json().catch(() => ({ ok: false, unavailable: true }));
    if (!res.ok) return { ...data, ok: false, status: res.status, unavailable: res.status >= 500 || data.unavailable };
    return data;
  } catch {
    return { ok: false, unavailable: true };
  } finally {
    clearTimeout(timer);
  }
}

export function submitRun(mode, rounds) {
  return request('/api/rank', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode, rounds })
  });
}

export function fetchBoard(mode) {
  return request(`/api/rank?mode=${encodeURIComponent(mode)}`);
}

export function rankNote(result) {
  if (result?.ok && result.you) {
    return `이 기록이 랭킹 ${Number(result.you.rank).toLocaleString('ko-KR')}위에 올랐습니다.`;
  }
  if (result?.status === 429) return '기록이 너무 빠릅니다. 잠시 뒤 다음 판부터 올라갑니다. 이 결과는 화면에 남아 있습니다.';
  return '랭킹 서버에 닿지 않았습니다. 배틀 결과는 이 기기에 그대로 남아 있습니다.';
}
