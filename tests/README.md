# Ubuntu HRMS - Comprehensive Testing Suite

All tests live in this `tests/` folder — completely separate from backend and frontend source code.

## Folder Structure

```
tests/
├── e2e/                      # Playwright E2E browser tests
│   ├── playwright.config.js
│   ├── tests/
│   │   ├── auth.spec.js          - Login, logout, password reset, auth guards
│   │   ├── dashboard.spec.js     - Stats cards, navigation, data display
│   │   ├── employees.spec.js     - Employee CRUD, name display, search/filter
│   │   ├── payroll.spec.js       - Payroll calculation, approval, disbursement
│   │   ├── leave.spec.js         - Leave requests, balances, approvals
│   │   ├── attendance.spec.js    - Punch in/out, attendance records
│   │   ├── recruitment.spec.js   - Job postings, applications, review
│   │   ├── navigation.spec.js    - All pages render, no undefined/null data
│   │   ├── visual.spec.js        - Visual regression snapshots
│   │   ├── accessibility.spec.js - WCAG 2.1 AA axe-core checks
│   │   ├── mobile.spec.js        - Responsive design, mobile viewports
│   │   └── compliance.spec.js    - GDPR, data privacy, sensitive data access
│   ├── helpers/
│   │   └── auth.helper.js        - Login helpers, token management
│   └── fixtures/
│       └── test-data.js          - Mock employee, payroll, leave data
│
├── api/                      # Jest + Supertest backend API tests
│   ├── jest.config.js
│   ├── setup/
│   │   ├── global-setup.js       - Test environment configuration
│   │   ├── teardown.js           - Cleanup after tests
│   │   ├── test-helpers.js       - JWT generation, mock DB helpers
│   │   └── seed-test-data.js     - Seed test users/employees for CI
│   └── tests/
│       ├── health.test.js        - Health endpoint
│       ├── auth.test.js          - Auth endpoints (login, register, reset)
│       ├── employees.test.js     - Employee CRUD + validation
│       ├── payroll.test.js       - Payroll calculation + approval logic
│       ├── leave.test.js         - Leave requests + balance logic
│       ├── attendance.test.js    - Biometric + self-punch + geolocation
│       ├── database.test.js      - Schema integrity, table/column checks
│       ├── business-logic.test.js - Pure function unit tests
│       ├── security.test.js      - Auth bypass, injection, JWT validation
│       └── compliance.test.js    - Data privacy, sensitive data access
│
├── load/                     # k6 load & stress tests
│   ├── config.js             - Shared config (URLs, credentials)
│   ├── auth-load.js          - Auth endpoint load test
│   ├── employees-load.js     - Employee endpoint load test
│   ├── payroll-load.js       - Payroll endpoint load test
│   └── stress-test.js        - Full system stress test
│
├── performance/              # Lighthouse CI performance tests
│   └── lighthouserc.json     - Lighthouse configuration + thresholds
│
├── security/                 # Security audit scripts
│   ├── audit.js              - Dependency scan + secret detection + security headers
│   └── owasp-checks.js       - OWASP Top 10 code-level checks
│
└── package.json              - Root test runner scripts
```

---

## Prerequisites

### Required
- **Node.js 20+**
- **npm** or **pnpm**
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- PostgreSQL database available

### Optional (for load tests)
- **k6** - https://k6.io/docs/getting-started/installation/

### Optional (for performance tests)
- **@lhci/cli** - `npm install -g @lhci/cli`

---

## Quick Start

### 1. Set up environment
Create a `.env` file in `tests/e2e/`:
```env
TEST_ADMIN_USER=testadmin
TEST_ADMIN_PASS=testpass123
TEST_EMPLOYEE_USER=testemployee
TEST_EMPLOYEE_PASS=testpass123
TEST_MANAGER_USER=testmanager
TEST_MANAGER_PASS=testpass123
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### 2. Install dependencies
```bash
# Install all test dependencies
npm run install:all

# Install Playwright browsers
cd e2e && npx playwright install
```

### 3. Start your servers (in separate terminals)
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## Running Tests

### Security Audit (fastest, no server needed)
```bash
node tests/security/owasp-checks.js
node tests/security/audit.js
```

### API Tests (backend must be configured)
```bash
cd tests/api
npm test                    # Run all API tests
npm run test:coverage       # With coverage report
npm run test:verbose        # Detailed output
```

### E2E Tests (both servers must be running)
```bash
cd tests/e2e
npm test                    # All browsers, headless
npm run test:headed         # With browser window open (see what's happening)
npm run test:debug          # Step-by-step debugging
npm run test:ui             # Playwright UI mode (best for development)
npm run test:chromium       # Chromium only (faster)
npm run test:mobile         # Mobile viewport tests
```

### Run specific test file
```bash
cd tests/e2e
npx playwright test tests/employees.spec.js
npx playwright test tests/employees.spec.js --headed
```

### Load Tests (k6 required)
```bash
# Quick load test
k6 run tests/load/auth-load.js

# With custom options
k6 run --vus 50 --duration 60s tests/load/employees-load.js

# Full stress test (WARNING: only on test environment)
k6 run tests/load/stress-test.js
```

### Performance (Lighthouse CI)
```bash
npm install -g @lhci/cli
cd tests/performance
lhci autorun
```

### Run Everything
```bash
cd tests
npm run test:all
```

---

## What Each Test Suite Checks

### E2E Tests (Playwright)
- **auth.spec.js** - Login/logout, wrong passwords, inactive accounts, role-based redirects
- **dashboard.spec.js** - Stats cards show real numbers, navigation works, no blank pages
- **employees.spec.js** - **Employee names display correctly (catches firstName/lastName display bugs)**, CRUD works, search/filter functional
- **payroll.spec.js** - Payroll calculations correct, employee names visible in payroll list, net pay is numeric
- **leave.spec.js** - Leave balances display correctly, leave types correct, approval flow works
- **attendance.spec.js** - Punch in/out works, attendance records display dates correctly
- **navigation.spec.js** - **Every page renders** (no white screens), no "undefined"/"null" text visible on screen
- **visual.spec.js** - Screenshots compared to baseline (catches layout/styling regressions)
- **accessibility.spec.js** - WCAG 2.1 AA compliance (keyboard nav, screen readers, contrast)
- **mobile.spec.js** - Works on phone/tablet viewports, no horizontal scroll breaks
- **compliance.spec.js** - Sensitive data not visible to wrong roles, JWT expiry enforced

### API Tests (Jest + Supertest)
- **auth.test.js** - All auth endpoints, invalid credentials, token validation
- **employees.test.js** - CRUD validation, required fields, ID validation
- **payroll.test.js** - Calculation accuracy, period format, approval workflow
- **leave.test.js** - Working days vs calendar days, overlap detection, balance deduction
- **attendance.test.js** - Geolocation validation, biometric device matching, hour calculation
- **database.test.js** - All tables exist, correct columns, foreign keys intact
- **business-logic.test.js** - Pure function unit tests (payroll formula, leave day counting)
- **security.test.js** - SQL injection blocked, JWT forgery blocked, role bypass blocked
- **compliance.test.js** - Passwords never in response, sensitive data access control

### Load Tests (k6)
- **auth-load.js** - 50 concurrent users logging in/out, <2s response time
- **employees-load.js** - 100 concurrent employee list requests, names always present
- **payroll-load.js** - 30 concurrent payroll calculations, correct results under load
- **stress-test.js** - 300 concurrent users finding system breaking point

### Security (Node.js scripts)
- **audit.js** - npm vulnerability scan, hardcoded secret detection, CORS config, JWT config
- **owasp-checks.js** - OWASP Top 10: access control, injection, crypto, misconfiguration, logging

### Performance (Lighthouse CI)
- Performance score ≥ 60, Accessibility ≥ 85, Best Practices ≥ 75
- FCP < 3s, TTI < 5s, CLS < 0.1

---

## CI/CD Pipeline

Tests run automatically via GitHub Actions (`.github/workflows/ci.yml`):

| Job | Trigger | What it does |
|-----|---------|-------------|
| Security Audit | Every push/PR | npm audit + OWASP checks |
| Lint | Every push/PR | ESLint + Prettier on both packages |
| API Tests | Every push/PR | Full backend test suite with real PostgreSQL |
| Frontend Build | Every push/PR | Vite build (catches import/compilation errors) |
| E2E Tests | Every push/PR | Full Playwright suite across Chrome/Firefox/Safari |
| Accessibility | Push to main | axe-core WCAG checks |
| Performance | Push to main + nightly | Lighthouse CI |
| Test Report | Always | Summary of all job results |

**Artifacts saved:**
- Playwright HTML report (30 days)
- Screenshots/videos of failed E2E tests (14 days)
- API test coverage report (30 days)

---

## Error Tracking (Sentry)

For production error monitoring, add Sentry to both packages:

### Backend
```bash
cd backend
npm install @sentry/node
```

Add to `backend/app.js` (top):
```js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
// ... existing routes ...
app.use(Sentry.Handlers.errorHandler());
```

### Frontend
```bash
cd frontend
npm install @sentry/react
```

Add to `frontend/src/main.jsx`:
```js
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

Add `SENTRY_DSN` and `VITE_SENTRY_DSN` to your environment variables.

---

## Fixing Bugs Found by Tests

When tests find a misalignment (e.g. employee name not displaying):

1. **Check the test output** - it will tell you exactly what it expected vs what it found
2. **View the screenshot** - for E2E failures, a screenshot is saved in `tests/e2e/test-results/`
3. **Run in headed mode** to watch the failure happen: `npx playwright test --headed`
4. **Fix the source code** in `backend/` or `frontend/`
5. **Re-run the test** to confirm the fix
6. **Commit** - CI will validate the fix automatically

---

## Adding New Tests

### New E2E test
Create `tests/e2e/tests/my-feature.spec.js`:
```js
import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth.helper.js';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('my feature works', async ({ page }) => {
    await page.goto('/admin/my-feature');
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByText('undefined')).not.toBeVisible();
  });
});
```

### New API test
Create `tests/api/tests/my-endpoint.test.js`:
```js
const request = require('supertest');
const app = require('../../../backend/app');
const { createAdminToken } = require('../setup/test-helpers');

describe('My Endpoint', () => {
  test('GET /api/my-endpoint returns 200', async () => {
    const token = createAdminToken();
    const res = await request(app)
      .get('/api/my-endpoint')
      .set('x-auth-token', token);
    expect(res.status).toBe(200);
  });
});
```
