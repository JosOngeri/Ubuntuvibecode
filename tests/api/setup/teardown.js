/**
 * teardown.js  (globalTeardown)
 *
 * Runs once in the Jest main process after ALL test suites have completed.
 * Used to release any resources that may keep the process alive.
 *
 * Note: Jest mocks are cleaned up automatically per test-file; this file
 * handles things like open DB-pool handles, temp files, etc.
 */
module.exports = async () => {
  // Give async operations (e.g. systemLogger fire-and-forget inserts) a moment
  // to settle before Jest force-exits, preventing "open handle" warnings in CI.
  await new Promise((resolve) => setTimeout(resolve, 300));

  // If a real pg Pool was opened by database.test.js it will be closed by that
  // test's own afterAll() hook.  Nothing else to clean up here.
};
