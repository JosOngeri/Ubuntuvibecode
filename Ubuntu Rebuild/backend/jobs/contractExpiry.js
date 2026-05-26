const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = async function contractExpiry() {
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);

  await pool.query(
    `UPDATE contracts SET status = 'expired' WHERE end_date < CURRENT_DATE AND status = 'active'`
  );

  const { rows: expiring } = await pool.query(
    `SELECT c.id, c.end_date, e.first_name, e.surname
     FROM contracts c JOIN employees e ON e.id = c.employee_id
     WHERE c.status = 'active' AND c.end_date BETWEEN CURRENT_DATE AND $1`,
    [in30.toISOString().split('T')[0]]
  );
  logger.info('job.contractExpiry', `${expiring.length} contract(s) expiring within 30 days`);
};
