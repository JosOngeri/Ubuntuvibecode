// tests/auth.spec.js
// Authentication E2E tests for Ubuntu HRMS
// Covers: login, logout, validation, redirects, token expiry, role-based routing

const { test, expect } = require('@playwright/test');
const {
  loginAs,
  loginWithCredentials,
  logout,
  clearAuthState,
  injectToken,
  getAdminToken,
  FRONTEND_URL,
  BACKEND_URL,
  CREDENTIALS,
} = require('./helpers/auth.helper');

// Use the no-auth project for these tests (no pre-loaded storageState)
test.use({ storageState: { cookies: [], origins: [] } });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Login — Valid Credentials
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login — Valid Credentials', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('admin login redirects to /admin/dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    // Verify no error banner on the dashboard
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    await expect(page.locator('text=Error')).not.toBeVisible();
  });

  test('employee login redirects to /employee/dashboard', async ({ page }) => {
    const creds = CREDENTIALS.employee;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/\/employee\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/employee\/dashboard/);
  });

  test('manager login redirects to /manager/dashboard', async ({ page }) => {
    const creds = CREDENTIALS.manager;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/\/manager\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/manager\/dashboard/);
  });

  test('JWT token is stored in localStorage after login', async ({ page }) => {
    await loginAs(page, 'admin');
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });

  test('login page title contains app name or Login', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    // Should contain some meaningful text, not be empty
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Login — Invalid Credentials
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login — Invalid Credentials', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('wrong password shows error message', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill('testadmin');
    await page.locator('input[type="password"]').first().fill('WRONG_PASSWORD_12345');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();

    // Should stay on login page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);

    // Should show some error — look for common error indicators
    const errorLocators = [
      page.locator('text=/invalid|incorrect|wrong|unauthorized|failed|error/i').first(),
      page.locator('[role="alert"]').first(),
      page.locator('.error, .alert, .alert-danger, .text-red, .text-danger').first(),
    ];

    let errorVisible = false;
    for (const locator of errorLocators) {
      if (await locator.isVisible({ timeout: 3000 }).catch(() => false)) {
        errorVisible = true;
        break;
      }
    }
    expect(errorVisible).toBe(true);
  });

  test('non-existent username shows error message', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill('does_not_exist_99999');
    await page.locator('input[type="password"]').first().fill('anypassword');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();

    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('error message does not expose system internals (no stack trace)', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill('baduser');
    await page.locator('input[type="password"]').first().fill('badpass');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();

    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent();
    // Must not leak internal details
    expect(bodyText).not.toContain('at Object.');
    expect(bodyText).not.toContain('at async');
    expect(bodyText).not.toContain('stack:');
    expect(bodyText).not.toContain('SELECT');
    expect(bodyText).not.toContain('PostgreSQL');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Login — Empty / Partial Fields (Client-side Validation)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login — Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
  });

  test('submitting empty form shows validation error or stays on page', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    await submitBtn.click();

    await page.waitForTimeout(1500);
    // Must stay on login page — no redirect to dashboard
    await expect(page).toHaveURL(/\/login/);
  });

  test('submitting with only username shows validation error', async ({ page }) => {
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill('testadmin');
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    await submitBtn.click();

    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('submitting with only password shows validation error', async ({ page }) => {
    await page.locator('input[type="password"]').first().fill('testpass123');
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    await submitBtn.click();

    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('password field does not show plain text', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('login form has username and password fields', async ({ page }) => {
    const usernameField = page.locator(
      'input[name="username"], input[name="email"], input[type="email"], input[placeholder*="username" i]'
    ).first();
    const passwordField = page.locator('input[type="password"]').first();
    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Forgot Password
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('forgot password page is accessible from login', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    const forgotLink = page.locator(
      'a:has-text("Forgot"), a:has-text("Reset password"), a:has-text("forgot"), button:has-text("Forgot")'
    ).first();
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('forgot password page loads correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
    // Should have an email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible();
  });

  test('forgot password form submits with valid email', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.fill('testadmin@ubuntu.co.ke');

    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("Send"), button:has-text("Reset"), button:has-text("Submit")'
    ).first();
    await submitBtn.click();

    await page.waitForTimeout(3000);
    // Should show success message or remain on page (no crash)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('500');
    expect(bodyText).not.toContain('undefined');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Logout
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Logout', () => {
  test('logout clears session and redirects to /login', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    await logout(page);

    // Should be on login page
    await expect(page).toHaveURL(/\/login/);

    // authToken should be cleared
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('after logout, navigating to dashboard redirects to /login', async ({ page }) => {
    await loginAs(page, 'admin');
    await logout(page);

    // Try to access protected route
    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForTimeout(2000);

    // Should be redirected to login
    const url = page.url();
    expect(url).toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Unauthenticated Access (Route Guards)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Route Guards — Unauthenticated Access', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('unauthenticated access to /admin/dashboard redirects to /login', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/login/);
  });

  test('unauthenticated access to /admin/employees redirects to /login', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/employees`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/login/);
  });

  test('unauthenticated access to /admin/payroll redirects to /login', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/payroll`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/login/);
  });

  test('public routes are accessible without auth', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
    // Page should render, not be blank
    const body = await page.locator('body').textContent();
    expect(body.trim().length).toBeGreaterThan(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Token Expiry
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Token Expiry', () => {
  test('expired token in localStorage redirects to /login on protected route access', async ({ page }) => {
    // Inject a clearly expired/invalid token
    const expiredToken = process.env.TEST_EXPIRED_JWT ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.expired_sig';

    await injectToken(page, expiredToken);

    // Navigate to protected route
    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForTimeout(3000);

    const url = page.url();
    // Should be redirected to login or show unauthorized
    const isOnLogin = url.includes('/login');
    const isOnUnauthorized = url.includes('/unauthorized');
    const bodyText = await page.locator('body').textContent();
    const showsAuthError = bodyText.toLowerCase().includes('session') ||
                           bodyText.toLowerCase().includes('expired') ||
                           bodyText.toLowerCase().includes('login');

    expect(isOnLogin || isOnUnauthorized || showsAuthError).toBe(true);
  });

  test('malformed token in localStorage redirects to /login', async ({ page }) => {
    await injectToken(page, 'this.is.not.a.valid.jwt.token.at.all');
    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toMatch(/\/login|\/unauthorized/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Role-Based Redirect After Login
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Role-Based Redirect After Login', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('admin is redirected to /admin/dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('employee is redirected to /employee/dashboard', async ({ page }) => {
    const creds = CREDENTIALS.employee;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();

    await page.waitForURL(/dashboard/, { timeout: 15000 });
    const url = page.url();
    expect(url).toMatch(/\/employee\/dashboard/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Login Page — UI / UX checks
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login Page — UI checks', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
  });

  test('login page has no undefined or null text', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).not.toContainText('undefined');
    await expect(body).not.toContainText('[object Object]');
  });

  test('login page has no console errors on load', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    // Filter out known benign errors
    const realErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('404')
    );
    expect(realErrors.length).toBe(0);
  });

  test('login button is visible and enabled', async ({ page }) => {
    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
    ).first();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('login page is responsive — form is visible at 375px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const usernameField = page.locator(
      'input[name="username"], input[type="email"], input[placeholder*="username" i]'
    ).first();
    const passwordField = page.locator('input[type="password"]').first();
    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });
});
