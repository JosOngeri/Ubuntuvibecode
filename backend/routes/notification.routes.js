const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendNotification,
  sendBatchNotifications,
  getNotifications,
  markAsRead,
  processQueued,
  getOwnerNotifications,
  markOwnerNotificationAsRead,
  markAllOwnerNotificationsAsRead,
  getSalaryReminderSettings,
  updateSalaryReminderSettings,
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

// Owner notifications
router.get('/owner/list', auth, getOwnerNotifications);
router.put('/owner/:id/read', auth, markOwnerNotificationAsRead);
router.put('/owner/read-all', auth, markAllOwnerNotificationsAsRead);

// Salary reminder settings
router.get('/salary-reminder/settings', auth, getSalaryReminderSettings);
router.put('/salary-reminder/settings', auth, updateSalaryReminderSettings);

module.exports = router;
