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
  // a shown number answer never looks like 880,0000000000001
  if (q.type === 'number' && !q.answerDisplay) {
    for (const a of [].concat(q.answer)) if (Math.abs(a * 1000 - Math.round(a * 1000)) > 1e-6) fail(`${where}: answer not rounded ${a}`, q);
  }
  // no two options with the same text (that would make two answers right)
  if (q.type === 'choice' && q.options.every((o) => typeof o === 'string') && new Set(q.options).size !== q.options.length) fail(`${where}: duplicate options`, q);
  if (/\(a\)|\(la\)|\(а\)|\(ла\)/.test(q.text)) fail(`${where}: unresolved gender form`, q);
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
// every country × its grades × its subjects
const COMBOS = [];
for (const c of Object.values(tax.CURRICULA)) for (const grade of c.grades) for (const subject of c.subjects) {
  if (!COMBOS.some((x) => x.grade === grade && x.subject === subject)) COMBOS.push({ grade, subject, curriculum: c.id });
}
for (const { grade, subject } of COMBOS) {
  {
    for (const topic of tax.topicsFor(subject, grade)) {
      for (const lang of subject === 'math' ? langs : ['cs', 'en', 'de', 'sk']) {
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
for (const { grade, subject } of COMBOS) {
  {
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
for (const { grade, subject } of COMBOS) {
  {
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

// 2d) update safety: old green tests (v2.1 keys) stay green after the update
{
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; }, key: (i) => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
  globalThis.window = globalThis.window || { dispatchEvent() {} };
  store.lq_stats_v1 = JSON.stringify({ xp: 777, solved: 42, mocks: { 'math:5:3B': 38 }, tried: { 'czech:9:1A': 12, 'math:5:2024/1': 20 }, history: [] });
  const st = await load('/src/exam/stats.js');
  const s1 = st.getStats();
  if (s1.xp !== 777 || s1.solved !== 42) fail('update: old stats lost');
  if (st.getRound(s1, 'math', 5).items['t:10'] !== 38) fail('update: old green test 3B lost');
  if (st.getRound(s1, 'czech', 9).items['t:1'] !== 12) fail('update: old green test 1A lost');
  delete globalThis.localStorage;
}

// 2e) a test stopped in the middle continues where it stopped; finished or old runs disappear
{
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; }, key: (i) => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
  globalThis.window = globalThis.window || { dispatchEvent() {} };
  const rs = await load('/src/lib/resume.js');
  const set = engine.buildDailyPlan({ grade: 5, lang: 'cs', curriculum: 'cz' });
  const set2 = engine.buildDailyPlan({ grade: 5, lang: 'cs', curriculum: 'cz' });
  const k = rs.resumeKey(set, 'practice', 5);
  if (k !== rs.resumeKey(set2, 'practice', 5)) fail('resume: same daily plan gives a different key');
  if (k === rs.resumeKey(set, 'sim', 5)) fail('resume: sim and practice share a key');
  const answers = set.questions.map((q, i) => (i < 4 ? 0 : null));
  rs.saveResume(k, { meta: rs.metaFor(set, 5, 'practice'), idx: 4, answers, checks: answers.map(() => null), reveal: answers.map(() => false), mistakes: 1, ms: 90000, answered: 4 });
  const back = rs.loadResume(k, set.questions.length);
  if (!back || back.idx !== 4 || back.answered !== 4 || back.ms !== 90000) fail('resume: saved run not restored');
  if (rs.listResume((m) => m.kind === 'daily').length !== 1) fail('resume: daily run not listed');
  rs.clearResume(k);
  if (rs.loadResume(k, set.questions.length)) fail('resume: finished run still there');
  delete globalThis.localStorage;
}

// 2f) Slovak: the verb agrees with the subject (Petra kúpila, Peter kúpil, dieťa kúpilo, deti kúpili)
{
  const { SLOVAK_LISTS: L } = await load('/src/exam/generators/slovak.js');
  for (let seed = 0; seed < 300; seed++) {
    for (const grade of [5, 9]) {
      const set = engine.buildTopicSet({ subject: 'slovak', grade, topic: 'sk_skladba', lang: 'sk', curriculum: 'sk', count: 10, seed });
      set.questions.filter((q) => q.type === 'choice' && /zhoda/.test(q.text)).forEach((q) => {
        const subj = L.SG_SUBJ.find(([n]) => q.expr.startsWith(`${n} `));
        const right = q.options[q.answer];
        if (subj) {
          const v = L.VERBS.find((x) => x.includes(right));
          if (!v || v[{ m: 0, f: 1, n: 2 }[subj[1]]] !== right) fail(`sk agreement: ${q.expr} → ${right}`, q);
        } else if (!/li$/.test(right)) fail(`sk plural agreement: ${q.expr} → ${right}`, q);
      });
    }
  }
}

// 2g) duel: both phones get the same tasks (whatever the interface language); links survive the trip
{
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; }, key: (i) => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
  const duel = await load('/src/lib/duel.js');
  for (const c of Object.values(tax.CURRICULA)) for (const grade of c.grades) for (const subject of c.subjects) {
    for (const seed of ['abc', 'k9x2', '77']) {
      const sets = ['cs', 'en', 'de', 'sk', 'uk'].map((lang) => engine.buildDuelSet({ subject, grade, curriculum: c.id, lang, seed }));
      if (sets[0].questions.length !== engine.DUEL_SIZE) fail(`duel ${c.id}/${subject}/${grade}: ${sets[0].questions.length} tasks`);
      const key = (st) => JSON.stringify(st.questions.map((q) => [q.type, q.answer, q.topic]));
      sets.forEach((st) => { if (key(st) !== key(sets[0])) fail(`duel ${c.id}/${subject}/${grade}/${seed}: tasks differ between languages`); st.questions.forEach((q) => validate(q, `duel ${c.id}/${subject}`)); });
    }
  }
  const d = { id: 'x1', subject: 'math', grade: 5, curriculum: 'cz', seed: 'abc', a: { n: 'Petra', v: '🦊', l: 'cs', p: 8, t: 192000 } };
  const back = duel.decodeDuel(duel.encodeDuel(d));
  if (!back || back.a.n !== 'Petra' || back.a.v !== '🦊' || back.seed !== 'abc' || back.b) fail('duel: link round trip');
  if (duel.decodeDuel('garbage') !== null || duel.decodeDuel(duel.encodeDuel({ ...d, subject: 'czech', curriculum: 'de' })) !== null) fail('duel: bad link accepted');
  const done = { ...d, role: 'a', b: { n: 'Tomáš', v: '🐼', l: 'sk', p: 8, t: 150000 } };
  if (duel.outcome(done) !== 'them') fail('duel: same points, faster should win');
  if (duel.outcome({ ...done, role: 'b' }) !== 'me') fail('duel: winner seen from the other side');
  if (!/^https:\/\/.+#\/d\?d=[A-Za-z0-9_-]+$/.test(duel.duelLink(d))) fail('duel: link format');
  delete globalThis.localStorage;
}

// 3) daily plan = 3 per subject
for (const c of Object.values(tax.CURRICULA)) {
  for (const grade of c.grades) {
    const p = engine.buildDailyPlan({ grade, lang: { de: 'de', sk: 'sk' }[c.id] || 'uk', curriculum: c.id });
    if (p.questions.length !== 3 * c.subjects.length) fail(`daily ${c.id}/${grade}: ${p.questions.length} questions`);
    p.questions.forEach((q) => validate(q, `daily ${c.id}/${grade}`));
  }
}
// German UI: gendered names resolve, currency is €
{
  const set = engine.buildTopicSet({ subject: 'math', grade: 4, topic: 'slovni', lang: 'de', curriculum: 'de', count: 12, seed: 3 });
  set.questions.forEach((q) => { if (/Kč|\{/.test(q.text)) fail('de: wrong currency or placeholder', q); });
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
  // same number of names everywhere → duels give the same tasks in every language
  if (d['m.names'].length !== en['m.names'].length || d['m.namesG'].length !== d['m.names'].length) fail(`locale ${code} names`);
}

// 7) rng sanity
const r = makeRng(1);
if (r.int(1, 1) !== 1) fail('rng');

console.log(`\n${total} questions checked, ${mocks} mock tests built, ${errors} problem(s).`);
await server.close();
process.exit(errors ? 1 : 0);
