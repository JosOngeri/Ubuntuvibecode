/**
 * Standardized API Response Utility
 * Provides consistent response format across all API endpoints
 * This ensures junior developers follow the same pattern
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const success = (res, data, message = 'Success', meta = {}) => {
  res.status(200).json({
    success: true,
    data,
    message,
    meta,
  });
};

/**
 * Send a created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 */
const created = (res, data, message = 'Resource created successfully') => {
  res.status(201).json({
    success: true,
    data,
    message,
  });
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} rows - Data rows
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 */
const paginated = (res, rows, page, limit, total) => {
  const pages = Math.ceil(total / limit);
  res.status(200).json({
    success: true,
    data: rows,
    meta: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {string} code - Error code for client handling
 * @param {Object} details - Additional error details
 */
const error = (res, message, status = 500, code = 'INTERNAL_ERROR', details = null) => {
  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  });
};

/**
 * Send a bad request error (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} details - Validation errors or other details
 */
const badRequest = (res, message = 'Bad request', details = null) => {
  error(res, message, 400, 'BAD_REQUEST', details);
};

/**
 * Send an unauthorized error (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorized = (res, message = 'Unauthorized') => {
  error(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Send a forbidden error (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbidden = (res, message = 'Forbidden') => {
  error(res, message, 403, 'FORBIDDEN');
};

/**
 * Send a not found error (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFound = (res, message = 'Resource not found') => {
  error(res, message, 404, 'NOT_FOUND');
};

/**
 * Send a conflict error (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const conflict = (res, message = 'Resource conflict') => {
  error(res, message, 409, 'CONFLICT');
};

/**
 * Send a validation error (422)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} details - Validation errors
 */
const validationError = (res, message = 'Validation failed', details = null) => {
  error(res, message, 422, 'VALIDATION_ERROR', details);
};

/**
 * Send a server error (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const serverError = (res, message = 'Internal server error') => {
  error(res, message, 500, 'INTERNAL_ERROR');
};

module.exports = {
  success,
  created,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
};
