// tests/navigation.spec.js
// Navigation E2E tests for Ubuntu HRMS
// For every admin page: verifies render, heading, no undefined/null/NaN data,
// button clickability, table column headers, and empty state messages.

const { test, expect } = require('@playwright/test');
const { loginAs, FRONTEND_URL } = require('./helpers/auth.helper');
const { ADMIN_ROUTES, SHARED_ROUTES } = require('./fixtures/test-data');

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper: verify a page renders correctly
// ─────────────────────────────────────────────────────────────────────────────
async function verifyPageRenders(page, path) {
  await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  const url = page.url();

  // If redirected to login, re-authenticate
  if (url.includes('/login')) {
    await loginAs(page, 'admin');
    await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  }

  // Wait for network to settle
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    // Continue even if network doesn't fully settle
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core checks applied to every page
// ─────────────────────────────────────────────────────────────────────────────
async function coreChecks(page, path) {
  const bodyText = await page.locator('body').textContent();

  // 1. Not a blank white screen
  expect(bodyText.trim().length, `Page ${path} appears blank`).toBeGreaterThan(30);

  // 2. No "undefined" or "null" text rendered as data
  expect(bodyText, `Page ${path} shows "undefined"`).not.toContain('undefined');
  expect(bodyText, `Page ${path} shows "[object Object]"`).not.toContain('[object Object]');

  // 3. No NaN in numeric displays
  expect(bodyText, `Page ${path} shows "NaN"`).not.toContain('NaN');

  // 4. No unhandled crash page
  expect(bodyText).not.toContain('Cannot read properties');
  expect(bodyText).not.toContain('Something went wrong');
}

// ─────────────────────────────────────────────────────────────────────────────
// Check that the main heading is visible
// ─────────────────────────────────────────────────────────────────────────────
async function checkHeading(page, path) {
  const headingEl = page.locator('h1, h2, [class*="title"], [class*="heading"], [class*="page-title"]').first();
  const headingVisible = await headingEl.isVisible({ timeout: 5000 }).catch(() => false);
  if (headingVisible) {
    const text = await headingEl.textContent();
    expect(text.trim().length, `Page ${path} heading is empty`).toBeGreaterThan(0);
    expect(text, `Page ${path} heading is "undefined"`).not.toContain('undefined');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check that primary action buttons are enabled (not disabled without reason)
// ─────────────────────────────────────────────────────────────────────────────
async function checkButtons(page) {
  const primaryBtns = page.locator('button[class*="primary"], button[class*="btn-primary"], .btn-primary').first();
  if (await primaryBtns.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(primaryBtns).toBeEnabled();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check table structure if a table is present
// ─────────────────────────────────────────────────────────────────────────────
async function checkTable(page, path) {
  const table = page.locator('table').first();
  if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Column headers should not be blank
    const headers = table.locator('thead th, thead td');
    const headerCount = await headers.count();
    if (headerCount > 0) {
      for (let i = 0; i < Math.min(headerCount, 6); i++) {
        const headerText = await headers.nth(i).textContent();
        expect(headerText, `Page ${path} has blank table header at col ${i}`).not.toBe('');
        expect(headerText).not.toContain('undefined');
      }
    }

    // Data rows should not have undefined values
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 3); i++) {
        const rowText = await rows.nth(i).textContent();
        expect(rowText, `Page ${path} row ${i} shows "undefined"`).not.toContain('undefined');
        expect(rowText, `Page ${path} row ${i} shows "NaN"`).not.toContain('NaN');
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check empty state is meaningful if list is empty
// ─────────────────────────────────────────────────────────────────────────────
async function checkEmptyState(page, path) {
  const rows = page.locator('table tbody tr, .card, [class*="row"], [class*="item"]');
  const count = await rows.count();
  if (count === 0) {
    // Get all visible text — should have more than just a spinner
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText.trim().length > 30;
    expect(hasContent, `Page ${path} appears blank when list is empty`).toBe(true);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Routes — full navigation test for each page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin Navigation — All Pages', () => {
  for (const route of ADMIN_ROUTES) {
    test(`${route.path} renders correctly`, async ({ page }) => {
      await verifyPageRenders(page, route.path);
      await coreChecks(page, route.path);
      await checkHeading(page, route.path);
      await checkButtons(page);
      await checkTable(page, route.path);
      await checkEmptyState(page, route.path);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared Routes
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Shared Routes Navigation', () => {
  for (const route of SHARED_ROUTES) {
    test(`${route.path} renders correctly`, async ({ page }) => {
      await verifyPageRenders(page, route.path);
      await coreChecks(page, route.path);
      await checkHeading(page, route.path);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Links — verify all sidebar links navigate correctly
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Sidebar Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    const url = page.url();
    if (url.includes('/login')) {
      await loginAs(page, 'admin');
    }
    await page.waitForLoadState('networkidle');
  });

  test('all sidebar links are visible', async ({ page }) => {
    const sidebarLinks = page.locator('nav a, aside a, .sidebar a');
    const count = await sidebarLinks.count();
    expect(count).toBeGreaterThan(3);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = sidebarLinks.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      // Each link should have href and text
      if (href && !href.startsWith('#')) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('sidebar links navigate to correct routes', async ({ page }) => {
    const knownLinks = [
      { text: 'Employees', expectedUrl: /employees/ },
      { text: 'Payroll',   expectedUrl: /payroll/ },
      { text: 'Leave',     expectedUrl: /leave/ },
    ];

    for (const { text, expectedUrl } of knownLinks) {
      const link = page.locator(`nav a:has-text("${text}"), aside a:has-text("${text}"), .sidebar a:has-text("${text}")`).first();
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        await expect(page).toHaveURL(expectedUrl);
        // Navigate back
        await page.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('no broken links in sidebar (all return non-error pages)', async ({ page }) => {
    const sidebarLinks = page.locator('nav a[href], aside a[href], .sidebar a[href]');
    const count = await sidebarLinks.count();

    for (let i = 0; i < Math.min(count, 8); i++) {
      const link = sidebarLinks.nth(i);
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/') && !href.includes('#')) {
        const response = await page.goto(`${FRONTEND_URL}${href}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        }).catch(() => null);
        // Should not be a 500 error
        if (response) {
          expect(response.status()).toBeLessThan(500);
        }
        await expect(page.locator('body')).not.toContainText('undefined');
        // Navigate back to dashboard for next iteration
        await page.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deep-linked Routes — verify specific patterns
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Deep-linked Admin Routes', () => {
  test('employee detail page renders (ID 1)', async ({ page }) => {
    await verifyPageRenders(page, '/admin/employees/1');
    const url = page.url();
    if (!url.includes('/login')) {
      await coreChecks(page, '/admin/employees/1');
    }
  });

  test('user detail page renders (ID 1)', async ({ page }) => {
    await verifyPageRenders(page, '/admin/users/1');
    const url = page.url();
    if (!url.includes('/login')) {
      await coreChecks(page, '/admin/users/1');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Public Routes — verify accessible without auth
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Public Routes', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('/login renders correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await coreChecks(page, '/login');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('/register renders correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle' });
    await coreChecks(page, '/register');
  });

  test('/forgot-password renders correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/forgot-password`, { waitUntil: 'networkidle' });
    await coreChecks(page, '/forgot-password');
  });

  test('/unauthorized renders correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/unauthorized`, { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.trim().length).toBeGreaterThan(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Role-based Routes — manager/employee dashboards
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Role-based Dashboard Routes', () => {
  test('manager dashboard renders for manager role', async ({ page }) => {
    const creds = require('./helpers/auth.helper').CREDENTIALS.manager;
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="username"], input[type="email"], input[placeholder*="username" i]').first().fill(creds.username);
    await page.locator('input[type="password"]').first().fill(creds.password);
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await coreChecks(page, '/manager/dashboard');
  });
});
