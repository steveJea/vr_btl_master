// Single place for owner decisions and public links.
// Empty strings stay hidden. Do not add a main-game call to action here.

export const IMAGE_BASE = 'https://raw.githubusercontent.com/steveJea/vr-ideal-worldcup/main/img/bt_img/';
export const FALLBACK_ART = 'img/card-fallback.svg';

// One track is fetched after the player starts. Title load does not fetch audio.
export const BGM = {
  main: 'bgm/lite/main.mp3',
  select: 'bgm/lite/select.mp3',
  battle: 'bgm/lite/battle.mp3',
  result: 'bgm/lite/result.mp3',
};

/** Owner decision. true keeps male cards in the roster. */
export const INCLUDE_MALE_CARDS = true;

/** Owner decision. Default round count for the start button. Use 5 or 10. */
export const DEFAULT_MODE = 5;

/**
 * Official channels. A row appears only when url is a non-empty http(s) link.
 * Add another object to show another channel.
 */
export const OFFICIAL_CHANNELS = [
  { id: 'primary', label: '공식 채널', url: '' },
];

/**
 * Result share actions. The Kakao target stays off until enabled is true.
 * Turning it on is the only step required to show that button later.
 */
export const SHARE_TARGETS = [
  { id: 'native', label: '공유', enabled: true },
  { id: 'x', label: 'X', enabled: true },
  { id: 'copy', label: '링크 복사', enabled: true },
  { id: 'kakao', label: '카카오톡', enabled: false },
];

/** Ranking endpoint. Same origin when this is a relative path. */
export const RANKING_API = '/api/ranking';

export const GRADE_CLASS = {
  NORMAL: 'g-normal',
  RARE: 'g-rare',
  'HIGH RARE': 'g-high',
  'SUPER RARE': 'g-super',
  'ULTRA RARE': 'g-ultra',
  'MYTHIC RARE': 'g-mythic',
};

export const MODE_DISTRIBUTION = {
  5: { NORMAL: 2, RARE: 1, 'HIGH RARE': 1, 'SUPER RARE': 0, 'ULTRA RARE': 1, 'MYTHIC RARE': 0 },
  10: { NORMAL: 5, RARE: 2, 'HIGH RARE': 1, 'SUPER RARE': 1, 'ULTRA RARE': 1, 'MYTHIC RARE': 0 },
  20: { NORMAL: 10, RARE: 4, 'HIGH RARE': 2, 'SUPER RARE': 2, 'ULTRA RARE': 1, 'MYTHIC RARE': 1 },
};

export const MODE_BLURB = {
  5: '짧은 맛보기',
  10: '한 판 더',
  20: '긴 배틀',
};
