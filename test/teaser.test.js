import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateRun, summarize } from '../shared/score.js';

const cards = new Map(Object.entries(JSON.parse(readFileSync(new URL('../worker/cards.json', import.meta.url), 'utf8'))));

function card(id, extra = {}) {
  return { id, name: id, gender: 'MALE', power: 1, grade: 'NORMAL', ...extra };
}

test('client roster drops personal fields and unknown cards', () => {
  const text = readFileSync(new URL('../js/cards-data.js', import.meta.url), 'utf8');
  const data = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
  assert.equal(data.length, 454);
  for (const row of data) {
    assert.equal(Object.hasOwn(row, 'age'), false);
    assert.notEqual(row.id, '10533');
    assert.equal(String(row.name).includes('우승찬'), false);
  }
  assert.equal(data.find((row) => row.id === '10083').name, '김희건');
  assert.equal(data.find((row) => row.id === '10098').name, '두윤창');
  assert.equal(data.find((row) => row.id === '10444').name, '한석열');
  assert.equal(cards.has('10533'), false);
});

test('public pages do not show age, the main game, or random photos', () => {
  const files = [
    'index.html',
    'js/ui.js',
    'js/cards.js',
    'js/footer.js',
    'js/main.js',
    'js/share.js',
    'js/config.js',
    'css/style.css',
  ];
  const banned = ['picsum.photos', 'tcg.mbbs.kr', '어비스', 'PRESS ANY KEY', 'Abyss Gate', 'card.age', '지금 플레이'];
  for (const file of files) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const phrase of banned) {
      assert.equal(text.includes(phrase), false, `${file} contains ${phrase}`);
    }
  }
});

test('heroine prefers a winning woman over a stronger man', () => {
  const summary = summarize([
    { my: card('a', { gender: 'FEMALE', power: 10, name: '히로인' }), opp: card('b', { power: 1 }) },
    { my: card('c', { gender: 'MALE', power: 99, name: '에이스' }), opp: card('d', { power: 2 }) },
  ]);
  assert.equal(summary.wins, 2);
  assert.equal(summary.heroine.name, '히로인');
  assert.equal(summary.heroineIsFemale, true);
});

test('server recomputes the score and rejects a card the main game does not have', () => {
  const ids = [...cards.keys()];
  const rounds = [0, 1, 2, 3, 4].map((index) => ({ my: ids[index], opp: ids[index + 5] }));
  const result = evaluateRun({ mode: 5, wins: 5, rounds }, cards);
  assert.equal(result.ok, true);
  assert.equal(result.wins + result.losses + result.draws, 5);
  assert.equal(evaluateRun({ mode: 5, rounds: [...rounds.slice(0, 4), { my: '10533', opp: ids[9] }] }, cards).error, 'unknown');
  assert.equal(evaluateRun({ mode: 4, rounds }, cards).error, 'mode');
  const duplicate = rounds.map((round, index) => (index === 4 ? { ...round, my: rounds[0].my } : round));
  assert.equal(evaluateRun({ mode: 5, rounds: duplicate }, cards).error, 'duplicate');
});

test('owner switches are single config values', () => {
  const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
  assert.match(config, /export const INCLUDE_MALE_CARDS = true/);
  assert.match(config, /export const DEFAULT_MODE = 5/);
  assert.match(config, /export const OFFICIAL_CHANNELS = \[/);
  assert.match(config, /id: 'kakao'[\s\S]*enabled: false/);
});
