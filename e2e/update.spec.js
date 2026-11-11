// An app update must never lose what the child already did: data written by older versions
// has to open in the new version, and a damaged record must be recovered, not replaced by zero.
import { test, expect } from '@playwright/test';

// what version 2.1 stored (no rounds, no day log, a language that was later removed)
const OLD_SETTINGS = { lang: 'uz', name: 'Anna', grade: 5, onboarded: true, curriculum: 'cz', theme: 'light' };
const OLD_STATS = {
  xp: 1234, solved: 80, correct: 60, fixed: 3, dailyCount: 2,
  streak: { count: 2, last: null },
  topics: { 'czech:5:pravopis': { a: 10, c: 8 } },
  mocks: { 'czech:5:1A': 41, 'math:5:3B': 37 },
  history: [{ at: 1750000000000, kind: 'mock', subject: 'czech', grade: 5, score: 41, max: 50, ms: 600000, mode: 'practice', series: 1, variant: 'A' }],
  mistakes: [], dailyDone: {}, badges: { first_test: 1750000000000 },
};

async function seed(page, items) {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem('e2e-init')) return;
    sessionStorage.setItem('e2e-init', '1');
    localStorage.clear();
    Object.entries(items).forEach(([k, v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
  }, items);
}

const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('lq_stats_v1')));

test('results from an old version are all there after the update', async ({ page }) => {
  await seed(page, { lq_settings_v1: OLD_SETTINGS, lq_stats_v1: OLD_STATS });
  await page.goto('/#/');
  // no onboarding again, the name and XP are kept
  await expect(page.getByText(/Anna/).first()).toBeVisible();
  await expect(page.getByText(/1\s?234\s*XP/).first()).toBeVisible();

  // tests done in the old layout (series + variant) are green under their new numbers
  await page.goto('/#/subject/czech');
  await expect(page.getByRole('button', { name: /^Test 1$/ })).toContainText('41/50');
  await page.goto('/#/subject/math');
  await expect(page.getByRole('button', { name: /^Test 10$/ })).toContainText('37/50');

  // a new answer adds to the old record instead of replacing it
  await page.evaluate(async () => {
    const st = await import('/src/exam/stats.js');
    st.recordAnswer({ id: 'x1', subject: 'czech', topic: 'pravopis', points: 1 }, { correct: true }, { grade: 5 });
  });
  const s = await stored(page);
  expect(s.xp).toBe(1244);
  expect(s.solved).toBe(81);
  expect(s.history).toHaveLength(1);
  expect(s.mocks['czech:5:1A']).toBe(41);
  expect(s.badges.first_test).toBeTruthy();
});

test('a damaged record is recovered from the daily copy, not reset to zero', async ({ page }) => {
  await seed(page, {
    lq_settings_v1: { ...OLD_SETTINGS, lang: 'cs' },
    lq_stats_v1: '{"xp":12,"solved', // cut off in the middle of a write
    lq_stats_snap_v1: { day: '2026-01-01', raw: JSON.stringify(OLD_STATS) },
  });
  await page.goto('/#/');
  await expect(page.getByText(/1\s?234\s*XP/).first()).toBeVisible();
  expect((await stored(page)).solved).toBe(80);
});

test('the first save of the day keeps a copy of the old record; only "reset" clears results', async ({ page }) => {
  await seed(page, { lq_settings_v1: { ...OLD_SETTINGS, lang: 'cs' }, lq_stats_v1: OLD_STATS });
  await page.goto('/#/');
  await expect(page.getByText(/Anna/).first()).toBeVisible();
  // the first save of the day keeps a copy of what was there before
  await page.evaluate(async () => {
    const st = await import('/src/exam/stats.js');
    st.recordAnswer({ id: 'x2', subject: 'czech', topic: 'pravopis', points: 1 }, { correct: false }, { grade: 5 });
  });
  const snap = await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('lq_stats_snap_v1')).raw));
  expect(snap.xp).toBe(1234);

  await page.evaluate(async () => {
    const st = await import('/src/exam/stats.js');
    st.resetStats();
  });
  expect((await stored(page)).xp).toBe(0);
});
