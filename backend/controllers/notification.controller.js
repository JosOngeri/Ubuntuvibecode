const { sendMultiChannelNotification, sendUrgentNotification, queueNotification, getUserNotifications, markNotificationAsRead, processQueuedNotifications, NOTIFICATION_TYPES, PRIORITIES } = require('../utils/notification');
const { normalizeId } = require('../utils/postgres');
const { query } = require('../config/db');
const logger = require('../utils/logger');

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

/**
 * Create owner notification
 */
const createOwnerNotification = async (type, title, message, data = null) => {
  try {
    const result = await query(
      `INSERT INTO owner_notifications (type, title, message, data)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [type, title, message, data ? JSON.stringify(data) : null]
    );
    return result.rows[0];
  } catch (err) {
    logger.error('notification.createOwner', 'Error creating owner notification', err);
    throw err;
  }
};

/**
 * Get owner notifications
 */
const getOwnerNotifications = async (req, res) => {
  try {
    const { unread_only, limit } = req.query;

    let queryStr = `SELECT * FROM owner_notifications`;
    const params = [];

    if (unread_only === 'true') {
      queryStr += ` WHERE is_read = false`;
    }

    queryStr += ` ORDER BY created_at DESC`;

    if (limit) {
      queryStr += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const result = await query(queryStr, params);

    res.status(200).json({
      notifications: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    logger.error('notification.getOwner', 'Error fetching owner notifications', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark owner notification as read
 */
const markOwnerNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE owner_notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({
      notification: result.rows[0],
    });
  } catch (err) {
    logger.error('notification.markOwnerRead', 'Error marking notification as read', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark all owner notifications as read
 */
const markAllOwnerNotificationsAsRead = async (req, res) => {
  try {
    const result = await query(
      `UPDATE owner_notifications
       SET is_read = true, read_at = NOW()
       WHERE is_read = false
       RETURNING *`
    );

    res.status(200).json({
      count: result.rows.length,
    });
  } catch (err) {
    logger.error('notification.markAllOwnerRead', 'Error marking all notifications as read', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Send backdated attendance notification to owner
 */
const notifyBackdatedAttendance = async (attendanceData) => {
  try {
    const { employee_name, date, backdated_reason, backdated_by } = attendanceData;

    const notification = await createOwnerNotification(
      'backdated_attendance',
      'Backdated Attendance Created',
      `Attendance record for ${employee_name} was backdated to ${new Date(date).toLocaleDateString()}. Reason: ${backdated_reason || 'Not specified'}`,
      {
        employee_name,
        date,
        backdated_reason,
        backdated_by,
      }
    );

    return notification;
  } catch (err) {
    logger.error('notification.backdatedAttendance', 'Error sending notification', err);
    throw err;
  }
};

/**
 * Get salary reminder settings
 */
const getSalaryReminderSettings = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM salary_reminders WHERE id = 1`
    );

    if (result.rows.length === 0) {
      // Create default settings
      const defaultSettings = await query(
        `INSERT INTO salary_reminders (reminder_day, enabled, notified_roles)
         VALUES (25, TRUE, ARRAY['owner','manager'])
         RETURNING *`
      );
      return res.json(defaultSettings.rows[0]);
    }

    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('notification.getSalaryReminder', 'Error fetching settings', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update salary reminder settings
 */
const updateSalaryReminderSettings = async (req, res) => {
  try {
    const { reminder_day, enabled, notified_roles } = req.body;

    const result = await query(
      `UPDATE salary_reminders
       SET reminder_day = $1, enabled = $2, notified_roles = $3, updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [reminder_day, enabled, notified_roles]
    );

    if (result.rows.length === 0) {
      // Create if doesn't exist
      const newSettings = await query(
        `INSERT INTO salary_reminders (reminder_day, enabled, notified_roles)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [reminder_day, enabled, notified_roles]
      );
      return res.json(newSettings.rows[0]);
    }

    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('notification.updateSalaryReminder', 'Error updating settings', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Send salary reminder notification
 */
const sendSalaryReminder = async () => {
  try {
    const settingsResult = await query(
      `SELECT * FROM salary_reminders WHERE enabled = TRUE LIMIT 1`
    );

    if (settingsResult.rows.length === 0) {
      logger.info('notification.salaryReminder', 'Salary reminders not enabled');
      return;
    }

    const settings = settingsResult.rows[0];
    const today = new Date();
    const currentDay = today.getDate();

    if (currentDay !== settings.reminder_day) {
      logger.info('notification.salaryReminder', `Not reminder day`, { today: currentDay, reminderDay: settings.reminder_day });
      return;
    }

    // Check if already sent this month
    const lastSent = settings.last_sent_at;
    if (lastSent) {
      const lastSentDate = new Date(lastSent);
      if (lastSentDate.getMonth() === today.getMonth() && lastSentDate.getFullYear() === today.getFullYear()) {
        logger.info('notification.salaryReminder', 'Already sent this month');
        return;
      }
    }

    // Get users to notify
    const rolesToNotify = settings.notified_roles || ['owner', 'manager'];
    const rolePlaceholders = rolesToNotify.map((_, i) => `$${i + 1}`).join(',');
    const usersResult = await query(
      `SELECT id, email, username FROM users WHERE role = ANY(ARRAY[${rolePlaceholders}]) AND status = 'active'`,
      rolesToNotify
    );

    for (const user of usersResult.rows) {
      await createOwnerNotification(
        'salary_reminder',
        'Monthly Salary Day Reminder',
        `Today is the monthly salary processing day (day ${settings.reminder_day}). Please review and process payroll for all employees.`,
        {
          reminder_day: settings.reminder_day,
          user_id: user.id,
          username: user.username,
        }
      );
    }

    // Update last_sent_at
    await query(
      `UPDATE salary_reminders SET last_sent_at = NOW() WHERE id = $1`,
      [settings.id]
    );

    logger.info('notification.salaryReminder', `Sent to ${usersResult.rows.length} users`);
  } catch (err) {
    logger.error('notification.salaryReminder', 'Error sending salary reminder', err);
    throw err;
  }
};

module.exports = {
  sendNotification,
  sendBatchNotifications,
  getNotifications,
  markAsRead,
  processQueued,
  createOwnerNotification,
  getOwnerNotifications,
  markOwnerNotificationAsRead,
  markAllOwnerNotificationsAsRead,
  notifyBackdatedAttendance,
  getSalaryReminderSettings,
  updateSalaryReminderSettings,
  sendSalaryReminder,
  NOTIFICATION_TYPES,
  PRIORITIES,
};
