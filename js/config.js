// VR Battle Masters — 오픈 전 맛보기. 여기 있는 값만 바꾸면 공개 동작이 바뀐다.

export const IMAGE_BASE = 'https://raw.githubusercontent.com/steveJea/vr-ideal-worldcup/main/img/bt_img/';
export const THUMB_BASE = 'https://raw.githubusercontent.com/steveJea/vr-tcg/main/img/thumb/';
export const CARD_DATA_URL = './data/cards.json?v=7';
export const CARD_FALLBACK = './img/card-fallback.svg';

// 화면 배경음. 각 곡은 기존 트랙을 약 45초로 자른 루프다.
// 배틀 시작 뒤에, 지금 화면의 곡만 받는다.
export const BGM = {
  main: './bgm/Battle%20Master.mp3',
  select: './bgm/Where%20is%20my%20Hero.mp3',
  battle: './bgm/Battle%20yourself.mp3',
  result: './bgm/Who%20is%20the%20winner.mp3'
};

export const GRADE_COLORS = {
  'NORMAL': 'NORMAL',
  'RARE': 'RARE',
  'HIGH RARE': 'HIGH',
  'SUPER RARE': 'SUPER',
  'ULTRA RARE': 'ULTRA',
  'MYTHIC RARE': 'MYTHIC'
};

export const MODE_DISTRIBUTION = {
  5:  { 'NORMAL': 2, 'RARE': 1, 'HIGH RARE': 1, 'SUPER RARE': 0, 'ULTRA RARE': 1, 'MYTHIC RARE': 0 },
  10: { 'NORMAL': 5, 'RARE': 2, 'HIGH RARE': 1, 'SUPER RARE': 1, 'ULTRA RARE': 1, 'MYTHIC RARE': 0 },
  20: { 'NORMAL': 10, 'RARE': 4, 'HIGH RARE': 2, 'SUPER RARE': 2, 'ULTRA RARE': 1, 'MYTHIC RARE': 1 }
};

export const MODE_COPY = {
  5:  { title: '5 VS 5', blurb: '더 짧게' },
  10: { title: '10 VS 10', blurb: '기본' },
  20: { title: '20 VS 20', blurb: '길게 돌기' }
};

/**
 * 남성 카드를 덱에 넣을지. 지금은 포함한다.
 * false로 바꾸면 여성 카드만 돌린다.
 */
export const INCLUDE_MALE_CARDS = true;

/**
 * 시작 버튼이 바로 여는 길이. 지금은 10장.
 * 5 또는 20으로 바꿀 수 있고, 목록에 없는 값은 10으로 되돌린다.
 */
export const DEFAULT_MODE = 10;

/**
 * 공식 채널 슬롯. 이 배열 하나만 고친다.
 * url이 비어 있으면 그 줄은 숨기고, 전부 비어 있으면 슬롯 자체를 그리지 않는다.
 */
export const OFFICIAL_CHANNELS = [
  { id: 'official', label: '공식 채널', url: '' }
];

/**
 * 결과 공유 수단. enabled가 false면 버튼을 만들지 않는다.
 * 카카오톡 전용 버튼은 템플릿 키가 생기기 전에는 꺼 둔다.
 * 나중에 켤 때 id: 'kakao' 의 enabled만 true로 바꾸면 같은 자리가 열린다.
 */
export const SHARE_PROVIDERS = [
  { id: 'x', label: 'X', enabled: true },
  { id: 'copy', label: '링크 복사', enabled: true },
  { id: 'native', label: '공유', enabled: true },
  { id: 'kakao', label: '카카오톡', enabled: false }
];

/** 비우면 같은 주소의 /api/rank. 랭킹만 다른 호스트에 둘 때 절대 URL. */
export const RANK_API_BASE = '';

/**
 * 타이틀과 기본 공유 이미지의 얼굴. 카드 이름과 정확히 같은 한 장.
 * 각성 카드처럼 이름이 더 긴 장은 고르지 않는다.
 * 덱 확률, POWER, 랭킹 정렬에는 쓰지 않는다.
 */
export const FEATURED_HEROINE_NAME = '임유리';

export function resolvedDefaultMode() {
  return Object.prototype.hasOwnProperty.call(MODE_DISTRIBUTION, DEFAULT_MODE)
    ? DEFAULT_MODE
    : 10;
}
