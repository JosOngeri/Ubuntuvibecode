# Quick Start: Running Tests

This guide gets you running tests in 5 minutes.

---

## Prerequisites Check

```bash
node --version    # Should be 20+
npm --version     # Should be 9+
```

---

## Step 1: Start Your Servers

Open 3 terminal windows:

**Terminal 1 - Backend:**
```bash
cd "d:\0000 SCO400 Project 2026\Ubuntu Software\backend"
npm run dev
```
Wait for: `Server running on port 5000`

**Terminal 2 - Frontend:**
```bash
cd "d:\0000 SCO400 Project 2026\Ubuntu Software\frontend"
npm run dev
```
Wait for: `Local: http://localhost:5173/`

**Terminal 3 - Tests:**
```bash
cd "d:\0000 SCO400 Project 2026\Ubuntu Software\tests"
```

---

## Step 2: Run Security Audit (Fastest, No Server Needed)

```bash
node security/owasp-checks.js
node security/audit.js
```

This checks for:
- Vulnerable dependencies
- Hardcoded secrets
- OWASP Top 10 issues
- CORS configuration
- JWT configuration

---

## Step 3: Run API Tests

```bash
cd api
npm install
npm test
```

This tests:
- All backend endpoints
- Authentication
- Employee CRUD
- Payroll calculations
- Leave logic
- Database schema
- Security

---

## Step 4: Run E2E Tests

```bash
cd e2e
npm install
npx playwright install chromium
npm test
```

This tests:
- User interface
- Navigation
- Data display (catches "undefined" employee names)
- Forms
- Accessibility
- Mobile responsiveness

---

## Step 5: Run Load Tests (Optional - Requires k6)

Install k6: https://k6.io/docs/getting-started/installation/

```bash
cd load
k6 run auth-load.js
```

---

## What to Do When Tests Fail

### E2E Test Fails

1. Run in headed mode to see what's happening:
   ```bash
   npx playwright test tests/employees.spec.js --headed
   ```

2. Check the screenshot (saved in `test-results/`)

3. Fix the source code in `backend/` or `frontend/`

4. Re-run the test

### API Test Fails

1. Check the error message - it tells you what's wrong

2. Check the backend controller or model

3. Fix the issue

4. Re-run: `npm test`

### Security Test Fails

1. Read the warning/failure message

2. Fix the issue (e.g., add helmet.js, fix CORS, remove hardcoded secret)

3. Re-run: `node security/audit.js`

---

## Common Issues

### "Backend not running"
- Make sure Terminal 1 is running and shows `Server running on port 5000`

### "Frontend not running"
- Make sure Terminal 2 is running and shows `Local: http://localhost:5173/`

### "Cannot find module"
- Run `npm install` in the test directory

### "Playwright not installed"
- Run `npx playwright install`

### "Database connection failed"
- Make sure PostgreSQL is running
- Check `DATABASE_URL` in backend/.env

---

## Full Test Suite (All at Once)

```bash
cd tests
npm run test:all
```

This runs:
1. Security audit
2. API tests
3. E2E tests

---

## CI/CD (Automatic)

Tests run automatically on every push to GitHub:
- Security audit
- Linting
- API tests
- Frontend build
- E2E tests
- Accessibility tests
- Performance tests

Check the Actions tab in GitHub to see results.
