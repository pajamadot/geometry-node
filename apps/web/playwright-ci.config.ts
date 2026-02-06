import { defineConfig, devices } from '@playwright/test';

/**
 * Lightweight Playwright config for CI - no Clerk auth required.
 * Tests public pages: /tests (in-browser test runner), / (landing page)
 *
 * Usage: npx playwright test --config playwright-ci.config.ts
 */
export default defineConfig({
  testDir: './app/__tests__/e2e',
  testMatch: /.*\.ci\.spec\.ts$/,

  timeout: 120 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3333',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15 * 1000,
    navigationTimeout: 60 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu'],
        },
      },
    },
  ],

  webServer: {
    command: 'npx next dev --port 3333',
    url: 'http://localhost:3333',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
