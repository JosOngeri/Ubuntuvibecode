const logger = require('../utils/logger');

const roleMiddleware = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'Not authenticated' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    logger.warn('roleMiddleware', 'Access denied', { role: req.user.role, required: allowedRoles, url: req.originalUrl });
    return res.status(403).json({ msg: 'Access denied — insufficient role' });
  }
  next();
};

module.exports = roleMiddleware;
