const express = require('express');
const router = express.Router();
const {
  sendNotification,
  sendBatchNotifications,
  getNotifications,
  markAsRead,
  processQueued,
} = require('../controllers/notification.controller');

// Send notification
router.post('/send', sendNotification);

// Send batch notifications
router.post('/batch', sendBatchNotifications);

// Get user notifications
router.get('/:userId', getNotifications);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Process queued notifications (for batch job)
router.post('/process-queued', processQueued);

module.exports = router;
