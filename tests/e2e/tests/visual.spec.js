// tests/visual.spec.js
// Visual regression tests for Ubuntu HRMS using Playwright's toHaveScreenshot()
// Captures baseline screenshots and compares on subsequent runs.
// Run `npm run test:update-snapshots` to update baselines after intentional UI changes.

const { test, expect } = require('@playwright/test');
const { loginAs, FRONTEND_URL } = require('./helpers/auth.helper');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ensure page is ready (no spinners, networkidle)
// ─────────────────────────────────────────────────────────────────────────────
async function waitForPageReady(page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    // Continue even if not fully idle
  }
  // Hide any animated spinners before screenshot to avoid flakiness
  await page.evaluate(() => {
    document.querySelectorAll('.spinner, .animate-spin, [class*="spinner"]').forEach(el => {
      el.style.animation = 'none';
      el.style.transition = 'none';
    });
  });
  // Short settle time for any CSS transitions
  await page.waitForTimeout(500);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: navigate to a page, handle auth redirect
// ─────────────────────────────────────────────────────────────────────────────
async function goTo(page, path) {
  await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'domcontentloaded' });
  const url = page.url();
  if (url.includes('/login')) {
    await loginAs(page, 'admin');
    await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'domcontentloaded' });
  }
  await waitForPageReady(page);
}

// ─────────────────────────────────────────────────────────────────────────────
// Screenshot options — allow small pixel diffs for font anti-aliasing
// ─────────────────────────────────────────────────────────────────────────────
const SCREENSHOT_OPTIONS = {
  maxDiffPixels: 200,
  threshold: 0.2,
  animations: 'disabled',
};

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Visual Regression — Desktop (1280x720)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('login page matches baseline screenshot', async ({ page }) => {
    // No auth needed — public page
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.querySelectorAll('.spinner, .animate-spin').forEach(el => {
        el.style.animation = 'none';
      });
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('login-desktop.png', SCREENSHOT_OPTIONS);
  });

  test('admin dashboard matches baseline screenshot', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    // Mask any dynamic content (dates, live stats) to prevent false failures
    await expect(page).toHaveScreenshot('admin-dashboard-desktop.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [
        // Mask elements with dynamic content
        page.locator('time, [class*="date"], [class*="clock"]'),
      ],
    });
  });

  test('employees page matches baseline screenshot', async ({ page }) => {
    await goTo(page, '/admin/employees');
    await expect(page).toHaveScreenshot('employees-desktop.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [
        page.locator('[class*="date"], time'),
      ],
    });
  });

  test('payroll page matches baseline screenshot', async ({ page }) => {
    await goTo(page, '/admin/payroll');
    await expect(page).toHaveScreenshot('payroll-desktop.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [
        page.locator('[class*="date"], time'),
      ],
    });
  });

  test('leave page matches baseline screenshot', async ({ page }) => {
    await goTo(page, '/admin/leave');
    await expect(page).toHaveScreenshot('leave-desktop.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [
        page.locator('[class*="date"], time'),
      ],
    });
  });

  test('attendance page matches baseline screenshot', async ({ page }) => {
    await goTo(page, '/admin/attendance');
    await expect(page).toHaveScreenshot('attendance-desktop.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [
        page.locator('[class*="date"], time'),
      ],
    });
  });

  test('recruitment page matches baseline screenshot', async ({ page }) => {
    await goTo(page, '/admin/recruitment');
    await expect(page).toHaveScreenshot('recruitment-desktop.png', SCREENSHOT_OPTIONS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Visual Regression — Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('login page matches baseline screenshot (mobile)', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('login-mobile.png', SCREENSHOT_OPTIONS);
  });

  test('admin dashboard matches baseline screenshot (mobile)', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    await expect(page).toHaveScreenshot('admin-dashboard-mobile.png', {
      ...SCREENSHOT_OPTIONS,
      mask: [
        page.locator('time, [class*="date"], [class*="clock"]'),
      ],
    });
  });

  test('employees page matches baseline screenshot (mobile)', async ({ page }) => {
    await goTo(page, '/admin/employees');
    await expect(page).toHaveScreenshot('employees-mobile.png', SCREENSHOT_OPTIONS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Visual Regression — Component Level', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('sidebar component matches baseline', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    const sidebar = page.locator('nav, aside, .sidebar').first();
    if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sidebar).toHaveScreenshot('sidebar-component.png', SCREENSHOT_OPTIONS);
    }
  });

  test('login form component matches baseline', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    const form = page.locator('form').first();
    if (await form.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(form).toHaveScreenshot('login-form-component.png', SCREENSHOT_OPTIONS);
    }
  });

  test('employee table header matches baseline', async ({ page }) => {
    await goTo(page, '/admin/employees');
    const tableHead = page.locator('table thead').first();
    if (await tableHead.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(tableHead).toHaveScreenshot('employees-table-header.png', SCREENSHOT_OPTIONS);
    }
  });

  test('dashboard stats cards section matches baseline', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    // Try to screenshot just the stats/metrics section
    const statsSection = page.locator('[class*="stat"], [class*="metric"], [class*="summary"], .grid').first();
    if (await statsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statsSection).toHaveScreenshot('dashboard-stats.png', {
        ...SCREENSHOT_OPTIONS,
        mask: [
          page.locator('[class*="count"], [class*="number"], [class*="value"]'),
        ],
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full-page screenshots (scrolled)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Visual Regression — Full Page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('employees full page screenshot', async ({ page }) => {
    await goTo(page, '/admin/employees');
    await expect(page).toHaveScreenshot('employees-full-page.png', {
      ...SCREENSHOT_OPTIONS,
      fullPage: true,
    });
  });

  test('payroll full page screenshot', async ({ page }) => {
    await goTo(page, '/admin/payroll');
    await expect(page).toHaveScreenshot('payroll-full-page.png', {
      ...SCREENSHOT_OPTIONS,
      fullPage: true,
      mask: [page.locator('[class*="date"], time')],
    });
  });
});
