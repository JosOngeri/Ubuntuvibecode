const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const login = async (req, res) => {
  logger.info('auth.login', 'Entry', { username: req.body.username });
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: 'Username and password are required' });
  }
  try {
    const user = await User.findByUsername(username.trim());
    if (!user) {
      logger.warn('auth.login', 'User not found', { username });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (user.status === 'inactive') {
      return res.status(403).json({ msg: 'Account is inactive. Contact admin.' });
    }
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      logger.warn('auth.login', 'Wrong password', { username });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const payload = { user: { id: user.id, role: user.role, username: user.username } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
    logger.info('auth.login', 'Login success', { userId: user.id, role: user.role });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword },
    });
  } catch (err) {
    logger.error('auth.login', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const register = async (req, res) => {
  logger.info('auth.register', 'Entry', { username: req.body.username });
  const { username, email, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: 'Username and password are required' });
  }
  try {
    const existing = await User.findByUsername(username.trim());
    if (existing) return res.status(409).json({ msg: 'Username already taken' });
    const user = await User.create({ username: username.trim(), email, password, role: role || 'employee' });
    const payload = { user: { id: user.id, role: user.role, username: user.username } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.status(201).json({ token, user });
  } catch (err) {
    logger.error('auth.register', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('auth.getMe', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email is required' });
  try {
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) return res.json({ msg: 'If that email exists, a reset link has been sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    const expire = new Date(Date.now() + 3600000);
    await User.update(user.id, { reset_token: token, reset_token_expire: expire });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Ubuntu HRMS — Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
    res.json({ msg: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    logger.error('auth.forgotPassword', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ msg: 'Token and password are required' });
  try {
    const { rows } = await require('../config/db').query(
      `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expire > NOW()`, [token]
    );
    if (!rows[0]) return res.status(400).json({ msg: 'Invalid or expired reset token' });
    await User.updatePassword(rows[0].id, password);
    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    logger.error('auth.resetPassword', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ msg: 'Both passwords are required' });
  try {
    const { rows } = await require('../config/db').query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ msg: 'User not found' });
    const isMatch = await User.comparePassword(currentPassword, rows[0].password);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
    await User.updatePassword(req.user.id, newPassword);
    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    logger.error('auth.changePassword', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { login, register, getMe, forgotPassword, resetPassword, changePassword };
