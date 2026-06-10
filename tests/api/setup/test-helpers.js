/**
 * test-helpers.js
 *
 * Shared utilities for the Ubuntu HRMS API test suite.
 *
 * Exported helpers
 * ─────────────────
 *  generateTestToken(payload)          – sign a JWT with the test secret
 *  createAdminToken()                  – JWT with role:admin, id:999999
 *  createEmployeeToken(employeeId)     – JWT with role:employee
 *  createManagerToken()                – JWT with role:manager
 *  mockDbModule()                      – returns a fresh jest mock for config/db
 *  seedTestEmployee(overrides)         – factory for a mock employee DB row
 *  seedTestUser(overrides)             – factory for a mock user DB row
 *  seedTestPayslip(overrides)          – factory for a mock payslip DB row
 *  seedTestLeaveRequest(overrides)     – factory for a mock leave_request DB row
 *  TEST_SECRET                         – the shared JWT secret
 */

const jwt = require('jsonwebtoken');

// ── Constants ─────────────────────────────────────────────────────────────────
const TEST_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing';

// ── Token helpers ─────────────────────────────────────────────────────────────

/**
 * Sign a JWT using the test secret.
 * @param {object} payload  – token payload (id, role, status, …)
 * @param {object} [opts]   – jsonwebtoken sign options (e.g. { expiresIn: '1h' })
 */
const generateTestToken = (payload, opts = { expiresIn: '1h' }) =>
  jwt.sign(payload, TEST_SECRET, opts);

/** Admin token – full access to all protected routes */
const createAdminToken = () =>
  generateTestToken({
    id:       999999,
    role:     'admin',
    status:   'active',
    username: 'test_admin',
    email:    'admin@test.ubuntu.co.ke',
    name:     'Test Admin',
  });

/**
 * Employee token.
 * @param {number} [employeeId=1]  – the numeric user id embedded in the token
 */
const createEmployeeToken = (employeeId = 1) =>
  generateTestToken({
    id:       employeeId,
    role:     'employee',
    status:   'active',
    username: 'test_employee',
    email:    'employee@test.ubuntu.co.ke',
    name:     'Test Employee',
  });

/** Manager token – subset of admin permissions */
const createManagerToken = () =>
  generateTestToken({
    id:       888888,
    role:     'manager',
    status:   'active',
    username: 'test_manager',
    email:    'manager@test.ubuntu.co.ke',
    name:     'Test Manager',
  });

// ── DB mock factory ───────────────────────────────────────────────────────────

/**
 * Returns the shape expected by jest.mock('../../../backend/config/db', factory).
 * Callers can call db.query.mockResolvedValueOnce(…) to control per-test responses.
 *
 * Both `query` and `pool.query` are mocked separately because:
 *   – Business-logic models use `query` (re-exported from pool).
 *   – SystemLog.model & raw controllers use `pool.query` directly.
 * Keeping them separate lets tests control business queries while the system
 * logger's fire-and-forget inserts silently succeed.
 */
const mockDbModule = () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  pool: {
    query:   jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue({
      query:   jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    }),
    end: jest.fn().mockResolvedValue(undefined),
  },
  connectDB:    jest.fn().mockResolvedValue(undefined),
  closeDB:      jest.fn().mockResolvedValue(undefined),
  initDatabase: jest.fn().mockResolvedValue(undefined),
});

// ── Seed factories ────────────────────────────────────────────────────────────

/**
 * Build a mock DB row representing an employee.
 * Column names match what PostgreSQL returns (snake_case).
 */
const seedTestEmployee = (overrides = {}) => ({
  id:                       1,
  user_id:                  1,
  status:                   'active',
  first_name:               'Jane',
  last_name:                'Wanjiku',
  email:                    'jane.wanjiku@company.co.ke',
  phone:                    '+254700000001',
  biometric_device_id:      'BIO-001',
  mpesa_phone_number:       '0700000001',
  employment_type:          'Permanent',
  wage_rate:                '50.00',
  department:               'Engineering',
  date_joined:              '2024-01-15',
  can_self_record_attendance: true,
  national_id:              null,
  created_at:               new Date().toISOString(),
  updated_at:               new Date().toISOString(),
  ...overrides,
});

/**
 * Build a mock DB row representing a user.
 */
const seedTestUser = (overrides = {}) => ({
  id:                  1,
  username:            'jane.wanjiku',
  email:               'jane.wanjiku@company.co.ke',
  password:            '$2b$10$mockHashedPasswordValue',
  role:                'employee',
  status:              'active',
  must_change_password: false,
  reset_token:         null,
  reset_token_expire:  null,
  created_at:          new Date().toISOString(),
  updated_at:          new Date().toISOString(),
  ...overrides,
});

/**
 * Build a mock payslip DB row.
 */
const seedTestPayslip = (overrides = {}) => ({
  id:             100,
  employee_id:    1,
  period:         '2026-05',
  gross_pay:      '8000.00',
  overtime_pay:   '750.00',
  kpi_bonus:      '500.00',
  deductions:     '200.00',
  net_pay:        '9050.00',
  status:         'Draft',
  payment_method: 'MPESA',
  created_at:     new Date().toISOString(),
  updated_at:     new Date().toISOString(),
  ...overrides,
});

/**
 * Build a mock leave_request DB row.
 */
const seedTestLeaveRequest = (overrides = {}) => ({
  id:          50,
  employee_id: 1,
  type:        'annual',
  start_date:  '2026-07-07',
  end_date:    '2026-07-11',
  days:        5,
  reason:      'Family vacation',
  status:      'Pending',
  created_at:  new Date().toISOString(),
  updated_at:  new Date().toISOString(),
  ...overrides,
});

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  TEST_SECRET,
  generateTestToken,
  createAdminToken,
  createEmployeeToken,
  createManagerToken,
  mockDbModule,
  seedTestEmployee,
  seedTestUser,
  seedTestPayslip,
  seedTestLeaveRequest,
};
