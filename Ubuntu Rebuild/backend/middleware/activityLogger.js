const pool = require('../config/db');
const logger = require('../utils/logger');

const TRACKED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

module.exports = (req, res, next) => {
  if (!TRACKED_METHODS.includes(req.method)) return next();
  if (!req.user) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode < 400) {
      const action = req.method;
      const entity = req.originalUrl.split('/')[2] || 'unknown';
      const entityId = req.params?.id || req.params?.userId || req.params?.employeeId || null;
      pool.query(
        `INSERT INTO user_activity_logs (user_id, username, role, action, entity, entity_id, ip, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          req.user.id,
          req.user.username || req.user.email || '',
          req.user.role,
          action,
          entity,
          entityId,
          req.ip,
          req.get('user-agent') || '',
        ]
      ).catch((err) => logger.error('activityLogger', 'Failed to log activity', err));
    }
    return originalJson(body);
  };
  next();
};
