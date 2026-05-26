const cron = require('node-cron');
const wrapJob = require('./_jobWrapper');
const logger = require('../utils/logger');

const JOBS = [
  { name: 'leaveEscalation',    schedule: '0 9 * * *',    fn: require('./leaveEscalation') },
  { name: 'kpiReminders',       schedule: '0 8 * * *',    fn: require('./kpiReminders') },
  { name: 'contractExpiry',     schedule: '0 7 * * *',    fn: require('./contractExpiry') },
  { name: 'wageUrgency',        schedule: '*/30 * * * *', fn: require('./wageUrgency') },
  { name: 'complaintEscalation',schedule: '0 10 * * *',   fn: require('./complaintEscalation') },
  { name: 'payrollRetry',       schedule: '*/5 * * * *',  fn: require('./payrollRetry') },
];

function startJobs() {
  JOBS.forEach(({ name, schedule, fn }) => {
    try {
      cron.schedule(schedule, wrapJob(name, fn));
      logger.info('jobs', `Registered: ${name} [${schedule}]`);
    } catch (err) {
      logger.error('jobs', `Failed to register ${name}`, err);
    }
  });
  logger.info('jobs', `${JOBS.length} scheduled jobs registered`);
}

module.exports = { startJobs, jobStatus: wrapJob.jobStatus };
