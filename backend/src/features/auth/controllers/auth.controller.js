/**
 * Auth Controller
 * Request handling layer for authentication endpoints
 * Uses auth service for business logic
 */

const logger = require('../../../utils/logger');
const {
  success,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} = require('../../../shared/utils/response');
const authService = require('../services/auth.service');

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { username, password, role, email } = req.body;

    const result = await authService.register({ username, password, role, email });
    success(res, result, 'User registered successfully');
  } catch (err) {
    if (err.message === 'User already exists') {
      return badRequest(res, err.message);
    }
    logger.error('auth.controller.register', 'Unhandled error', err);
    serverError(res, 'Registration failed');
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await authService.login(username, password);
    success(res, result, 'Login successful');
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return unauthorized(res, err.message);
    }
    if (err.message.includes('deactivated')) {
      return forbidden(res, err.message);
    }
    logger.error('auth.controller.login', 'Unhandled error', err);
    serverError(res, 'Login failed');
  }
};

/**
 * Forgot password - generate reset token
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);
    success(res, result, 'If an account exists, reset link sent');
  } catch (err) {
    logger.error('auth.controller.forgotPassword', 'Unhandled error', err);
    serverError(res, 'Password reset request failed');
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword);
    success(res, result, 'Password reset successful');
  } catch (err) {
    if (err.message.includes('Token') || err.message.includes('password')) {
      return badRequest(res, err.message);
    }
    logger.error('auth.controller.resetPassword', 'Unhandled error', err);
    serverError(res, 'Password reset failed');
  }
};

/**
 * Admin reset user password
 */
const adminResetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const result = await authService.adminResetPassword(userId, newPassword, req.user);
    success(res, result, 'Password reset successfully');
  } catch (err) {
    if (err.message === 'User not found') {
      return notFound(res, err.message);
    }
    if (err.message.includes('required')) {
      return badRequest(res, err.message);
    }
    logger.error('auth.controller.adminResetPassword', 'Unhandled error', err);
    serverError(res, 'Password reset failed');
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  adminResetPassword,
};
