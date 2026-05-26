const express = require('express');
const router = express.Router();
const AnnouncementController = require('../controllers/announcements.controller');
const { authenticateToken, requireRole, requireDepartmentAccess } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');

// Get public announcements (no authentication required)
router.get('/public', AnnouncementController.getPublic);
router.get('/public/:id', AnnouncementController.getPublicById);

// Get all announcements (public and user's department announcements)
router.get('/', authenticateToken, AnnouncementController.getAll);

// Get single announcement
router.get('/:id', authenticateToken, AnnouncementController.getById);

// Create announcement (authenticated users)
router.post('/',
  authenticateToken,
  validationRules.announcement.create,
  validate,
  AnnouncementController.create
);

// Update announcement (author or admin)
router.put('/:id',
  authenticateToken,
  validationRules.idParam,
  validate,
  validationRules.announcement.update,
  validate,
  AnnouncementController.update
);

// Delete announcement (author or admin)
router.delete('/:id', authenticateToken, AnnouncementController.delete);

module.exports = router;
