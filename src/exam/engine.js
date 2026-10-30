// Builds question sets: topic practice, full mock tests (TAU-style), daily plan, mistakes review.
import { makeRng, hashString, randomSeed } from './rng';
import { mathGeneratorsFor } from './generators/math';
import { czechGeneratorsFor, readingGroups } from './generators/czech';
import { BLUEPRINTS, SUBJECTS, topicsFor, CURRICULA } from './taxonomy';
import { translate, currencyFor } from '@/i18n';
import { fmt } from './checker';
import { getPackQuestions } from './packs';

export function makeCtx({ lang, grade, curriculum }) {
  return {
    grade,
    lang,
    t: (key, vars) => translate(lang, key, vars),
    f: (n) => fmt(n, lang),
    names: translate(lang, 'm.names'),
    cur: currencyFor(lang, curriculum),
    exclude: new Set(),
  };
}

function finalize(q, meta) {
  const id = `${meta.subject}:${meta.topic}:${hashString(JSON.stringify([q.text, q.expr, q.context?.slice(0, 40), q.options, q.statements, q.answer]))}`;
  return { points: 1, ...q, ...meta, id, points: meta.points ?? q.points ?? 1 };
}

export function generateQuestion(subject, topic, r, ctx, points) {
  const gens = subject === 'czech' ? czechGeneratorsFor(topic) : mathGeneratorsFor(topic, ctx.grade);
  const packs = getPackQuestions({ subject, grade: ctx.grade, topic });
  for (let attempt = 0; attempt < 12; attempt++) {
    // imported packs get a fair share of the pool
    if (packs.length && r.chance(packs.length / (packs.length + gens.length * 3))) {
      const p = r.pick(packs);
      return finalize({ ...p }, { subject, topic, points: points ?? p.points });
    }
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
export function buildTopicSet({ subject, grade, topic, lang, curriculum, count = 12, seed = randomSeed() }) {
  const r = makeRng(`topic:${subject}:${grade}:${topic}:${seed}`);
  const ctx = { ...makeCtx({ lang, grade, curriculum }), seenKeys: new Set() };
  const qs = [];
  for (let i = 0; qs.length < count && i < count * 3; i++) {
    const q = generateQuestion(subject, topic, r.fork(`q${i}`), ctx, 1);
    if (q) qs.push(q);
  }
  return {
    kind: 'topic', subject, grade, topic, seed, questions: groupSort(qs),
    title: { key: `topic.${topic}` },
  };
}

// ---------------------------------------------------------------- full mock tests (celý test)
export function buildMockTest({ subject, grade, series, variant, lang, curriculum }) {
  const r = makeRng(`mock:${subject}:${grade}:${series}:${variant}`);
  const ctx = { ...makeCtx({ lang, grade, curriculum }), seenKeys: new Set(), usedGens: new Set() };
  const blueprint = BLUEPRINTS[subject][grade] || BLUEPRINTS[subject][5];
  const qs = [];

  let bp = blueprint;
  if (subject === 'czech') {
    // reading comprehension comes first as one block with a shared source text (4.1, 4.2 …)
    const groups = readingGroups(grade);
    const comprSlots = bp.filter(([t]) => t === 'porozumeni');
    if (groups.length && comprSlots.length) {
      const g = groups[hashString(`${series}${variant}`) % groups.length];
      const items = g.items.slice(0, comprSlots.length);
      items.forEach((it, i) => {
        qs.push(finalize({ ...it, context: g.context, source: g.source, group: g.group, groupIndex: i, curated: true }, { subject, topic: 'porozumeni', points: comprSlots[i][1] }));
        ctx.exclude.add(it.text + g.context.slice(0, 20));
      });
      let removed = items.length;
      bp = bp.filter(([t]) => (t === 'porozumeni' && removed-- > 0 ? false : true));
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
    kind: 'mock', subject, grade, series, variant,
    minutes: SUBJECTS[subject].minutes,
    questions: groupSort(qs),
    title: { key: 'tests.variantL', vars: { v: `${series}${variant}` } },
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
  const subjects = CURRICULA[curriculum]?.subjects || ['math'];
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

// TAU-style labels: 1, 2, 3.1, 3.2, 4 …
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
