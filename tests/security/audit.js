/**
 * Security Audit Script
 *
 * Runs automated security checks across the project:
 * 1. npm audit - dependency vulnerability scanning
 * 2. Checks for hardcoded secrets/keys
 * 3. Validates security headers
 * 4. Checks CORS configuration
 * 5. Validates JWT configuration
 *
 * Run with: node tests/security/audit.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '../..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');

const results = {
  passed: [],
  warnings: [],
  failures: [],
};

function pass(msg) {
  results.passed.push(msg);
  console.log(`  ✓ ${msg}`);
}

function warn(msg) {
  results.warnings.push(msg);
  console.warn(`  ⚠ ${msg}`);
}

function fail(msg) {
  results.failures.push(msg);
  console.error(`  ✗ ${msg}`);
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// ─── 1. Dependency Vulnerability Scan ───────────────────────────────────────
section('1. Dependency Vulnerability Scan (npm audit)');

['backend', 'frontend'].forEach((dir) => {
  const dirPath = path.join(ROOT, dir);
  try {
    execSync('npm audit --audit-level=high --json', { cwd: dirPath, stdio: 'pipe' });
    pass(`${dir}: No high/critical vulnerabilities found`);
  } catch (err) {
    try {
      const output = JSON.parse(err.stdout?.toString() || '{}');
      const { high = 0, critical = 0 } = output.metadata?.vulnerabilities || {};
      if (critical > 0) {
        fail(`${dir}: ${critical} CRITICAL vulnerabilities found - run: npm audit fix`);
      } else if (high > 0) {
        warn(`${dir}: ${high} HIGH vulnerabilities found - run: npm audit fix`);
      } else {
        pass(`${dir}: No high/critical vulnerabilities`);
      }
    } catch {
      warn(`${dir}: Could not parse npm audit output`);
    }
  }
});

// ─── 2. Hardcoded Secret Detection ──────────────────────────────────────────
section('2. Hardcoded Secret Detection');

const SECRET_PATTERNS = [
  { pattern: /password\s*=\s*['"][^'"]{8,}['"]/gi, label: 'hardcoded password' },
  { pattern: /secret\s*=\s*['"][^'"]{16,}['"]/gi, label: 'hardcoded secret' },
  { pattern: /api[_-]?key\s*=\s*['"][^'"]{16,}['"]/gi, label: 'hardcoded API key' },
  { pattern: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, label: 'hardcoded JWT token' },
  { pattern: /postgres:\/\/[^:]+:[^@]+@/g, label: 'hardcoded DB connection string' },
];

const SCAN_DIRS = [
  path.join(BACKEND, 'controllers'),
  path.join(BACKEND, 'routes'),
  path.join(BACKEND, 'models'),
  path.join(FRONTEND, 'src'),
];

const EXCLUDED_FILES = ['.env', '.env.example', '.env.test', 'node_modules'];

function scanFileForSecrets(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  for (const { pattern, label } of SECRET_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      findings.push({ label, count: matches.length, file: filePath });
    }
  }

  return findings;
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_FILES.some((ex) => entry.name.includes(ex))) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const findings = scanFileForSecrets(fullPath);
      for (const f of findings) {
        warn(`Potential ${f.label} in ${path.relative(ROOT, f.file)}`);
      }
    }
  }
}

SCAN_DIRS.forEach(scanDir);
if (results.warnings.length === 0) {
  pass('No hardcoded secrets detected in source code');
}

// ─── 3. .env File Validation ─────────────────────────────────────────────────
section('3. Environment File Security');

const envFile = path.join(BACKEND, '.env');
if (fs.existsSync(envFile)) {
  warn('.env file exists in backend/ - ensure it is in .gitignore');

  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  if (gitignore.includes('.env')) {
    pass('.env is listed in .gitignore');
  } else {
    fail('.env is NOT in .gitignore - SECURITY RISK: secrets may be committed');
  }
} else {
  pass('No .env file in repository (using environment variables)');
}

// ─── 4. JWT Configuration Checks ─────────────────────────────────────────────
section('4. JWT Configuration Audit');

const authControllerPath = path.join(BACKEND, 'controllers', 'auth.controller.js');
if (fs.existsSync(authControllerPath)) {
  const authContent = fs.readFileSync(authControllerPath, 'utf8');

  if (authContent.includes('expiresIn')) {
    pass('JWT tokens have expiry configured');
  } else {
    fail('JWT tokens have no expiry - SECURITY RISK: tokens never expire');
  }

  if (authContent.includes('bcrypt') || authContent.includes('bcryptjs')) {
    pass('Passwords are hashed with bcrypt');
  } else {
    fail('Passwords may not be properly hashed');
  }

  if (authContent.includes('crypto.createHash') || authContent.includes('resetTokenHash')) {
    pass('Reset tokens are hashed before storage');
  } else {
    warn('Reset token hashing not confirmed');
  }
}

// ─── 5. Security Headers Check ───────────────────────────────────────────────
section('5. Security Headers');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

function checkHeaders(url) {
  return new Promise((resolve) => {
    try {
      const req = http.get(`${url}/api/health`, (res) => {
        const headers = res.headers;
        const checks = {
          'x-content-type-options': headers['x-content-type-options'],
          'x-frame-options': headers['x-frame-options'],
          'x-xss-protection': headers['x-xss-protection'],
          'strict-transport-security': headers['strict-transport-security'],
          'content-security-policy': headers['content-security-policy'],
        };

        for (const [header, value] of Object.entries(checks)) {
          if (value) {
            pass(`Security header present: ${header}`);
          } else {
            warn(`Security header missing: ${header} - consider adding helmet.js`);
          }
        }

        resolve();
      });

      req.on('error', () => {
        warn('Backend not running - skipping security headers check (run when server is active)');
        resolve();
      });

      req.setTimeout(3000, () => {
        req.destroy();
        warn('Backend not reachable - skipping security headers check');
        resolve();
      });
    } catch {
      warn('Could not check security headers - ensure backend is running');
      resolve();
    }
  });
}

// ─── 6. CORS Configuration ──────────────────────────────────────────────────
section('6. CORS Configuration');

const appJsPath = path.join(BACKEND, 'app.js');
if (fs.existsSync(appJsPath)) {
  const appContent = fs.readFileSync(appJsPath, 'utf8');

  if (appContent.includes('cors(')) {
    pass('CORS middleware is configured');
  } else {
    fail('CORS middleware not found - all origins will be allowed');
  }

  if (appContent.includes('allowedOrigins')) {
    pass('CORS uses an allowlist of origins');
  } else {
    warn('CORS may not restrict origins to an allowlist');
  }

  if (!appContent.includes("origin: '*'")) {
    pass('CORS does not use wildcard origin (*)');
  } else {
    fail('CORS allows all origins (*) - SECURITY RISK in production');
  }
}

// ─── 7. Authentication Middleware Coverage ───────────────────────────────────
section('7. Authentication Middleware Coverage');

const routesDir = path.join(BACKEND, 'routes');
if (fs.existsSync(routesDir)) {
  const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.routes.js'));
  let allProtected = true;

  for (const file of routeFiles) {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    if (!content.includes('auth') && file !== 'auth.routes.js') {
      warn(`${file}: May have unprotected routes (no auth middleware import found)`);
      allProtected = false;
    }
  }

  if (allProtected) {
    pass('All route files appear to use auth middleware');
  }
}

// ─── Final Report ─────────────────────────────────────────────────────────────
async function main() {
  await checkHeaders(BACKEND_URL);

  console.log('\n' + '═'.repeat(60));
  console.log('  SECURITY AUDIT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  ✓ Passed:   ${results.passed.length}`);
  console.log(`  ⚠ Warnings: ${results.warnings.length}`);
  console.log(`  ✗ Failures: ${results.failures.length}`);

  if (results.failures.length > 0) {
    console.log('\n  FAILURES (must fix):');
    results.failures.forEach((f) => console.log(`    - ${f}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n  WARNINGS (should fix):');
    results.warnings.forEach((w) => console.log(`    - ${w}`));
  }

  console.log('═'.repeat(60));

  // Exit with error code if failures exist
  if (results.failures.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
