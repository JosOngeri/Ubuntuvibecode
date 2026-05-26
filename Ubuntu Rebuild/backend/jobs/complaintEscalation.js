const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = async function complaintEscalation() {
  const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { rowCount: r1 } = await pool.query(
    `UPDATE complaints SET escalation_level = 1
     WHERE status = 'open' AND created_at < $1 AND escalation_level < 1`,
    [threeDaysAgo.toISOString()]
  );
  const { rowCount: r2 } = await pool.query(
    `UPDATE complaints SET escalation_level = 2
     WHERE status IN ('open','acknowledged','investigating') AND created_at < $1 AND escalation_level < 2`,
    [sevenDaysAgo.toISOString()]
  );
  logger.info('job.complaintEscalation', `Escalated: level-1=${r1}, level-2=${r2}`);
};
