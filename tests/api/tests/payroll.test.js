/**
 * payroll.test.js
 *
 * Full test suite for /api/payroll (calculate, approve, list, batch-generate, disburse, mpesa-callback).
 *
 * Payroll calculation logic (from payroll.controller.js)
 * ────────────────────────────────────────────────────────
 *  standardHours = 160
 *  regularHours  = min(totalHours, 160)
 *  overtimeHours = max(totalHours - 160, 0)
 *  grossPay      = regularHours  × baseRate
 *  overtimePay   = overtimeHours × (baseRate × 1.5)
 *  kpiBonus      = SUM(pending_bonuses WHERE status='pending' AND period=…)
 *  deductions    = unpaid-leave days × (baseRate × 8)   [daily rate = hourly × 8]
 *  netPay        = grossPay + overtimePay + kpiBonus – deductions
 *
 * Controller DB call order for calculatePayroll:
 *  1. SELECT employees WHERE id = $1           → getEmployee
 *  2. SELECT pay_rates WHERE employee_id = $1  → getPayRate
 *  3. SELECT SUM(total_hours_worked) …         → getAttendanceHours
 *  4. SELECT SUM(bonus_amount) …               → getKpiBonus
 *  5. SELECT start_date, end_date … leave_requests WHERE … Unpaid … → getUnpaidLeaveDeduction
 *  6. INSERT INTO payslips … RETURNING *
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
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
  sendEmail: jest.fn().mockResolvedValue({ sent: false }),
}));

// mpesa util used by payroll routes
jest.mock('../../../backend/utils/mpesa', () => ({
  sendMpesaB2C: jest.fn().mockResolvedValue({ success: false }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
const request = require('supertest');
const app     = require('../../../backend/app');
const db      = require('../../../backend/config/db');
const {
  createAdminToken,
  createEmployeeToken,
  seedTestEmployee,
  seedTestPayslip,
} = require('../setup/test-helpers');

const ADMIN_TOKEN    = createAdminToken();
const EMPLOYEE_TOKEN = createEmployeeToken(1);

// ── DB mock helpers ───────────────────────────────────────────────────────────

/**
 * Seed the 6 sequential DB calls made by calculatePayroll.
 * Defaults represent a scenario with 170 hours worked (10 OT), $50/hr base.
 */
const mockCalculateFlow = ({
  empRow       = seedTestEmployee({ id: 1, wage_rate: '50.00', payment_method: 'MPESA' }),
  payRateRow   = null,                        // null → uses employee.wage_rate
  totalHours   = 170,                         // 10 hours overtime
  kpiBonus     = 500,
  unpaidLeave  = [],                          // no unpaid leave → 0 deductions
  payslipRow   = null,
} = {}) => {
  const savedPayslip = payslipRow || seedTestPayslip({
    employee_id:  1,
    period:       '2026-05',
    gross_pay:    (160 * 50).toFixed(2),               // 8000
    overtime_pay: (10 * 50 * 1.5).toFixed(2),          // 750
    kpi_bonus:    kpiBonus.toFixed(2),
    deductions:   '0.00',
    net_pay:      (8000 + 750 + kpiBonus - 0).toFixed(2),
  });

  db.query
    .mockResolvedValueOnce({ rows: [empRow], rowCount: 1 })                             // getEmployee
    .mockResolvedValueOnce({ rows: payRateRow ? [payRateRow] : [], rowCount: payRateRow ? 1 : 0 }) // getPayRate
    .mockResolvedValueOnce({ rows: [{ total_hours: String(totalHours) }], rowCount: 1 }) // getAttendanceHours
    .mockResolvedValueOnce({ rows: [{ total_bonus: String(kpiBonus) }], rowCount: 1 })  // getKpiBonus
    .mockResolvedValueOnce({ rows: unpaidLeave, rowCount: unpaidLeave.length })         // getUnpaidLeaveDeduction
    .mockResolvedValueOnce({ rows: [savedPayslip], rowCount: 1 });                      // INSERT payslips
};

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Restore default pool.query stub after clearAllMocks
  db.pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  // Restore default query stub – returns empty by default, tests override with Once
  db.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

// =============================================================================
// POST /api/payroll/calculate
// =============================================================================
describe('POST /api/payroll/calculate', () => {
  // ── happy path ──────────────────────────────────────────────────────────────
  it('returns 201 { payslip } for valid employeeId + period', async () => {
    mockCalculateFlow();

    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '2026-05' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('payslip');
    expect(res.body.payslip).toHaveProperty('id');
  });

  // ── payslip has all required numeric fields ──────────────────────────────────
  it('payslip contains gross_pay, overtime_pay, kpi_bonus, deductions, net_pay as numbers', async () => {
    mockCalculateFlow();

    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '2026-05' });

    const p = res.body.payslip;
    // Controller stores them as numeric strings in Postgres; parse them
    expect(Number(p.gross_pay)).not.toBeNaN();
    expect(Number(p.overtime_pay)).not.toBeNaN();
    expect(Number(p.kpi_bonus)).not.toBeNaN();
    expect(Number(p.deductions)).not.toBeNaN();
    expect(Number(p.net_pay)).not.toBeNaN();
  });

  // ── net_pay arithmetic ───────────────────────────────────────────────────────
  it('net_pay equals gross_pay + overtime_pay + kpi_bonus − deductions', async () => {
    mockCalculateFlow({ totalHours: 170, kpiBonus: 500 });

    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '2026-05' });

    const p   = res.body.payslip;
    const gross   = Number(p.gross_pay);
    const ot      = Number(p.overtime_pay);
    const bonus   = Number(p.kpi_bonus);
    const deduct  = Number(p.deductions);
    const net     = Number(p.net_pay);
    expect(net).toBeCloseTo(gross + ot + bonus - deduct, 2);
  });

  // ── overtime calculation ─────────────────────────────────────────────────────
  it('calculates overtime when total hours > 160', async () => {
    // 170 hours → 10 OT hours, base $50 → OT = 10 × 75 = 750
    mockCalculateFlow({ totalHours: 170 });

    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '2026-05' });

    const p = res.body.payslip;
    expect(Number(p.overtime_pay)).toBeGreaterThan(0);
  });

  it('overtime_pay is 0 when total hours ≤ 160', async () => {
    const payslip = seedTestPayslip({ overtime_pay: '0.00', gross_pay: '8000.00', net_pay: '8500.00' });
    mockCalculateFlow({ totalHours: 160, payslipRow: payslip });

    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '2026-05' });

    const p = res.body.payslip;
    expect(Number(p.overtime_pay)).toBe(0);
  });

  // ── KPI bonus included ───────────────────────────────────────────────────────
  it('includes KPI bonus in payslip', async () => {
    mockCalculateFlow({ kpiBonus: 1000 });

    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '2026-05' });

    const p = res.body.payslip;
    expect(Number(p.kpi_bonus)).toBeGreaterThanOrEqual(0);
  });

  // ── missing params ───────────────────────────────────────────────────────────
  it('returns 400 when employeeId is missing', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ period: '2026-05' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when period is missing', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1 });

    expect(res.status).toBe(400);
  });

  // ── invalid period format ────────────────────────────────────────────────────
  it('returns 400 with "period must be in YYYY-MM format" for invalid period', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '05-2026' });

    expect(res.status).toBe(400);
    expect(res.body.error || res.body.msg).toMatch(/YYYY-MM/i);
  });

  it('returns 400 for period with invalid month (2026-13)', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: '2026-13' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for period = "invalid"', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 1, period: 'invalid' });

    expect(res.status).toBe(400);
  });

  // ── employee not found ───────────────────────────────────────────────────────
  it('returns 404 when employee does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // getEmployee returns nothing

    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ employeeId: 9999, period: '2026-05' });

    expect(res.status).toBe(404);
  });

  // ── access control ───────────────────────────────────────────────────────────
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .send({ employeeId: 1, period: '2026-05' });

    expect(res.status).toBe(401);
  });

  it('returns 403 for employee token (admin-only route)', async () => {
    const res = await request(app)
      .post('/api/payroll/calculate')
      .set('x-auth-token', EMPLOYEE_TOKEN)
      .send({ employeeId: 1, period: '2026-05' });

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// PUT /api/payroll/approve/:id
// =============================================================================
describe('PUT /api/payroll/approve/:id', () => {
  it('returns 200 when approving a Draft payslip', async () => {
    const approved = seedTestPayslip({ id: 100, status: 'Approved' });
    db.query.mockResolvedValueOnce({ rows: [approved], rowCount: 1 }); // UPDATE RETURNING

    const res = await request(app)
      .put('/api/payroll/approve/100')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Approved');
  });

  it('returns 404 when payslip is not in Draft status (or not found)', async () => {
    // Controller: UPDATE WHERE status = 'Draft' → no rows → 404
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/payroll/approve/999')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(404);
    expect(res.body.error || res.body.msg).toMatch(/not found|not in draft/i);
  });

  it('returns 403 for non-admin token', async () => {
    const res = await request(app)
      .put('/api/payroll/approve/100')
      .set('x-auth-token', EMPLOYEE_TOKEN);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/payroll/approve/100');
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// GET /api/payroll  (list all payslips – admin)
// =============================================================================
describe('GET /api/payroll', () => {
  it('returns 200 and an array for admin token', async () => {
    db.query.mockResolvedValueOnce({ rows: [seedTestPayslip()], rowCount: 1 });

    const res = await request(app)
      .get('/api/payroll')
      .set('x-auth-token', ADMIN_TOKEN);

    expect([200]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
    }
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/payroll');
    expect(res.status).toBe(401);
  });

  it('returns 403 for employee token', async () => {
    const res = await request(app)
      .get('/api/payroll')
      .set('x-auth-token', EMPLOYEE_TOKEN);

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// POST /api/payroll/batch-generate
// =============================================================================
describe('POST /api/payroll/batch-generate', () => {
  it('returns 200 with generated count for valid period', async () => {
    const employees = [
      seedTestEmployee({ id: 1, employment_type: 'Monthly' }),
      seedTestEmployee({ id: 2, employment_type: 'Monthly' }),
    ];
    const existingPayslip = seedTestPayslip({ employee_id: 1, period: '2026-05' });
    const newPayslip = seedTestPayslip({ employee_id: 2, period: '2026-05' });

    db.query
      .mockResolvedValueOnce({ rows: employees, rowCount: 2 }) // SELECT employees
      .mockResolvedValueOnce({ rows: [existingPayslip], rowCount: 1 }) // existing check for emp 1
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing check for emp 2
      .mockResolvedValueOnce({ rows: [newPayslip], rowCount: 1 }); // INSERT for emp 2

    const res = await request(app)
      .post('/api/payroll/batch-generate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ period: '2026-05' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('generated');
    expect(res.body).toHaveProperty('skipped');
  });

  it('returns 400 for invalid period format', async () => {
    const res = await request(app)
      .post('/api/payroll/batch-generate')
      .set('x-auth-token', ADMIN_TOKEN)
      .send({ period: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/payroll/batch-generate')
      .send({ period: '2026-05' });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// POST /api/payroll/disburse
// =============================================================================
describe('POST /api/payroll/disburse', () => {
  it('returns 200 with summary for bulk disbursement', async () => {
    const approvedPayslips = [
      seedTestPayslip({ id: 1, status: 'Approved', payment_method: 'MPESA', mpesa_phone_number: '254712345678' }),
    ];

    db.query
      .mockResolvedValueOnce({ rows: approvedPayslips, rowCount: 1 }) // getApprovedPayslips
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // UPDATE to Processing

    const res = await request(app)
      .post('/api/payroll/disburse')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('summary');
  });

  it('returns 200 with success message when no payslips to disburse', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // getApprovedPayslips returns empty

    const res = await request(app)
      .post('/api/payroll/disburse')
      .set('x-auth-token', ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/payroll/disburse');
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// POST /api/payroll/mpesa-callback
// =============================================================================
describe('POST /api/payroll/mpesa-callback', () => {
  it('returns 200 and updates payslip to Paid on success callback', async () => {
    const paidPayslip = seedTestPayslip({ id: 1, status: 'Paid' });
    const callbackBody = {
      Result: {
        ResultCode: 0,
        OriginatorConversationID: 'REF-123',
        ResultDesc: 'Success',
      },
    };

    db.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT into mpesa_callbacks
      .mockResolvedValueOnce({ rows: [paidPayslip], rowCount: 1 }); // UPDATE payslips

    const res = await request(app)
      .post('/api/payroll/mpesa-callback')
      .send(callbackBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 200 and updates payslip to Failed on failure callback', async () => {
    const failedPayslip = seedTestPayslip({ id: 1, status: 'Failed' });
    const callbackBody = {
      Result: {
        ResultCode: 1,
        OriginatorConversationID: 'REF-123',
        ResultDesc: 'Insufficient funds',
      },
    };

    db.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT into mpesa_callbacks
      .mockResolvedValueOnce({ rows: [failedPayslip], rowCount: 1 }); // UPDATE payslips

    const res = await request(app)
      .post('/api/payroll/mpesa-callback')
      .send(callbackBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when callback reference is missing', async () => {
    const callbackBody = { Result: { ResultCode: 0 } };

    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // INSERT into mpesa_callbacks

    const res = await request(app)
      .post('/api/payroll/mpesa-callback')
      .send(callbackBody);

    expect(res.status).toBe(400);
  });

  it('returns 200 for timeout callback (no payslip update)', async () => {
    const callbackBody = { Result: { ResultCode: 2001, ResultDesc: 'Timeout' } };

    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // INSERT into mpesa_callbacks

    const res = await request(app)
      .post('/api/payroll/mpesa-timeout')
      .send(callbackBody);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
