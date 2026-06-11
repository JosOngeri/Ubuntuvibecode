/**
 * OWASP Top 10 Checks
 *
 * Automated checks against the OWASP Top 10 web security risks.
 * These are code-level and configuration checks (not active exploitation).
 *
 * Run with: node tests/security/owasp-checks.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BACKEND = path.join(ROOT, 'backend');

const results = { passed: [], warnings: [], failures: [] };

function pass(label, detail) {
  results.passed.push({ label, detail });
  console.log(`  ✓ [${label}] ${detail}`);
}
function warn(label, detail) {
  results.warnings.push({ label, detail });
  console.warn(`  ⚠ [${label}] ${detail}`);
}
function fail(label, detail) {
  results.failures.push({ label, detail });
  console.error(`  ✗ [${label}] ${detail}`);
}

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function findFiles(dir, ext) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(full);
      } else if (entry.isFile() && full.endsWith(ext)) {
        result.push(full);
      }
    }
  };
  walk(dir);
  return result;
}

console.log('\n' + '═'.repeat(60));
console.log('  OWASP Top 10 Security Checks');
console.log('═'.repeat(60));

// ─── A01: Broken Access Control ──────────────────────────────────────────────
console.log('\n[A01] Broken Access Control');

const routeFiles = findFiles(path.join(BACKEND, 'routes'), '.js');
let unprotectedCount = 0;
for (const rf of routeFiles) {
  const content = readFile(rf);
  const filename = path.basename(rf);
  if (filename === 'auth.routes.js') continue;

  const hasAuth = content.includes('auth') || content.includes('authenticate');
  const hasRole = content.includes('role') || content.includes('authorize');

  if (!hasAuth) {
    warn('A01', `${filename}: No auth middleware found - routes may be unprotected`);
    unprotectedCount++;
  }
}
if (unprotectedCount === 0) {
  pass('A01', 'All route files include auth middleware references');
}

const authMiddleware = readFile(path.join(BACKEND, 'middleware', 'auth.js'));
if (authMiddleware.includes('jwt.verify')) {
  pass('A01', 'JWT verification is performed in auth middleware');
} else {
  fail('A01', 'JWT verification not found in auth middleware');
}

const roleMiddleware = readFile(path.join(BACKEND, 'middleware', 'role.js'));
if (roleMiddleware.includes('role') || roleMiddleware.length > 0) {
  pass('A01', 'Role-based access control middleware exists');
} else {
  warn('A01', 'Role middleware may not be implemented');
}

// ─── A02: Cryptographic Failures ─────────────────────────────────────────────
console.log('\n[A02] Cryptographic Failures');

const authController = readFile(path.join(BACKEND, 'controllers', 'auth.controller.js'));

if (authController.includes('bcrypt')) {
  pass('A02', 'Passwords are hashed using bcrypt');
} else {
  fail('A02', 'bcrypt not used for password hashing - CRITICAL');
}

if (authController.includes('genSalt(10)') || authController.includes('genSalt')) {
  pass('A02', 'bcrypt salt rounds are configured');
}

if (authController.includes('crypto.createHash') || authController.includes('crypto.randomBytes')) {
  pass('A02', 'Cryptographically secure token generation used');
} else {
  warn('A02', 'Reset tokens may not use cryptographically secure generation');
}

if (authController.includes("{ expiresIn: '1h' }") || authController.includes('expiresIn')) {
  pass('A02', 'JWT tokens have expiry configured');
} else {
  fail('A02', 'JWT tokens have no expiry - tokens never expire');
}

// ─── A03: Injection ──────────────────────────────────────────────────────────
console.log('\n[A03] Injection (SQL/NoSQL)');

const dbFiles = findFiles(path.join(BACKEND, 'controllers'), '.js');
let rawSqlCount = 0;
let parameterizedCount = 0;

for (const df of dbFiles) {
  const content = readFile(df);
  // Check for parameterized queries (safe)
  if (content.includes('query(') && content.includes('$1')) {
    parameterizedCount++;
  }
  // Check for string concatenation in SQL (unsafe pattern)
  if (/query\([`'"].*\+.*[`'"]/g.test(content)) {
    warn('A03', `${path.basename(df)}: Possible SQL string concatenation detected`);
    rawSqlCount++;
  }
}

if (parameterizedCount > 0 && rawSqlCount === 0) {
  pass('A03', `${parameterizedCount} files use parameterized queries - SQL injection protected`);
} else if (rawSqlCount > 0) {
  fail('A03', `${rawSqlCount} files may have SQL string concatenation - injection risk`);
}

// ─── A04: Insecure Design ────────────────────────────────────────────────────
console.log('\n[A04] Insecure Design');

// Check for rate limiting
const appJs = readFile(path.join(BACKEND, 'app.js'));
if (appJs.includes('rateLimit') || appJs.includes('rate-limit') || appJs.includes('express-rate-limit')) {
  pass('A04', 'Rate limiting is configured');
} else {
  warn('A04', 'No rate limiting found - consider adding express-rate-limit to prevent brute force');
}

// Check forgot password doesn't reveal user existence
if (authController.includes('If an account with that email exists')) {
  pass('A04', 'Forgot password does not reveal if email exists (prevents enumeration)');
} else {
  warn('A04', 'Forgot password may reveal if email exists in system');
}

// ─── A05: Security Misconfiguration ──────────────────────────────────────────
console.log('\n[A05] Security Misconfiguration');

if (appJs.includes("process.env.NODE_ENV === 'production'") || appJs.includes("NODE_ENV")) {
  pass('A05', 'Application checks NODE_ENV for environment-specific config');
}

// Check that detailed errors aren't exposed in production
const globalErrorHandler = appJs.match(/app\.use\(\(err.*?\{[\s\S]*?\}\)/);
if (globalErrorHandler) {
  const handlerCode = globalErrorHandler[0];
  if (!handlerCode.includes('err.stack') && !handlerCode.includes('err.message')) {
    pass('A05', 'Global error handler does not expose stack traces to clients');
  } else {
    warn('A05', 'Global error handler may expose internal error details to clients');
  }
}

// Check for CORS wildcard
if (!appJs.includes("origin: '*'")) {
  pass('A05', 'CORS does not use wildcard origin');
} else {
  fail('A05', 'CORS configured with wildcard origin (*) - not safe for production');
}

// ─── A06: Vulnerable Components ──────────────────────────────────────────────
console.log('\n[A06] Vulnerable and Outdated Components');
warn('A06', 'Run: npm audit in backend/ and frontend/ to check for vulnerable dependencies');
warn('A06', 'Run: npx npm-check-updates to find outdated packages');

// ─── A07: Authentication Failures ────────────────────────────────────────────
console.log('\n[A07] Identification and Authentication Failures');

if (authController.includes("user.status === 'inactive'")) {
  pass('A07', 'Inactive/deactivated accounts are blocked from login');
} else {
  warn('A07', 'Account deactivation check not found in login flow');
}

if (authController.includes('mustChangePassword')) {
  pass('A07', 'Force password change on first login is implemented');
}

if (authController.includes("expiresIn: '1h'")) {
  pass('A07', 'JWT tokens expire after 1 hour - limiting session duration');
} else {
  warn('A07', 'JWT token expiry not confirmed - long-lived tokens are a risk');
}

// ─── A08: Data Integrity Failures ────────────────────────────────────────────
console.log('\n[A08] Software and Data Integrity Failures');

const employeeController = readFile(path.join(BACKEND, 'controllers', 'employee.controller.js'));
if (employeeController.includes('validateEmployeePayload')) {
  pass('A08', 'Employee data is validated before processing');
} else {
  warn('A08', 'Employee input validation not confirmed');
}

// ─── A09: Security Logging and Monitoring ────────────────────────────────────
console.log('\n[A09] Security Logging and Monitoring Failures');

if (authController.includes("logger.info('auth.login'") || authController.includes('logger.warn')) {
  pass('A09', 'Authentication events are logged');
} else {
  warn('A09', 'Authentication logging not confirmed');
}

if (authController.includes("logger.warn('auth.login', 'Wrong password'") ||
    authController.includes("logger.warn('auth.login', 'User not found'")) {
  pass('A09', 'Failed login attempts are logged with warnings');
} else {
  warn('A09', 'Failed login attempt logging not confirmed');
}

const auditRoutes = findFiles(path.join(BACKEND, 'routes'), 'audit.routes.js');
if (auditRoutes.length > 0) {
  pass('A09', 'Audit log routes are implemented');
}

// ─── A10: Server-Side Request Forgery ────────────────────────────────────────
console.log('\n[A10] Server-Side Request Forgery (SSRF)');

const allControllerFiles = findFiles(path.join(BACKEND, 'controllers'), '.js');
let hasExternalRequests = false;

for (const cf of allControllerFiles) {
  const content = readFile(cf);
  if (content.includes('axios.get') || content.includes('http.get') || content.includes('fetch(')) {
    const filename = path.basename(cf);
    warn('A10', `${filename}: Makes external HTTP requests - validate URLs to prevent SSRF`);
    hasExternalRequests = true;
  }
}

if (!hasExternalRequests) {
  pass('A10', 'No obvious SSRF-susceptible external requests found in controllers');
}

// ─── Final Report ─────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('  OWASP TOP 10 SUMMARY');
console.log('═'.repeat(60));
console.log(`  ✓ Passed:   ${results.passed.length}`);
console.log(`  ⚠ Warnings: ${results.warnings.length}`);
console.log(`  ✗ Failures: ${results.failures.length}`);

if (results.failures.length > 0) {
  console.log('\n  CRITICAL FAILURES (must fix immediately):');
  results.failures.forEach((f) => console.log(`    [${f.label}] ${f.detail}`));
}

console.log('═'.repeat(60));

if (results.failures.length > 0) {
  process.exit(1);
}
