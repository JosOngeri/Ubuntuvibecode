/**
 * Request Validation Middleware
 * Uses express-validator to validate incoming request data
 * Provides consistent error handling for validation failures
 */

const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Returns a standardized error response if validation fails
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors for consistent response
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
    });
  }

  next();
};

/**
 * Middleware to check if required fields are present
 * Simple validation for cases where express-validator is overkill
 * @param {Array<string>} fields - Array of required field names
 */
const requireFields = fields => {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields',
          code: 'MISSING_FIELDS',
          details: { missing },
        },
      });
    }

    next();
  };
};

/**
 * Middleware to validate email format
 * @param {string} field - Field name to validate
 */
const validateEmail = (field = 'email') => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (req, res, next) => {
    const value = req.body[field];

    if (value && !emailRegex.test(value)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid email format',
          code: 'INVALID_EMAIL',
          details: { field },
        },
      });
    }

    next();
  };
};

/**
 * Middleware to validate phone number format
 * @param {string} field - Field name to validate
 */
const validatePhone = (field = 'phone') => {
  const phoneRegex = /^\+?[\d\s-()]+$/;

  return (req, res, next) => {
    const value = req.body[field];

    if (value && !phoneRegex.test(value)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE',
          details: { field },
        },
      });
    }

    next();
  };
};

module.exports = {
  handleValidationErrors,
  requireFields,
  validateEmail,
  validatePhone,
};
