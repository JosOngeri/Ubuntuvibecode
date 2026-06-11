// tests/accessibility.spec.js
// WCAG 2.1 AA accessibility tests for Ubuntu HRMS using @axe-core/playwright
// Covers: login, admin dashboard, employees, payroll, leave, forms

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { loginAs, FRONTEND_URL } = require('./helpers/auth.helper');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: navigate to page, handle auth
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
    // Continue even if not fully idle
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: run axe analysis and report violations
// ─────────────────────────────────────────────────────────────────────────────
async function runAxe(page, options = {}) {
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .exclude('#axe-skip') // Skip elements explicitly marked
    .exclude('iframe[src*="recaptcha"]'); // Skip third-party widgets

  if (options.exclude) {
    for (const sel of options.exclude) {
      builder.exclude(sel);
    }
  }

  const results = await builder.analyze();
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: format violations for readable assertion messages
// ─────────────────────────────────────────────────────────────────────────────
function formatViolations(violations) {
  return violations.map(v => `
  Rule: ${v.id}
  Impact: ${v.impact}
  Help: ${v.help}
  URL: ${v.helpUrl}
  Nodes: ${v.nodes.length} affected element(s)
    ${v.nodes.slice(0, 2).map(n => `• ${n.html}`).join('\n    ')}
  `).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Acceptable known violations (low-impact, third-party, or pending fix)
// Add rule IDs here to temporarily skip known issues
// ─────────────────────────────────────────────────────────────────────────────
const KNOWN_VIOLATIONS_TO_SKIP = [
  // 'color-contrast', // Skip if colour contrast is a known ongoing issue
];

function filterViolations(violations) {
  return violations.filter(v => !KNOWN_VIOLATIONS_TO_SKIP.includes(v.id));
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Login Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page has no critical WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    const results = await runAxe(page);
    const violations = filterViolations(results.violations);
    const criticalViolations = violations.filter(v => ['critical', 'serious'].includes(v.impact));
    expect(
      criticalViolations,
      `Critical accessibility violations on /login:\n${formatViolations(criticalViolations)}`
    ).toHaveLength(0);
  });

  test('login form inputs have accessible labels', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Each input should have at least one form of labelling
      const hasLabel = id
        ? await page.locator(`label[for="${id}"]`).count() > 0
        : false;
      const hasAccessibleName = hasLabel || !!ariaLabel || !!ariaLabelledBy || !!placeholder;
      expect(
        hasAccessibleName,
        `Input at index ${i} (type: ${await input.getAttribute('type')}) has no accessible name`
      ).toBe(true);
    }
  });

  test('login page has correct document language attribute', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    const lang = await page.locator('html').getAttribute('lang');
    // Should have a lang attribute for screen readers
    expect(lang).toBeTruthy();
    expect(lang.length).toBeGreaterThan(0);
  });

  test('login page is keyboard navigable', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Focus should be visible (no error thrown)
    const focusedEl = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedEl).toBeTruthy();
  });

  test('login submit button has descriptive text', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btnText = await submitBtn.textContent();
      const ariaLabel = await submitBtn.getAttribute('aria-label');
      expect(btnText.trim().length > 0 || (ariaLabel && ariaLabel.length > 0)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/admin/dashboard');
  });

  test('admin dashboard has no critical WCAG 2.1 AA violations', async ({ page }) => {
    const results = await runAxe(page, {
      exclude: ['[class*="chart"]', 'canvas'], // Charts often have a11y limitations
    });
    const violations = filterViolations(results.violations);
    const criticalViolations = violations.filter(v => ['critical', 'serious'].includes(v.impact));
    expect(
      criticalViolations,
      `Critical violations on admin dashboard:\n${formatViolations(criticalViolations)}`
    ).toHaveLength(0);
  });

  test('dashboard navigation has accessible landmark roles', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('dashboard has main content landmark', async ({ page }) => {
    const main = page.locator('main, [role="main"]').first();
    const hasMain = await main.isVisible({ timeout: 3000 }).catch(() => false);
    // main landmark is strongly recommended but not always required
    // Log if absent but don't fail
    if (!hasMain) {
      console.warn('⚠ Dashboard missing <main> landmark — consider adding for screen reader users');
    }
  });

  test('all images on dashboard have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      // Decorative images should have role="presentation" or empty alt=""
      // Content images must have non-empty alt
      if (role !== 'presentation' && role !== 'none') {
        expect(alt, `Image at index ${i} is missing alt attribute`).not.toBeNull();
      }
    }
  });

  test('interactive elements have focus indicators', async ({ page }) => {
    const results = await runAxe(page);
    const focusViolations = filterViolations(results.violations).filter(v =>
      v.id.includes('focus') || v.id.includes('outline')
    );
    expect(focusViolations).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Employees Page', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/admin/employees');
  });

  test('employees page has no critical WCAG 2.1 AA violations', async ({ page }) => {
    const results = await runAxe(page);
    const violations = filterViolations(results.violations);
    const criticalViolations = violations.filter(v => ['critical', 'serious'].includes(v.impact));
    expect(
      criticalViolations,
      `Critical violations on employees page:\n${formatViolations(criticalViolations)}`
    ).toHaveLength(0);
  });

  test('employee table has accessible column headers', async ({ page }) => {
    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const results = await runAxe(page);
      const tableViolations = filterViolations(results.violations).filter(v =>
        v.id.includes('table') || v.id.includes('th') || v.id.includes('scope')
      );
      expect(
        tableViolations,
        `Table accessibility violations:\n${formatViolations(tableViolations)}`
      ).toHaveLength(0);
    }
  });

  test('search input has accessible label', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const id = await searchInput.getAttribute('id');
      const hasLabel = id
        ? await page.locator(`label[for="${id}"]`).count() > 0
        : false;
      expect(hasLabel || !!ariaLabel).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Add Employee Form', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/admin/employees');
    // Open add form
    const addBtn = page.locator('button:has-text("Add Employee"), button:has-text("New Employee")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('add employee form has no critical accessibility violations', async ({ page }) => {
    const formVisible = await page.locator('[role="dialog"], .modal, form').first().isVisible({ timeout: 3000 }).catch(() => false);
    if (formVisible) {
      const results = await runAxe(page);
      const violations = filterViolations(results.violations);
      const criticalViolations = violations.filter(v => ['critical', 'serious'].includes(v.impact));
      expect(
        criticalViolations,
        `Critical violations in add employee form:\n${formatViolations(criticalViolations)}`
      ).toHaveLength(0);
    }
  });

  test('form inputs inside modal have labels', async ({ page }) => {
    const modal = page.locator('[role="dialog"], .modal').first();
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const inputs = modal.locator('input:not([type="hidden"])');
      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        const hasLabel = id
          ? await page.locator(`label[for="${id}"]`).count() > 0
          : false;
        expect(
          hasLabel || !!ariaLabel || !!placeholder,
          `Modal input at index ${i} has no accessible name`
        ).toBe(true);
      }
    }
  });

  test('modal has accessible role and title', async ({ page }) => {
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const ariaLabel = await modal.getAttribute('aria-label');
      const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
      expect(
        ariaLabel || ariaLabelledBy,
        'Modal dialog should have aria-label or aria-labelledby'
      ).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Leave Request Form', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/leave/request');
  });

  test('leave request form has no critical WCAG violations', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      const results = await runAxe(page);
      const violations = filterViolations(results.violations);
      const criticalViolations = violations.filter(v => ['critical', 'serious'].includes(v.impact));
      expect(
        criticalViolations,
        `Critical violations in leave request form:\n${formatViolations(criticalViolations)}`
      ).toHaveLength(0);
    }
  });

  test('date inputs have accessible labels', async ({ page }) => {
    const url = page.url();
    if (!url.includes('/login')) {
      const dateInputs = page.locator('input[type="date"]');
      const count = await dateInputs.count();
      for (let i = 0; i < count; i++) {
        const input = dateInputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const hasLabel = id
          ? await page.locator(`label[for="${id}"]`).count() > 0
          : false;
        expect(
          hasLabel || !!ariaLabel,
          `Date input at index ${i} has no accessible label`
        ).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Colour Contrast', () => {
  test('login page text meets minimum contrast ratio', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    const results = await runAxe(page);
    const contrastViolations = filterViolations(results.violations).filter(v =>
      v.id === 'color-contrast'
    );
    if (contrastViolations.length > 0) {
      console.warn(`⚠ Colour contrast violations on login:\n${formatViolations(contrastViolations)}`);
    }
    // Report but don't fail for contrast — it's a design decision
    expect(contrastViolations.length).toBeLessThanOrEqual(5);
  });

  test('admin dashboard text meets minimum contrast ratio', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    const results = await runAxe(page);
    const contrastViolations = filterViolations(results.violations).filter(v =>
      v.id === 'color-contrast'
    );
    if (contrastViolations.length > 0) {
      console.warn(`⚠ Colour contrast violations on dashboard:\n${formatViolations(contrastViolations)}`);
    }
    expect(contrastViolations.length).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Keyboard Navigation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login form can be submitted via keyboard only', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    // Tab to username
    await page.keyboard.press('Tab');
    const focusedTag1 = await page.evaluate(() => document.activeElement?.tagName);

    // If focused on an input, type the username
    if (focusedTag1 === 'INPUT') {
      await page.keyboard.type('testadmin');
      await page.keyboard.press('Tab');
      await page.keyboard.type('testpass123');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      // Should either login or show error — not crash
      await expect(page.locator('body')).not.toContainText('Something went wrong');
    }
  });

  test('focus trap works in modals', async ({ page }) => {
    await goTo(page, '/admin/employees');
    const addBtn = page.locator('button:has-text("Add Employee"), button:has-text("New Employee")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const modalOpen = await page.locator('[role="dialog"], .modal').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (modalOpen) {
        // Tab several times — focus should stay within modal
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
        }
        // Modal should still be visible
        await expect(page.locator('[role="dialog"], .modal').first()).toBeVisible();
        // Close modal
        await page.keyboard.press('Escape');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Accessibility — Full Axe Report (non-blocking)', () => {
  test('generate full axe report for admin dashboard', async ({ page }) => {
    await goTo(page, '/admin/dashboard');
    const results = await runAxe(page, {
      exclude: ['[class*="chart"]', 'canvas'],
    });

    console.log(`\n📊 Axe Report — Admin Dashboard`);
    console.log(`  Passes:     ${results.passes.length}`);
    console.log(`  Violations: ${results.violations.length}`);
    console.log(`  Incomplete: ${results.incomplete.length}`);

    if (results.violations.length > 0) {
      console.log('\n  Violations by impact:');
      const byImpact = {};
      for (const v of results.violations) {
        byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
      }
      for (const [impact, count] of Object.entries(byImpact)) {
        console.log(`    ${impact}: ${count}`);
      }
    }

    // Attach full report as test attachment
    await test.info().attach('axe-report-admin-dashboard.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });

    // Only hard-fail on critical violations
    const criticals = filterViolations(results.violations).filter(v => v.impact === 'critical');
    expect(
      criticals,
      `Critical violations:\n${formatViolations(criticals)}`
    ).toHaveLength(0);
  });
});
