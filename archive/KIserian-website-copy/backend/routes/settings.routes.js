const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Validation rules
const settingValidation = [
  body('key').trim().notEmpty().withMessage('Key is required'),
  body('value').notEmpty().withMessage('Value is required'),
  body('value_type').isIn(['string', 'number', 'boolean', 'json', 'color']).withMessage('Invalid value type'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('label').trim().notEmpty().withMessage('Label is required')
];

// Public routes
router.get('/public', settingsController.getPublicSettings);

// Admin routes (require authentication and admin role)
router.get('/', authenticateToken, requireRole(['Super Admin', 'admin', 'Pastor', 'First Elder']), settingsController.getAllSettings);
router.get('/:key', authenticateToken, requireRole(['Super Admin', 'admin', 'Pastor', 'First Elder']), settingsController.getSettingByKey);
router.post('/', authenticateToken, requireRole(['Super Admin', 'admin']), settingValidation, settingsController.createSetting);
router.put('/:key', authenticateToken, requireRole(['Super Admin', 'admin', 'Pastor', 'First Elder']), settingsController.updateSetting);
router.put('/bulk', authenticateToken, requireRole(['Super Admin', 'admin', 'Pastor', 'First Elder']), settingsController.updateMultipleSettings);
router.delete('/:key', authenticateToken, requireRole(['Super Admin', 'admin']), settingsController.deleteSetting);

module.exports = router;
