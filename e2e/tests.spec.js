// Main flows of a test, on every device in playwright.config.js.
import { test, expect } from '@playwright/test';
import {
  freshChild, stats, mockTasks, openSubject, startTest, answer, wrongAnswer, check, next, prev,
  handIn, solveAll, results, expectNoSideScroll,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await freshChild(page);
  await page.goto('/#/');
  await expect(page.getByText('Ahoj, Test!')).toBeVisible();
});

test('home and subject pages fit the screen', async ({ page }) => {
  await expectNoSideScroll(page);
  await openSubject(page, 'czech');
  await expectNoSideScroll(page);
  await openSubject(page, 'math');
  await expectNoSideScroll(page);
});

for (const [subject, n] of [['czech', 1], ['math', 1]]) {
  test(`${subject}: a perfect test scores 50/50 and its tile turns green`, async ({ page }) => {
    await startTest(page, subject, n);
    const qs = await mockTasks(page, subject, n);
    await expectNoSideScroll(page);
    await solveAll(page, qs);
    await handIn(page);
    const r = await results(page);
    expect(r.score).toBe(50);
    expect(r.firstTry).toBe(qs.length);
    await expectNoSideScroll(page);

    await openSubject(page, subject);
    const tile = page.getByRole('button', { name: `Test ${n}`, exact: true });
    await expect(tile).toContainText('50/50');
    expect((await stats(page)).rounds[`${subject}:5`].items[`t:${n}`]).toBe(50);
  });
}

test('a test from level 2 (test 12) turns green after tests 1–3', async ({ page }, info) => {
  // four full tests: one phone is enough, the single-test flows cover every screen size
  test.skip(info.project.name !== 'pixel-7', 'long flow, runs on one device');
  test.slow();
  for (const n of [1, 2, 3, 12]) {
    await startTest(page, 'czech', n);
    await solveAll(page, await mockTasks(page, 'czech', n));
    await handIn(page);
  }
  await openSubject(page, 'czech');
  for (const n of [1, 2, 3, 12]) await expect(page.getByRole('button', { name: `Test ${n}`, exact: true })).toContainText('50/50');
});

test('a fixed answer adds no points, and the results say so consistently', async ({ page }) => {
  await startTest(page, 'czech', 4);
  const qs = await mockTasks(page, 'czech', 4);
  const target = qs.findIndex((q) => q.type === 'choice');
  const xpBefore = (await stats(page)).xp ?? 0;
  await solveAll(page, qs, async (i, q) => {
    if (i !== target) return false;
    await wrongAnswer(page, q);
    await check(page);
    await answer(page, q);
    await check(page);
    return true;
  });
  await handIn(page);
  const r = await results(page);
  expect(r.score).toBe(50 - qs[target].points);
  expect(r.firstTry).toBe(qs.length - 1);
  await expect(page.getByText('opravené úlohy (1) body nepřidávají')).toBeVisible();
  // the XP shown is the XP the child really got
  expect((await stats(page)).xp - xpBefore).toBe(r.xp);
});

test('leaving a half-done multi-part task does not cost its points', async ({ page }) => {
  await startTest(page, 'czech', 4);
  const qs = await mockTasks(page, 'czech', 4);
  const multi = qs.findIndex((q, i) => i < qs.length - 1 && (q.type === 'tf' || q.type === 'match'));
  test.skip(multi < 0, 'no multi-part task in this test');
  await solveAll(page, qs, async (i, q) => {
    if (i !== multi) return false;
    await answer(page, q, 'first');
    await next(page); // move away with only one row filled
    await prev(page);
    await answer(page, q, 'rest');
    await check(page);
    return true;
  });
  await handIn(page);
  expect((await results(page)).score).toBe(50);
});

test('a test left in the middle continues where it stopped and still turns green', async ({ page }) => {
  await startTest(page, 'czech', 12);
  const qs = await mockTasks(page, 'czech', 12);
  for (let i = 0; i < 5; i++) {
    await answer(page, qs[i]);
    await check(page);
    await next(page);
  }
  await page.locator('header').getByRole('button', { name: 'Zpět' }).first().click();
  await expect(page.getByRole('button', { name: 'Test 12', exact: true })).toContainText('↺');

  await startTest(page, 'czech', 12, 'Pokračovat v rozdělané práci');
  await expect(page.getByText(/hotovo 5 z 25/)).toBeVisible();
  for (let i = 5; i < qs.length; i++) {
    await answer(page, qs[i]);
    await check(page);
    if (i < qs.length - 1) await next(page);
  }
  await handIn(page);
  expect((await results(page)).score).toBe(50);
  await openSubject(page, 'czech');
  await expect(page.getByRole('button', { name: 'Test 12', exact: true })).toContainText('50/50');
});

test('the ? help opens on top of the screen even when the list is scrolled', async ({ page }) => {
  await openSubject(page, 'czech');
  await page.mouse.wheel(0, 1500);
  await page.getByRole('button', { name: 'Jak postupovat?' }).click();
  const help = page.getByRole('dialog', { name: 'Jak postupovat?' });
  await expect(help).toBeInViewport();
  await expect(help.getByText('Co znamenají barvy')).toBeVisible();
  await expectNoSideScroll(page);
  await help.getByRole('button', { name: 'Zavřít' }).last().click();
  await expect(help).toBeHidden();
});

test('a screen that fails to load shows a calm message and recovers, results untouched', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('lq_stats_v1', JSON.stringify({ xp: 777, solved: 5, correct: 4 })));
  await page.route('**/src/pages/Stats.jsx*', (r) => r.abort());
  await page.goto('/#/stats');
  await expect(page.getByRole('alert')).toContainText('Tvoje výsledky jsou v bezpečí');
  await page.unroute('**/src/pages/Stats.jsx*');
  await page.getByRole('button', { name: 'Zkusit znovu' }).click();
  await expect(page.getByRole('heading', { name: 'Statistiky' })).toBeVisible();
  expect((await stats(page)).xp).toBe(777);
});
