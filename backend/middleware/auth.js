const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    logger.warn('auth', 'No token provided', { url: req.originalUrl, method: req.method });
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('auth', `Token invalid: ${err.message}`, { url: req.originalUrl, method: req.method, errName: err.name });
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;