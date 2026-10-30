// Generates thousands of questions in every grade, topic and language and checks them.
// Run: npm run selftest
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const load = (p) => server.ssrLoadModule(p);

const engine = await load('/src/exam/engine.js');
const checker = await load('/src/exam/checker.js');
const tax = await load('/src/exam/taxonomy.js');
const i18n = await load('/src/i18n/index.js');
const { makeRng } = await load('/src/exam/rng.js');

let errors = 0;
let total = 0;
const fail = (msg, q) => {
  errors++;
  if (errors < 40) console.error('✗', msg, q ? JSON.stringify(q).slice(0, 400) : '');
};

function correctResponse(q) {
  switch (q.type) {
    case 'choice': return q.answer;
    case 'number': return String(Array.isArray(q.answer) ? q.answer[0] : q.answer).replace('.', ',');
    case 'text': return q.answer[0];
    case 'tf': return [...q.answer];
    case 'match': return [...q.answer];
    default: return null;
  }
}

function validate(q, where) {
  total++;
  const s = JSON.stringify(q);
  if (/"m\.[a-z_0-9]+"|\{[a-z]+\}/.test(s.replace(/\\"/g, ''))) {
    // raw i18n key or unreplaced placeholder
    const m = s.match(/m\.[a-z_0-9]+|\{[a-z]+\}/);
    fail(`${where}: untranslated ${m && m[0]}`, q);
  }
  if (!q.text) fail(`${where}: no text`, q);
  if (q.type === 'choice') {
    if (!Array.isArray(q.options) || q.options.length < 2) fail(`${where}: options`, q);
    if (!(q.answer >= 0 && q.answer < q.options.length)) fail(`${where}: answer index`, q);
    const keys = q.options.map((o) => JSON.stringify(o));
    if (new Set(keys).size !== keys.length) fail(`${where}: duplicate options`, q);
  }
  if (q.type === 'number') {
    const a = Array.isArray(q.answer) ? q.answer : [q.answer];
    if (!a.every((x) => Number.isFinite(x))) fail(`${where}: non-finite answer`, q);
  }
  if (q.type === 'tf' && (!q.statements || q.statements.length !== q.answer.length)) fail(`${where}: tf length`, q);
  const res = checker.checkAnswer(q, correctResponse(q));
  if (!res.correct || res.score !== res.max) fail(`${where}: correct answer not accepted`, q);
  // a clearly wrong answer must not pass
  if (q.type === 'number') {
    const a = Array.isArray(q.answer) ? q.answer[0] : q.answer;
    if (checker.checkAnswer(q, String(a + 1)).correct) fail(`${where}: wrong answer accepted`, q);
  }
  if (q.type === 'choice') {
    const wrong = (q.answer + 1) % q.options.length;
    if (checker.checkAnswer(q, wrong).correct) fail(`${where}: wrong option accepted`, q);
  }
}

// 1) every topic × grade × language, many seeds
const langs = i18n.LANGS.map((l) => l.code);
for (const grade of tax.GRADES) {
  for (const subject of ['math', 'czech']) {
    for (const topic of tax.topicsFor(subject, grade)) {
      for (const lang of subject === 'czech' ? ['cs', 'en'] : langs) {
        for (let seed = 0; seed < (lang === 'cs' || lang === 'en' ? 12 : 3); seed++) {
          const set = engine.buildTopicSet({ subject, grade, topic, lang, curriculum: 'cz', count: 10, seed });
          if (set.questions.length < 8) fail(`${subject}/${grade}/${topic}/${lang}: only ${set.questions.length} questions`);
          set.questions.forEach((q) => validate(q, `${subject}/${grade}/${topic}/${lang}`));
        }
      }
    }
  }
}

// 2) mock tests: every series/variant sums to 50 points and is deterministic
let mocks = 0;
for (const grade of tax.GRADES) {
  for (const subject of ['math', 'czech']) {
    for (let s = 1; s <= tax.MOCK_SERIES; s++) {
      for (const v of tax.MOCK_VARIANTS_PER_SERIES) {
        const t = engine.buildMockTest({ subject, grade, series: s, variant: v, lang: 'cs', curriculum: 'cz' });
        const t2 = engine.buildMockTest({ subject, grade, series: s, variant: v, lang: 'cs', curriculum: 'cz' });
        const pts = t.questions.reduce((a, q) => a + q.points, 0);
        if (pts !== 50) fail(`mock ${subject}/${grade}/${s}${v}: ${pts} points`);
        if (JSON.stringify(t.questions.map((q) => q.id)) !== JSON.stringify(t2.questions.map((q) => q.id))) fail(`mock ${subject}/${grade}/${s}${v}: not deterministic`);
        if (new Set(t.questions.map((q) => q.id)).size !== t.questions.length) fail(`mock ${subject}/${grade}/${s}${v}: duplicate task`);
        t.questions.forEach((q) => validate(q, `mock ${subject}/${grade}`));
        mocks++;
      }
    }
  }
}

// 3) daily plan = 3 per subject
for (const grade of tax.GRADES) {
  const p = engine.buildDailyPlan({ grade, lang: 'uz', curriculum: 'cz' });
  if (p.questions.length !== 6) fail(`daily ${grade}: ${p.questions.length} questions`);
  const p2 = engine.buildDailyPlan({ grade, lang: 'en', curriculum: 'intl' });
  if (p2.questions.length !== 3) fail(`daily intl ${grade}: ${p2.questions.length}`);
}

// 4) checker edge cases
const nq = { type: 'number', answer: 2.5, points: 1 };
for (const ok of ['2,5', '2.5', ' 2,5 ', '5/2', '2,50']) if (!checker.checkAnswer(nq, ok).correct) fail(`checker rejects ${ok}`);
for (const bad of ['2', '25', 'abc', '2,4']) if (checker.checkAnswer(nq, bad).correct) fail(`checker accepts ${bad}`);
const fq = { type: 'number', answer: 7 / 12 };
if (!checker.checkAnswer(fq, '7/12').correct) fail('fraction 7/12');
if (!checker.checkAnswer(fq, '14/24').correct) fail('fraction 14/24 equal value');
const tq = { type: 'tf', answer: [true, false, true, false], points: 2 };
if (checker.checkAnswer(tq, [true, false, true, true]).score !== 1) fail('tf partial');
const xq = { type: 'text', answer: ['brzy, smáli'] };
if (!checker.checkAnswer(xq, 'Brzy,smáli').correct) fail('text comma normalisation');
if (checker.checkAnswer(xq, 'brzi, smáli').correct) fail('text diacritics/typo accepted');

// 5) every locale has every key the English master has
const en = i18n.ALL_DICTS.en;
for (const [code, d] of Object.entries(i18n.ALL_DICTS)) {
  const missing = Object.keys(en).filter((k) => !(k in d) && !['app.name', 'home.xp', 'res.xp'].includes(k));
  if (missing.length) fail(`locale ${code} missing ${missing.length}: ${missing.slice(0, 6).join(', ')}`);
  for (const [k, v] of Object.entries(d)) {
    if (Array.isArray(en[k]) !== Array.isArray(v)) fail(`locale ${code} ${k} type`);
    if (typeof v === 'string') {
      const need = (en[k] || '').match(/\{\w+\}/g) || [];
      need.forEach((p) => { if (!v.includes(p)) fail(`locale ${code} ${k} lacks ${p}`); });
    }
  }
  if (d['m.weekdays_full'] && d['m.weekdays_full'].length !== 7) fail(`locale ${code} weekdays`);
}

// 6) the example content pack is valid and its answers pass the checker
const packs = await load('/src/exam/packs.js');
const fs = await import('node:fs');
const pack = packs.parsePack(fs.readFileSync('content-packs/example-pack.json', 'utf8'));
[...pack.questions, ...pack.tests.flatMap((t) => t.questions)].forEach((q) => validate({ points: 1, ...q }, 'example pack'));
let bad = false;
try { packs.parsePack({ name: 'x', questions: [{ subject: 'math', type: 'choice', text: 'a', options: ['a', 'b'], answer: 5 }] }); } catch { bad = true; }
if (!bad) fail('invalid pack accepted');

// 7) rng sanity
const r = makeRng(1);
if (r.int(1, 1) !== 1) fail('rng');

console.log(`\n${total} questions checked, ${mocks} mock tests built, ${errors} problem(s).`);
await server.close();
process.exit(errors ? 1 : 0);
