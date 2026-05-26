const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error('errorHandler', err.message || 'Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  });

  if (err.code === '23505') {
    return res.status(409).json({ msg: 'Record already exists', detail: err.detail });
  }
  if (err.code === '23503') {
    return res.status(400).json({ msg: 'Referenced record does not exist' });
  }
  if (err.code === '23502') {
    return res.status(400).json({ msg: 'Required field missing' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ msg: 'Validation error', errors: err.details });
  }

  res.status(500).json({
    msg: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
};
