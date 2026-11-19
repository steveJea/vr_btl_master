import { BGM } from './config.js';

let currentAudio = null;
let currentKey = null;
let isMuted = false;
let hasUserInteracted = false;
const audioCache = {};

function getAudio(key) {
  if (!BGM[key]) return null;
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
  const next = getAudio(key);
  if (!next) return;
  if (currentKey === key && currentAudio && !currentAudio.paused) return;

  if (currentAudio && currentAudio !== next) {
    currentAudio.pause();
  }

  currentKey = key;
  currentAudio = next;
  currentAudio.volume = isMuted ? 0 : 0.45;

  if (!hasUserInteracted) return;
  currentAudio.play().catch((error) => {
    console.log(JSON.stringify({ message: 'bgm blocked', key, error: error.message }));
  });
}

export function toggleMute() {
  isMuted = !isMuted;
  if (currentAudio) currentAudio.volume = isMuted ? 0 : 0.45;
  return isMuted;
}

export function getMuted() {
  return isMuted;
}
