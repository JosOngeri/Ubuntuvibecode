const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ErrorHandler } = require('./utils/errorHandler');
const logger = require('./config/logging');

const app = express();

// Security middleware
app.use(helmet());

// Per-endpoint rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 SMS requests per windowMs
  message: 'Too many SMS requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced CORS configuration for mobile apps and APIs
const isDevelopment = process.env.NODE_ENV === 'development';

const allowedOrigins = [
  'http://localhost:5180',
  'https://kiserian-main-sda-church-website-c7u7oiydk.vercel.app',
  process.env.FRONTEND_ORIGIN,
  process.env.PRODUCTION_FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow any localhost origin
    if (isDevelopment && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }

    // Allow explicitly configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Block unauthorized origins in production
    if (!isDevelopment) {
      logger.warn(`CORS blocked request from: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }

    // In development, allow unknown origins for flexibility
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email || 'anonymous';

  // Log request details
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: userId,
    userEmail: userEmail,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // Log response details
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: userId,
      userEmail: userEmail,
      ip: req.ip
    });
  });

  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes with appropriate rate limiting
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/users', generalLimiter, require('./routes/users.routes'));
app.use('/api/announcements', generalLimiter, require('./routes/announcements.routes'));
app.use('/api/departments', generalLimiter, require('./routes/departments.routes'));
app.use('/api/department', generalLimiter, require('./routes/department.routes'));
app.use('/api/payments', generalLimiter, require('./routes/payments.routes'));
app.use('/api/events', generalLimiter, require('./routes/events.routes'));
app.use('/api/sms', smsLimiter, require('./routes/sms.routes'));
app.use('/api/dashboard', generalLimiter, require('./routes/dashboard.routes'));
app.use('/api/treasury', generalLimiter, require('./routes/treasury.routes'));
app.use('/api/settings', generalLimiter, require('./routes/settings.routes'));
app.use('/api/gallery', generalLimiter, require('./routes/gallery.routes'));

// 404 handler
app.use('*', ErrorHandler.notFound);

// Global error handler
app.use(ErrorHandler.handleError);

module.exports = app;
