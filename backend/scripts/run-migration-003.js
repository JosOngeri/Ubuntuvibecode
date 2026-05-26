const { pool, query } = require('../config/db');

async function run() {
  try {
    const { rows } = await query(`
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_attendance_employee_date'
    `);
    if (rows.length > 0) {
      console.log('Migration already applied: idx_attendance_employee_date exists');
      process.exit(0);
    }

    await query(`
      CREATE UNIQUE INDEX idx_attendance_employee_date
      ON attendance (employee_id, attendance_date)
    `);
    console.log('Migration applied: created unique index idx_attendance_employee_date');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
