import { GRADE_COLORS } from './config.js';

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getGradeColor(grade) {
  return GRADE_COLORS[grade] || 'NORMAL';
}

export function getGradeClass(grade) {
  return `g-${getGradeColor(grade)}`;
}

const NUM_FMT = new Intl.NumberFormat('ko-KR');
export function fmtNum(n) {
  const value = Number(n);
  return Number.isFinite(value) ? NUM_FMT.format(value) : (n ?? '');
}

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

export function genderLabel(gender) {
  if (gender === 'FEMALE') return '여성';
  if (gender === 'MALE') return '남성';
  return '';
}
