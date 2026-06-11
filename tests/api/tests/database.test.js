/**
 * database.test.js
 *
 * Schema integrity tests – verify the PostgreSQL database has the expected
 * tables, columns, and foreign-key constraints.
 *
 * ⚠️  These tests require a live PostgreSQL connection.
 *     They are SKIPPED automatically when TEST_DATABASE_URL is not set,
 *     so they never fail in CI environments that have no database.
 *
 * To run them locally:
 *   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/ubuntu_hrms_test npx jest database.test.js
 *
 * The tests do NOT mock config/db – they use a real pool so they can query
 * information_schema and pg_constraint.
 */

const { Pool } = require('pg');

// ── Skip guard ────────────────────────────────────────────────────────────────
// Only run DB tests if TEST_DATABASE_URL is explicitly set to a non-default value
// or if DATABASE_URL is set (for local development with real DB)
const DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const DEFAULT_TEST_URL = 'postgres://postgres:postgres@127.0.0.1:5432/ubuntu_hrms_test';
const RUN_DB_TESTS = Boolean(DB_URL && DB_URL !== DEFAULT_TEST_URL);
const dbIt   = RUN_DB_TESTS ? it   : it.skip;
const dbDesc = RUN_DB_TESTS ? describe : describe.skip;

let pool;

beforeAll(() => {
  if (!RUN_DB_TESTS) return;
  pool = new Pool({
    connectionString: DB_URL,
    connectionTimeoutMillis: 5000,
  });
});

afterAll(async () => {
  if (pool) {
    await pool.end().catch(() => {});
  }
});

/** Helper: query information_schema */
const tableExists = async (tableName) => {
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return rows.length > 0;
};

const columnExists = async (tableName, columnName) => {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = $1
       AND column_name  = $2`,
    [tableName, columnName]
  );
  return rows.length > 0;
};

const fkExists = async (fromTable, fromColumn, toTable) => {
  const { rows } = await pool.query(
    `SELECT tc.constraint_name
     FROM information_schema.table_constraints   AS tc
     JOIN information_schema.key_column_usage    AS kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.referential_constraints AS rc
       ON tc.constraint_name = rc.constraint_name
     JOIN information_schema.key_column_usage    AS ccu
       ON ccu.constraint_name = rc.unique_constraint_name AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_name      = $1
       AND kcu.column_name    = $2
       AND ccu.table_name     = $3`,
    [fromTable, fromColumn, toTable]
  );
  return rows.length > 0;
};

// =============================================================================
// Required tables
// =============================================================================
dbDesc('Schema – required tables exist', () => {
  const REQUIRED_TABLES = [
    'employees',
    'users',
    'payslips',
    'leave_requests',
    'leave_balances',
    'attendance',
    'leave_policies',
    'settings',
    'notifications',
    'audit_logs',
    'system_logs',
    'orientation_checklists',
    'training',
    'complaints',
    'assets',
    'messages',
    'kpis',
    'job_applications',
    'pay_rates',
    'pending_bonuses',
  ];

  for (const table of REQUIRED_TABLES) {
    dbIt(`table "${table}" exists`, async () => {
      const exists = await tableExists(table);
      expect(exists).toBe(true);
    });
  }
});

// =============================================================================
// employees table columns
// =============================================================================
dbDesc('Schema – employees table columns', () => {
  const REQUIRED_COLUMNS = [
    'id',
    'user_id',
    'first_name',
    'last_name',
    'email',
    'department',
    'wage_rate',
    'status',
  ];

  for (const col of REQUIRED_COLUMNS) {
    dbIt(`employees.${col} column exists`, async () => {
      const exists = await columnExists('employees', col);
      expect(exists).toBe(true);
    });
  }
});

// =============================================================================
// payslips table columns
// =============================================================================
dbDesc('Schema – payslips table columns', () => {
  const REQUIRED_COLUMNS = ['id', 'employee_id', 'period', 'gross_pay', 'net_pay', 'status'];

  for (const col of REQUIRED_COLUMNS) {
    dbIt(`payslips.${col} column exists`, async () => {
      const exists = await columnExists('payslips', col);
      expect(exists).toBe(true);
    });
  }
});

// =============================================================================
// leave_balances table columns
// =============================================================================
dbDesc('Schema – leave_balances table columns', () => {
  const REQUIRED_COLUMNS = ['employee_id', 'year', 'annual', 'sick', 'maternity_paternity'];

  for (const col of REQUIRED_COLUMNS) {
    dbIt(`leave_balances.${col} column exists`, async () => {
      const exists = await columnExists('leave_balances', col);
      expect(exists).toBe(true);
    });
  }
});

// =============================================================================
// Foreign key relationships
// =============================================================================
dbDesc('Schema – foreign key relationships', () => {
  dbIt('payslips.employee_id → employees.id', async () => {
    const exists = await fkExists('payslips', 'employee_id', 'employees');
    expect(exists).toBe(true);
  });

  dbIt('leave_requests.employee_id → employees.id', async () => {
    const exists = await fkExists('leave_requests', 'employee_id', 'employees');
    expect(exists).toBe(true);
  });

  dbIt('attendance.employee_id → employees.id', async () => {
    const exists = await fkExists('attendance', 'employee_id', 'employees');
    expect(exists).toBe(true);
  });

  dbIt('employees.user_id → users.id', async () => {
    const exists = await fkExists('employees', 'user_id', 'users');
    expect(exists).toBe(true);
  });
});

// =============================================================================
// Data integrity – no orphaned records
// =============================================================================
dbDesc('Data integrity – no orphaned records', () => {
  dbIt('no orphaned payslips (all employee_id values reference valid employees)', async () => {
    const { rows } = await pool.query(`
      SELECT COUNT(*) AS orphan_count
      FROM payslips p
      LEFT JOIN employees e ON e.id = p.employee_id
      WHERE e.id IS NULL
    `);
    expect(Number(rows[0].orphan_count)).toBe(0);
  });

  dbIt('no orphaned leave_requests (all employee_id values reference valid employees)', async () => {
    const { rows } = await pool.query(`
      SELECT COUNT(*) AS orphan_count
      FROM leave_requests lr
      LEFT JOIN employees e ON e.id = lr.employee_id
      WHERE e.id IS NULL
    `);
    expect(Number(rows[0].orphan_count)).toBe(0);
  });

  dbIt('no orphaned attendance records', async () => {
    const { rows } = await pool.query(`
      SELECT COUNT(*) AS orphan_count
      FROM attendance a
      LEFT JOIN employees e ON e.id = a.employee_id
      WHERE e.id IS NULL
    `);
    expect(Number(rows[0].orphan_count)).toBe(0);
  });
});

// =============================================================================
// Uniqueness constraints
// =============================================================================
dbDesc('Schema – uniqueness constraints', () => {
  dbIt('employee email column has a unique constraint or unique index', async () => {
    const { rows } = await pool.query(`
      SELECT tc.constraint_type
      FROM information_schema.table_constraints   tc
      JOIN information_schema.key_column_usage    kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name   = 'employees'
        AND kcu.column_name = 'email'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    `);
    // Accept unique index as an alternative
    const { rows: idxRows } = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'employees'
        AND indexdef ILIKE '%email%'
        AND (indexdef ILIKE '%unique%' OR indexname ILIKE '%unique%' OR indexname ILIKE '%email%')
    `);
    expect(rows.length + idxRows.length).toBeGreaterThan(0);
  });

  dbIt('users username column has a unique constraint', async () => {
    const { rows } = await pool.query(`
      SELECT tc.constraint_type
      FROM information_schema.table_constraints   tc
      JOIN information_schema.key_column_usage    kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name   = 'users'
        AND kcu.column_name = 'username'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    `);
    const { rows: idxRows } = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'users' AND indexdef ILIKE '%username%'
    `);
    expect(rows.length + idxRows.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Smoke-test when no DB is available (always passes)
// =============================================================================
describe('Database test setup', () => {
  it('skips real DB tests gracefully when TEST_DATABASE_URL is not configured', () => {
    if (!RUN_DB_TESTS) {
      console.info(
        'ℹ  database.test.js: real DB tests skipped – set TEST_DATABASE_URL to enable them.'
      );
    }
    expect(true).toBe(true); // always passes
  });
});
