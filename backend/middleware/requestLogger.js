const logger = require('../utils/logger');

const REDACTED_FIELDS = new Set(['password', 'newPassword', 'confirmPassword', 'token', 'resetToken']);

const redactBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  const safe = { ...body };
  for (const key of Object.keys(safe)) {
    if (REDACTED_FIELDS.has(key)) safe[key] = '[REDACTED]';
  }
  return safe;
};

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const user = req.user ? `${req.user.role}:${req.user.id}` : 'anon';
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    const msg = `${req.method} ${req.originalUrl} ${res.statusCode} (${ms}ms) user=${user}`;

    const ctx = {};
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      ctx.body = redactBody(req.body);
    }
    if (req.params && Object.keys(req.params).length > 0) ctx.params = req.params;

    logger[level]('REQUEST', msg, ctx);
  });

  next();
};

module.exports = requestLogger;
