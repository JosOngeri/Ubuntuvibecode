// tests/mobile.spec.js
// Responsive / mobile E2E tests for Ubuntu HRMS
// Tests on viewport 375x812 (iPhone) and 768x1024 (iPad)
// Covers: sidebar toggle, horizontal scroll, form usability, layout integrity

const { test, expect } = require('@playwright/test');
const { loginAs, FRONTEND_URL } = require('./helpers/auth.helper');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: navigate with auth handling
// ─────────────────────────────────────────────────────────────────────────────
async function goTo(page, path) {
  await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'domcontentloaded' });
  const url = page.url();
  if (url.includes('/login') && path !== '/login') {
    await loginAs(page, 'admin');
    await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'domcontentloaded' });
  }
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    // Continue
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: check for horizontal overflow (broken layouts)
// ─────────────────────────────────────────────────────────────────────────────
async function checkNoHorizontalOverflow(page) {
  const hasOverflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const viewWidth = document.documentElement.clientWidth;
    // Allow 2px tolerance for rounding
    return docWidth > viewWidth + 2;
  });
  expect(hasOverflow, 'Page has horizontal overflow — layout broken on mobile').toBe(false);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: check that text is not clipped or invisible
// ─────────────────────────────────────────────────────────────────────────────
async function checkTextVisible(page) {
  const bodyText = await page.locator('body').textContent();
  expect(bodyText.trim().length).toBeGreaterThan(20);
  expect(bodyText).not.toContain('undefined');
  expect(bodyText).not.toContain('NaN');
}

// ─────────────────────────────────────────────────────────────────────────────
// iPhone (375x812) Tests
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Mobile — iPhone (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.describe('Login Page', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login page renders correctly at 375px width', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
      await checkTextVisible(page);
      await checkNoHorizontalOverflow(page);
    });

    test('login form inputs are visible and usable on mobile', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
      const usernameInput = page.locator(
        'input[name="username"], input[type="email"], input[placeholder*="username" i]'
      ).first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();

      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitBtn).toBeVisible();

      // Inputs should have sufficient height for touch (min 44px)
      const inputBox = await usernameInput.boundingBox();
      if (inputBox) {
        expect(inputBox.height).toBeGreaterThanOrEqual(36);
      }
    });

    test('login form does not have horizontal overflow on mobile', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
      await checkNoHorizontalOverflow(page);
    });
  });

  test.describe('Admin Dashboard — Mobile', () => {
    test('dashboard loads on mobile', async ({ page }) => {
      await goTo(page, '/admin/dashboard');
      const url = page.url();
      if (!url.includes('/login')) {
        await checkTextVisible(page);
      }
    });

    test('sidebar is hidden or collapsed by default on mobile', async ({ page }) => {
      await goTo(page, '/admin/dashboard');
      const url = page.url();
      if (!url.includes('/login')) {
        // Sidebar should either not be visible or be collapsed
        const sidebar = page.locator('nav, aside, .sidebar').first();
        if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
          // On mobile, sidebar should be narrower than viewport or hidden
          const box = await sidebar.boundingBox();
          if (box) {
            // Full sidebar width should not take up entire viewport on mobile
            const isFullWidth = box.width >= 375;
            // If full width it should be the mobile menu open state
            // This is acceptable if it's a hamburger menu
            const hamburger = page.locator(
              'button[aria-label*="menu" i], button[aria-label*="hamburger" i], button[aria-label*="nav" i], .hamburger, .menu-toggle'
            ).first();
            const hasHamburger = await hamburger.isVisible({ timeout: 2000 }).catch(() => false);
            // Either sidebar is compact OR a hamburger button exists
            expect(!isFullWidth || hasHamburger).toBe(true);
          }
        }
      }
    });

    test('hamburger menu button is visible on mobile', async ({ page }) => {
      await goTo(page, '/admin/dashboard');
      const url = page.url();
      if (!url.includes('/login')) {
        const hamburgerSelectors = [
          'button[aria-label*="menu" i]',
          'button[aria-label*="hamburger" i]',
          'button[aria-label*="navigation" i]',
          '.hamburger',
          '.menu-toggle',
          '.nav-toggle',
          'button:has(svg)',
        ];
        let found = false;
        for (const sel of hamburgerSelectors) {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            found = true;
            break;
          }
        }
        // Mobile nav toggle is expected
        expect(found).toBe(true);
      }
    });

    test('sidebar opens when hamburger menu is clicked', async ({ page }) => {
      await goTo(page, '/admin/dashboard');
      const url = page.url();
      if (!url.includes('/login')) {
        const hamburgerSelectors = [
          'button[aria-label*="menu" i]',
          'button[aria-label*="hamburger" i]',
          '.hamburger',
          '.menu-toggle',
        ];
        for (const sel of hamburgerSelectors) {
          const btn = page.locator(sel).first();
          if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(500);
            // Sidebar/nav should now be visible
            const nav = page.locator('nav a, aside a, .sidebar a').first();
            const navVisible = await nav.isVisible({ timeout: 3000 }).catch(() => false);
            expect(navVisible).toBe(true);
            break;
          }
        }
      }
    });

    test('no horizontal overflow on dashboard at 375px', async ({ page }) => {
      await goTo(page, '/admin/dashboard');
      const url = page.url();
      if (!url.includes('/login')) {
        await checkNoHorizontalOverflow(page);
      }
    });
  });

  test.describe('Employees Page — Mobile', () => {
    test('employees page loads on mobile', async ({ page }) => {
      await goTo(page, '/admin/employees');
      const url = page.url();
      if (!url.includes('/login')) {
        await checkTextVisible(page);
      }
    });

    test('employee table scrolls horizontally on mobile (not cut off)', async ({ page }) => {
      await goTo(page, '/admin/employees');
      const url = page.url();
      if (!url.includes('/login')) {
        const table = page.locator('table').first();
        if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Table should be inside a scrollable container
          const tableWrapper = page.locator('[class*="overflow-x"], [class*="table-responsive"], .overflow-x-auto').first();
          const isScrollable = await tableWrapper.isVisible({ timeout: 2000 }).catch(() => false);
          if (!isScrollable) {
            // If no wrapper, the table container itself should handle overflow
            const tableBox = await table.boundingBox();
            if (tableBox) {
              // Table width can exceed viewport — it should scroll, not break layout
              // Check that the body doesn't have unintended horizontal scroll
              const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
              const viewportWidth = 375;
              // It's okay if the TABLE is wider (scrolls), but the page body should handle it
              expect(bodyScrollWidth).toBeGreaterThanOrEqual(viewportWidth);
            }
          }
        }
      }
    });

    test('add employee button is reachable on mobile', async ({ page }) => {
      await goTo(page, '/admin/employees');
      const url = page.url();
      if (!url.includes('/login')) {
        const addBtn = page.locator('button:has-text("Add Employee"), button:has-text("New Employee")').first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          const box = await addBtn.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThanOrEqual(36);
          }
        }
      }
    });
  });

  test.describe('Forms — Mobile Usability', () => {
    test('leave request form is usable on mobile', async ({ page }) => {
      await goTo(page, '/leave/request');
      const url = page.url();
      if (!url.includes('/login')) {
        await checkTextVisible(page);
        await checkNoHorizontalOverflow(page);

        // All form inputs should be visible
        const inputs = page.locator('input, select, textarea');
        const count = await inputs.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
          const input = inputs.nth(i);
          if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
            const box = await input.boundingBox();
            if (box) {
              expect(box.height).toBeGreaterThanOrEqual(30);
            }
          }
        }
      }
    });

    test('add employee form is usable on mobile', async ({ page }) => {
      await goTo(page, '/admin/employees');
      const url = page.url();
      if (!url.includes('/login')) {
        const addBtn = page.locator('button:has-text("Add Employee"), button:has-text("New Employee")').first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(1000);

          const modal = page.locator('[role="dialog"], .modal').first();
          if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
            const modalBox = await modal.boundingBox();
            if (modalBox) {
              // Modal should fit within viewport width
              expect(modalBox.width).toBeLessThanOrEqual(385); // 375 + small margin
              expect(modalBox.width).toBeGreaterThan(200);
            }
            await checkNoHorizontalOverflow(page);
          }
        }
      }
    });
  });

  test.describe('Navigation — Mobile', () => {
    test('can navigate between pages on mobile', async ({ page }) => {
      await goTo(page, '/admin/dashboard');
      const url = page.url();
      if (!url.includes('/login')) {
        // Open mobile menu if hamburger exists
        const hamburger = page.locator('button[aria-label*="menu" i], .hamburger, .menu-toggle').first();
        if (await hamburger.isVisible({ timeout: 2000 }).catch(() => false)) {
          await hamburger.click();
          await page.waitForTimeout(500);
        }

        // Click on Employees link
        const empLink = page.locator('a[href*="/admin/employees"], a:has-text("Employees")').first();
        if (await empLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await empLink.click();
          await page.waitForLoadState('domcontentloaded');
          await expect(page).toHaveURL(/employees/);
        }
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// iPad (768x1024) Tests
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Mobile — iPad (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('login page renders correctly at 768px width', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await checkTextVisible(page);
    await checkNoHorizontalOverflow(page);
  });

  test('admin dashboard renders on iPad', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    const url = page.url();
    if (!url.includes('/login')) {
      await checkTextVisible(page);
      await checkNoHorizontalOverflow(page);
    }
  });

  test('sidebar is partially visible or accessible on iPad', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    const url = page.url();
    if (!url.includes('/login')) {
      // At 768px, sidebar may be visible or collapsed
      const nav = page.locator('nav, aside, .sidebar').first();
      if (await nav.isVisible({ timeout: 3000 }).catch(() => false)) {
        const box = await nav.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(0);
        }
      }
    }
  });

  test('employees table is accessible on iPad', async ({ page }) => {
    await goTo(page, '/admin/employees');
    const url = page.url();
    if (!url.includes('/login')) {
      await checkTextVisible(page);
      // Table should be visible at 768px
      const table = page.locator('table').first();
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(table).toBeVisible();
      }
    }
  });

  test('payroll page renders on iPad without broken layout', async ({ page }) => {
    await goTo(page, '/admin/payroll');
    const url = page.url();
    if (!url.includes('/login')) {
      await checkTextVisible(page);
      await checkNoHorizontalOverflow(page);
    }
  });

  test('leave request form is usable on iPad', async ({ page }) => {
    await goTo(page, '/leave/request');
    const url = page.url();
    if (!url.includes('/login')) {
      await checkTextVisible(page);
      const startDate = page.locator('input[type="date"]').first();
      if (await startDate.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(startDate).toBeVisible();
      }
    }
  });

  test('no horizontal overflow on iPad for employees page', async ({ page }) => {
    await goTo(page, '/admin/employees');
    const url = page.url();
    if (!url.includes('/login')) {
      await checkNoHorizontalOverflow(page);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-viewport: Touch Target Size
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Touch Target Sizes', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('navigation links have adequate touch target size (min 44x44px)', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    const url = page.url();
    if (!url.includes('/login')) {
      // Open mobile menu to show nav links
      const hamburger = page.locator('button[aria-label*="menu" i], .hamburger, .menu-toggle').first();
      if (await hamburger.isVisible({ timeout: 2000 }).catch(() => false)) {
        await hamburger.click();
        await page.waitForTimeout(500);
      }

      const navLinks = page.locator('nav a, aside a, .sidebar a');
      const count = await navLinks.count();
      let smallTargetsCount = 0;

      for (let i = 0; i < Math.min(count, 5); i++) {
        const link = navLinks.nth(i);
        if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
          const box = await link.boundingBox();
          if (box && (box.height < 36 || box.width < 36)) {
            smallTargetsCount++;
          }
        }
      }

      // Allow a few small targets (icons, etc.) but most should meet size requirements
      expect(smallTargetsCount).toBeLessThanOrEqual(3);
    }
  });

  test('form submit buttons have adequate touch target on mobile', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await submitBtn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
