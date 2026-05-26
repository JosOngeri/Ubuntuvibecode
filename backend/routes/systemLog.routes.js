const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllSystemLogs,
  getSystemLogById,
  getSystemLogStats,
  deleteOldLogs
} = require('../controllers/systemLog.controller');

// All routes require authentication
router.use(auth);

// Get all system logs with optional filters
router.get('/', getAllSystemLogs);

// Get system log statistics
router.get('/stats', getSystemLogStats);

// Get system log by ID
router.get('/:id', getSystemLogById);

// Delete old system logs (maintenance)
router.delete('/cleanup', deleteOldLogs);

module.exports = router;
