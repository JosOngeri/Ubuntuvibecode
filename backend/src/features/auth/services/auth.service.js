/**
 * Auth Service
 * Business logic layer for authentication operations
 * Handles validation, password hashing, token generation, email sending
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../../../utils/email');
const logger = require('../../../utils/logger');
const authRepository = require('../repositories/auth.repository');

const buildResetLink = resetToken =>
  `${process.env.FRONTEND_URL || 'http://localhost:5177'}/reset-password?token=${resetToken}`;

/**
 * Sign JWT auth token
 * @param {Object} user
 * @returns {Promise<string>}
 */
const signAuthToken = user => {
  return new Promise((resolve, reject) => {
    const payload = {
      id: user.id,
      role: user.role,
      status: user.status,
      username: user.username,
      email: user.email,
      name: user.name || user.username,
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(token);
    });
  });
};

/**
 * Hash password
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async password => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate reset token
 * @returns {Object} { token, hash }
 */
const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour
  return { token, hash, expiry };
};

/**
 * Register new user
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
const register = async userData => {
  const { username, password, role, email } = userData;
  logger.info('auth.service.register', 'Attempt', { username, role, email });

  // Check if user exists
  const existingUser = await authRepository.findByUsername(username);
  if (existingUser) {
    logger.warn('auth.service.register', 'Username already exists', { username });
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await authRepository.create({
    username,
    password: hashedPassword,
    role,
    email,
  });

  // Send welcome email
  let emailResult = { sent: false };
  if (email) {
    emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to Ubuntu HRMS',
      text: `Hello ${username},\n\nWelcome to Ubuntu HRMS! Your account has been successfully created.\n\nUsername: ${username}\nRole: ${role}\n\nPlease log in to get started.`,
      html: `<p>Hello ${username},</p><p>Welcome to Ubuntu HRMS! Your account has been successfully created.</p><p><strong>Username:</strong> ${username}</p><p><strong>Role:</strong> ${role}</p><p>Please log in to get started.</p>`,
    });
  }

  const token = await signAuthToken(user);
  logger.info('auth.service.register', 'Success', { username, role, userId: user.id });

  return { token, emailNotification: emailResult.sent ? 'sent' : 'not-sent' };
};

/**
 * Login user
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>}
 */
const login = async (username, password) => {
  logger.info('auth.service.login', 'Attempt', { username });

  const user = await authRepository.findByUsername(username);
  if (!user) {
    logger.warn('auth.service.login', 'User not found', { username });
    throw new Error('Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    logger.warn('auth.service.login', 'Wrong password', { username });
    throw new Error('Invalid credentials');
  }

  // Check if user is inactive
  if (user.status === 'inactive') {
    logger.warn('auth.service.login', 'Account inactive', { username, userId: user.id });
    throw new Error('Account has been deactivated. Please contact administrator.');
  }

  // Handle password change requirement
  if (user.mustChangePassword) {
    const { token, hash, expiry } = generateResetToken();
    await authRepository.setResetToken(user.id, hash, expiry);

    logger.info('auth.service.login', 'Password change required', { username, userId: user.id });
    return {
      mustChangePassword: true,
      resetToken: token,
      msg: 'Password change required before first login',
    };
  }

  const token = await signAuthToken(user);
  logger.info('auth.service.login', 'Success', { username, userId: user.id, role: user.role });

  return { token, mustChangePassword: false };
};

/**
 * Forgot password - generate reset token
 * @param {string} email
 * @returns {Promise<Object>}
 */
const forgotPassword = async email => {
  logger.info('auth.service.forgotPassword', 'Attempt', { email });

  const user = await authRepository.findByEmail(email);

  // For security, don't reveal if email exists
  if (!user) {
    logger.info('auth.service.forgotPassword', 'Email not found (security)', { email });
    return { msg: 'If an account with that email exists, a password reset link will be sent' };
  }

  const { token, hash, expiry } = generateResetToken();
  await authRepository.setResetToken(user.id, hash, expiry);

  const resetLink = buildResetLink(token);

  await sendEmail({
    to: user.email,
    subject: 'Ubuntu HRMS Password Reset',
    text: `Hello ${user.username},\n\nUse this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
    html: `<p>Hello ${user.username},</p><p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour.</p>`,
  });

  logger.info('auth.service.forgotPassword', 'Reset link sent', { email, userId: user.id });
  return { msg: 'If an account with that email exists, a password reset link will be sent' };
};

/**
 * Reset password with token
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<Object>}
 */
const resetPassword = async (token, newPassword) => {
  logger.info('auth.service.resetPassword', 'Attempt');

  if (!token || !newPassword) {
    throw new Error('Token and password are required');
  }

  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await authRepository.findByResetToken(hash);

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await hashPassword(newPassword);
  await authRepository.updatePassword(user.id, hashedPassword);
  await authRepository.clearResetToken(user.id);
  await authRepository.update(user.id, { mustChangePassword: false });

  logger.info('auth.service.resetPassword', 'Success', { userId: user.id });
  return { msg: 'Password reset successful' };
};

/**
 * Admin reset user password
 * @param {number} userId
 * @param {string} newPassword
 * @param {Object} adminUser
 * @returns {Promise<Object>}
 */
const adminResetPassword = async (userId, newPassword, adminUser) => {
  logger.info('auth.service.adminResetPassword', 'Attempt', {
    targetUserId: userId,
    by: adminUser?.id,
  });

  if (!userId || !newPassword) {
    throw new Error('User ID and new password are required');
  }

  const user = await authRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const hashedPassword = await hashPassword(newPassword);
  await authRepository.updatePassword(userId, hashedPassword);
  await authRepository.update(userId, { mustChangePassword: true });

  // Send email notification
  if (user.email) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5177';
    await sendEmail({
      to: user.email,
      subject: 'Ubuntu HRMS - Password Reset by Admin',
      text: `Hello ${user.username},\n\nYour password has been reset by an administrator.\n\nPlease log in at ${frontendUrl} and change your password immediately.\n\nBest regards,\nUbuntu HRMS Team`,
      html: `<p>Hello ${user.username},</p><p>Your password has been reset by an administrator.</p><p>Please log in at <a href="${frontendUrl}">${frontendUrl}</a> and change your password immediately.</p><p>Best regards,<br>Ubuntu HRMS Team</p>`,
    });
  }

  logger.info('auth.service.adminResetPassword', 'Success', {
    targetUserId: userId,
    by: adminUser?.id,
  });
  return { msg: 'Password reset successfully' };
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  adminResetPassword,
};
