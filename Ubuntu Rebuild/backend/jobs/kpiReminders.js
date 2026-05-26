const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = async function kpiReminders() {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  await pool.query(
    `UPDATE kpi SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status NOT IN ('completed','overdue')`
  );

  const { rows } = await pool.query(
    `SELECT k.id, k.definition_title, k.due_date, e.first_name, e.surname
     FROM kpi k JOIN employees e ON e.id = k.employee_id
     WHERE k.due_date BETWEEN CURRENT_DATE AND $1 AND k.status = 'pending'`,
    [threeDaysFromNow.toISOString().split('T')[0]]
  );
  logger.info('job.kpiReminders', `${rows.length} KPI(s) due within 3 days`);
};
