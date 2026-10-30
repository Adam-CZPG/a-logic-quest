// Imported test packs (JSON). Lets a teacher – or anyone with permission to use
// official materials – load their own tasks into the app. Format: see CONTENT.md.
import { z } from 'zod';

const KEY = 'lq_packs_v1';

const base = {
  subject: z.enum(['math', 'czech']),
  topic: z.string().min(1).optional(),
  grades: z.array(z.number().int()).length(2).optional(),
  grade: z.number().int().optional(),
  points: z.number().int().min(1).max(10).optional(),
  text: z.string().min(1),
  context: z.string().optional(),
  source: z.string().optional(),
  group: z.string().optional(),
  explain: z.string().optional(),
  expr: z.string().optional(),
  prefix: z.string().optional(),
  unit: z.string().optional(),
};

const Question = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('choice'), options: z.array(z.string()).min(2).max(6), answer: z.number().int().min(0) }),
  z.object({ ...base, type: z.literal('number'), answer: z.union([z.number(), z.array(z.number()).min(1)]), tolerance: z.number().optional() }),
  z.object({ ...base, type: z.literal('text'), answer: z.array(z.string()).min(1) }),
  z.object({ ...base, type: z.literal('tf'), statements: z.array(z.string()).min(1), answer: z.array(z.boolean()).min(1) }),
  z.object({ ...base, type: z.literal('match'), left: z.array(z.string()).min(1), right: z.array(z.string()).min(1), answer: z.array(z.number().int()).min(1) }),
]);

const Test = z.object({
  title: z.string().min(1),
  subject: z.enum(['math', 'czech']),
  grade: z.number().int(),
  minutes: z.number().int().min(1).max(240).optional(),
  questions: z.array(Question).min(1),
});

const Pack = z.object({
  name: z.string().min(1),
  version: z.number().optional(),
  questions: z.array(Question).optional(),
  tests: z.array(Test).optional(),
});

export function parsePack(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const pack = Pack.parse(data);
  const all = [...(pack.questions || []), ...(pack.tests || []).flatMap((t) => t.questions)];
  all.forEach((q) => {
    if (q.type === 'choice' && q.answer >= q.options.length) throw new Error('answer out of range');
    if (q.type === 'tf' && q.answer.length !== q.statements.length) throw new Error('tf length');
    if (q.type === 'match' && q.answer.length !== q.left.length) throw new Error('match length');
  });
  if (!all.length) throw new Error('empty pack');
  return { ...pack, id: `${pack.name}-${Date.now()}`, count: all.length };
}

export function getPacks() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function savePacks(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function addPack(pack) {
  const list = getPacks().filter((p) => p.name !== pack.name);
  list.push(pack);
  savePacks(list);
  return list;
}

export function removePack(id) {
  const list = getPacks().filter((p) => p.id !== id);
  savePacks(list);
  return list;
}

function fitsGrade(q, grade) {
  if (q.grade) return q.grade === grade;
  if (q.grades) return grade >= q.grades[0] && grade <= q.grades[1];
  return true;
}

export function getPackQuestions({ subject, grade, topic }) {
  return getPacks()
    .flatMap((p) => p.questions || [])
    .filter((q) => q.subject === subject && fitsGrade(q, grade) && (!topic || q.topic === topic));
}

export function getPackTests({ subject, grade }) {
  return getPacks().flatMap((p) => (p.tests || []).map((t, i) => ({ ...t, packId: p.id, index: i, packName: p.name })))
    .filter((t) => t.subject === subject && t.grade === grade);
}
