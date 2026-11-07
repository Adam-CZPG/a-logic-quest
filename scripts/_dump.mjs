import { createServer } from 'vite';
import fs from 'node:fs';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const e = await server.ssrLoadModule('/src/exam/engine.js');
const tax = await server.ssrLoadModule('/src/exam/taxonomy.js');
const out = process.argv[2];
const fmt = (q) => {
  let a = q.type === 'choice' ? `✓ ${q.options[q.answer]}` : q.type === 'tf' ? q.statements.map((s, i) => `${q.answer[i] ? 'ANO' : 'NE'}: ${s}`).join(' | ') : q.type === 'match' ? JSON.stringify(q.answer) : `✓ ${JSON.stringify(q.answer)}${q.unit ? ' ' + q.unit : ''}`;
  return `[${q.topic}] ${q.text}${q.expr ? ' «' + q.expr + '»' : ''}${q.options ? '\n    opts: ' + q.options.join(' | ') : ''}${q.figure ? '\n    fig: ' + JSON.stringify(q.figure).slice(0, 160) : ''}\n    ${a}${q.explain ? '\n    expl: ' + q.explain : ''}`;
};
const lines = [];
const [subject, grade, lang, cur, n] = process.argv.slice(3);
for (const topic of tax.topicsFor(subject, +grade)) {
  const seen = new Set();
  for (let seed = 0; seed < +n; seed++) {
    const s = e.buildTopicSet({ subject, grade: +grade, topic, lang, curriculum: cur, count: 12, seed });
    s.questions.forEach((q) => { const k = q.text + q.expr + JSON.stringify(q.options); if (!seen.has(k) && !q.context) { seen.add(k); lines.push(fmt(q)); } });
  }
}
fs.writeFileSync(out, lines.join('\n'));
console.log(subject, grade, lines.length);
await server.close();
