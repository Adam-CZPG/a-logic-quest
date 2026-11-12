// Shared steps for the e2e tests: a fresh child profile, the right answers, and acting like a child would.
import { expect } from '@playwright/test';

export const GRADE = 5;

// fresh device with a finished onboarding (Czech, grade 5); runs once per page, before the app loads
// full version on by default (the tests open paid tests); { free: true } = the free version
export async function freshChild(page, { free = false, ...extra } = {}) {
  await page.addInitScript(({ settings, free }) => {
    if (sessionStorage.getItem('e2e-init')) return;
    sessionStorage.setItem('e2e-init', '1');
    localStorage.clear();
    localStorage.setItem('lq_settings_v1', JSON.stringify(settings));
    if (!free) localStorage.setItem('lq_premium_v1', JSON.stringify({ on: true, at: Date.now() }));
  }, { settings: { lang: 'cs', onboarded: true, name: 'Test', curriculum: 'cz', grade: GRADE, startedAt: Date.now(), ...extra }, free });
}

export async function stats(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('lq_stats_v1') || '{}'));
}

// the tasks of a test exactly as the app builds them (same seed), with their answers
export async function mockTasks(page, subject, number) {
  return page.evaluate(async ({ subject, number, grade }) => {
    const e = await import('/src/exam/engine.js');
    const st = await import('/src/exam/stats.js');
    const cycle = st.getRound(st.getStats(), subject, grade).cycle;
    const set = e.buildMockTest({ subject, grade, number, lang: 'cs', curriculum: 'cz', cycle });
    return set.questions.map((q) => ({ type: q.type, answer: q.answer, options: q.options?.length ?? 0, points: q.points || 1 }));
  }, { subject, number, grade: GRADE });
}

export async function openSubject(page, subject) {
  await page.goto(`/#/subject/${subject}`);
  await expect(page.getByRole('tab').first()).toBeVisible();
}

// tap a test tile and choose a mode in the picker, like a child
export async function startTest(page, subject, number, mode = 'Procvičování') {
  await openSubject(page, subject);
  await page.getByRole('button', { name: `Test ${number}`, exact: true }).click();
  const picker = page.getByRole('dialog');
  await picker.getByRole('button', { name: new RegExp(mode) }).first().click();
  await expect(page.getByRole('button', { name: 'Odevzdat' }).first()).toBeVisible();
}

const task = (page) => page.locator('main article');

// parts: 'all' | 'first' (only the first row of a multi-part task) | 'rest' (all rows but the first)
export async function answer(page, q, parts = 'all') {
  if (q.type === 'choice') {
    await task(page).locator('button[aria-pressed]').nth(q.answer).click();
  } else if (q.type === 'tf' || q.type === 'match') {
    const from = parts === 'rest' ? 1 : 0;
    const to = parts === 'first' ? 1 : q.answer.length;
    for (let k = from; k < to; k++) {
      if (q.type === 'tf') await task(page).getByRole('radiogroup').nth(k).getByRole('radio').nth(q.answer[k] ? 0 : 1).click();
      else await task(page).locator('select').nth(k).selectOption(String(q.answer[k]));
    }
  } else {
    const a = Array.isArray(q.answer) ? q.answer[0] : q.answer;
    await task(page).locator('input').fill(q.type === 'number' ? String(a).replace('.', ',') : String(a));
  }
}

export async function wrongAnswer(page, q) {
  if (q.type !== 'choice') throw new Error('wrongAnswer supports choice tasks');
  await task(page).locator('button[aria-pressed]').nth((q.answer + 1) % q.options).click();
}

export async function check(page) {
  await page.getByRole('button', { name: 'Ověřit odpověď' }).click();
}

export async function next(page) {
  const label = await page.getByText(/^\d+(\.\d+)? \/ \d+$/).first().textContent();
  await page.locator('footer').getByRole('button', { name: 'Další úloha' }).last().click();
  await expect(page.getByText(/^\d+(\.\d+)? \/ \d+$/).first()).not.toHaveText(label);
}

export async function prev(page) {
  await page.locator('footer button').first().click();
}

export async function handIn(page) {
  await page.locator('header').getByRole('button', { name: 'Odevzdat' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Odevzdat' }).click();
  await expect(page.getByText('Výsledky')).toBeVisible();
}

// solve a whole test correctly; hook(i, q) may take over a task (return true when it did)
export async function solveAll(page, qs, hook = async () => false) {
  for (let i = 0; i < qs.length; i++) {
    if (!(await hook(i, qs[i]))) {
      await answer(page, qs[i]);
      await check(page);
    }
    if (i < qs.length - 1) await next(page);
  }
}

// the score card on the results screen
export async function results(page) {
  const card = page.locator('section').first();
  const text = await card.innerText();
  const score = Number(text.match(/(\d+)\s*\/\s*50/)[1]);
  const first = text.match(/Napoprvé\s*(\d+)\/(\d+)/);
  const xp = Number(text.match(/\+(\d+)\s*XP/)[1]);
  return { score, firstTry: first ? Number(first[1]) : null, of: first ? Number(first[2]) : null, xp, text };
}

// nothing may stick out sideways on a phone
export async function expectNoSideScroll(page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over, 'page is wider than the screen').toBeLessThanOrEqual(1);
}
