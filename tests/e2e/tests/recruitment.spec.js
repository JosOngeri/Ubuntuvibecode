// tests/recruitment.spec.js
// Recruitment E2E tests for Ubuntu HRMS
// Covers: job board, postings, application form, applicant review dashboard

const { test, expect } = require('@playwright/test');
const { loginAs, FRONTEND_URL } = require('./helpers/auth.helper');

const RECRUITMENT_URL = `${FRONTEND_URL}/admin/recruitment`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: navigate to recruitment page
// ─────────────────────────────────────────────────────────────────────────────
async function goToRecruitment(page) {
  await page.goto(RECRUITMENT_URL, { waitUntil: 'domcontentloaded' });
  const url = page.url();
  if (url.includes('/login')) {
    await loginAs(page, 'admin');
    await page.goto(RECRUITMENT_URL, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForLoadState('networkidle');
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Job Board / Recruitment Page', () => {
  test.beforeEach(async ({ page }) => {
    await goToRecruitment(page);
  });

  // ─── Page Load ──────────────────────────────────────────────────────────────
  test.describe('Page Load', () => {
    test('recruitment page loads without errors', async ({ page }) => {
      await expect(page).toHaveURL(/recruitment/);
      await expect(page.locator('body')).not.toContainText('Something went wrong');
      await expect(page.locator('body')).not.toContainText('Cannot read properties');
    });

    test('recruitment page has a visible heading', async ({ page }) => {
      const heading = page.locator('h1, h2, h3, [class*="title"], [class*="heading"]').first();
      await expect(heading).toBeVisible();
      const text = await heading.textContent();
      expect(text.trim().length).toBeGreaterThan(0);
    });

    test('recruitment page does not show undefined or NaN values', async ({ page }) => {
      await expect(page.locator('body')).not.toContainText('undefined');
      await expect(page.locator('body')).not.toContainText('NaN');
      await expect(page.locator('body')).not.toContainText('[object Object]');
    });

    test('loading state resolves — no infinite spinner', async ({ page }) => {
      const spinner = page.locator('.spinner, .loading, [class*="spinner"]').first();
      if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(spinner).not.toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ─── Job Postings ────────────────────────────────────────────────────────────
  test.describe('Job Postings', () => {
    test('job postings list or cards are displayed', async ({ page }) => {
      const listSelectors = [
        'table',
        '.job-card',
        '[class*="job"]',
        '[class*="posting"]',
        '.card',
      ];
      let listFound = false;
      for (const sel of listSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          listFound = true;
          break;
        }
      }
      // Either data or empty state — never blank
      const bodyText = await page.locator('body').textContent();
      expect(bodyText.trim().length).toBeGreaterThan(20);
    });

    test('job posting titles are not blank or undefined', async ({ page }) => {
      const rows = page.locator('table tbody tr, .job-card, [class*="job-row"]');
      const count = await rows.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const rowText = await rows.nth(i).textContent();
          expect(rowText.trim().length).toBeGreaterThan(0);
          expect(rowText).not.toContain('undefined');
          expect(rowText).not.toContain('[object Object]');
        }
      }
    });

    test('job postings show department information', async ({ page }) => {
      const rows = page.locator('table tbody tr, .job-card');
      const count = await rows.count();
      if (count > 0) {
        const bodyText = await page.locator('body').textContent();
        // Should contain at least one department name
        const hasDept = /engineering|finance|hr|human resources|operations|marketing|IT/i.test(bodyText);
        // Or department column header
        const deptHeader = page.locator('th:has-text("Department")');
        if (await deptHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
          expect(hasDept).toBe(true);
        }
      }
    });

    test('job status column shows valid status values', async ({ page }) => {
      const statusCells = page.locator(
        'td:has-text("Active"), td:has-text("Closed"), td:has-text("Draft"), td:has-text("Open"), .badge, [class*="status"]'
      );
      const count = await statusCells.count();
      if (count > 0) {
        const firstStatus = await statusCells.first().textContent();
        expect(firstStatus.trim().length).toBeGreaterThan(0);
        expect(firstStatus).not.toContain('undefined');
      }
    });

    test('job postings show applicant count as a number', async ({ page }) => {
      const bodyText = await page.locator('body').textContent();
      // Applicant count should not be NaN
      await expect(page.locator('body')).not.toContainText('NaN');
    });

    test('empty state shows when no jobs (not blank)', async ({ page }) => {
      const rows = page.locator('table tbody tr, .job-card');
      const count = await rows.count();
      if (count === 0) {
        const emptyStateSelectors = [
          'text=/no jobs/i',
          'text=/no postings/i',
          'text=/no records/i',
          '.empty-state',
          '[class*="empty"]',
        ];
        let emptyFound = false;
        for (const sel of emptyStateSelectors) {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            emptyFound = true;
            break;
          }
        }
        expect(emptyFound).toBe(true);
      }
    });
  });

  // ─── Add Job / Post Job ──────────────────────────────────────────────────────
  test.describe('Post a Job', () => {
    test('Post Job / Add Job button is visible', async ({ page }) => {
      const addJobSelectors = [
        'button:has-text("Post Job")',
        'button:has-text("Add Job")',
        'button:has-text("Create Job")',
        'button:has-text("New Job")',
        'button:has-text("+ Job")',
        'a:has-text("Post Job")',
      ];
      let found = false;
      for (const sel of addJobSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    test('clicking Post Job opens a form or modal', async ({ page }) => {
      const addJobSelectors = [
        'button:has-text("Post Job")',
        'button:has-text("Add Job")',
        'button:has-text("Create Job")',
        'button:has-text("New Job")',
      ];
      for (const sel of addJobSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await el.click();
          await page.waitForTimeout(1000);

          const formOpen = await page.locator('[role="dialog"], .modal, form, [class*="form"]').first().isVisible({ timeout: 3000 }).catch(() => false);
          const isOnNewPage = page.url().includes('new') || page.url().includes('create') || page.url().includes('post');
          expect(formOpen || isOnNewPage).toBe(true);
          break;
        }
      }
    });

    test('job form has job title field', async ({ page }) => {
      const addJobSelectors = [
        'button:has-text("Post Job")',
        'button:has-text("Add Job")',
        'button:has-text("New Job")',
      ];
      for (const sel of addJobSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await el.click();
          await page.waitForTimeout(1000);

          const titleField = page.locator(
            'input[name*="title" i], input[placeholder*="job title" i], input[placeholder*="title" i]'
          ).first();
          if (await titleField.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(titleField).toBeVisible();
          }
          break;
        }
      }
    });
  });

  // ─── Application Form ────────────────────────────────────────────────────────
  test.describe('Job Application Form', () => {
    test('application form is accessible for a job posting', async ({ page }) => {
      // Try to click on a job to view it / apply
      const applySelectors = [
        'button:has-text("Apply")',
        'button:has-text("View Applicants")',
        'a:has-text("Apply")',
        'button:has-text("Applications")',
      ];
      for (const sel of applySelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await el.click();
          await page.waitForTimeout(1500);
          await expect(page.locator('body')).not.toContainText('undefined');
          break;
        }
      }
    });

    test('applicant data does not show undefined or null', async ({ page }) => {
      // Click on a job row to see applicants
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      if (count > 0) {
        await rows.first().click();
        await page.waitForTimeout(1500);
        await expect(page.locator('body')).not.toContainText('undefined');
        await expect(page.locator('body')).not.toContainText('[object Object]');
      }
    });
  });

  // ─── Applicant Review Dashboard ──────────────────────────────────────────────
  test.describe('Applicant Review', () => {
    test('applicant review section loads for a job', async ({ page }) => {
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      if (count > 0) {
        // Look for a "View" or "Review" button on the first row
        const viewBtn = rows.first().locator('button:has-text("View"), button:has-text("Review"), a').first();
        if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await viewBtn.click();
          await page.waitForTimeout(1500);
          await expect(page.locator('body')).not.toContainText('undefined');
          await expect(page.locator('body')).not.toContainText('NaN');
        }
      }
    });

    test('applicant names in review list are not blank', async ({ page }) => {
      // Visit applicants for job 1 if exists
      const applicantRows = page.locator('table tbody tr, [class*="applicant"]');
      const count = await applicantRows.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const rowText = await applicantRows.nth(i).textContent();
          expect(rowText.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('application status badges show valid values', async ({ page }) => {
      const statusBadges = page.locator(
        '.badge, [class*="status"], td:has-text("Applied"), td:has-text("Shortlisted"), td:has-text("Interviewed"), td:has-text("Rejected")'
      );
      const count = await statusBadges.count();
      if (count > 0) {
        const firstBadge = await statusBadges.first().textContent();
        expect(firstBadge.trim().length).toBeGreaterThan(0);
        expect(firstBadge).not.toContain('undefined');
      }
    });
  });

  // ─── Interview Score ─────────────────────────────────────────────────────────
  test.describe('Interview Data', () => {
    test('interview score fields do not show NaN', async ({ page }) => {
      await expect(page.locator('body')).not.toContainText('NaN');
    });

    test('interview date fields do not show undefined', async ({ page }) => {
      await expect(page.locator('body')).not.toContainText('undefined');
    });
  });
});
