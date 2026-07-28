import { BGM } from './config.js';

let currentAudio = null;
let currentKey = null;
let isMuted = false;
let hasUserInteracted = false;

// 미리 Audio 객체 생성 (첫 재생 지연 줄이기)
const audioCache = {};
Object.keys(BGM).forEach(key => {
  const a = new Audio();
  a.src = BGM[key];
  a.loop = true;
  a.preload = 'auto';
  a.volume = 0.45;
  // GitHub raw CORS 대응
  a.crossOrigin = 'anonymous';
  audioCache[key] = a;
});

/**
 * 사용자 상호작용이 발생했음을 기록
 * (클릭, 키입력 등 실제 제스처 안에서 호출해야 함)
 */
export function unlockAudio() {
  hasUserInteracted = true;
}

/**
 * 화면별 배경음 재생
 * @param {'main'|'select'|'battle'|'result'} key
 */
export function playBGM(key) {
  if (!BGM[key]) {
    console.warn('[BGM] 키 없음:', key);
    return;
  }

  // 같은 곡이 이미 재생 중이면 스킵
  if (currentKey === key && currentAudio && !currentAudio.paused) {
    return;
  }

  // 기존 오디오 정지
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentKey = key;
  currentAudio = audioCache[key];
  currentAudio.volume = isMuted ? 0 : 0.45;
  currentAudio.currentTime = 0;

  // 사용자 상호작용이 있었을 때만 재생 시도
  if (hasUserInteracted) {
    const playPromise = currentAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[BGM] 재생 성공:', key);
        })
        .catch(err => {
          console.warn('[BGM] 재생 실패:', key, err.message);
          // 실패 시 한 번 더 시도 (일부 브라우저에서 필요)
          setTimeout(() => {
            currentAudio.play().catch(e => console.warn('[BGM] 재시도 실패:', e.message));
          }, 200);
        });
    }
  } else {
    console.log('[BGM] 대기 중 (사용자 상호작용 필요):', key);
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

/** 디버그용: 현재 상태 확인 */
export function debugAudio() {
  return {
    key: currentKey,
    muted: isMuted,
    interacted: hasUserInteracted,
    paused: currentAudio ? currentAudio.paused : null,
    src: currentAudio ? currentAudio.src : null,
    volume: currentAudio ? currentAudio.volume : null
  };
}

// 콘솔에서 window.debugAudio() 로 확인 가능
window.debugAudio = debugAudio;
