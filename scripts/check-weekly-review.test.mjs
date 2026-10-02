import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fingerprint, validateWeeklyReview } from './check-weekly-review.mjs';

const fixture = new URL('../docs/editorial-reviews/2026-10-02-10-12-screen/', import.meta.url);
const text = readFileSync(new URL('screenplay.txt', fixture), 'utf8');
const review = JSON.parse(readFileSync(new URL('review.json', fixture), 'utf8'));
test('reviewed package is valid', () => assert.deepEqual(validateWeeklyReview(text, review), []));
test('editing a reviewed script invalidates the review', () => {
  assert.match(validateWeeklyReview(text.replace('폭 앉는다', '천천히 앉는다'), review).join('\n'), /changed after review/);
});
test('a strong average cannot hide a weak ending or unresolved criticism', () => {
  const r = structuredClone(review);
  r.episodes[0].criteria.forEach(g => g.score = 9);
  r.episodes[0].criteria.find(g => g.id === 'payoff').score = 7;
  r.episodes[0].openIssues = ['The ending only repeats the start.'];
  const errors = validateWeeklyReview(text, r).join('\n');
  assert.match(errors, /payoff is below/);
  assert.match(errors, /Unresolved editorial issue/);
});
test('all twelve distinct criteria and shot-specific review are required', () => {
  const r = structuredClone(review);
  r.episodes[0].criteria[1] = r.episodes[0].criteria[0];
  r.episodes[1].shots[3].watchReason = '';
  const errors = validateWeeklyReview(text, r).join('\n');
  assert.match(errors, /twelve distinct/);
  assert.match(errors, /watch reason/);
});
test('a new hash does not excuse mismatched captions or future references', () => {
  const changed = text.replace('화면 자막: 자리 넓혀줄게.', '화면 자막: 다른 말.')
    .replace('referencePlan: {"background":1,', 'referencePlan: {"background":4,');
  const r = structuredClone(review);
  r.sourceSha256 = fingerprint(changed);
  const errors = validateWeeklyReview(changed, r).join('\n');
  assert.match(errors, /Speaker\/dialogue\/caption mismatch/);
  assert.match(errors, /reference must point backward/);
});
test('review evidence must exist in the exact source', () => {
  const r = structuredClone(review);
  r.episodes[2].criteria[0].quote = 'A scene that does not exist.';
  assert.match(validateWeeklyReview(text, r).join('\n'), /needs source evidence/);
});

test('script intention alone cannot pass the finished-film review gate', () => {
  const r = structuredClone(review);
  r.evaluationMode = 'ideal-script';
  r.productionBasis = [];
  delete r.episodes[0].screenTest;
  const errors = validateWeeklyReview(text, r).join('\n');
  assert.match(errors, /likely finished film/);
  assert.match(errors, /production assumption/);
  assert.match(errors, /decisive screen image/);
});
