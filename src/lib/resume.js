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

// one saved run per test + mode (a simulation and a practice of the same test are separate).
// The key names the test itself (subject, grade, number / topic+variant / day, round), not the task
// texts: math texts change with the interface language and any task can change after an app update,
// and the child must still get their unfinished test back.
export function resumeKey(set, mode, grade) {
  const base = `${set.kind}:${set.subject || ''}:${grade}:${mode}`;
  if (set.kind === 'mock' && set.number) return `${base}:n${set.number}:c${set.cycle ?? 0}`;
  if (set.kind === 'topic' && set.variant) return `${base}:${set.topic}:v${set.variant}:c${set.cycle ?? 0}`;
  if (set.kind === 'daily' && set.day) return `${base}:${set.day}`;
  if (set.kind === 'duel' && set.duelId) return `${base}:${set.duelId}`;
  return legacyKey(set, mode, grade);
}

// how keys looked before (hash of the task ids) – runs saved by older versions are still found
function legacyKey(set, mode, grade) {
  return `${set.kind}:${set.subject || ''}:${grade}:${mode}:${hashString(set.questions.map((q) => q.id).join('|'))}`;
}

// what a task is, independent of the interface language: same topic, type and right answer
function sigOf(q) {
  return `${q.topic || ''}|${q.type || ''}|${JSON.stringify(q.answer ?? null)}|${q.options?.length ?? 0}|${q.points || 1}`;
}

export function resumeIds(qs) {
  return { ids: qs.map((q) => q.id), sigs: qs.map(sigOf) };
}

export function metaFor(set, grade, mode) {
  return {
    kind: set.kind, subject: set.subject || null, grade, mode,
    number: set.number ?? null, topic: set.topic ?? null, variant: set.variant ?? null, cycle: set.cycle ?? 0,
    day: set.day ?? null, total: set.questions.length,
  };
}

// the saved run for this test, lined up with the tasks as they are built now.
// A task keeps its saved answer when it is the same task (same id, or same topic/type/answer at the
// same place – e.g. a math word problem shown in another language). Changed tasks start empty.
export function loadResume(key, set, mode, grade) {
  const qs = set.questions;
  const all = readAll();
  let v = all[key];
  let from = key;
  if (!v) {
    const old = legacyKey(set, mode, grade);
    if (old !== key && all[old]) {
      v = all[old];
      from = old;
    }
  }
  if (!v || !Array.isArray(v.answers)) return null;
  const { ids, sigs } = resumeIds(qs);
  const sameAll = v.answers.length === qs.length && (!v.ids || v.ids.every((id, i) => id === ids[i]));
  let out;
  if (sameAll) {
    out = v;
  } else {
    const at = (i) => {
      if (v.ids) {
        const j = v.ids.indexOf(ids[i]);
        if (j >= 0) return j;
        if (i < v.answers.length && v.sigs?.[i] === sigs[i]) return i;
        return -1;
      }
      return -1;
    };
    const map = qs.map((_, i) => at(i));
    if (!map.some((j) => j >= 0)) return null;
    const pick = (arr, empty) => map.map((j) => (j >= 0 && Array.isArray(arr) ? arr[j] ?? empty : empty));
    out = {
      ...v,
      answers: pick(v.answers, null),
      checks: pick(v.checks, null),
      reveal: pick(v.reveal, false),
      skipped: v.skipped ? pick(v.skipped, false) : undefined,
      left: v.left ? pick(v.left, false) : undefined,
      idx: Math.max(0, map.indexOf(v.idx ?? 0)),
    };
  }
  // move a run saved under the old key to the new one
  if (from !== key) {
    delete all[from];
    all[key] = { ...v, ...resumeIds(qs), answers: out.answers, checks: out.checks, reveal: out.reveal, skipped: out.skipped, left: out.left, idx: out.idx };
    writeAll(all);
  }
  return out;
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
