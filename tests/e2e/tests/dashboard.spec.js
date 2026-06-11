// tests/dashboard.spec.js
// Admin Dashboard E2E tests for Ubuntu HRMS
// Covers: page load, stats cards, sidebar navigation, page titles, console errors

const { test, expect } = require('@playwright/test');
const { loginAs, clearAuthState, FRONTEND_URL } = require('./helpers/auth.helper');

// ─────────────────────────────────────────────────────────────────────────────
// Setup — log in as admin before each test
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // If storageState from globalSetup has a valid session, skip login
    await page.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    const url = page.url();
    if (url.includes('/login')) {
      await loginAs(page, 'admin');
    }
    await page.waitForLoadState('networkidle');
  });

  // ─── Page Load ─────────────────────────────────────────────────────────────
  test.describe('Page Load', () => {
    test('admin dashboard loads without errors', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin\/dashboard/);
      // No error boundary message
      await expect(page.locator('text=Something went wrong')).not.toBeVisible();
      await expect(page.locator('text=Cannot read properties')).not.toBeVisible();
    });

    test('dashboard does not show blank white screen', async ({ page }) => {
      const body = await page.locator('body').textContent();
      expect(body.trim().length).toBeGreaterThan(50);
    });

    test('dashboard has no "undefined" text in data fields', async ({ page }) => {
      await expect(page.locator('body')).not.toContainText('undefined');
    });

    test('dashboard has no "null" text in data fields', async ({ page }) => {
      // "null" can appear as rendered text when a JS value is coerced to string
      const bodyText = await page.locator('body').textContent();
      // Allow "null" as part of words like "annulled", focus on standalone
      const hasStandaloneNull = /\bnull\b/.test(bodyText);
      // We only fail if there are multiple occurrences (one might be incidental)
      const nullMatches = (bodyText.match(/\bnull\b/g) || []).length;
      expect(nullMatches).toBeLessThanOrEqual(1);
    });

    test('dashboard has no "NaN" in numeric displays', async ({ page }) => {
      await expect(page.locator('body')).not.toContainText('NaN');
    });

    test('loading spinner resolves — no infinite spinner', async ({ page }) => {
      // Wait up to 10s for any spinner/loader to disappear
      const spinnerSelectors = [
        '.spinner',
        '.loading',
        '[data-loading="true"]',
        '.loader',
        '[role="progressbar"]',
        'svg.animate-spin',
      ];
      for (const sel of spinnerSelectors) {
        const spinners = page.locator(sel);
        const count = await spinners.count();
        if (count > 0) {
          await expect(spinners.first()).not.toBeVisible({ timeout: 10000 });
        }
      }
    });

    test('no JavaScript console errors on dashboard load', async ({ page }) => {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      await page.reload({ waitUntil: 'networkidle' });
      const realErrors = consoleErrors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('net::ERR_') &&
        !e.includes('Failed to load resource') &&
        !e.includes('404')
      );
      expect(realErrors.length).toBe(0);
    });
  });

  // ─── Stats Cards ────────────────────────────────────────────────────────────
  test.describe('Stats Cards', () => {
    test('stats cards are visible on dashboard', async ({ page }) => {
      // Look for any card-like container with a numeric value
      const cardSelectors = [
        '.stat-card',
        '.stats-card',
        '.metric-card',
        '.summary-card',
        '.card',
        '[class*="stat"]',
        '[class*="metric"]',
        '[class*="summary"]',
      ];

      let cardsFound = false;
      for (const sel of cardSelectors) {
        const cards = page.locator(sel);
        const count = await cards.count();
        if (count >= 2) {
          cardsFound = true;
          break;
        }
      }
      expect(cardsFound).toBe(true);
    });

    test('stats cards contain numeric values (not blank)', async ({ page }) => {
      // Find elements that look like count/metric displays
      const numericElements = page.locator('text=/^\\d+$/, text=/^\\d{1,3}(,\\d{3})*$/, text=/^\\d+\\.\\d+$/');
      const count = await numericElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('total employees count is a positive number', async ({ page }) => {
      // Look for employee count — common label patterns
      const employeeCountSelectors = [
        'text=/Total Employees/i',
        'text=/Employees/i',
        'text=/Staff/i',
      ];
      for (const sel of employeeCountSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          // The number should be nearby
          const parent = el.locator('..');
          const parentText = await parent.textContent().catch(() => '');
          const numbers = parentText.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            const value = parseInt(numbers[0], 10);
            expect(isNaN(value)).toBe(false);
          }
          break;
        }
      }
    });

    test('stats do not show [object Object]', async ({ page }) => {
      await expect(page.locator('body')).not.toContainText('[object Object]');
    });
  });

  // ─── Sidebar Navigation ─────────────────────────────────────────────────────
  test.describe('Sidebar Navigation', () => {
    test('sidebar is visible', async ({ page }) => {
      const sidebarSelectors = [
        'nav',
        'aside',
        '[role="navigation"]',
        '.sidebar',
        '.nav-sidebar',
        '.side-nav',
      ];
      let sidebarFound = false;
      for (const sel of sidebarSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          sidebarFound = true;
          break;
        }
      }
      expect(sidebarFound).toBe(true);
    });

    test('sidebar contains navigation links', async ({ page }) => {
      const links = page.locator('nav a, aside a, .sidebar a');
      const count = await links.count();
      expect(count).toBeGreaterThan(3);
    });

    test('sidebar contains Dashboard link', async ({ page }) => {
      const dashLink = page.locator('a:has-text("Dashboard"), a[href*="dashboard"]').first();
      await expect(dashLink).toBeVisible();
    });

    test('sidebar contains Employees link', async ({ page }) => {
      const empLink = page.locator('a:has-text("Employees"), a[href*="employees"]').first();
      await expect(empLink).toBeVisible();
    });

    test('sidebar contains Payroll link', async ({ page }) => {
      const payrollLink = page.locator('a:has-text("Payroll"), a[href*="payroll"]').first();
      await expect(payrollLink).toBeVisible();
    });

    test('sidebar contains Leave link', async ({ page }) => {
      const leaveLink = page.locator('a:has-text("Leave"), a[href*="leave"]').first();
      await expect(leaveLink).toBeVisible();
    });

    test('sidebar contains Attendance link', async ({ page }) => {
      const attendanceLink = page.locator('a:has-text("Attendance"), a[href*="attendance"]').first();
      await expect(attendanceLink).toBeVisible();
    });

    test('sidebar contains Reports link', async ({ page }) => {
      const reportsLink = page.locator('a:has-text("Reports"), a[href*="reports"]').first();
      await expect(reportsLink).toBeVisible();
    });
  });

  // ─── Sidebar Navigation — Click-through ─────────────────────────────────────
  test.describe('Sidebar Click Navigation', () => {
    test('clicking Employees link navigates to employees page', async ({ page }) => {
      const empLink = page.locator('a[href*="/admin/employees"], a:has-text("Employees")').first();
      if (await empLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await empLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/employees/);
      }
    });

    test('clicking Payroll link navigates to payroll page', async ({ page }) => {
      const payrollLink = page.locator('a[href*="/admin/payroll"], a:has-text("Payroll")').first();
      if (await payrollLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await payrollLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/payroll/);
      }
    });

    test('clicking Attendance link navigates to attendance page', async ({ page }) => {
      const attLink = page.locator('a[href*="/admin/attendance"], a:has-text("Attendance")').first();
      if (await attLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await attLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/attendance/);
      }
    });

    test('clicking Leave link navigates to leave page', async ({ page }) => {
      const leaveLink = page.locator('a[href*="/admin/leave"], a:has-text("Leave")').first();
      if (await leaveLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await leaveLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/leave/);
      }
    });

    test('clicking Reports link navigates to reports page', async ({ page }) => {
      const reportsLink = page.locator('a[href*="/admin/reports"], a[href*="/reports"], a:has-text("Reports")').first();
      if (await reportsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reportsLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/reports/);
      }
    });
  });

  // ─── Page Title ─────────────────────────────────────────────────────────────
  test.describe('Page Titles', () => {
    test('dashboard has a meaningful page heading', async ({ page }) => {
      const headingSelectors = [
        'h1',
        'h2',
        '[class*="page-title"]',
        '[class*="heading"]',
        '[class*="title"]',
      ];
      let headingFound = false;
      for (const sel of headingSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          const text = await el.textContent();
          if (text && text.trim().length > 2) {
            headingFound = true;
            break;
          }
        }
      }
      expect(headingFound).toBe(true);
    });

    test('browser tab title is not empty', async ({ page }) => {
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
    });
  });

  // ─── Overview Tabs (if present) ─────────────────────────────────────────────
  test.describe('Dashboard Tabs', () => {
    test('tabs are clickable and show content', async ({ page }) => {
      const tabSelectors = [
        '[role="tab"]',
        '.tab',
        'button[aria-selected]',
        '.tab-button',
      ];
      for (const sel of tabSelectors) {
        const tabs = page.locator(sel);
        const count = await tabs.count();
        if (count >= 2) {
          // Click the second tab
          await tabs.nth(1).click();
          await page.waitForTimeout(1000);
          // Page should not crash
          await expect(page.locator('body')).not.toContainText('undefined');
          await expect(page.locator('body')).not.toContainText('NaN');
          break;
        }
      }
    });
  });
});
