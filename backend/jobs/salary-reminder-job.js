const { sendSalaryReminder } = require('../controllers/notification.controller');

/**
 * Salary Reminder Job
 * This job should be scheduled to run daily (e.g., via cron or node-cron)
 * It checks if today is the salary reminder day and sends notifications to configured roles
 */
const runSalaryReminderJob = async () => {
  try {
    console.log('[Salary Reminder Job] Starting...');
    await sendSalaryReminder();
    console.log('[Salary Reminder Job] Completed');
  } catch (err) {
    console.error('[Salary Reminder Job] Error:', err);
  }
};

// Export for use in scheduler
module.exports = { runSalaryReminderJob };

// If run directly, execute the job
if (require.main === module) {
  runSalaryReminderJob();
}
