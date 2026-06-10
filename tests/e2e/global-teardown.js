// global-teardown.js
// Runs once after all Playwright tests complete.
// Cleans up temporary auth state files and any test artifacts.

const path = require('path');
const fs   = require('fs');

const AUTH_STATES_DIR = path.join(__dirname, 'auth-states');

/**
 * Global teardown entry point.
 */
async function globalTeardown() {
  console.log('\n[global-teardown] Running cleanup...');

  // Remove per-role auth state files (they contain sensitive tokens)
  if (fs.existsSync(AUTH_STATES_DIR)) {
    const files = fs.readdirSync(AUTH_STATES_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        fs.unlinkSync(path.join(AUTH_STATES_DIR, file));
        console.log(`[global-teardown]  ✓ Removed auth-states/${file}`);
      } catch (err) {
        console.warn(`[global-teardown]  ⚠ Could not remove auth-states/${file}: ${err.message}`);
      }
    }
  }

  console.log('[global-teardown] ✓ Teardown complete.\n');
}

module.exports = globalTeardown;
