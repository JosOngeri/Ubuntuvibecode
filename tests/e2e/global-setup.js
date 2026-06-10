// global-setup.js
// Runs once before all Playwright tests.
// Pre-generates auth state files for each role so tests can reuse sessions.

require('dotenv').config({ path: `${__dirname}/.env` });

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:5000';

const AUTH_STATES_DIR = path.join(__dirname, 'auth-states');

/**
 * Role → login credentials mapping.
 * Credentials fall back to env vars, then hard-coded test defaults.
 */
const ROLES = [
  {
    role: 'admin',
    username: process.env.TEST_ADMIN_USER     || 'testadmin',
    password: process.env.TEST_ADMIN_PASS     || 'testpass123',
    expectedPath: '/admin/dashboard',
  },
  {
    role: 'manager',
    username: process.env.TEST_MANAGER_USER   || 'testmanager',
    password: process.env.TEST_MANAGER_PASS   || 'testpass123',
    expectedPath: '/manager/dashboard',
  },
  {
    role: 'employee',
    username: process.env.TEST_EMPLOYEE_USER  || 'testemployee',
    password: process.env.TEST_EMPLOYEE_PASS  || 'testpass123',
    expectedPath: '/employee/dashboard',
  },
  {
    role: 'contractor',
    username: process.env.TEST_CONTRACTOR_USER || 'testcontractor',
    password: process.env.TEST_CONTRACTOR_PASS || 'testpass123',
    expectedPath: '/contractor/dashboard',
  },
];

/**
 * Perform login via the UI and save browser storage state to disk.
 * @param {import('@playwright/test').BrowserContext} context
 * @param {import('@playwright/test').Page} page
 * @param {{ username: string, password: string, expectedPath: string, role: string }} creds
 */
async function loginAndSaveState(context, page, creds) {
  console.log(`[global-setup] Logging in as ${creds.role} (${creds.username})...`);

  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

  // Fill username — try common field names / labels
  const usernameField = page.locator(
    'input[name="username"], input[name="email"], input[placeholder*="username" i], input[placeholder*="email" i], input[type="email"]'
  ).first();
  await usernameField.fill(creds.username);

  // Fill password
  const passwordField = page.locator(
    'input[name="password"], input[type="password"]'
  ).first();
  await passwordField.fill(creds.password);

  // Submit
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")'
  ).first();
  await submitButton.click();

  // Wait for navigation to dashboard
  try {
    await page.waitForURL(`**${creds.expectedPath}**`, { timeout: 15000 });
    console.log(`[global-setup]  ✓ ${creds.role} logged in → ${creds.expectedPath}`);
  } catch {
    const currentURL = page.url();
    console.warn(`[global-setup]  ⚠ ${creds.role} login: expected ${creds.expectedPath}, got ${currentURL}`);
  }

  // Save storage state (localStorage + cookies)
  const stateFile = path.join(AUTH_STATES_DIR, `${creds.role}.json`);
  await context.storageState({ path: stateFile });
  console.log(`[global-setup]  ✓ Auth state saved → auth-states/${creds.role}.json`);
}

/**
 * Global setup entry point.
 */
async function globalSetup() {
  // Ensure auth-states directory exists
  if (!fs.existsSync(AUTH_STATES_DIR)) {
    fs.mkdirSync(AUTH_STATES_DIR, { recursive: true });
  }

  // Check if the frontend is reachable before running setup
  let frontendReachable = false;
  const browser = await chromium.launch({ headless: true });

  try {
    const testPage = await browser.newPage();
    try {
      const response = await testPage.goto(FRONTEND_URL, { timeout: 10000 });
      frontendReachable = response !== null && response.status() < 500;
    } catch {
      frontendReachable = false;
    } finally {
      await testPage.close();
    }
  } catch {
    frontendReachable = false;
  }

  if (!frontendReachable) {
    console.warn(
      `[global-setup] ⚠ Frontend not reachable at ${FRONTEND_URL}. ` +
      `Auth state files will be empty placeholders. Tests will attempt login themselves.`
    );

    // Write empty state files so Playwright does not crash on missing storageState
    for (const creds of ROLES) {
      const stateFile = path.join(AUTH_STATES_DIR, `${creds.role}.json`);
      if (!fs.existsSync(stateFile)) {
        fs.writeFileSync(stateFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
        console.log(`[global-setup]  ✓ Empty state placeholder → auth-states/${creds.role}.json`);
      }
    }

    await browser.close();
    return;
  }

  // Frontend is reachable — attempt real login for each role
  for (const creds of ROLES) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    try {
      await loginAndSaveState(context, page, creds);
    } catch (err) {
      console.error(`[global-setup]  ✗ Failed to log in as ${creds.role}:`, err.message);

      // Write empty state so tests can still run and handle login themselves
      const stateFile = path.join(AUTH_STATES_DIR, `${creds.role}.json`);
      fs.writeFileSync(stateFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();
  console.log('[global-setup] ✓ Global setup complete.\n');
}

module.exports = globalSetup;
