const pool = require('../config/db');
const logger = require('../utils/logger');
const { sendSMS } = require('../utils/sms');

module.exports = async function leaveEscalation() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { rows: urgent } = await pool.query(
    `SELECT l.id, l.employee_id, l.start_date, l.leave_type,
            e.first_name, e.surname,
            u.phone as manager_phone
     FROM leaves l
     JOIN employees e ON e.id = l.employee_id
     LEFT JOIN users u ON u.role IN ('admin','manager') AND u.status = 'active'
     WHERE l.status = 'pending' AND l.start_date::date = $1
     LIMIT 20`,
    [tomorrowStr]
  );

  for (const row of urgent) {
    await pool.query(`UPDATE leaves SET escalated = TRUE, escalation_level = 1 WHERE id = $1`, [row.id]);
    if (row.manager_phone) {
      await sendSMS(row.manager_phone, `URGENT: ${row.first_name} ${row.surname} leave starts tomorrow. Please approve/reject.`);
    }
    logger.info('job.leaveEscalation', `Escalated leave ${row.id} for ${row.first_name} ${row.surname}`);
  }

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  await pool.query(
    `UPDATE leaves SET escalation_level = 2 WHERE status = 'pending' AND created_at < $1 AND escalation_level < 2`,
    [threeDaysAgo.toISOString()]
  );

  logger.info('job.leaveEscalation', `Processed ${urgent.length} urgent leave(s)`);
};
