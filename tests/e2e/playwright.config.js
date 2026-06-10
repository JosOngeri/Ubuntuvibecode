// @ts-check
require('dotenv').config({ path: '.env' });

const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for Ubuntu HRMS E2E test suite.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,

  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['line'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./global-setup.js'),
  globalTeardown: require.resolve('./global-teardown.js'),

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',

    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'on-first-retry',

    /* Default viewport */
    viewport: { width: 1280, height: 720 },

    /* Navigation timeout */
    navigationTimeout: 30000,

    /* Action timeout */
    actionTimeout: 10000,

    /* Ignore HTTPS errors (for local dev) */
    ignoreHTTPSErrors: true,
  },

  /* Test timeout */
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  /* Configure projects for major browsers + mobile */
  projects: [
    /* ── Desktop browsers ── */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: 'auth-states/admin.json',
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        storageState: 'auth-states/admin.json',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        storageState: 'auth-states/admin.json',
      },
    },

    /* ── Mobile viewports ── */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
        storageState: 'auth-states/admin.json',
      },
      testMatch: ['**/mobile.spec.js'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 812 },
        storageState: 'auth-states/admin.json',
      },
      testMatch: ['**/mobile.spec.js'],
    },

    /* ── No-auth project for auth tests ── */
    {
      name: 'auth-tests',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        /* No storageState — tests handle auth themselves */
      },
      testMatch: ['**/auth.spec.js', '**/compliance.spec.js'],
    },
  ],

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Snapshot directory for visual regression */
  snapshotDir: 'tests/__snapshots__',

  /* Expect screenshot options */
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 200,
      threshold: 0.2,
    },
  },
});
