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
