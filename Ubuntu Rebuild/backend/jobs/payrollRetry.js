const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = async function payrollRetry() {
  const client = await pool.connect();
  try {
    await client.query('SET statement_timeout = 5000');
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await client.query(
      `UPDATE payroll SET urgency_level = 'urgent'
       WHERE status IN ('draft','failed') AND created_at < $1 AND urgency_level = 'normal'`,
      [thirtyMinAgo.toISOString()]
    );
    await client.query(
      `UPDATE payroll SET urgency_level = 'critical'
       WHERE status IN ('draft','failed') AND created_at < $1 AND urgency_level != 'critical'`,
      [twoHoursAgo.toISOString()]
    );

    const { rows } = await client.query(
      `SELECT COUNT(*) as cnt FROM payroll WHERE urgency_level = 'critical' AND status = 'failed'`
    );
    if (parseInt(rows[0].cnt) > 0) {
      logger.warn('job.payrollRetry', `${rows[0].cnt} critical failed payroll record(s) need attention`);
    }
  } finally {
    client.release();
  }
};
