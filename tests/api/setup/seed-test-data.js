/**
 * Seed Test Data for CI/CD Pipeline
 *
 * Creates test users and employees needed for E2E and API tests.
 * Safe to run multiple times (uses ON CONFLICT DO NOTHING).
 *
 * Run with: node tests/api/setup/seed-test-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../backend/.env') });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/ubuntu_hrms_test';

const pool = new Pool({ connectionString });

async function query(text, params) {
  return pool.query(text, params);
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function seedTestUsers() {
  console.log('Seeding test users...');

  const users = [
    { username: 'testadmin',    password: 'testpass123', role: 'admin',    email: 'testadmin@ubuntu-hrms.test',    status: 'active' },
    { username: 'testowner',    password: 'testpass123', role: 'owner',    email: 'testowner@ubuntu-hrms.test',    status: 'active' },
    { username: 'testmanager',  password: 'testpass123', role: 'manager',  email: 'testmanager@ubuntu-hrms.test',  status: 'active' },
    { username: 'testemployee', password: 'testpass123', role: 'employee', email: 'testemployee@ubuntu-hrms.test', status: 'active' },
    { username: 'testhr',       password: 'testpass123', role: 'hr',       email: 'testhr@ubuntu-hrms.test',       status: 'active' },
    { username: 'inactiveuser', password: 'testpass123', role: 'employee', email: 'inactive@ubuntu-hrms.test',     status: 'inactive' },
  ];

  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);
    await query(
      `INSERT INTO users (username, password, role, email, status, must_change_password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         email = EXCLUDED.email,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [user.username, hashedPassword, user.role, user.email, user.status]
    );
    console.log(`  ✓ User: ${user.username} (${user.role})`);
  }
}

async function seedTestEmployees() {
  console.log('Seeding test employees...');

  // Get user IDs
  const { rows: users } = await query(
    `SELECT id, username, email FROM users WHERE username IN ('testemployee', 'testmanager')`
  );

  const userMap = {};
  users.forEach((u) => { userMap[u.username] = u; });

  const employees = [
    {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'testemployee@ubuntu-hrms.test',
      phone: '+254700000001',
      department: 'Engineering',
      employmentType: 'Permanent',
      wageRate: 500,
      status: 'active',
      userId: userMap['testemployee']?.id || null,
    },
    {
      firstName: 'Test',
      lastName: 'Manager',
      email: 'testmanager@ubuntu-hrms.test',
      phone: '+254700000002',
      department: 'Management',
      employmentType: 'Permanent',
      wageRate: 800,
      status: 'active',
      userId: userMap['testmanager']?.id || null,
    },
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@ubuntu-hrms.test',
      phone: '+254700000003',
      department: 'Finance',
      employmentType: 'Permanent',
      wageRate: 600,
      status: 'active',
      userId: null,
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@ubuntu-hrms.test',
      phone: '+254700000004',
      department: 'HR',
      employmentType: 'Contract',
      wageRate: 450,
      status: 'active',
      userId: null,
    },
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@ubuntu-hrms.test',
      phone: '+254700000005',
      department: 'Engineering',
      employmentType: 'Permanent',
      wageRate: 550,
      status: 'active',
      userId: null,
    },
  ];

  for (const emp of employees) {
    const { rows } = await query(
      `INSERT INTO employees (
        user_id, status, first_name, last_name, email, phone,
        employment_type, wage_rate, department,
        date_joined, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        department = EXCLUDED.department,
        wage_rate = EXCLUDED.wage_rate,
        updated_at = NOW()
      RETURNING id`,
      [emp.userId, emp.status, emp.firstName, emp.lastName, emp.email, emp.phone,
       emp.employmentType, emp.wageRate, emp.department]
    );
    console.log(`  ✓ Employee: ${emp.firstName} ${emp.lastName} (${emp.department})`);

    // Create leave balance for each employee
    if (rows[0]) {
      const employeeId = rows[0].id;
      const year = new Date().getFullYear();
      await query(
        `INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity, created_at, updated_at)
         VALUES ($1, $2, 30, 15, 30, NOW(), NOW())
         ON CONFLICT (employee_id, year) DO NOTHING`,
        [employeeId, year]
      ).catch(() => {}); // Ignore if table doesn't exist
    }
  }
}

async function seedLeaveTypes() {
  console.log('Seeding leave policies...');

  const policies = [
    { type: 'annual', config: { day_count_mode: 'working_days', yearly_allocation_days: 30, carry_forward_limit: 5 } },
    { type: 'sick', config: { day_count_mode: 'calendar_days', requires_balance: true } },
    { type: 'maternity', config: { day_count_mode: 'calendar_days', statutory: true } },
    { type: 'paternity', config: { day_count_mode: 'calendar_days', statutory: true } },
    { type: 'compassionate', config: { day_count_mode: 'calendar_days' } },
    { type: 'unpaid', config: { day_count_mode: 'calendar_days' } },
  ];

  for (const p of policies) {
    await query(
      `INSERT INTO leave_policies (type, rule_config, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (type) DO NOTHING`,
      [p.type, JSON.stringify(p.config)]
    ).catch(() => {}); // Ignore if table doesn't exist
    console.log(`  ✓ Leave policy: ${p.type}`);
  }
}

async function seedSettings() {
  console.log('Seeding settings...');

  const settings = [
    { key: 'ATTENDANCE_LOCATION_1_LATITUDE', value: '-1.19293' },
    { key: 'ATTENDANCE_LOCATION_1_LONGITUDE', value: '36.93057' },
    { key: 'ATTENDANCE_LOCATION_1_NAME', value: 'Main Office' },
    { key: 'ATTENDANCE_LOCATION_1_RADIUS_METERS', value: '1000' },
  ];

  for (const s of settings) {
    await query(
      `INSERT INTO settings (setting_key, setting_value, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (setting_key) DO NOTHING`,
      [s.key, s.value]
    ).catch(() => {}); // Ignore if table doesn't exist
    console.log(`  ✓ Setting: ${s.key}`);
  }
}

async function main() {
  console.log('━'.repeat(50));
  console.log(' Ubuntu HRMS - Seeding Test Data');
  console.log('━'.repeat(50));
  console.log(`Database: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);
  console.log('');

  try {
    await seedTestUsers();
    console.log('');
    await seedTestEmployees();
    console.log('');
    await seedLeaveTypes();
    console.log('');
    await seedSettings();

    console.log('');
    console.log('━'.repeat(50));
    console.log(' Test data seeded successfully!');
    console.log('━'.repeat(50));
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
