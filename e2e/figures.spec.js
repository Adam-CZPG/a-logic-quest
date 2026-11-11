// Every drawing a task can show (rectangles, L-shapes, cuboids, bar charts, grids) must keep
// all of its labels inside the picture and readable – on a phone, in every language.
import { test, expect } from '@playwright/test';
import { freshChild } from './helpers';

// extreme sizes the generators may reach later: long numbers, long units, very thin shapes
const EXTRA = [
  { kind: 'rect', a: 6, b: 11, unit: 'cm' },
  { kind: 'rect', a: 2, b: 125, unit: 'mm' },
  { kind: 'rect', a: 1250, b: 3, unit: 'mm' },
  { kind: 'rect', a: 12.5, b: 7.25, unit: 'dm' },
  { kind: 'lshape', a: 120, b: 100, c: 30, unit: 'mm' },
  { kind: 'lshape', a: 3, b: 14, c: 1, unit: 'cm' },
  { kind: 'cuboid', a: 120, b: 100, c: 150, unit: 'mm' },
  { kind: 'cuboid', a: 2, b: 2, c: 12, unit: 'cm' },
  { kind: 'bars', labels: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'], values: [1200, 800, 1500, 300, 950, 0, 2000] },
];

test('no label in any task drawing is cut off or printed over another', async ({ page }, info) => {
  test.skip(!['small-phone', 'pixel-7'].includes(info.project.name), 'drawings scale as a whole; two phones are enough');
  test.slow();
  await freshChild(page);
  await page.goto('/#/');
  const { count, problems } = await page.evaluate(async (extra) => {
    const { scanFigures } = await import('/src/dev/figureCheck.js');
    return scanFigures(extra);
  }, EXTRA);
  expect(count).toBeGreaterThan(300);
  expect(problems, JSON.stringify(problems.slice(0, 5), null, 1)).toEqual([]);
});
