import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright Configuration for Geometry Framework E2E Tests
 * Tests the complete user journey including UI, 3D rendering, and exports
 * Uses Clerk authentication for protected routes
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

export default defineConfig({
  testDir: './app/__tests__/e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport size for consistent rendering
    viewport: { width: 1920, height: 1080 },

    // Timeout for actions
    actionTimeout: 10 * 1000,

    // Timeout for navigation
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for different browsers
  projects: [
    // Global setup project - runs first to authenticate
    {
      name: 'global setup',
      testMatch: /global\.setup\.ts/,
    },

    // Authenticated tests on Chromium
    {
      name: 'chromium',
      testMatch: /.*\.(spec|test)\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        // Use stored authentication state
        storageState: path.join(__dirname, 'playwright/.clerk/user.json'),
        // Enable WebGL for 3D rendering tests
        launchOptions: {
          args: [
            '--use-gl=swiftshader', // Software rendering for CI
            '--disable-gpu-sandbox',
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
          ],
        },
      },
      dependencies: ['global setup'],
    },

    // Authenticated tests on Firefox
    {
      name: 'firefox',
      testMatch: /.*\.(spec|test)\.ts$/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: path.join(__dirname, 'playwright/.clerk/user.json'),
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
            'webgl.disabled': false,
          },
        },
      },
      dependencies: ['global setup'],
    },

    // Test on mobile viewport for responsive testing
    {
      name: 'mobile-chrome',
      testMatch: /.*\.(spec|test)\.ts$/,
      use: {
        ...devices['Pixel 5'],
        storageState: path.join(__dirname, 'playwright/.clerk/user.json'),
        launchOptions: {
          args: ['--enable-webgl'],
        },
      },
      dependencies: ['global setup'],
    },

    // Webkit/Safari testing
    // {
    //   name: 'webkit',
    //   testMatch: /.*\.(spec|test)\.ts$/,
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: path.join(__dirname, 'playwright/.clerk/user.json'),
    //   },
    //   dependencies: ['global setup'],
    // },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
