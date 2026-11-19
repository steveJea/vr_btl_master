import { RANKING_API } from './config.js';
import { summarize } from '../shared/score.js';

export function localSummary(log) {
  return summarize(log.map((row) => ({ my: row.myCard, opp: row.oppCard })));
}

export async function submitRun(state) {
  const rounds = state.battleLog.map((row) => ({ my: row.myCard.id, opp: row.oppCard.id }));
  const response = await fetch(RANKING_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: state.runId, mode: state.mode, rounds }),
  });
  if (!response.ok) {
    const error = new Error('ranking');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function loadRanking(mode) {
  const response = await fetch(`${RANKING_API}?mode=${encodeURIComponent(mode)}`);
  if (!response.ok) throw new Error('ranking');
  return response.json();
}
