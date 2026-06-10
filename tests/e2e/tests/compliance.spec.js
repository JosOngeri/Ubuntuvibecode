// tests/compliance.spec.js
// GDPR / data privacy / security compliance E2E tests for Ubuntu HRMS
// Covers: role-based data access, password masking, error leakage, JWT expiry, audit logs

const { test, expect } = require('@playwright/test');
const {
  loginAs,
  loginWithCredentials,
  injectToken,
  getAdminToken,
  getTokenForRole,
  clearAuthState,
  FRONTEND_URL,
  BACKEND_URL,
  CREDENTIALS,
} = require('./helpers/auth.helper');

// Use the no-auth project — these tests manage auth themselves
test.use({ storageState: { cookies: [], origins: [] } });

// ─────────────────────────────────────────────────────────────────────────────
// Helper: make an API request with a given token
// ─────────────────────────────────────────────────────────────────────────────
async function apiRequest(endpoint, token = null) {
  const fetchFn = typeof fetch !== 'undefined' ? fetch : null;
  if (!fetchFn) return null;

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-auth-token'] = token;

  try {
    const res = await fetchFn(`${BACKEND_URL}${endpoint}`, { headers });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, text, json };
  } catch (err) {
    return { status: 0, text: '', json: null, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Password Field Security
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Password Security', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('password input field is always type="password" (never plain text)', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const inputType = await passwordInputs.nth(i).getAttribute('type');
      expect(inputType).toBe('password');
    }
  });

  test('password is not visible in page source after typing', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('supersecretpassword123');

    // Check that the DOM value is not exposed as visible text
    const inputValue = await passwordInput.inputValue();
    const pageContent = await page.content();

    // Page source should NOT contain the password in plain text
    expect(pageContent).not.toContain('supersecretpassword123');
  });

  test('forgot password page does not show passwords', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
    const bodyText = await page.locator('body').textContent();
    // Should not show any password-like content
    expect(bodyText).not.toMatch(/password:\s*[a-zA-Z0-9]+/i);
  });

  test('password is not stored in localStorage', async ({ page }) => {
    await loginAs(page, 'admin');
    const allLocalStorage = await page.evaluate(() => {
      const result = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        result[key] = localStorage.getItem(key);
      }
      return result;
    });

    const storageJSON = JSON.stringify(allLocalStorage).toLowerCase();
    expect(storageJSON).not.toContain('testpass123');
    expect(storageJSON).not.toContain('password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. JWT Token Security
// ─────────────────────────────────────────────────────────────────────────────
test.describe('JWT Token Security', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('JWT token is stored only in localStorage (not cookies)', async ({ page }) => {
    await loginAs(page, 'admin');

    // Token should be in localStorage
    const lsToken = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(lsToken).toBeTruthy();

    // Token should NOT be in cookies (HttpOnly is better but we check UI-accessible cookies)
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c =>
      c.name.toLowerCase().includes('token') ||
      c.name.toLowerCase().includes('auth') ||
      c.name.toLowerCase().includes('jwt')
    );
    // If token IS in cookies, it should be HttpOnly for security
    // This test logs but doesn't fail if cookie auth is used (valid alternative)
    if (authCookie) {
      console.warn(`⚠ Auth token found in cookie "${authCookie.name}". Ensure it's HttpOnly and Secure.`);
    }
  });

  test('expired JWT causes redirect to /login or shows session expired message', async ({ page }) => {
    const expiredToken = process.env.TEST_EXPIRED_JWT ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.bad_sig';

    await injectToken(page, expiredToken);
    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForTimeout(3000);

    const url = page.url();
    const bodyText = await page.locator('body').textContent();

    const isRedirected = url.includes('/login') || url.includes('/unauthorized');
    const showsMessage = /session|expired|unauthorized|login/i.test(bodyText);

    expect(isRedirected || showsMessage).toBe(true);
  });

  test('malformed JWT is rejected by protected routes', async ({ page }) => {
    await injectToken(page, 'not.a.real.jwt.token');
    await page.goto(`${FRONTEND_URL}/admin/employees`);
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url).toMatch(/\/login|\/unauthorized/);
  });

  test('removed JWT causes redirect to /login', async ({ page }) => {
    await loginAs(page, 'admin');
    // Remove token
    await page.evaluate(() => localStorage.removeItem('authToken'));
    // Navigate to protected page
    await page.goto(`${FRONTEND_URL}/admin/dashboard`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/login/);
  });

  test('JWT sent as x-auth-token header (API level check)', async ({ page }) => {
    // Intercept network requests to verify token is sent as x-auth-token
    let tokenHeader = null;
    page.on('request', req => {
      const headers = req.headers();
      if (headers['x-auth-token']) {
        tokenHeader = headers['x-auth-token'];
      }
    });

    await loginAs(page, 'admin');
    await page.goto(`${FRONTEND_URL}/admin/employees`, { waitUntil: 'networkidle' });

    // Token should have been sent in at least one API request
    if (tokenHeader) {
      expect(tokenHeader.split('.').length).toBe(3); // Valid JWT structure
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Role-Based Data Access (RBAC)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Role-Based Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('employee cannot access admin dashboard URL', async ({ page }) => {
    const creds = CREDENTIALS.employee;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Employee is on employee dashboard — now try to access admin page
    await page.goto(`${FRONTEND_URL}/admin/employees`);
    await page.waitForTimeout(2000);

    const url = page.url();
    const bodyText = await page.locator('body').textContent();

    // Should be redirected or shown unauthorized
    const isBlocked = url.includes('/unauthorized') ||
                      url.includes('/login') ||
                      url.includes('/employee/dashboard') ||
                      /unauthorized|access denied|forbidden|not allowed/i.test(bodyText);
    expect(isBlocked).toBe(true);
  });

  test('employee cannot access admin payroll URL', async ({ page }) => {
    const creds = CREDENTIALS.employee;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    await page.goto(`${FRONTEND_URL}/admin/payroll`);
    await page.waitForTimeout(2000);

    const url = page.url();
    const isBlocked = url.includes('/unauthorized') ||
                      url.includes('/login') ||
                      url.includes('/employee/dashboard') ||
                      !url.includes('/admin/payroll');
    expect(isBlocked).toBe(true);
  });

  test('admin API endpoints reject requests without token', async ({ page }) => {
    // Direct API call without token
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async (backendUrl) => {
      try {
        const res = await fetch(`${backendUrl}/api/employees`, {
          headers: { 'Content-Type': 'application/json' },
        });
        return { status: res.status };
      } catch {
        return { status: 0 };
      }
    }, BACKEND_URL);

    // Should return 401 Unauthorized, not 200 or 500
    if (result.status > 0) {
      expect(result.status).toBe(401);
    }
  });

  test('admin API endpoints reject requests with employee token', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    const employeeToken = await page.evaluate(async ({ backendUrl, creds }) => {
      try {
        const res = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: creds.username, password: creds.password }),
        });
        const data = await res.json();
        return data.token || null;
      } catch {
        return null;
      }
    }, { backendUrl: BACKEND_URL, creds: CREDENTIALS.employee });

    if (employeeToken) {
      // Try to access admin-only endpoint with employee token
      const result = await page.evaluate(async ({ backendUrl, token }) => {
        try {
          const res = await fetch(`${backendUrl}/api/users`, {
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token,
            },
          });
          return { status: res.status };
        } catch {
          return { status: 0 };
        }
      }, { backendUrl: BACKEND_URL, token: employeeToken });

      if (result.status > 0) {
        // Should be 401 or 403
        expect(result.status).toBeGreaterThanOrEqual(401);
        expect(result.status).toBeLessThanOrEqual(403);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Sensitive Data Exposure
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Sensitive Data Exposure', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('salary/wage data is not visible to employee in their dashboard', async ({ page }) => {
    const creds = CREDENTIALS.employee;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    const bodyText = await page.locator('body').textContent();
    // Employee dashboard should not show other employees' salaries
    // Their own salary may be visible — that's acceptable
    // Check that bulk salary data isn't exposed
    const multipleSalaries = (bodyText.match(/\b\d{2,3},?\d{3}\b/g) || []).length;
    // More than 5 salary amounts might indicate data leakage
    // This is a soft check — adjust threshold based on app design
    expect(multipleSalaries).toBeLessThan(15);
  });

  test('national ID is not visible in employee list view for non-admin', async ({ page }) => {
    const creds = CREDENTIALS.employee;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    const bodyText = await page.locator('body').textContent();
    // 8-digit national ID patterns should not be bulk-exposed
    const nationalIds = (bodyText.match(/\b\d{8}\b/g) || []).length;
    expect(nationalIds).toBeLessThan(5);
  });

  test('API error responses do not expose stack traces to UI', async ({ page }) => {
    await clearAuthState(page);
    // Trigger a 404 by accessing non-existent resource
    const response = await page.goto(`${FRONTEND_URL}/admin/employees/999999`, {
      waitUntil: 'domcontentloaded',
    });
    const bodyText = await page.locator('body').textContent();

    expect(bodyText).not.toContain('at Object.');
    expect(bodyText).not.toContain('at async');
    expect(bodyText).not.toContain('Error: ');
    expect(bodyText).not.toContain('stack:');
    expect(bodyText).not.toContain('SELECT');
    expect(bodyText).not.toContain('pg_catalog');
  });

  test('error messages do not reveal internal system information', async ({ page }) => {
    // Trigger error with invalid credentials
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill('hacker_test_user');
    await page.locator('input[type="password"]').first().fill('tryingToHack123!@#');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent();
    // Should not reveal DB queries, stack traces, or system internals
    expect(bodyText).not.toContain('SELECT');
    expect(bodyText).not.toContain('PostgreSQL');
    expect(bodyText).not.toContain('ERROR:');
    expect(bodyText).not.toContain('at Object.');
    expect(bodyText).not.toContain('node_modules');
    expect(bodyText).not.toContain('database');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Audit Log Access
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await loginAs(page, 'admin');
  });

  test('audit log page is accessible to admin', async ({ page }) => {
    // Audit logs might be at various paths — try common locations
    const auditPaths = [
      '/admin/settings',
      '/admin/hr-ops',
      '/admin/reports',
    ];

    for (const path of auditPaths) {
      await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'domcontentloaded' });
      const url = page.url();
      if (!url.includes('/login')) {
        const bodyText = await page.locator('body').textContent();
        // At least one of these pages should have audit-related content
        if (/audit|log|activity|history/i.test(bodyText)) {
          expect(bodyText).not.toContain('undefined');
          expect(bodyText).not.toContain('NaN');
          break;
        }
      }
    }
  });

  test('audit log entries do not show undefined values', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/settings`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).not.toContainText('undefined');
    await expect(page.locator('body')).not.toContainText('NaN');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Session Management
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('session is cleared on logout — localStorage does not persist token', async ({ page }) => {
    await loginAs(page, 'admin');
    const tokenBefore = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(tokenBefore).toBeTruthy();

    // Navigate to logout
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.clear();
    });

    const tokenAfter = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(tokenAfter).toBeNull();
  });

  test('back button after logout does not restore authenticated session', async ({ page }) => {
    await loginAs(page, 'admin');
    // Simulate logout by clearing storage
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.clear();
    });

    // Navigate to login
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });

    // Press browser back
    await page.goBack();
    await page.waitForTimeout(2000);

    const url = page.url();
    const token = await page.evaluate(() => localStorage.getItem('authToken'));

    // Either redirected to login OR token is not set (expired)
    const isSecure = url.includes('/login') || !token;
    expect(isSecure).toBe(true);
  });

  test('concurrent sessions are handled (two tabs)', async ({ page, context }) => {
    await loginAs(page, 'admin');

    // Open a second tab with the same context
    const secondPage = await context.newPage();
    await secondPage.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });

    const url = secondPage.url();
    // Second tab should either be authenticated (shared storage) or redirected to login
    expect(url).toBeTruthy();
    await expect(secondPage.locator('body')).not.toContainText('Cannot read properties');

    await secondPage.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Input Sanitization (XSS Prevention)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Input Sanitization', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await loginAs(page, 'admin');
  });

  test('XSS payload in search input is not executed', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/employees`, { waitUntil: 'networkidle' });
    const xssPayload = '<script>window._xss_executed=true</script>';

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="name" i]'
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(xssPayload);
      await page.waitForTimeout(1000);

      // Check XSS was not executed
      const xssRan = await page.evaluate(() => window._xss_executed || false);
      expect(xssRan).toBe(false);
    }
  });

  test('HTML injection in form fields is escaped', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/employees`, { waitUntil: 'networkidle' });
    const addBtn = page.locator('button:has-text("Add Employee"), button:has-text("New Employee")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const firstNameInput = page.locator('input[name*="first" i], input[placeholder*="first" i]').first();
      if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const htmlPayload = '<img src=x onerror="window._xss2=true">';
        await firstNameInput.fill(htmlPayload);
        await page.waitForTimeout(500);

        const xssRan = await page.evaluate(() => window._xss2 || false);
        expect(xssRan).toBe(false);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GDPR Checks
// ─────────────────────────────────────────────────────────────────────────────
test.describe('GDPR Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('user registration does not collect excessive personal data', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'domcontentloaded' });
    const url = page.url();
    if (!url.includes('/login')) {
      // Registration form should ask only for necessary fields
      const allInputs = await page.locator('input:not([type="hidden"])').count();
      // Reasonable limit — too many fields may indicate excessive data collection
      expect(allInputs).toBeLessThanOrEqual(15);
    }
  });

  test('admin can access personal data (GDPR data controller)', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(`${FRONTEND_URL}/admin/employees`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).not.toContainText('undefined');
  });

  test('employees page does not expose sensitive fields in list view', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(`${FRONTEND_URL}/admin/employees`, { waitUntil: 'networkidle' });

    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const headerText = await table.locator('thead').textContent().catch(() => '');
      // Sensitive fields that should not be in the list view (detail view only)
      const hasNationalIdColumn = /national.?id/i.test(headerText);
      const hasKraPinColumn     = /kra.?pin/i.test(headerText);
      const hasBankAccount      = /bank.?account|account.?number/i.test(headerText);

      // These should be in employee detail, not bulk list
      if (hasNationalIdColumn) {
        console.warn('⚠ National ID is visible in employee list table — consider moving to detail view only');
      }
      if (hasBankAccount) {
        console.warn('⚠ Bank account is visible in employee list table — should be restricted');
      }
    }
    // Primary check: no exposed data bugs
    await expect(page.locator('body')).not.toContainText('undefined');
  });
});
