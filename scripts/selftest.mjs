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

// 2) mock tests: all 40 per subject/grade sum to 50 points, are deterministic, and change per round
let mocks = 0;
for (const grade of tax.GRADES) {
  for (const subject of ['math', 'czech']) {
    for (let n = 1; n <= tax.MOCK_COUNT; n++) {
      for (const cycle of [0, 1]) {
        const t = engine.buildMockTest({ subject, grade, number: n, cycle, lang: 'cs', curriculum: 'cz' });
        const t2 = engine.buildMockTest({ subject, grade, number: n, cycle, lang: 'cs', curriculum: 'cz' });
        const pts = t.questions.reduce((a, q) => a + q.points, 0);
        if (pts !== 50) fail(`mock ${subject}/${grade}/${n}/c${cycle}: ${pts} points`);
        if (JSON.stringify(t.questions.map((q) => q.id)) !== JSON.stringify(t2.questions.map((q) => q.id))) fail(`mock ${subject}/${grade}/${n}: not deterministic`);
        if (new Set(t.questions.map((q) => q.id)).size !== t.questions.length) fail(`mock ${subject}/${grade}/${n}: duplicate task`);
        t.questions.forEach((q) => validate(q, `mock ${subject}/${grade}`));
        mocks++;
      }
      const a = engine.buildMockTest({ subject, grade, number: n, cycle: 0, lang: 'cs', curriculum: 'cz' });
      const b = engine.buildMockTest({ subject, grade, number: n, cycle: 1, lang: 'cs', curriculum: 'cz' });
      const same = a.questions.filter((q, i) => b.questions[i] && q.id === b.questions[i].id).length;
      if (same > a.questions.length * 0.6) fail(`mock ${subject}/${grade}/${n}: new round barely differs (${same} same)`);
    }
  }
}

// 2b) fixed topic variants: deterministic within a round, different between rounds
for (const grade of tax.GRADES) {
  for (const subject of ['math', 'czech']) {
    for (const topic of tax.topicsFor(subject, grade)) {
      for (let v = 1; v <= tax.TOPIC_VARIANTS; v++) {
        const a = engine.buildTopicSet({ subject, grade, topic, lang: 'cs', curriculum: 'cz', variant: v, cycle: 0 });
        const a2 = engine.buildTopicSet({ subject, grade, topic, lang: 'cs', curriculum: 'cz', variant: v, cycle: 0 });
        if (JSON.stringify(a.questions.map((q) => q.id)) !== JSON.stringify(a2.questions.map((q) => q.id))) fail(`topic ${subject}/${grade}/${topic}/v${v}: not deterministic`);
        a.questions.forEach((q) => validate(q, `topic-variant ${subject}/${grade}/${topic}`));
      }
    }
  }
}

// 2c) grammar: verbs agree with the subject's gender (no "koupil(a)", no "David koupila")
const FEM = new Set(['Anna', 'Ema', 'Lucie', 'Tereza', 'Klára', 'Petra']);
for (let seed = 0; seed < 400; seed++) {
  const set = engine.buildTopicSet({ subject: 'math', grade: 5, topic: 'slovni', lang: 'cs', curriculum: 'cz', count: 10, seed });
  set.questions.forEach((q) => {
    if (/\(a\)|\(la\)/.test(q.text)) fail('cs: unresolved (a) in text', q);
    const m = q.text.match(/^(\S+) (koupil|koupila|utratil|utratila) /);
    if (m && FEM.has(m[1]) !== m[2].endsWith('a')) fail(`cs: gender mismatch "${m[1]} ${m[2]}"`, q);
  });
}
for (const lang of ['ru', 'uk']) {
  for (let seed = 0; seed < 100; seed++) {
    const set = engine.buildTopicSet({ subject: 'math', grade: 5, topic: 'slovni', lang, curriculum: 'cz', count: 10, seed });
    set.questions.forEach((q) => { if (/\((а|ла)\)/.test(q.text)) fail(`${lang}: unresolved gender form`, q); });
  }
}
{
  const { CZECH_WORD_LISTS: W } = await load('/src/exam/generators/czech.js');
  W.SUBJECTS.forEach(([sub, end]) => {
    const expect = /Kluci|Psi|Učitelé|Sousedé|Chlapci|Ptáci|Lvi|psi|Dědeček|tatínek/.test(sub) ? 'i' : /Kuřata$|Koťata$|Štěňata|Auta|Okna|Města$|^Koťata a/.test(sub) && !/Slepice|Vesnice/.test(sub) ? 'a' : 'y';
    if (expect !== end) fail(`agreement rule: ${sub} → ${end}, expected ${expect}`);
  });
}

// 3) daily plan = 3 per subject
for (const grade of tax.GRADES) {
  const p = engine.buildDailyPlan({ grade, lang: 'uk', curriculum: 'cz' });
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
