const { sendMultiChannelNotification, sendUrgentNotification, queueNotification, getUserNotifications, markNotificationAsRead, processQueuedNotifications, NOTIFICATION_TYPES, PRIORITIES } = require('../utils/notification');
const { normalizeId } = require('../utils/postgres');

/**
 * Send notification
 */
const sendNotification = async (req, res) => {
  try {
    const { userId, type, title, message, subject, actionLink, html, channels, priority } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'userId, type, title, and message are required' });
    }

    const isUrgent = priority === PRIORITIES.URGENT;
    const result = isUrgent 
      ? await sendUrgentNotification({ userId, type, title, message, subject, actionLink, html, channels })
      : await sendMultiChannelNotification({ userId, type, title, message, subject, actionLink, html, channels, priority });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Send batch notifications
 */
const sendBatchNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ error: 'notifications array is required' });
    }

    const results = [];
    for (const notif of notifications) {
      const result = await queueNotification(notif);
      results.push(result);
    }

    return res.status(200).json({ queued: results.length, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = normalizeId(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { status, type, limit } = req.query;
    const notifications = await getUserNotifications(userId, { status, type, limit });

    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const notification = await markNotificationAsRead(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Process queued notifications (batch job endpoint)
 */
const processQueued = async (req, res) => {
  try {
    const result = await processQueuedNotifications();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  sendNotification,
  sendBatchNotifications,
  getNotifications,
  markAsRead,
  processQueued,
  NOTIFICATION_TYPES,
  PRIORITIES,
};
