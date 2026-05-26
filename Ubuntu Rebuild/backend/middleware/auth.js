const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    logger.warn('auth', 'No token provided', { url: req.originalUrl });
    return res.status(401).json({ msg: 'No token, authorisation denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    logger.warn('auth', 'Invalid token', { url: req.originalUrl });
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
