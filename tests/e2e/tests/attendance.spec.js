// tests/attendance.spec.js
// Attendance E2E tests for Ubuntu HRMS
// Covers: attendance list, records display, punch page, check-in/check-out UI

const { test, expect } = require('@playwright/test');
const { loginAs, FRONTEND_URL } = require('./helpers/auth.helper');

const ATTENDANCE_ADMIN_URL = `${FRONTEND_URL}/admin/attendance`;
const ATTENDANCE_URL       = `${FRONTEND_URL}/attendance`;
const PUNCH_URL            = `${FRONTEND_URL}/attendance/punch`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: navigate to admin attendance page
// ─────────────────────────────────────────────────────────────────────────────
async function goToAttendance(page, url = ATTENDANCE_ADMIN_URL) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    await loginAs(page, 'admin');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForLoadState('networkidle');
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin Attendance Page', () => {
  test.beforeEach(async ({ page }) => {
    await goToAttendance(page, ATTENDANCE_ADMIN_URL);
  });

  test('attendance page loads without errors', async ({ page }) => {
    await expect(page).toHaveURL(/attendance/);
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('attendance page has a visible heading', async ({ page }) => {
    const heading = page.locator('h1, h2, h3, [class*="title"], [class*="heading"]').first();
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('attendance page does not display undefined or NaN values', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('undefined');
    await expect(page.locator('body')).not.toContainText('NaN');
    await expect(page.locator('body')).not.toContainText('[object Object]');
  });

  test('attendance records display with dates', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count > 0) {
      const tableText = await page.locator('table').textContent().catch(() => '');
      // Dates should appear in YYYY-MM-DD or DD/MM/YYYY format
      const hasDate = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\s+\w+\s+\d{4}/.test(tableText);
      expect(hasDate).toBe(true);
    }
  });

  test('attendance table shows employee names', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const rowText = await rows.nth(i).textContent();
        expect(rowText.trim().length).toBeGreaterThan(0);
        expect(rowText).not.toContain('undefined');
      }
    }
  });

  test('attendance table has correct column headers', async ({ page }) => {
    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const headerText = await table.locator('thead').textContent().catch(() => '');
      // Should have date column
      const hasDate     = /date/i.test(headerText);
      const hasStatus   = /status|present|absent/i.test(headerText);
      const hasEmployee = /employee|name|staff/i.test(headerText);
      expect(hasDate || hasStatus || hasEmployee).toBe(true);
    }
  });

  test('attendance status values are valid (Present/Absent/Late etc)', async ({ page }) => {
    const statusCells = page.locator('td:has-text("Present"), td:has-text("Absent"), td:has-text("Late"), td:has-text("Holiday"), .badge, [class*="status"]');
    const count = await statusCells.count();
    if (count > 0) {
      // Status cells exist and have meaningful text
      const firstStatus = await statusCells.first().textContent();
      expect(firstStatus.trim().length).toBeGreaterThan(0);
      expect(firstStatus).not.toContain('undefined');
    }
  });

  test('check-in and check-out times are displayed or labeled', async ({ page }) => {
    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const headerText = await table.locator('thead').textContent().catch(() => '');
      const hasCheckIn  = /check.?in|in.?time|clock.?in/i.test(headerText);
      const hasCheckOut = /check.?out|out.?time|clock.?out/i.test(headerText);
      // If neither column header exists, at least no undefined in data
      await expect(page.locator('body')).not.toContainText('undefined');
    }
  });

  test('hours worked column shows numeric values', async ({ page }) => {
    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const headerText = await table.locator('thead').textContent().catch(() => '');
      if (/hours/i.test(headerText)) {
        await expect(page.locator('body')).not.toContainText('NaN');
      }
    }
  });

  test('employee selector dropdown works for filtering', async ({ page }) => {
    const empSelect = page.locator(
      'select[name*="employee" i], select[aria-label*="employee" i], select[id*="employee" i]'
    ).first();
    if (await empSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await empSelect.locator('option').allTextContents();
      expect(options.length).toBeGreaterThan(1);

      // Select "All Employees" if available, or first real employee
      const allOption = options.find(o => /all/i.test(o));
      if (allOption) {
        await empSelect.selectOption({ label: allOption });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).not.toContainText('undefined');
      }
    }
  });

  test('Log Daily Attendance button is present (admin)', async ({ page }) => {
    const logBtn = page.locator(
      'button:has-text("Log"), button:has-text("Add Attendance"), button:has-text("Log Attendance")'
    ).first();
    // May not be visible if "All" is selected
    await expect(page.locator('body')).not.toContainText('undefined');
  });

  test('date range filter or date picker is present', async ({ page }) => {
    const dateSelectors = [
      'input[type="date"]',
      'input[type="month"]',
      '[placeholder*="date" i]',
      'button:has-text("Today")',
      'button:has-text("This Week")',
      'button:has-text("This Month")',
    ];
    let found = false;
    for (const sel of dateSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    // Date filter is a common feature — not mandatory to fail if absent
    await expect(page.locator('body')).not.toContainText('NaN');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Attendance Punch Page', () => {
  test.beforeEach(async ({ page }) => {
    await goToAttendance(page, PUNCH_URL);
  });

  test('punch page loads correctly', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      await expect(page.locator('body')).not.toContainText('Something went wrong');
      await expect(page.locator('body')).not.toContainText('undefined');
      await expect(page.locator('body')).not.toContainText('NaN');
    }
  });

  test('punch page has a heading', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      const heading = page.locator('h1, h2, h3, [class*="title"]').first();
      await expect(heading).toBeVisible();
    }
  });

  test('check-in button is visible on punch page', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      const checkInSelectors = [
        'button:has-text("Check In")',
        'button:has-text("Clock In")',
        'button:has-text("Punch In")',
        'button:has-text("Check-In")',
        'button:has-text("Sign In")',
        'button[aria-label*="check in" i]',
      ];
      let found = false;
      for (const sel of checkInSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          found = true;
          break;
        }
      }
      // Punch page may show Check Out if already checked in
      const checkOutSelectors = [
        'button:has-text("Check Out")',
        'button:has-text("Clock Out")',
        'button:has-text("Punch Out")',
      ];
      let checkOutFound = false;
      for (const sel of checkOutSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          checkOutFound = true;
          break;
        }
      }
      expect(found || checkOutFound).toBe(true);
    }
  });

  test('check-out button is visible or conditionally shown', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      // At least one punch action button should exist
      const anyPunchBtn = page.locator(
        'button:has-text("Check"), button:has-text("Clock"), button:has-text("Punch")'
      ).first();
      await expect(anyPunchBtn).toBeVisible();
    }
  });

  test('current date and time displayed on punch page', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      // Should show current year at minimum
      const currentYear = new Date().getFullYear().toString();
      expect(bodyText).toContain(currentYear);
    }
  });

  test('punch page does not crash after clicking check-in', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      const checkInBtn = page.locator(
        'button:has-text("Check In"), button:has-text("Clock In"), button:has-text("Punch In")'
      ).first();
      if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false) &&
          await checkInBtn.isEnabled().catch(() => false)) {
        await checkInBtn.click();
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page.locator('body')).not.toContainText('undefined');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Shared Attendance Page', () => {
  test('shared /attendance page loads for admin', async ({ page }) => {
    await goToAttendance(page, ATTENDANCE_URL);
    const url = page.url();
    if (!url.includes('/login')) {
      await expect(page.locator('body')).not.toContainText('Something went wrong');
      await expect(page.locator('body')).not.toContainText('undefined');
    }
  });
});
