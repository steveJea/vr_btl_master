import { BGM } from './config.js';

let currentAudio = null;
let currentKey = null;
let isMuted = false;
let isUnlocked = false; // 브라우저 자동재생 정책 해제 여부

/**
 * 첫 사용자 상호작용 시 오디오 잠금 해제
 */
export function unlockAudio() {
  if (isUnlocked) return;
  isUnlocked = true;
  // 더미 재생으로 잠금 해제
  const silent = new Audio();
  silent.play().catch(() => {});
}

/**
 * 화면별 배경음 재생
 * @param {'main'|'select'|'battle'|'result'} key
 */
export function playBGM(key) {
  if (!BGM[key]) return;
  if (currentKey === key && currentAudio && !currentAudio.paused) return;

  // 기존 오디오 정지
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentKey = key;
  currentAudio = new Audio(BGM[key]);
  currentAudio.loop = true;
  currentAudio.volume = isMuted ? 0 : 0.45;

  // 잠금 해제된 경우에만 재생 시도
  if (isUnlocked) {
    currentAudio.play().catch(err => {
      console.warn('BGM 재생 실패:', err.message);
    });
  }
}

export function stopBGM() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentKey = null;
}

export function toggleMute() {
  isMuted = !isMuted;
  if (currentAudio) {
    currentAudio.volume = isMuted ? 0 : 0.45;
  }
  return isMuted;
}

export function getMuted() {
  return isMuted;
}
