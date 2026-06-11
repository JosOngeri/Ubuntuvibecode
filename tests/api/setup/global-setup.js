/**
 * global-setup.js
 *
 * Dual-purpose file:
 *  1. When used as `setupFiles` entry – this module is LOADED (not called) inside every
 *     Jest worker process, so the top-level assignments below set env vars in the
 *     same process that runs the tests → required before `require('../../../backend/app')`.
 *
 *  2. When used as `globalSetup` entry – Jest calls the exported async function once in
 *     a separate process (env vars set here won't propagate to workers, which is why
 *     we also list it in `setupFiles`).
 *
 * JWT_SECRET is intentionally set to a well-known test string so that test-helpers.js
 * can generate tokens that the backend middleware will accept.
 */

// ─── Environment variables (set in worker processes via setupFiles) ───────────
process.env.JWT_SECRET        = process.env.JWT_SECRET        || 'test-jwt-secret-for-testing';
process.env.DATABASE_URL      = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/ubuntu_hrms_test';
process.env.NODE_ENV          = 'test';
process.env.FRONTEND_URL      = 'http://localhost:5177';
process.env.FRONTEND_ORIGIN   = 'http://localhost:5173';

// Silence noisy logs during tests (controllers use this logger)
process.env.LOG_LEVEL         = 'silent';

// Prevent real e-mail delivery during tests
process.env.SMTP_HOST         = '';
process.env.SMTP_PORT         = '';
process.env.SMTP_USER         = '';
process.env.SMTP_PASS         = '';

// ─── globalSetup export (called once by Jest's main process) ─────────────────
module.exports = async () => {
  // Re-apply env vars here too, in case Jest's globalSetup process is different
  // from the worker processes.  The assignments above won't run when Jest imports
  // this file as a module from the main process (they will run), but we also set
  // them explicitly here so future maintainers have a single source of truth.
  process.env.JWT_SECRET   = process.env.JWT_SECRET   || 'test-jwt-secret-for-testing';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/ubuntu_hrms_test';
  process.env.NODE_ENV     = 'test';

  // Nothing async needed for unit/mock-based tests.
  // If a real DB is needed (database.test.js), it self-manages the connection.
};
