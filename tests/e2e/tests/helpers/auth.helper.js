// tests/helpers/auth.helper.js
// Reusable authentication helpers for the Ubuntu HRMS Playwright test suite.

require('dotenv').config({ path: `${__dirname}/../../.env` });

const path = require('path');
const fs   = require('fs');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Credential map per role
// ─────────────────────────────────────────────────────────────────────────────
const CREDENTIALS = {
  admin: {
    username: process.env.TEST_ADMIN_USER      || 'testadmin',
    password: process.env.TEST_ADMIN_PASS      || 'testpass123',
    dashboard: '/admin/dashboard',
  },
  owner: {
    username: process.env.TEST_ADMIN_USER      || 'testadmin',
    password: process.env.TEST_ADMIN_PASS      || 'testpass123',
    dashboard: '/admin/dashboard',
  },
  manager: {
    username: process.env.TEST_MANAGER_USER    || 'testmanager',
    password: process.env.TEST_MANAGER_PASS    || 'testpass123',
    dashboard: '/manager/dashboard',
  },
  supervisor: {
    username: process.env.TEST_MANAGER_USER    || 'testmanager',
    password: process.env.TEST_MANAGER_PASS    || 'testpass123',
    dashboard: '/manager/dashboard',
  },
  employee: {
    username: process.env.TEST_EMPLOYEE_USER   || 'testemployee',
    password: process.env.TEST_EMPLOYEE_PASS   || 'testpass123',
    dashboard: '/employee/dashboard',
  },
  contractor: {
    username: process.env.TEST_CONTRACTOR_USER || 'testcontractor',
    password: process.env.TEST_CONTRACTOR_PASS || 'testpass123',
    dashboard: '/contractor/dashboard',
  },
  daily_labourer: {
    username: process.env.TEST_LABOURER_USER   || 'testlabourer',
    password: process.env.TEST_LABOURER_PASS   || 'testpass123',
    dashboard: '/daily-labour/dashboard',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// loginAs(page, role)
// Navigates to /login, fills credentials for the given role, submits,
// and waits for the role-specific dashboard to load.
// ─────────────────────────────────────────────────────────────────────────────
async function loginAs(page, role) {
  const creds = CREDENTIALS[role];
  if (!creds) {
    throw new Error(`[auth.helper] Unknown role: "${role}". Valid roles: ${Object.keys(CREDENTIALS).join(', ')}`);
  }

  // Navigate to login page
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Wait for the form to appear
  await page.waitForSelector(
    'input[name="username"], input[name="email"], input[type="email"], input[placeholder*="username" i]',
    { timeout: 10000 }
  );

  // Fill username
  const usernameLocator = page.locator(
    'input[name="username"], input[name="email"], input[type="email"], input[placeholder*="username" i], input[placeholder*="email" i]'
  ).first();
  await usernameLocator.fill(creds.username);

  // Fill password
  const passwordLocator = page.locator('input[name="password"], input[type="password"]').first();
  await passwordLocator.fill(creds.password);

  // Click submit
  const submitLocator = page.locator(
    'button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Sign In")'
  ).first();
  await submitLocator.click();

  // Wait for redirect to role dashboard
  await page.waitForURL(`**${creds.dashboard}**`, { timeout: 15000 });

  return creds;
}

// ─────────────────────────────────────────────────────────────────────────────
// loginWithCredentials(page, username, password)
// Low-level login — does NOT wait for a specific redirect.
// Returns the current URL after form submission.
// ─────────────────────────────────────────────────────────────────────────────
async function loginWithCredentials(page, username, password) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('input[type="password"]', { timeout: 10000 });

  const usernameLocator = page.locator(
    'input[name="username"], input[name="email"], input[type="email"], input[placeholder*="username" i], input[placeholder*="email" i]'
  ).first();
  await usernameLocator.fill(username);

  const passwordLocator = page.locator('input[type="password"]').first();
  await passwordLocator.fill(password);

  const submitLocator = page.locator(
    'button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Sign In")'
  ).first();
  await submitLocator.click();

  // Short wait for any navigation or error to appear
  await page.waitForTimeout(2000);

  return page.url();
}

// ─────────────────────────────────────────────────────────────────────────────
// getAdminToken()
// Calls the backend auth API directly to obtain a JWT for admin.
// Returns the raw token string or null on failure.
// ─────────────────────────────────────────────────────────────────────────────
async function getAdminToken() {
  const username = process.env.TEST_ADMIN_USER || 'testadmin';
  const password = process.env.TEST_ADMIN_PASS || 'testpass123';

  try {
    // Use Node's built-in fetch (Node 18+) or fallback
    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    const response = await fetchFn(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      console.warn(`[auth.helper] getAdminToken: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    // API returns { token } according to the spec
    return data.token || data.accessToken || data.jwt || null;
  } catch (err) {
    console.error('[auth.helper] getAdminToken error:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getTokenForRole(role)
// Calls the backend auth API directly for any supported role.
// ─────────────────────────────────────────────────────────────────────────────
async function getTokenForRole(role) {
  const creds = CREDENTIALS[role];
  if (!creds) return null;

  try {
    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    const response = await fetchFn(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.token || data.accessToken || data.jwt || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// injectToken(page, token)
// Injects a JWT directly into localStorage without going through the login UI.
// Useful for tests that need a specific token (e.g. expired token).
// ─────────────────────────────────────────────────────────────────────────────
async function injectToken(page, token) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('authToken', t);
  }, token);
}

// ─────────────────────────────────────────────────────────────────────────────
// logout(page)
// Logs out the current user via the UI logout button and verifies redirect.
// ─────────────────────────────────────────────────────────────────────────────
async function logout(page) {
  // Try to find a logout button — common selectors used in HRMS UIs
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Log out")',
    'button:has-text("Sign out")',
    'a:has-text("Logout")',
    'a:has-text("Log out")',
    'a:has-text("Sign out")',
    '[aria-label="Logout"]',
    '[title="Logout"]',
  ];

  let clicked = false;
  for (const selector of logoutSelectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible({ timeout: 3000 }).catch(() => false)) {
      await locator.click();
      clicked = true;
      break;
    }
  }

  // If no direct logout button found, try user menu first
  if (!clicked) {
    const userMenuSelectors = [
      '[aria-label="User menu"]',
      '[aria-label="Account menu"]',
      '.user-avatar',
      '.user-menu-trigger',
      'button:has-text("Account")',
    ];
    for (const selector of userMenuSelectors) {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
        await locator.click();
        await page.waitForTimeout(500);

        // Try logout again after opening menu
        for (const logoutSel of logoutSelectors) {
          const l = page.locator(logoutSel).first();
          if (await l.isVisible({ timeout: 2000 }).catch(() => false)) {
            await l.click();
            clicked = true;
            break;
          }
        }
        if (clicked) break;
      }
    }
  }

  if (!clicked) {
    // Fallback: clear localStorage directly
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.clear();
    });
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    return;
  }

  // Wait for redirect to /login
  try {
    await page.waitForURL('**/login**', { timeout: 10000 });
  } catch {
    // Some apps redirect to / which then redirects to /login
    await page.waitForTimeout(2000);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// clearAuthState(page)
// Clears all auth data from localStorage without any UI interaction.
// ─────────────────────────────────────────────────────────────────────────────
async function clearAuthState(page) {
  try {
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore security errors if we're not on the right page yet
    // This is safe since we'll navigate to the login page anyway
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getStoredToken(page)
// Returns the JWT currently stored in localStorage.
// ─────────────────────────────────────────────────────────────────────────────
async function getStoredToken(page) {
  return page.evaluate(() => localStorage.getItem('authToken'));
}

module.exports = {
  CREDENTIALS,
  FRONTEND_URL,
  BACKEND_URL,
  loginAs,
  loginWithCredentials,
  getAdminToken,
  getTokenForRole,
  injectToken,
  logout,
  clearAuthState,
  getStoredToken,
};
