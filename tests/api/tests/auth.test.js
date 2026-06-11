/**
 * auth.test.js
 *
 * Full test suite for authentication endpoints and the JWT auth middleware.
 *
 * Mocking strategy
 * -----------------
 *  * config/db   -- all SQL calls go to jest.fn(); each test seeds its own response
 *                  using mockResolvedValueOnce so sequential queries are independent.
 *  * bcryptjs     -- NOT mocked at module level. We use real bcrypt with a low cost
 *                   factor (4) for speed, which keeps tests honest.
 *  * email util   -- sendEmail is a no-op mock (avoids SMTP errors).
 *
 * Key controller behaviour (from auth.controller.js)
 * ----------------------------------------------------
 *  Login    -- User.findOne -> bcrypt.compare -> jwt.sign -> { token, mustChangePassword }
 *  Register -- User.findOne (dup check) -> new User -> user.save -> jwt.sign -> { token }
 *  Forgot   -- User.findOne by email -> user.save -> sendEmail (silent failure ok)
 *  Reset    -- User.findOne by resetToken+expiry -> bcrypt.hash -> user.save
 */

// -- jest.mock calls are hoisted – must appear before any require --------------

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

jest.mock('../../../backend/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

// -- Imports -------------------------------------------------------------------
const request  = require('supertest');
const bcrypt   = require('bcryptjs');
const app      = require('../../../backend/app');
const db       = require('../../../backend/config/db');
const { sendEmail } = require('../../../backend/utils/email');
const { createAdminToken, createEmployeeToken, seedTestUser } = require('../setup/test-helpers');

// -- Pre-compute a real bcrypt hash so bcrypt.compare works correctly ----------
// Cost factor 4 = very fast (~5ms) while still being real bcrypt
const TEST_PASSWORD      = 'TestPass123!';
const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 4);

// -- Row helpers ---------------------------------------------------------------

const mockUserRow = (overrides = {}) =>
  seedTestUser({
    id:                  1,
    username:            'testuser',
    email:               'testuser@company.co.ke',
    password:            TEST_PASSWORD_HASH,   // real hash of TEST_PASSWORD
    role:                'employee',
    status:              'active',
    must_change_password: false,
    reset_token:         null,
    reset_token_expire:  null,
    ...overrides,
  });

// -----------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  db.query.mockReset();
  db.pool.query.mockReset();
  // Restore default stubs after resetAllMocks
  db.pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  sendEmail.mockResolvedValue({ sent: false });
});

// =============================================================================
// POST /api/auth/login
// =============================================================================
describe('POST /api/auth/login', () => {
  // -- happy path --------------------------------------------------------------
  it('returns 200 and a JWT token for valid credentials', async () => {
    const user = mockUserRow();
    db.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 }); // User.findOne

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.mustChangePassword).toBe(false);
  });

  // -- wrong password ----------------------------------------------------------
  it('returns 400 { msg: "Invalid credentials" } when password is wrong', async () => {
    const user = mockUserRow();
    db.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrong_password_totally' });

    expect(res.status).toBe(400);
    expect(res.body.msg).toBe('Invalid credentials');
  });

  // -- user not found ----------------------------------------------------------
  it('returns 400 { msg: "Invalid credentials" } when user does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghostuser', password: 'any' });

    expect(res.status).toBe(400);
    expect(res.body.msg).toBe('Invalid credentials');
  });

  // -- inactive / deactivated user ---------------------------------------------
  it('returns 403 with "deactivated" message for inactive accounts', async () => {
    // The controller checks: password match FIRST, then inactive status
    const user = mockUserRow({ status: 'inactive' });
    db.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: TEST_PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.msg).toMatch(/deactivated/i);
  });

  // -- must change password -----------------------------------------------------
  it('returns 200 { mustChangePassword: true, resetToken } for mustChangePassword users', async () => {
    const user = mockUserRow({ must_change_password: true });
    db.query
      .mockResolvedValueOnce({ rows: [user], rowCount: 1 })   // findOne
      .mockResolvedValueOnce({                                  // user.save (UPDATE)
        rows: [{ ...user, reset_token: 'hashed', reset_token_expire: new Date() }],
        rowCount: 1,
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
    expect(res.body).toHaveProperty('resetToken');
    expect(typeof res.body.resetToken).toBe('string');
  });

  // -- missing username ---------------------------------------------------------
  it('returns 400 or 500 when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: TEST_PASSWORD });

    expect([400, 500]).toContain(res.status);
  });

  // -- missing password ---------------------------------------------------------
  it('returns 400 when password is missing (comparison fails)', async () => {
    const user = mockUserRow();
    db.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser' });

    // bcrypt.compare(undefined, hash) -> 400
    expect([400, 500]).toContain(res.status);
  });
});

// =============================================================================
// POST /api/auth/register
// =============================================================================
describe('POST /api/auth/register', () => {
  const validPayload = {
    username: 'newuser',
    password: 'StrongPass1!',
    role:     'employee',
    email:    'newuser@company.co.ke',
  };

  // -- happy path --------------------------------------------------------------
  it('returns 200 and a JWT token for valid registration', async () => {
    const savedUser = mockUserRow({ id: 99, username: 'newuser', email: 'newuser@company.co.ke' });
    db.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                // findOne (no dup)
      .mockResolvedValueOnce({ rows: [savedUser], rowCount: 1 });      // INSERT RETURNING

    const res = await request(app)
      .post('/api/auth/register')
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  // -- duplicate username ------------------------------------------------------
  it('returns 400 { msg: "User already exists" } for duplicate username', async () => {
    const existing = mockUserRow();
    db.query.mockResolvedValueOnce({ rows: [existing], rowCount: 1 }); // dup found

    const res = await request(app)
      .post('/api/auth/register')
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.msg).toBe('User already exists');
  });

  // -- DB unique-constraint violation (race condition path) --------------------
  it('returns 400 { msg: "User already exists" } on DB 23505 unique constraint', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                // findOne ok
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' })); // INSERT fails

    const res = await request(app)
      .post('/api/auth/register')
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.msg).toBe('User already exists');
  });

  // -- missing required fields --------------------------------------------------
  it('returns an error when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'pass', role: 'employee' });

    expect([400, 500]).toContain(res.status);
  });

  it('returns an error when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'u', role: 'employee' });

    expect([400, 500]).toContain(res.status);
  });
});

// =============================================================================
// POST /api/auth/forgot-password
// =============================================================================
describe('POST /api/auth/forgot-password', () => {
  it('returns 200 regardless of whether the email exists (security: no disclosure)', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // email NOT found

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@company.co.ke' });

    expect(res.status).toBe(200);
  });

  it('also returns 200 when the email DOES exist (no disclosure)', async () => {
    const user = mockUserRow({ email: 'testuser@company.co.ke' });
    db.query
      .mockResolvedValueOnce({ rows: [user], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...user, reset_token: 'tok', reset_token_expire: new Date() }], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'testuser@company.co.ke' });

    expect(res.status).toBe(200);
  });
});

// =============================================================================
// POST /api/auth/reset-password
// =============================================================================
describe('POST /api/auth/reset-password', () => {
  // -- valid token --------------------------------------------------------------
  it('returns 200 { msg: "Password reset successful" } for a valid token', async () => {
    const user = mockUserRow({
      reset_token:        'somehashedtoken',
      reset_token_expire: new Date(Date.now() + 3_600_000),
    });
    db.query
      .mockResolvedValueOnce({ rows: [user], rowCount: 1 })           // findOne (token lookup)
      .mockResolvedValueOnce({ rows: [{ ...user, reset_token: null }], rowCount: 1 }); // user.save

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'somehashedtoken', newPassword: 'NewPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/success/i);
  });

  // -- expired / missing token ---------------------------------------------------
  it('returns 400 for an expired or unknown token', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // no matching token

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'badtoken', newPassword: 'NewPass123!' });

    expect(res.status).toBe(400);
  });

  // -- missing fields -----------------------------------------------------------
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ newPassword: 'NewPass123!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when newPassword is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'sometoken' });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// JWT middleware - protected routes
// =============================================================================
describe('JWT auth middleware', () => {
  it('returns 401 when no token is provided on a protected route', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });

  it('returns 403 when a valid token but insufficient role accesses admin route', async () => {
    const employeeToken = createEmployeeToken(1);
    const res = await request(app)
      .get('/api/users')
      .set('x-auth-token', employeeToken);
    expect(res.status).toBe(403);
  });

  it('returns 200 when admin token accesses /api/employees', async () => {
    const adminToken = createAdminToken();
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/employees')
      .set('x-auth-token', adminToken);

    expect(res.status).toBe(200);
  });

  it('returns 401 for a malformed/tampered JWT', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('x-auth-token', 'bad.token.here');

    expect(res.status).toBe(401);
  });
});
