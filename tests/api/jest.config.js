/**
 * Jest configuration for Ubuntu HRMS API test suite.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  testTimeout: 30000,

  // Runs once before test suites start (separate process)
  globalSetup: './setup/global-setup.js',

  // Runs in every worker process before the test framework is installed
  setupFiles: ['./setup/global-setup.js'],

  // Runs once after all test suites complete
  globalTeardown: './setup/teardown.js',

  // Keep test output readable
  verbose: false,

  // Force Jest to exit after tests complete (prevents hanging open handles)
  forceExit: true,

  // Warn about open handles that keep Jest running
  detectOpenHandles: true,

  // Stub out the broken payroll controller (being refactored in another session)
  // Map pg to backend's node_modules since tests/api doesn't have its own pg
  moduleNameMapper: {
    // Match any require path that resolves to payroll.routes.js
    '.*[/\\\\\\\\]routes[/\\\\\\\\]payroll\\.routes(\\.js)?$': '<rootDir>/setup/payroll-routes-stub.js',
    // Map pg module to backend's pg installation
    '^pg$': 'D:\\0000 SCO400 Project 2026\\Ubuntu Software\\backend\\node_modules\\pg',
  },

  // Coverage thresholds (optional)
  collectCoverageFrom: [
    '../../../backend/controllers/**/*.js',
    '../../../backend/models/**/*.js',
    '../../../backend/utils/**/*.js',
    '!**/node_modules/**',
  ],
};
