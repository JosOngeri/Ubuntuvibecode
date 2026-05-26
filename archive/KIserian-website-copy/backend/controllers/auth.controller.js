const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { pool } = require('../config/database');

const { generateToken, generateTokenPair, verifyToken, refreshAccessToken, extractToken, isTokenExpired } = require('../utils/jwt');
const emailService = require('../utils/emailService');

// Store password reset tokens (in production, use Redis or database)
const passwordResetTokens = new Map();

// Register new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { username, email, password, first_name, last_name, phone_number, role = 'Member' } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      phone_number
    });

    // Assign default role
    const roleQuery = 'SELECT id FROM roles WHERE name = $1';
    const roleResult = await pool.query(roleQuery, [role]);
    
    if (roleResult.rows.length > 0) {
      await User.assignRole(newUser.id, roleResult.rows[0].id);
    }

    // Generate token pair
    const tokens = generateTokenPair({ userId: newUser.id });

    // Get user with roles
    const userWithRoles = await User.findById(newUser.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userWithRoles.id,
        username: userWithRoles.username,
        email: userWithRoles.email,
        first_name: userWithRoles.first_name,
        last_name: userWithRoles.last_name,
        phone_number: userWithRoles.phone_number,
        roles: userWithRoles.roles
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    if (!loginIdentifier) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    // Find user by email or username
    let user;
    if (email && email.includes('@')) {
      user = await User.findByEmail(email);
    } else {
      user = await User.findByUsername(username);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token pair
    const tokens = generateTokenPair({ userId: user.id });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { first_name, last_name, phone_number } = req.body;

    const updatedUser = await User.updateProfile(req.user.id, {
      first_name,
      last_name,
      phone_number
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const users = await User.getAll(limit, offset);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store token with expiration (1 hour)
    passwordResetTokens.set(hashedToken, {
      userId: user.id,
      expiresAt: Date.now() + 3600000 // 1 hour
    });

    // Send password reset email
    try {
      await emailService.sendPasswordReset(email, resetToken, user.first_name);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue anyway - token is stored
    }

    res.json({ 
      message: 'If an account with this email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { token, newPassword } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists and is not expired
    const resetData = passwordResetTokens.get(hashedToken);
    if (!resetData || resetData.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update user password
    await User.updatePassword(resetData.userId, newPassword);

    // Remove used token
    passwordResetTokens.delete(hashedToken);

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const newAccessToken = refreshAccessToken(refreshToken);

    res.json({
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile,
  getAllUsers,
  // Validation middleware
  registerValidation: [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('phone_number').optional().isMobilePhone().withMessage('Valid phone number required')
  ],
  loginValidation: [
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  requestPasswordResetValidation: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  resetPasswordValidation: [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  updateProfileValidation: [
    body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone_number').optional().isMobilePhone().withMessage('Valid phone number required')
  ]
};
