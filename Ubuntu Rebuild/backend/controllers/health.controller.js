const pool = require('../config/db');
const { pingSmtp } = require('../utils/email');
const { getSMSBalance } = require('../utils/sms');
const { jobStatus } = require('../jobs/_jobWrapper');
const logger = require('../utils/logger');

const basic = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error('health.basic', 'Health check failed', err);
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
};

const full = async (req, res) => {
  const checks = {
    database: { status: 'unknown', message: '' },
    jwt: { status: 'unknown', message: '' },
    smtp: { status: 'unknown', message: '' },
    sms: { status: 'unknown', message: '' },
    jobs: { status: 'unknown', message: '' },
  };

  try {
    await pool.query('SELECT 1');
    checks.database = { status: 'ok', message: 'PostgreSQL connected' };
  } catch (err) {
    checks.database = { status: 'error', message: err.message };
  }

  try {
    if (process.env.JWT_SECRET) {
      checks.jwt = { status: 'ok', message: 'JWT secret configured' };
    } else {
      checks.jwt = { status: 'error', message: 'JWT secret missing' };
    }
  } catch (err) {
    checks.jwt = { status: 'error', message: err.message };
  }

  try {
    const smtpResult = await pingSmtp();
    checks.smtp = smtpResult.ok ? { status: 'ok', message: 'SMTP reachable' } : { status: 'error', message: smtpResult.error };
  } catch (err) {
    checks.smtp = { status: 'error', message: err.message };
  }

  try {
    const smsResult = await getSMSBalance();
    checks.sms = smsResult.success ? { status: 'ok', message: 'BlessedText API reachable' } : { status: 'error', message: smsResult.error };
  } catch (err) {
    checks.sms = { status: 'error', message: err.message };
  }

  try {
    const jobNames = Object.keys(jobStatus);
    checks.jobs = { status: 'ok', message: `${jobNames.length} jobs registered`, jobs: jobStatus };
  } catch (err) {
    checks.jobs = { status: 'error', message: err.message };
  }

  const overallStatus = Object.values(checks).every(c => c.status === 'ok') ? 'ok' : 'degraded';
  res.json({ status: overallStatus, timestamp: new Date().toISOString(), checks });
};

module.exports = { basic, full };
