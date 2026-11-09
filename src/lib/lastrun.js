// The last finished attempt of every test / topic set is kept on the device, so the child can
// open it again later, see which tasks were right (green), wrong (red) or skipped (orange)
// and fix just those.
import { hashString } from '@/exam/rng';

const KEY = 'lq_lastrun_v1';
const MAX = 120;

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  const keep = Object.entries(all).sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0)).slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch {}
}

// which test this is, independent of mode (a timed run and a practice run of test 2 are the same sheet)
export function lastKey({ kind, subject, grade, number, topic, variant, cycle, day }) {
  // a test is named by its number; a topic set by topic + variant; a daily plan by its day
  const id = kind === 'mock' ? number : kind === 'topic' ? `${topic}/${variant}` : kind === 'daily' ? day : '';
  return [kind, subject || '', grade, id ?? '', cycle ?? 0].join(':');
}

const keyOfSet = (set, grade) => lastKey({ ...set, grade });
const hashOf = (set) => hashString(set.questions.map((q) => q.id).join('|'));

// 'ok' = right, 'bad' = wrong, 'skip' = left empty
export function statusFromCheck(c) {
  if (!c || c.empty) return 'skip';
  return c.correct ? 'ok' : 'bad';
}

export function saveLast(set, grade, { answers, checks, score, max }) {
  if (!set || set.duelId || set.kind === 'mistakes') return;
  const all = readAll();
  all[keyOfSet(set, grade)] = {
    h: hashOf(set), at: Date.now(), score, max, answers,
    // keep only what the screen needs to redraw the marks
    checks: checks.map((c) => (c && !c.empty ? { correct: !!c.correct, score: c.score ?? 0, firstScore: c.firstScore ?? 0, right: c.right, total: c.total, n: c.n || 1 } : null)),
    st: checks.map(statusFromCheck),
  };
  writeAll(all);
}

export function loadLast(set, grade) {
  const v = readAll()[keyOfSet(set, grade)];
  if (!v || v.h !== hashOf(set) || !Array.isArray(v.st) || v.st.length !== set.questions.length) return null;
  return v;
}

// for the test cards: how many tasks of the last attempt still wait to be fixed
export function leftToFix(meta) {
  const v = readAll()[lastKey(meta)];
  if (!v || !Array.isArray(v.st)) return null;
  return { bad: v.st.filter((s) => s === 'bad').length, skip: v.st.filter((s) => s === 'skip').length, score: v.score, max: v.max };
}
