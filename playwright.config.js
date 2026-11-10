// End-to-end tests: the real app in a browser, on several phone / tablet / desktop sizes.
// Run: npm run e2e        (CI installs Chromium; locally PW_CHANNEL=chrome uses an installed Chrome)
import { defineConfig, devices } from '@playwright/test';

const channel = process.env.PW_CHANNEL || undefined;
const PORT = 5179;

// The APK runs in Android's Chromium WebView, so every device is emulated in Chromium
// (screen size, pixel ratio, touch, user agent).
const chromium = (d) => ({ ...d, browserName: 'chromium', ...(channel ? { channel } : {}) });

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'cs-CZ',
  },
  projects: [
    { name: 'small-phone', use: chromium(devices['Galaxy S9+']) }, // 320 px wide – the tightest layout
    { name: 'iphone-se', use: chromium(devices['iPhone SE']) },
    { name: 'pixel-7', use: chromium(devices['Pixel 7']) },
    { name: 'tablet', use: chromium(devices['Galaxy Tab S4']) },
    { name: 'desktop', use: chromium(devices['Desktop Chrome']) },
  ],
  webServer: {
    // dev server: the tests import the task generator to know the right answers
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
