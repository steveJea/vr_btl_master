import { GRADE_CLASS } from './config.js';

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function gradeClass(grade) {
  return GRADE_CLASS[grade] || 'g-normal';
}

const NUM_FMT = new Intl.NumberFormat('ko-KR');
export function fmtNum(n) {
  const value = Number(n);
  return Number.isFinite(value) ? NUM_FMT.format(value) : '';
}

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

export function safeId(id) {
  return /^\d{5}$/.test(String(id)) ? String(id) : '';
}
