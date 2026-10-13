import { GRADE_COLORS } from './config.js';

export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function getGradeColor(g) {
  return GRADE_COLORS[g] || "slate";
}

export function getGradeBorder(g) {
  return `border-${getGradeColor(g)}-500`;
}

// 표시용 숫자 포맷 (천 단위 구분). 비교/계산에는 원래 숫자를 그대로 사용.
const NUM_FMT = new Intl.NumberFormat('ko-KR');
export function fmtNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? NUM_FMT.format(v) : (n ?? '');
}
