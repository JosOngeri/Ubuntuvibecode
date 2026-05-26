const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public routes
router.post('/register', authController.registerValidation, authController.register);
router.post('/login', authController.loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/request-password-reset', authController.requestPasswordResetValidation, authController.requestPasswordReset);
router.post('/reset-password', authController.resetPasswordValidation, authController.resetPassword);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfileValidation, authController.updateProfile);

// Admin routes
router.get('/users', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder']), authController.getAllUsers);

module.exports = router;
