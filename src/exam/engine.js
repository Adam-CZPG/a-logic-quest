// Builds question sets: topic practice, full practice tests, daily plan, mistakes review.
import { makeRng, hashString, randomSeed } from './rng';
import { mathGeneratorsFor } from './generators/math';
import { czechGeneratorsFor, readingGroups as czechReading } from './generators/czech';
import { englishGeneratorsFor, readingGroups as englishReading } from './generators/english';
import { germanGeneratorsFor, readingGroups as germanReading } from './generators/german';
import { slovakGeneratorsFor, readingGroups as slovakReading } from './generators/slovak';
import { SUBJECTS, topicsFor, subjectsFor, contentGrade, englishLevel, blueprintFor, READING_TOPIC } from './taxonomy';
import { translate, currencyFor } from '@/i18n';
import { fmt } from './checker';

export function makeCtx({ lang, grade, curriculum }) {
  return {
    grade,
    lang,
    t: (key, vars) => translate(lang, key, vars),
    f: (n) => fmt(n, lang),
    names: translate(lang, 'm.names'),
    // 'm' | 'f' for every name, so verbs agree with the subject (David koupil / Petra koupila)
    genderOf: (name) => {
      const list = translate(lang, 'm.names');
      const g = String(translate(lang, 'm.namesG') || '');
      const i = Array.isArray(list) ? list.indexOf(name) : -1;
      return g[i] === 'f' ? 'f' : 'm';
    },
    cur: currencyFor(lang, curriculum),
    exclude: new Set(),
  };
}

function finalize(q, meta) {
  const id = `${meta.subject}:${meta.topic}:${hashString(JSON.stringify([q.text, q.expr, q.context?.slice(0, 40), q.options, q.statements, q.answer]))}`;
  return { points: 1, ...q, ...meta, id, points: meta.points ?? q.points ?? 1 };
}

function generatorsFor(subject, topic, grade) {
  if (subject === 'czech') return czechGeneratorsFor(topic);
  if (subject === 'english') return englishGeneratorsFor(topic);
  if (subject === 'german') return germanGeneratorsFor(topic);
  if (subject === 'slovak') return slovakGeneratorsFor(topic);
  return mathGeneratorsFor(topic, contentGrade('math', grade));
}

// shared source texts (reading comprehension) for a subject and real grade
function readingFor(subject, grade) {
  if (subject === 'czech') return czechReading(contentGrade('czech', grade));
  if (subject === 'english') return englishReading(englishLevel(grade));
  if (subject === 'german') return germanReading(grade);
  if (subject === 'slovak') return slovakReading(grade);
  return [];
}

export function generateQuestion(subject, topic, r, ctx0, points) {
  // generators see the grade their task bank is written for (+ English level / real grade)
  const ctx = { ...ctx0, grade: contentGrade(subject, ctx0.grade), realGrade: ctx0.grade, level: englishLevel(ctx0.grade) };
  const gens = generatorsFor(subject, topic, ctx0.grade);
  for (let attempt = 0; attempt < 12; attempt++) {
    if (!gens.length) break;
    // prefer a generator not yet used in this set, so one test never repeats the same kind of task
    const used = ctx.usedGens || new Set();
    const freshGens = gens.filter((g) => !used.has(g));
    const g = r.pick(freshGens.length && attempt < 8 ? freshGens : gens);
    used.add(g);
    let q = null;
    try {
      q = g(r.fork(`a${attempt}`), { ...ctx, points: points || 1, hard: (points || 1) >= 4 });
    } catch (e) {
      if (import.meta.env?.DEV) console.warn('generator failed', topic, e);
    }
    if (!q) continue;
    const key = (q.text || '') + (q.expr || '') + (q.context || '').slice(0, 20);
    if (ctx.seenKeys?.has(key) && attempt < 10) continue;
    ctx.seenKeys?.add(key);
    return finalize(q, { subject, topic, points });
  }
  return null;
}

// ---------------------------------------------------------------- topic practice (skupiny úloh)
export function buildTopicSet({ subject, grade, topic, lang, curriculum, count = 12, variant = null, cycle = 0, seed = randomSeed() }) {
  // a fixed variant (1…5) always gives the same tasks within a round; a new round gives new ones
  const r = makeRng(variant ? `topic:${subject}:${grade}:${topic}:v${variant}:c${cycle}` : `topic:${subject}:${grade}:${topic}:${seed}`);
  const ctx = { ...makeCtx({ lang, grade, curriculum }), seenKeys: new Set() };
  const qs = [];
  for (let i = 0; qs.length < count && i < count * 3; i++) {
    const q = generateQuestion(subject, topic, r.fork(`q${i}`), ctx, 1);
    if (q) qs.push(q);
  }
  return {
    kind: 'topic', subject, grade, topic, seed, variant, cycle, questions: groupSort(qs),
    title: variant ? { key: 'topics.variantTitle', vars: { topic: `topic.${topic}`, n: variant } } : { key: `topic.${topic}` },
  };
}

// ---------------------------------------------------------------- full mock tests (celý test)
// number: 1…40 (our own numbering). Each round (cycle) produces different tasks.
export function buildMockTest({ subject, grade, number, lang, curriculum, cycle = 0 }) {
  const series = Math.ceil(number / 4);
  const variant = 'ABCD'[(number - 1) % 4];
  const r = makeRng(cycle ? `mock:${subject}:${grade}:${series}:${variant}:c${cycle}` : `mock:${subject}:${grade}:${series}:${variant}`);
  const ctx = { ...makeCtx({ lang, grade, curriculum }), seenKeys: new Set(), usedGens: new Set() };
  const blueprint = blueprintFor(subject, grade);
  const qs = [];

  let bp = blueprint;
  const readTopic = READING_TOPIC[subject];
  if (readTopic) {
    // reading comprehension comes first as one block with a shared source text (1.1, 1.2 …)
    const groups = readingFor(subject, grade);
    const comprSlots = bp.filter(([t]) => t === readTopic);
    if (groups.length && comprSlots.length) {
      const g = groups[hashString(`${series}${variant}${cycle || ''}`) % groups.length];
      const items = g.items.slice(0, comprSlots.length);
      items.forEach((it, i) => {
        qs.push(finalize({ ...it, context: g.context, source: g.source, group: g.group, groupIndex: i, curated: true }, { subject, topic: readTopic, points: comprSlots[i][1] }));
        ctx.exclude.add(it.text + g.context.slice(0, 20));
      });
      let removed = items.length;
      bp = bp.filter(([t]) => (t === readTopic && removed-- > 0 ? false : true));
    }
  }
  bp.forEach(([topic, pts], i) => {
    const q = generateQuestion(subject, topic, r.fork(`s${i}`), ctx, pts);
    if (q) qs.push(q);
  });
  const total = qs.reduce((a, q) => a + q.points, 0);
  // top up to exactly 50 points if a generator was skipped
  if (total < 50 && qs.length) qs[qs.length - 1].points += 50 - total;
  return {
    kind: 'mock', subject, grade, number, series, variant, cycle,
    minutes: SUBJECTS[subject].minutes,
    questions: groupSort(qs),
    title: { key: 'tests.variant', vars: { n: number } },
  };
}

// ---------------------------------------------------------------- daily plan: 3 tasks from each subject
export function dailyKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildDailyPlan({ grade, lang, curriculum, weakTopics = {}, date = new Date(), perSubject = 3 }) {
  const day = dailyKey(date);
  const r = makeRng(`daily:${day}:${grade}:${curriculum}`);
  const ctx = { ...makeCtx({ lang, grade, curriculum }), seenKeys: new Set() };
  ctx.usedGens = new Set();
  const subjects = subjectsFor(curriculum);
  const qs = [];
  subjects.forEach((subject) => {
    const topics = topicsFor(subject, grade);
    // weakest topics first, then rotate through the rest by day
    const weak = (weakTopics[subject] || []).filter((t) => topics.includes(t));
    const dayIdx = hashString(day) % topics.length;
    const rotated = [...topics.slice(dayIdx), ...topics.slice(0, dayIdx)];
    const order = [...new Set([...weak.slice(0, 1), ...rotated])];
    for (let i = 0; i < perSubject; i++) {
      const topic = order[i % order.length];
      const q = generateQuestion(subject, topic, r.fork(`${subject}${i}`), ctx, 1);
      if (q) qs.push(q);
    }
  });
  return { kind: 'daily', day, grade, questions: qs, title: { key: 'p.daily' } };
}

// ---------------------------------------------------------------- duel
// 10 short tasks of one subject. The same seed + subject + grade + country give exactly the same
// tasks on every phone (in every interface language), so two children can compete without a server.
export const DUEL_SIZE = 10;
export function buildDuelSet({ subject, grade, curriculum, lang, seed }) {
  const r = makeRng(`duel:${subject}:${grade}:${curriculum}:${seed}`);
  const ctx = { ...makeCtx({ lang, grade, curriculum }), seenKeys: new Set() };
  ctx.usedGens = new Set();
  // the money must not depend on the interface language, or the two players would get different numbers
  if (curriculum === 'intl') ctx.cur = '€';
  // no long reading texts in a duel – it should be quick
  const topics = topicsFor(subject, grade).filter((t) => t !== READING_TOPIC[subject]);
  const start = hashString(String(seed)) % topics.length;
  const qs = [];
  for (let i = 0; qs.length < DUEL_SIZE && i < DUEL_SIZE * 3; i++) {
    const topic = topics[(start + i) % topics.length];
    const q = generateQuestion(subject, topic, r.fork(`d${i}`), ctx, 1);
    if (q && !q.context) qs.push(q);
  }
  return { kind: 'duel', subject, grade, seed, curriculum, minutes: 12, questions: qs, title: { key: 'duel.title' } };
}

// ---------------------------------------------------------------- mistakes review
export function buildMistakesSet(mistakes, max = 15) {
  const qs = mistakes.slice(0, max).map((m) => ({ ...m.q, mistakeId: m.q.id }));
  return { kind: 'mistakes', questions: qs, title: { key: 'p.mistakesMode' } };
}

// keep tasks that share a source text together, in order
function groupSort(qs) {
  const out = [];
  const used = new Set();
  qs.forEach((q, i) => {
    if (used.has(i)) return;
    if (!q.group) {
      out.push(q);
      used.add(i);
      return;
    }
    qs.forEach((p, j) => {
      if (!used.has(j) && p.group === q.group && p.context === q.context) {
        out.push(p);
        used.add(j);
      }
    });
  });
  return out;
}

// task labels: 1, 2, 3.1, 3.2, 4 … (tasks sharing one text are numbered together)
export function taskLabels(questions) {
  const labels = [];
  let n = 0;
  let sub = 0;
  questions.forEach((q, i) => {
    const prev = questions[i - 1];
    const next = questions[i + 1];
    const inGroup = q.group && ((prev && prev.group === q.group && prev.context === q.context) || (next && next.group === q.group && next.context === q.context));
    if (inGroup && prev && prev.group === q.group && prev.context === q.context) {
      sub++;
    } else {
      n++;
      sub = inGroup ? 1 : 0;
    }
    labels.push(inGroup ? `${n}.${sub}` : `${n}`);
  });
  return labels;
}
