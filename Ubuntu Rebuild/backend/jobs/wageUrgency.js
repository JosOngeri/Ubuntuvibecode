const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = async function wageUrgency() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query('SET statement_timeout = 5000');
    await client.query(
      `UPDATE daily_attendance SET is_urgent = TRUE
       WHERE is_paid = FALSE AND check_out IS NOT NULL AND created_at < $1`,
      [thirtyMinAgo.toISOString()]
    );
    const { rows } = await client.query(
      `SELECT COUNT(*) as cnt FROM daily_attendance WHERE is_urgent = TRUE AND is_paid = FALSE`
    );
    if (parseInt(rows[0].cnt) > 0) {
      logger.warn('job.wageUrgency', `${rows[0].cnt} unpaid daily wages marked urgent`);
    }
  } finally {
    client.release();
  }
};
