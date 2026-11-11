// Unit tests of the scoring rules. Run: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partial, firstOk, pointsOf, gradeTask, finalize, summarize, finishBonus } from '../src/exam/scoring.js';

const choice = (answer, points = 2, topic = 'a') => ({ id: `c${answer}${points}${topic}`, type: 'choice', options: ['x', 'y', 'z'], answer, points, topic });
const tf = (answer, points = 3, topic = 'b') => ({ id: 'tf', type: 'tf', statements: answer.map(String), answer, points, topic });
const num = (answer, points = 1, topic = 'c') => ({ id: 'n', type: 'number', answer, points, topic });

test('partial: only a half-filled multi-part task', () => {
  const q = tf([true, false, true]);
  assert.equal(partial(q, [true, null, null]), true);
  assert.equal(partial(q, [true, false, true]), false);
  assert.equal(partial(q, [null, null, null]), false);
  assert.equal(partial(q, null), false);
  assert.equal(partial(choice(1), 0), false);
});

test('first right answer gives full points', () => {
  const q = choice(1, 2);
  const g = gradeTask(q, 1, null);
  assert.equal(g.first, true);
  assert.deepEqual({ correct: g.check.correct, firstScore: g.check.firstScore, n: g.check.n }, { correct: true, firstScore: 2, n: 1 });
  assert.equal(firstOk(g.check, q), true);
});

test('a fixed answer turns correct but keeps the first-try points (0)', () => {
  const q = choice(1, 2);
  const wrong = gradeTask(q, 0, null).check;
  assert.equal(wrong.correct, false);
  assert.equal(wrong.firstScore, 0);
  // not edited yet → nothing to grade
  assert.equal(gradeTask(q, 0, wrong), null);
  const fixed = gradeTask(q, 1, { ...wrong, stale: true });
  assert.equal(fixed.first, false);
  assert.equal(fixed.check.correct, true);
  assert.equal(fixed.check.firstScore, 0);
  assert.equal(fixed.check.n, 2);
  assert.equal(firstOk(fixed.check, q), false);
});

test('an empty answer is not a try', () => {
  const g = gradeTask(num(5), '', null);
  assert.equal(g.res.empty, true);
  assert.equal(g.check, null);
  // the real first try still counts afterwards
  assert.equal(gradeTask(num(5), '5', g.check).check.firstScore, 1);
});

test('ANO/NE: one mistake costs one point', () => {
  const q = tf([true, false, true], 3);
  assert.equal(gradeTask(q, [true, false, false], null).check.firstScore, 2);
  assert.equal(gradeTask(q, [false, true, false], null).check.firstScore, 0);
});

test('in a fixing run nothing adds points', () => {
  const q = choice(1, 2);
  const g = gradeTask(q, 1, null, { fixing: true });
  assert.equal(g.first, false);
  assert.equal(g.check.correct, true);
  assert.equal(g.check.firstScore, 0);
});

test('handing in grades filled-but-unchecked tasks as first tries', () => {
  const qs = [choice(1, 2), choice(2, 2), num(7, 1), choice(0, 2)];
  const checked = gradeTask(qs[0], 1, null).check;
  const { final, total, answered, graded } = finalize(qs, [1, 2, '8', null], [checked, null, null, null]);
  assert.equal(total, 4); // 2 (checked) + 2 (right, unchecked) + 0 (wrong) + 0 (empty)
  assert.equal(answered, 3);
  assert.deepEqual(graded.map((g) => g.i), [1, 2]);
  assert.equal(final[1].late, true);
  assert.equal(final[3].empty, true);
  assert.equal(pointsOf(final), total);
});

test('handing in a fixing run never changes the score', () => {
  const qs = [choice(1, 2), choice(2, 2), choice(0, 2)];
  const old = [
    { correct: true, score: 2, firstScore: 2, n: 1 },
    { correct: false, score: 0, firstScore: 0, n: 1, stale: true },
    null, // was skipped last time
  ];
  const { final, total, graded } = finalize(qs, [1, 2, 0], old, { fixing: true });
  assert.equal(total, 2);
  assert.equal(graded.length, 0);
  assert.equal(final[1].correct, true);
  assert.equal(final[1].firstScore, 0);
  assert.equal(final[2].correct, true);
  assert.equal(final[2].firstScore, 0);
});

test('results: counters, XP and topics all come from first tries', () => {
  const qs = [choice(1, 2, 'a'), choice(2, 2, 'a'), tf([true, false], 3, 'b'), num(7, 1, 'b')];
  let c1 = gradeTask(qs[1], 0, null).check; // wrong first
  c1 = gradeTask(qs[1], 2, { ...c1, stale: true }).check; // then fixed
  const checks = [
    gradeTask(qs[0], 1, null).check,
    c1,
    gradeTask(qs[2], [true, true], null).check, // one mistake → 2 of 3
    null,
  ];
  const s = summarize(qs, checks);
  assert.equal(s.score, 4);
  assert.equal(s.max, 8);
  assert.equal(s.firstTry, 1);
  assert.equal(s.fixedLater, 1);
  assert.equal(s.wrong, 2); // partly-right ANO/NE + the empty one
  assert.equal(s.xp, 20); // only the task right on the first try: 10 × 2 points
  assert.deepEqual(s.byTopic, { a: { got: 2, max: 4 }, b: { got: 2, max: 4 } });
});

test('a perfect test: 50 points, everything first try', () => {
  const qs = Array.from({ length: 25 }, (_, i) => choice(i % 3, 2, `t${i % 5}`));
  const checks = qs.map((q) => gradeTask(q, q.answer, null).check);
  const s = summarize(qs, checks);
  assert.equal(s.score, 50);
  assert.equal(s.firstTry, 25);
  assert.equal(s.fixedLater, 0);
  assert.equal(s.wrong, 0);
  assert.equal(s.xp + finishBonus('mock'), 550);
});
