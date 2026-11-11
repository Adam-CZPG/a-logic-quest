// How a test is scored. Pure functions (no React, no storage), unit-tested in scripts/scoring.test.mjs.
//
// A "check" is the mark of one task: { correct, score, max, empty, n, firstScore, stale, late }.
//   firstScore – the points of the FIRST check; only these count for the result and XP
//   n          – how many times the task was checked
//   stale      – a wrong answer that is being changed (its next check is a retry)
//   late       – checked only when the sheet was handed in
import { checkAnswer } from './checker.js';

const pts = (q) => q.points || 1;

// some parts of a multi-part task (ANO/NE rows, pairs) are still empty
export function partial(q, resp) {
  if (q.type !== 'tf' && q.type !== 'match') return false;
  return Array.isArray(resp) && resp.some((v) => v === null || v === undefined) && resp.some((v) => v !== null && v !== undefined);
}

// right on the first try (full points from the first check), not only after a fix
export const firstOk = (c, q) => !!c && !c.empty && (c.firstScore ?? 0) >= pts(q);

export const pointsOf = (checks) => checks.reduce((a, c) => a + (c ? (c.firstScore ?? 0) : 0), 0);

// Grade one task. Returns null when there is nothing to grade (already marked and not edited),
// otherwise { res, check, first }: `check` is the new mark (unchanged for an empty answer) and
// `first` says whether this was the first, counting, try.
export function gradeTask(q, answer, prev, { fixing = false } = {}) {
  if (prev && !prev.stale) return null;
  const res = checkAnswer(q, answer);
  if (res.empty) return { res, check: prev ?? null, first: false };
  const first = !prev && !fixing;
  const check = { ...res, n: (prev?.n || 0) + 1, firstScore: first ? res.score : (prev?.firstScore ?? 0), stale: false };
  return { res, check, first };
}

// Handing in the sheet: tasks that were filled but never checked are graded now.
// Normal run – they count like a first try. Fixing run – they are marked but add no points.
// Returns { final, total, answered, graded } where graded = [{ i, res }] are the tasks first graded here.
export function finalize(qs, answers, checks, { fixing = false } = {}) {
  const graded = [];
  const final = checks.map((c, i) => {
    if (fixing) {
      if (c && !c.stale) return c;
      const r = checkAnswer(qs[i], answers[i]);
      return { ...r, firstScore: c?.firstScore ?? 0, n: (c?.n || 0) + 1, late: true };
    }
    if (c) return c;
    const r = checkAnswer(qs[i], answers[i]);
    if (!r.empty) graded.push({ i, res: r });
    return { ...r, firstScore: r.score, n: 0, late: true };
  });
  return { final, total: pointsOf(final), answered: final.filter((c) => !c.empty).length, graded };
}

// Numbers for the results screen – all counted from first tries, so they agree with the score.
export function summarize(qs, checks) {
  let firstTry = 0, fixedLater = 0, wrong = 0, xp = 0;
  const byTopic = {};
  qs.forEach((q, i) => {
    const c = checks[i];
    if (firstOk(c, q)) {
      firstTry++;
      xp += 10 * pts(q);
    } else if (c?.correct) fixedLater++;
    if (!c || c.empty || !c.correct) wrong++;
    const t = (byTopic[q.topic] ||= { got: 0, max: 0 });
    t.max += pts(q);
    t.got += c?.firstScore || 0;
  });
  return { firstTry, fixedLater, wrong, xp, byTopic, score: pointsOf(checks), max: qs.reduce((a, q) => a + pts(q), 0) };
}

// bonus XP for finishing a whole test / daily plan (given only when at least half was answered)
export const finishBonus = (kind) => (kind === 'mock' ? 50 : kind === 'daily' ? 30 : 0);
