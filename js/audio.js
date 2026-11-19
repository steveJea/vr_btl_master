import { BGM } from './config.js';

let currentAudio = null;
let currentKey = null;
let isMuted = false;
let hasUserInteracted = false;
let musicArmed = false;
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

/** 배틀 시작을 누른 뒤에만 음원 주소를 붙인다. */
export function armMusic() {
  hasUserInteracted = true;
  musicArmed = true;
}

export function playBGM(key) {
  if (!musicArmed) return;
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
