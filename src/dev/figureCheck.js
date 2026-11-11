// Test helper (not part of the app bundle): draws every figure the task generators can produce
// and reports labels that are cut off by the drawing area or printed over each other.
// Used by e2e/figures.spec.js through the dev server.
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Figure from '@/components/exam/Figure';
import { buildMockTest, buildTopicSet } from '@/exam/engine';
import { CURRICULA, MOCK_COUNT, subjectsFor, topicsFor } from '@/exam/taxonomy';

const KINDS = ['bars', 'rect', 'lshape', 'cuboid', 'grid'];

function collect(figs, value) {
  if (!value || typeof value !== 'object') return;
  if (KINDS.includes(value.kind)) figs.set(JSON.stringify(value), value);
  Object.values(value).forEach((v) => collect(figs, v));
}

export function allFigures(langs = ['cs', 'de', 'uk']) {
  const figs = new Map();
  for (const [curriculum, cur] of Object.entries(CURRICULA)) {
    for (const grade of cur.grades) for (const lang of langs) {
      const subjects = subjectsFor(curriculum, grade).map((s) => s.id || s).filter((s) => s === 'math');
      for (const subject of subjects) {
        for (let number = 1; number <= MOCK_COUNT; number++) {
          try { collect(figs, buildMockTest({ subject, grade, number, lang, curriculum, cycle: 0 }).questions); } catch { /* not offered */ }
        }
        for (const topic of topicsFor(subject, grade, curriculum)) for (let variant = 1; variant <= 6; variant++) {
          try { collect(figs, buildTopicSet({ subject, topic: topic.id || topic, grade, lang, curriculum, variant, cycle: 0 }).questions); } catch { /* not offered */ }
        }
      }
    }
  }
  return [...figs.values()];
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

export async function scanFigures(extra = []) {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:0;top:0;width:300px';
  document.body.appendChild(host);
  const root = createRoot(host);
  const figures = [...allFigures(), ...extra];
  const problems = [];
  for (const figure of figures) {
    root.render(createElement(Figure, { figure }));
    await frame();
    const svg = host.querySelector('svg');
    if (!svg) continue;
    const vb = svg.viewBox.baseVal;
    const texts = [...svg.querySelectorAll('text')].map((t) => ({ text: t.textContent, box: t.getBBox() }));
    const cut = texts.filter(({ box }) => box.x < vb.x - 0.5 || box.y < vb.y - 0.5 || box.x + box.width > vb.x + vb.width + 0.5 || box.y + box.height > vb.y + vb.height + 0.5).map((t) => t.text);
    const over = [];
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const p = texts[i].box, q = texts[j].box;
      if (p.x < q.x + q.width - 1 && q.x < p.x + p.width - 1 && p.y < q.y + q.height - 2 && q.y < p.y + p.height - 2) over.push(`${texts[i].text} × ${texts[j].text}`);
    }
    if (cut.length || over.length) problems.push({ figure: JSON.stringify(figure).slice(0, 120), cut, over: over.slice(0, 3) });
  }
  root.unmount();
  host.remove();
  return { count: figures.length, problems };
}
