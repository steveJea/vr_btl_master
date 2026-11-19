import { BGM } from './config.js';

let currentAudio = null;
let currentKey = null;
let isMuted = false;
let hasUserInteracted = false;
const audioCache = {};

function getAudio(key) {
  if (!audioCache[key]) {
    const audio = new Audio();
    audio.preload = 'none';
    audio.loop = true;
    audio.src = BGM[key];
    audio.volume = 0.45;
    audioCache[key] = audio;
  }
  return audioCache[key];
}

export function unlockAudio() {
  hasUserInteracted = true;
}

export function playBGM(key) {
  if (!BGM[key]) return;
  if (currentKey === key && currentAudio && !currentAudio.paused) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentKey = key;
  currentAudio = getAudio(key);
  currentAudio.volume = isMuted ? 0 : 0.45;
  if (!hasUserInteracted) return;
  currentAudio.play().catch(() => {});
}

export function toggleMute() {
  isMuted = !isMuted;
  if (currentAudio) currentAudio.volume = isMuted ? 0 : 0.45;
  return isMuted;
}
