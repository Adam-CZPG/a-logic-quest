// Unfinished tests are kept on the device, so a child can stop in the middle and continue later
// exactly where they left off (answers, checks, current task, time used).
import { hashString } from '@/exam/rng';
import { dailyKey } from '@/exam/dates';

const KEY = 'lq_resume_v1';
const MAX = 20;
const MAX_AGE = 30 * 86400000;

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  // keep the newest few; daily plans from earlier days are no longer useful
  const today = dailyKey();
  const keep = Object.entries(all)
    .filter(([, v]) => v && Date.now() - (v.at || 0) < MAX_AGE && !(v.meta?.kind === 'daily' && v.meta.day !== today))
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch {}
  try {
    window.dispatchEvent(new Event('lq-resume'));
  } catch {}
}

// one saved run per set of tasks + mode (a simulation and a practice of the same test are separate)
export function resumeKey(set, mode, grade) {
  return `${set.kind}:${set.subject || ''}:${grade}:${mode}:${hashString(set.questions.map((q) => q.id).join('|'))}`;
}

export function metaFor(set, grade, mode) {
  return {
    kind: set.kind, subject: set.subject || null, grade, mode,
    number: set.number ?? null, topic: set.topic ?? null, variant: set.variant ?? null, cycle: set.cycle ?? 0,
    day: set.day ?? null, total: set.questions.length,
  };
}

export function loadResume(key, count) {
  const v = readAll()[key];
  if (!v || !Array.isArray(v.answers) || v.answers.length !== count) return null;
  return v;
}

export function saveResume(key, data) {
  const all = readAll();
  all[key] = { ...data, at: Date.now() };
  writeAll(all);
}

export function clearResume(key) {
  const all = readAll();
  if (all[key]) {
    delete all[key];
    writeAll(all);
  }
}

// unfinished runs matching a filter, newest first: [{ key, meta, answered, at }]
export function listResume(match = () => true) {
  return Object.entries(readAll())
    .filter(([, v]) => v?.meta && match(v.meta))
    .map(([key, v]) => ({ key, meta: v.meta, answered: v.answered || 0, at: v.at }))
    .sort((a, b) => b.at - a.at);
}
