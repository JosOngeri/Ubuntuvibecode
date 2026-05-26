const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const user = req.user ? `${req.user.role}:${req.user.id}` : 'anon';
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('REQUEST', `${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms) user=${user}`);
  });
  next();
};
