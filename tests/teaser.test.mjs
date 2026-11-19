import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DEFAULT_MODE, FEATURED_HEROINE_NAME, INCLUDE_MALE_CARDS } from '../js/config.js';
import { findFeatured } from '../js/data.js';
import {
  buildShareText,
  indexCards,
  pickSpotlight,
  previewMeta,
  validateSubmission
} from '../js/rank-core.js';

const cards = JSON.parse(readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8'));
const byId = indexCards(cards);
const source = readFileSync(new URL('../data/cards.source.csv', import.meta.url), 'utf8');

test('public cards keep no age and the source file still has the column', () => {
  assert.equal(cards.some((card) => Object.prototype.hasOwnProperty.call(card, 'age')), false);
  assert.match(source.split('\n')[0], /(^|,)age(,|$)/);
  assert.equal(JSON.stringify(cards).includes('"age"'), false);
});

test('owner switches: male cards stay, default length is 10', () => {
  assert.equal(INCLUDE_MALE_CARDS, true);
  assert.equal(DEFAULT_MODE, 10);
  assert.ok(cards.some((card) => card.gender === 'MALE'));
  assert.ok(cards.some((card) => card.gender === 'FEMALE'));
});

test('임유리 is the exact-name featured card and is not forced into rank math', () => {
  const exact = cards.filter((card) => card.name === '임유리');
  assert.equal(exact.length, 1);
  assert.equal(findFeatured(cards).id, exact[0].id);
  assert.equal(FEATURED_HEROINE_NAME, '임유리');
  const awakened = cards.find((card) => card.name.includes('각성') && card.name.includes('임유리'));
  assert.notEqual(awakened.id, exact[0].id);
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  assert.equal(worker.includes(exact[0].id), false);
  assert.equal(worker.includes('ORDER BY wins'), true);
});

test('default share image is the site portrait, a result uses the real winner', () => {
  const featured = findFeatured(cards);
  const other = cards.find((card) => card.id !== featured.id && card.gender === 'FEMALE');
  const plain = previewMeta({
    search: '',
    origin: 'https://preview.example',
    byId,
    featuredName: FEATURED_HEROINE_NAME,
    cardImage: (id) => `https://cards.example/${id}.webp`
  });
  assert.equal(plain.image, 'https://preview.example/img/og.jpg');
  assert.equal(plain.alt, '임유리');
  const shared = previewMeta({
    search: `?m=10&w=6&l=4&d=0&c=${other.id}`,
    origin: 'https://preview.example',
    byId,
    featuredName: FEATURED_HEROINE_NAME,
    cardImage: (id) => `https://cards.example/${id}.webp`
  });
  assert.equal(shared.image, `https://cards.example/${other.id}.webp`);
  assert.equal(shared.alt, other.name);
  assert.equal(shared.description.includes('세'), false);
});

test('spotlight follows the round winner and share text has no age', () => {
  const heroine = findFeatured(cards);
  const other = cards.find((card) => card.gender === 'MALE');
  const spot = pickSpotlight([
    { myId: other.id, oppId: heroine.id, myWin: false, draw: false }
  ], byId);
  assert.equal(spot.card.id, heroine.id);
  assert.equal(spot.heroine, true);
  const text = buildShareText({
    mode: 10, wins: 6, loses: 4, draws: 0, name: heroine.name, power: heroine.power
  });
  assert.match(text, new RegExp(heroine.name));
  assert.equal(text.includes('세'), false);
  assert.equal(text.includes(String(heroine.power)), true);
});

test('a submitted board only accepts real rounds', () => {
  const [a, b, c, d, e] = cards;
  const bad = validateSubmission({ mode: 10, rounds: [{ my: a.id, opp: b.id }] }, byId);
  assert.equal(bad.ok, false);
  const rounds = [a, b, c, d, e].map((card, index) => ({ my: card.id, opp: cards[index + 10].id }));
  const ok = validateSubmission({ mode: 5, rounds }, byId);
  assert.equal(ok.ok, true);
  assert.equal(ok.wins + ok.loses + ok.draws, 5);
});

test('client surfaces do not show age, the main game, picsum, or a key-prompt', () => {
  const files = ['index.html', 'js/ui.js', 'js/cards.js', 'js/main.js', 'js/share.js', 'js/footer.js', 'css/style.css'];
  const blob = files.map((file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')).join('\n');
  assert.equal(blob.includes('card.age'), false);
  assert.equal(blob.includes('picsum'), false);
  assert.equal(blob.includes('tcg.mbbs.kr'), false);
  assert.equal(blob.includes('PRESS ANY KEY'), false);
  assert.equal(blob.includes('어비스'), false);
  assert.equal(blob.includes('세 •'), false);
});
