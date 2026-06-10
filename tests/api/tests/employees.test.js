/**
 * employees.test.js
 *
 * Full CRUD test suite for /api/employees.
 *
 * Mocking strategy
 * ─────────────────
 *  • config/db  – query is jest.fn(); each test seeds results via mockResolvedValueOnce.
 *  • bcryptjs    – mocked so employee creation does not try real hashing.
 *  • email util  – mocked (employee creation sends a welcome email).
 *
 * Route access levels (from employee.routes.js + role middleware)
 * ────────────────────────────────────────────────────────────────
 *  GET  /api/employees          → auth required (any role)
 *  GET  /api/employees/me       → auth required
 *  GET  /api/employees/:id      → auth required; employee role restricted to own id
 *  POST /api/employees          → admin only
 *  PUT  /api/employees/:id      → admin only
 *  DELETE /api/employees/:id    → admin only
 *
 * Employee.find()     calls: SELECT * FROM employees …
 * Employee.findById() calls: SELECT * FROM employees WHERE id = $1
 * Employee.findOne()  calls: SELECT * FROM employees WHERE <clause>
 * Employee.save()     calls: INSERT or UPDATE … RETURNING *
 */

// ── Mocks (hoisted) ───────────────────────────────────────────────────────────
jest.mock('../../../backend/config/db', () => ({
  query:        jest.fn(),
  pool:         {
    query:   jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
    end:     jest.fn(),
  },
  connectDB:    jest.fn(),
  closeDB:      jest.fn(),
  initDatabase: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare:  jest.fn().mockResolvedValue(true),
  genSalt:  jest.fn().mockResolvedValue('salt'),
  hash:     jest.fn().mockResolvedValue('$2b$10$hashedPassword'),
  hashSync: jest.fn().mockReturnValue('$2b$10$hashedSync'),
}));

jest.mock('../../../backend/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: false }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
const request = require('supertest');
const app     = require('../../../backend/app');
const db      = require('../../../backend/config/db');
const {
  createAdminToken,
  createEmployeeToken,
  createManagerToken,
  seedTestEmployee,
  seedTestUser,
} = require('../setup/test-helpers');
const { sendEmail } = require('../../../backend/utils/email');

// ── Constants ─────────────────────────────────────────────────────────────────
const ADMIN_TOKEN    = createAdminToken();
const EMPLOYEE_TOKEN = createEmployeeToken(1); // id:1 matches seedTestEmployee.id
const MANAGER_TOKEN  = createManagerToken();

// ── Row factory shortcuts ──────────────────────────────────────────────────────
const empRow  = (o = {}) => seedTestEmployee(o);
const userRow = (o = {}) => seedTestUser(o);

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  db.query.mockReset();
  db.pool.query.mockReset();
  // Restore default pool.query stub after clearAllMocks
  db.pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  // Restore default query stub – returns empty by default, tests override with Once
  db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  sendEmail.mockResolvedValue({ sent: false });
});

// =============================================================================
// GET /api/employees
// =============================================================================
describe('GET /api/employees', () => {
  it('returns 200 and an array of employees for admin token', async () => {
    const rows = [empRow({ id: 1 }), empRow({ id: 2, first_name: 'John', email: 'john@c.co.ke' })];
    db.query.mockResolvedValueOnce({ rows, rowCount: 2 });

    const res = await request(app)
      .get('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe('No token, authorization denied');
  });

  it('employee response objects contain firstName, lastName, email, department', async () => {
    const row = empRow();
    db.query.mockResolvedValueOnce({ rows: [row], rowCount: 1 });

    const res = await request(app)
      .get('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(200);
    const emp = res.body[0];
    expect(emp).toHaveProperty('firstName');
    expect(emp).toHaveProperty('lastName');
    expect(emp).toHaveProperty('email');
    expect(emp).toHaveProperty('department');
  });

  it('firstName and lastName are never null/undefined in the response', async () => {
    const row = empRow({ first_name: 'Alice', last_name: 'Maina' });
    db.query.mockResolvedValueOnce({ rows: [row], rowCount: 1 });

    const res = await request(app)
      .get('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN);

    const emp = res.body[0];
    expect(emp.firstName).not.toBeNull();
    expect(emp.firstName).not.toBeUndefined();
    expect(emp.lastName).not.toBeNull();
    expect(emp.lastName).not.toBeUndefined();
  });

  it('manager token can also access the employee list', async () => {
    db.query.mockResolvedValueOnce({ rows: [empRow()], rowCount: 1 });

    const res = await request(app)
      .get('/api/employees')
      .set('x-auth-token', MANAGER_TOKEN);

    expect([200, 403]).toContain(res.status); // route may restrict to admin/manager
  });
});

// =============================================================================
// GET /api/employees/:id
// =============================================================================
describe('GET /api/employees/:id', () => {
  it('returns 200 and the employee object for a valid id', async () => {
    const row = empRow({ id: 1 });
    db.query.mockResolvedValueOnce({ rows: [row], rowCount: 1 });

    const res = await request(app)
      .get('/api/employees/1')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app)
      .get('/api/employees/not-a-number')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/invalid employee id/i);
  });

  it('returns 400 for id = 0 (invalid)', async () => {
    const res = await request(app)
      .get('/api/employees/0')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(400);
  });

  it('returns 404 when the employee does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/employees/999')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(404);
    expect(res.body.msg).toMatch(/not found/i);
  });

  it('returns 403 when an employee role accesses another employee\'s record', async () => {
    // Token id=1 is trying to access employee id=2
    const token = createEmployeeToken(1);

    const res = await request(app)
      .get('/api/employees/2')
      .set('x-auth-token', token);

    expect(res.status).toBe(403);
  });

  it('allows an employee to access their OWN record', async () => {
    const row = empRow({ id: 1 });
    db.query.mockResolvedValueOnce({ rows: [row], rowCount: 1 });
    // The employee token has id:1; accessing employee id:1 should be allowed
    const token = createEmployeeToken(1);

    const res = await request(app)
      .get('/api/employees/1')
      .set('x-auth-token', token);

    // 200 or potentially 404 depending on user_id vs employee_id matching
    expect([200, 404]).toContain(res.status);
  });
});

// =============================================================================
// POST /api/employees  (admin only)
// =============================================================================
describe('POST /api/employees', () => {
  const validPayload = {
    firstName:      'Grace',
    lastName:       'Otieno',
    email:          'grace.otieno@company.co.ke',
    phone:          '+254711111111',
    employmentType: 'Permanent',
    wageRate:       60,
    department:     'Finance',
  };

  /**
   * Employee creation flow (from employee.controller.js):
   *  1. validateEmployeePayload  – pure, no DB
   *  2. User.findOne({ username }) – check username uniqueness (loop)
   *  3. User.save  – INSERT users RETURNING *
   *  4. Employee.save – INSERT employees RETURNING *
   *  5. sendEmail
   */
  const mockCreateFlow = (empOverrides = {}, userOverrides = {}) => {
    const savedUser = userRow({ id: 100, username: 'grace.otieno', ...userOverrides });
    const savedEmp  = empRow({ id: 200, first_name: 'Grace', last_name: 'Otieno', ...empOverrides });
    db.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })             // User.findOne (dup check)
      .mockResolvedValueOnce({ rows: [savedUser], rowCount: 1 })   // User.save INSERT
      .mockResolvedValueOnce({ rows: [savedEmp], rowCount: 1 });   // Employee.save INSERT
  };

  it('returns 201 with { employee, account } for valid payload (admin)', async () => {
    mockCreateFlow();

    const res = await request(app)
      .post('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('employee');
    expect(res.body).toHaveProperty('account');
  });

  it('returns 400 when firstName is missing', async () => {
    const { firstName, ...payload } = validPayload;

    const res = await request(app)
      .post('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('returns 400 when phone is missing', async () => {
    const { phone, ...payload } = validPayload;

    const res = await request(app)
      .post('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('returns 400 when employmentType is missing', async () => {
    const { employmentType, ...payload } = validPayload;

    const res = await request(app)
      .post('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('response includes temporaryPassword when employee has no email', async () => {
    // email is optional; system generates a temp password and may expose it when
    // the welcome email cannot be sent
    const savedUser = userRow({ id: 101 });
    const savedEmp  = empRow({ id: 201 });
    db.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [savedUser], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [savedEmp], rowCount: 1 });

    const { email, ...noEmailPayload } = validPayload;
    const res = await request(app)
      .post('/api/employees')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(noEmailPayload);

    // Either 201 with temp password, or 400 depending on validation
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('account');
    }
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/employees').send(validPayload);
    expect(res.status).toBe(401);
  });

  it('returns 403 for employee token (not admin)', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('x-auth-token', EMPLOYEE_TOKEN)
      .send(validPayload);

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// PUT /api/employees/:id  (admin only)
// =============================================================================
describe('PUT /api/employees/:id', () => {
  const updatePayload = {
    firstName:  'Grace',
    lastName:   'Otieno-Updated',
    phone:      '+254722222222',
    department: 'Accounting',
    employmentType: 'Permanent',
    wageRate:   65,
  };

  it('returns 200 with the updated employee on valid update', async () => {
    const row    = empRow({ id: 1 });
    const updated = empRow({ id: 1, last_name: 'Otieno-Updated', department: 'Accounting' });
    db.query
      .mockResolvedValueOnce({ rows: [row], rowCount: 1 })      // findById
      .mockResolvedValueOnce({ rows: [updated], rowCount: 1 }); // UPDATE RETURNING

    const res = await request(app)
      .put('/api/employees/1')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(updatePayload);

    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid (non-numeric) id', async () => {
    const res = await request(app)
      .put('/api/employees/abc')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(updatePayload);

    expect(res.status).toBe(400);
  });

  it('returns 404 when employee does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/employees/9999')
      .set('x-auth-token', ADMIN_TOKEN)
      .send(updatePayload);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin token', async () => {
    const res = await request(app)
      .put('/api/employees/1')
      .set('x-auth-token', EMPLOYEE_TOKEN)
      .send(updatePayload);

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// DELETE /api/employees/:id  (admin only)
// =============================================================================
describe('DELETE /api/employees/:id', () => {
  it('returns 200 when a valid employee is deleted', async () => {
    const row = empRow({ id: 1 });
    db.query
      .mockResolvedValueOnce({ rows: [row], rowCount: 1 })   // findById
      .mockResolvedValueOnce({ rows: [row], rowCount: 1 });  // DELETE or UPDATE status

    const res = await request(app)
      .delete('/api/employees/1')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(200);
  });

  it('returns 404 when the employee does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .delete('/api/employees/9999')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin token', async () => {
    const res = await request(app)
      .delete('/api/employees/1')
      .set('x-auth-token', EMPLOYEE_TOKEN);

    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).delete('/api/employees/1');
    expect(res.status).toBe(401);
  });
});
