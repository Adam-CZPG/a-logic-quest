// Learning progress: XP, streak, per-topic accuracy, test history, mistakes, badges.
// Stored locally (works offline in the APK).
import { dailyKey } from './engine';
import { topicsFor, CURRICULA } from './taxonomy';

const KEY = 'lq_stats_v1';
const MAX_HISTORY = 200;
const MAX_MISTAKES = 150;

function fresh() {
  return {
    xp: 0, solved: 0, correct: 0, fixed: 0, dailyCount: 0,
    streak: { count: 0, last: null },
    topics: {}, mocks: {}, history: [], mistakes: [], dailyDone: {}, badges: {},
    tried: {}, // every full test the child finished, even half-empty – shown green in the lists
    days: {}, // 'YYYY-MM-DD' → { a, c, m: { math: {a, c}, czech: {a, c} } } – progress over time
    firstAt: null,
  };
}

export function getStats() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = { ...fresh(), ...JSON.parse(raw) };
    if (!s.days || typeof s.days !== 'object') s.days = {};
    if (!s.tried || typeof s.tried !== 'object') s.tried = {};
    // older versions had no day log: rebuild a rough one from the finished tests
    if (!Object.keys(s.days).length && s.history.length) {
      s.history.forEach((h) => {
        const d = (s.days[dailyKey(new Date(h.at))] ||= { a: 0, c: 0, m: {} });
        const n = Math.max(1, Math.round(h.max / 3));
        d.a += n;
        d.c += Math.round((h.score / Math.max(1, h.max)) * n);
      });
    }
    if (!s.firstAt) s.firstAt = s.history.length ? s.history[s.history.length - 1].at : null;
    return s;
  } catch {
    return fresh();
  }
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  try {
    window.dispatchEvent(new Event('lq-stats'));
  } catch {}
}

export function resetStats() {
  save(fresh());
}

export function levelFromXp(xp) {
  // level n needs 100·n·(n-1)/2 XP → 0, 100, 300, 600 …
  let n = 1;
  while (xp >= (100 * n * (n + 1)) / 2) n++;
  const prev = (100 * (n - 1) * n) / 2;
  const next = (100 * n * (n + 1)) / 2;
  return { level: n, progress: (xp - prev) / (next - prev), toNext: next - xp };
}

function touchStreak(s) {
  const today = dailyKey();
  if (s.streak.last === today) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  s.streak.count = s.streak.last === dailyKey(y) ? s.streak.count + 1 : 1;
  s.streak.last = today;
}

export function currentStreak(s = getStats()) {
  const today = dailyKey();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (s.streak.last === today || s.streak.last === dailyKey(y)) return s.streak.count;
  return 0;
}

// Called whenever an answer is checked (first check counts for statistics).
export function recordAnswer(q, result, { grade, firstTry = true } = {}) {
  const s = getStats();
  if (firstTry) {
    const k = `${q.subject}:${grade}:${q.topic}`;
    const t = s.topics[k] || { a: 0, c: 0 };
    t.a++;
    if (result.correct) t.c++;
    s.topics[k] = t;
    s.solved++;
    const d = (s.days[dailyKey()] ||= { a: 0, c: 0, m: {} });
    const m = (d.m[q.subject] ||= { a: 0, c: 0 });
    d.a++;
    m.a++;
    if (result.correct) { d.c++; m.c++; }
    if (!s.firstAt) s.firstAt = Date.now();
    if (result.correct) {
      s.correct++;
      s.xp += 10 * (q.points || 1);
    }
  }
  if (!result.correct && firstTry && !q.mistakeId) {
    s.mistakes = [{ q: { ...q }, at: Date.now() }, ...s.mistakes.filter((m) => m.q.id !== q.id)].slice(0, MAX_MISTAKES);
  }
  if (result.correct && q.mistakeId) {
    const before = s.mistakes.length;
    s.mistakes = s.mistakes.filter((m) => m.q.id !== q.mistakeId);
    if (s.mistakes.length < before) {
      s.fixed++;
      s.xp += 5;
    }
  }
  touchStreak(s);
  save(s);
}

export function recordFinish(set, { score, max, ms, grade, mode, answered = 0, count = 1 }) {
  const s = getStats();
  // a test only counts (history, XP, badges) when at least half of it was answered
  if (set.kind === 'mock' && answered > 0) {
    const k = `${set.subject}:${grade}:${set.series}${set.variant}`;
    s.tried[k] = Math.max(s.tried[k] ?? 0, score);
  }
  if (answered * 2 < count) {
    save(s);
    return [];
  }
  const entry = { at: Date.now(), kind: set.kind, subject: set.subject, grade, score, max, ms, mode, series: set.series, variant: set.variant, topic: set.topic };
  s.history = [entry, ...s.history].slice(0, MAX_HISTORY);
  if (set.kind === 'mock') {
    const k = `${set.subject}:${grade}:${set.series}${set.variant}`;
    s.mocks[k] = Math.max(s.mocks[k] ?? 0, score);
    s.xp += 50;
  }
  if (set.kind === 'daily') {
    if (!s.dailyDone[set.day]) {
      s.dailyDone[set.day] = true;
      s.dailyCount++;
      s.xp += 30;
    }
  }
  touchStreak(s);
  const newBadges = updateBadges(s, grade);
  save(s);
  return newBadges;
}

export const BADGES = [
  { id: 'first_test', emoji: '🎯', check: (s) => s.history.some((h) => h.kind === 'mock') },
  { id: 'score40', emoji: '🏅', check: (s) => s.history.some((h) => h.kind === 'mock' && h.score >= 40) },
  { id: 'perfect', emoji: '💎', check: (s) => s.history.some((h) => h.kind === 'mock' && h.score >= 50) },
  { id: 'streak3', emoji: '🔥', check: (s) => s.streak.count >= 3 },
  { id: 'streak7', emoji: '⚡', check: (s) => s.streak.count >= 7 },
  { id: 'solved100', emoji: '💯', check: (s) => s.solved >= 100 },
  { id: 'solved500', emoji: '🚀', check: (s) => s.solved >= 500 },
  { id: 'explorer', emoji: '🧭', check: (s, grade, curriculum) => allTopicsTried(s, grade, curriculum) },
  { id: 'daily5', emoji: '📅', check: (s) => s.dailyCount >= 5 },
  { id: 'fixer', emoji: '🛠️', check: (s) => s.fixed >= 20 },
];

function allTopicsTried(s, grade, curriculum = 'cz') {
  const subjects = CURRICULA[curriculum]?.subjects || ['math'];
  return subjects.every((sub) => topicsFor(sub, grade).every((t) => s.topics[`${sub}:${grade}:${t}`]));
}

function updateBadges(s, grade) {
  let curriculum = 'cz';
  try {
    curriculum = JSON.parse(localStorage.getItem('lq_settings_v1') || '{}').curriculum || 'cz';
  } catch {}
  const earned = [];
  BADGES.forEach((b) => {
    if (!s.badges[b.id] && b.check(s, grade, curriculum)) {
      s.badges[b.id] = Date.now();
      earned.push(b);
    }
  });
  return earned;
}

export function topicAccuracy(s, subject, grade, topic) {
  const t = s.topics[`${subject}:${grade}:${topic}`];
  if (!t || !t.a) return null;
  return t.c / t.a;
}

export function weakTopics(s, grade, curriculum) {
  const out = {};
  (CURRICULA[curriculum]?.subjects || ['math']).forEach((sub) => {
    const list = topicsFor(sub, grade).map((t) => ({ t, acc: topicAccuracy(s, sub, grade, t) }));
    // untried topics count as weak too, so everything gets covered
    out[sub] = list.sort((a, b) => (a.acc ?? -1) - (b.acc ?? -1)).map((x) => x.t);
  });
  return out;
}

// ---------------------------------------------------------------- progress over time
function mondayOf(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Last `n` weeks (oldest first): tasks tried and accuracy, overall and per subject.
export function weeklyTrend(s, n = 8) {
  const start = mondayOf(new Date());
  const weeks = [];
  for (let w = n - 1; w >= 0; w--) {
    const from = new Date(start);
    from.setDate(from.getDate() - 7 * w);
    const row = { from, a: 0, c: 0, m: {} };
    for (let i = 0; i < 7; i++) {
      const day = new Date(from);
      day.setDate(day.getDate() + i);
      const d = s.days[dailyKey(day)];
      if (!d) continue;
      row.a += d.a;
      row.c += d.c;
      Object.entries(d.m || {}).forEach(([sub, v]) => {
        const r = (row.m[sub] ||= { a: 0, c: 0 });
        r.a += v.a;
        r.c += v.c;
      });
    }
    row.acc = row.a ? row.c / row.a : null;
    weeks.push(row);
  }
  return weeks;
}

// The child's journey: since when, how many days, how much better than at the start.
export function journey(s) {
  const keys = Object.keys(s.days).sort();
  const daysActive = keys.length;
  const first = keys.slice(0, 3).reduce((acc, k) => ({ a: acc.a + s.days[k].a, c: acc.c + s.days[k].c }), { a: 0, c: 0 });
  const last = keys.slice(-3).reduce((acc, k) => ({ a: acc.a + s.days[k].a, c: acc.c + s.days[k].c }), { a: 0, c: 0 });
  const firstAcc = first.a ? first.c / first.a : null;
  const lastAcc = last.a ? last.c / last.a : null;
  const tests = s.history.filter((h) => h.kind === 'mock').length;
  const attempts = s.history.length;
  return {
    firstAt: s.firstAt,
    daysActive,
    firstAcc,
    lastAcc,
    gain: daysActive >= 4 && firstAcc !== null && lastAcc !== null ? lastAcc - firstAcc : null,
    tests,
    attempts,
  };
}
