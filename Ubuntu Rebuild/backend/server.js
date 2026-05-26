require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const pool = require('./config/db');
const { startJobs } = require('./jobs');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('./middleware/requestLogger'));
app.use(require('./middleware/activityLogger'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/leaves', require('./routes/leave.routes'));
app.use('/api/payroll', require('./routes/payroll.routes'));
app.use('/api/kpi', require('./routes/kpi.routes'));
app.use('/api/daily-labourers', require('./routes/dailyLabourer.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/onboarding', require('./routes/onboarding.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/contractors', require('./routes/contractor.routes'));
app.use('/api/contracts', require('./routes/contract.routes'));
app.use('/api/assets', require('./routes/asset.routes'));
app.use('/api/training', require('./routes/training.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/orientation', require('./routes/orientation.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/logs', require('./routes/log.routes'));
app.use('/api/health', require('./routes/health.routes'));

app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5005;

const startServer = async () => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('server', 'Database connected successfully');
  } catch (err) {
    logger.error('server', 'Database connection failed', err);
    process.exit(1);
  }

  startJobs();

  app.listen(PORT, () => {
    logger.info('server', `Server running on port ${PORT}`);
  });
};

process.on('unhandledRejection', (err) => {
  logger.error('process', 'Unhandled Rejection', err);
});

process.on('uncaughtException', (err) => {
  logger.error('process', 'Uncaught Exception', err);
  process.exit(1);
});

startServer();
