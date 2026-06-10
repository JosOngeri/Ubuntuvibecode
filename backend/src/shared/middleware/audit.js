/**
 * Audit Logging Middleware
 * Logs important system actions for security and compliance
 */

const logger = require('../../utils/logger');

/**
 * Audit log middleware
 * Logs user actions with context
 */
const auditLog = action => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log the action after response is sent
      setImmediate(() => {
        const auditData = {
          action,
          userId: req.user?.id || null,
          userEmail: req.user?.email || null,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode,
        };

        logger.info('audit.log', action, auditData);
      });

      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Sensitive action audit log
 * For actions that require higher security logging
 */
const sensitiveActionLog = action => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      setImmediate(() => {
        const auditData = {
          action,
          userId: req.user?.id || null,
          userEmail: req.user?.email || null,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode,
          sensitive: true,
        };

        logger.warn('audit.sensitive', action, auditData);
      });

      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Error audit log
 * Logs errors for debugging and security monitoring
 */
const errorAuditLog = (err, req, res, next) => {
  const auditData = {
    action: 'ERROR',
    userId: req.user?.id || null,
    userEmail: req.user?.email || null,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
  };

  logger.error('audit.error', err.message, auditData);
  next(err);
};

module.exports = {
  auditLog,
  sensitiveActionLog,
  errorAuditLog,
};
