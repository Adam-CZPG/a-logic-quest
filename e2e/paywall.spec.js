// Free version: tests 1–2 and set 1 of every topic open; everything else asks for the full version.
import { test, expect } from '@playwright/test';
import { freshChild, openSubject } from './helpers';

for (const subject of ['math', 'czech']) {
  test(`free version: ${subject} tests 1–2 open, test 3 asks to unlock`, async ({ page }) => {
    await freshChild(page, { free: true });
    await openSubject(page, subject);
    await expect(page.getByRole('button', { name: /Testy 1–2 a sada 1 jsou zdarma/ })).toBeVisible();

    await page.getByRole('button', { name: 'Test 2', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Vyberte režim' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('button', { name: 'Test 3', exact: true }).click();
    const pay = page.getByRole('dialog', { name: 'Odemkni všechny testy' });
    await expect(pay).toBeVisible();
    await expect(pay).toContainText('299 Kč');
    await expect(pay).not.toContainText('599');
    await pay.getByRole('button', { name: 'Zavřít' }).click();
    await expect(pay).toBeHidden();

    // topics: set 1 free, set 2 locked
    await page.getByRole('tab').nth(1).click();
    await page.getByRole('button', { name: / 2$/ }).first().click();
    await expect(page.getByRole('dialog', { name: 'Odemkni všechny testy' })).toBeVisible();
  });
}

test('free version: a paid test opened by link shows the unlock sheet, not the test', async ({ page }) => {
  await freshChild(page, { free: true });
  await page.goto('/#/play/mock?subject=math&n=7&mode=practice');
  await expect(page.getByRole('dialog', { name: 'Odemkni všechny testy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Odevzdat' })).toHaveCount(0);
});

test('full version: no locks, settings say it is active', async ({ page }) => {
  await freshChild(page);
  await openSubject(page, 'math');
  await expect(page.getByRole('button', { name: /jsou zdarma/ })).toHaveCount(0);
  await page.goto('/#/settings');
  await expect(page.getByText('Plná verze je aktivní ✓')).toBeVisible();
});
