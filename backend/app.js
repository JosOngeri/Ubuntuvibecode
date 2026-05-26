const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const systemLogger = require('./middleware/systemLogger');

const app = express();


const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5177',
  'https://ubuntu-hrms.vercel.app',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow any localhost development origin
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept', 'X-Requested-With'],
    credentials: true,
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(requestLogger);
app.use(systemLogger());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/users', require('./routes/user.routes'));

// Payroll, KPI, Leave, Contract modules
app.use('/api/payroll', require('./routes/payroll.routes'));
app.use(['/api/kpi', '/api/kpis'], require('./routes/kpi.routes'));
app.use(['/api/leave', '/api/leaves'], require('./routes/leave.routes'));
app.use('/api/contracts', require('./routes/contract.routes'));
app.use('/api/contractors', require('./routes/contractor.routes'));

// Reports and analytics
app.use('/api/reports', require('./routes/report.routes'));

// New modules — Daily Labour, Onboarding, Complaints, Contractor Lifecycle, Assets
app.use('/api/daily-labourers', require('./routes/dailyLabourer.routes'));
app.use('/api/onboarding', require('./routes/onboarding.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/contractor-lifecycle', require('./routes/contractorLifecycle.routes'));
app.use('/api/assets', require('./routes/asset.routes'));

// Settings and configuration
app.use('/api/settings', require('./routes/settings.routes'));

// Notifications
app.use('/api/notifications', require('./routes/notification.routes'));

// Role and permission management
app.use('/api/roles', require('./routes/role.routes'));

// Verification
app.use('/api', require('./routes/verification.routes'));

// Job advertisements
app.use('/api/advertisements', require('./routes/advertisement.routes'));

// Training & Development
app.use('/api/training', require('./routes/training.routes'));

// Document Vault
app.use('/api/documents', require('./routes/document.routes'));

// Orientation Checklists
app.use('/api/orientation-checklists', require('./routes/orientationChecklist.routes'));

// Favicon management
app.use('/api/favicons', require('./routes/favicon.routes'));

// System Logs
app.use('/api/system-logs', require('./routes/systemLog.routes'));

// RBAC - Permissions and role management
app.use('/api/permissions', require('./routes/permissions.routes'));
app.use('/api/supervisor-allocations', require('./routes/supervisor.routes'));
app.use('/api/department-heads', require('./routes/departmentHead.routes'));
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/messages', require('./routes/message.routes'));

app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('app.globalErrorHandler', err.message || 'Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  });
  res.status(500).json({ msg: 'Server error' });
});

module.exports = app;