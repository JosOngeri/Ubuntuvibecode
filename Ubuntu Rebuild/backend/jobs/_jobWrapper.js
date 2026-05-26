const logger = require('../utils/logger');

const jobStatus = {};

module.exports = function wrapJob(name, fn) {
  let running = false;
  jobStatus[name] = { lastRun: null, lastStatus: 'never_run', lastDuration: null };

  return async () => {
    if (running) {
      logger.warn(`job.${name}`, 'Skipped — previous run still in progress');
      return;
    }
    running = true;
    const start = Date.now();
    logger.info(`job.${name}`, 'Starting');
    try {
      await fn();
      const duration = Date.now() - start;
      jobStatus[name] = { lastRun: new Date().toISOString(), lastStatus: 'success', lastDuration: duration };
      logger.info(`job.${name}`, `Done in ${duration}ms`);
    } catch (err) {
      const duration = Date.now() - start;
      jobStatus[name] = { lastRun: new Date().toISOString(), lastStatus: 'failed', lastDuration: duration, lastError: err.message };
      logger.error(`job.${name}`, 'Job failed — process NOT crashed', err);
    } finally {
      running = false;
    }
  };
};

module.exports.jobStatus = jobStatus;
