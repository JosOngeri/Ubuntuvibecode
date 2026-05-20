const { sendEmail } = require('./email');
const { sendSMS, normalizePhoneNumber } = require('./sms');
const { query } = require('../config/db');

/**
 * Notification channels
 */
const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
};

/**
 * Notification priorities
 */
const PRIORITIES = {
  URGENT: 'urgent',
  NORMAL: 'normal',
};

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  LEAVE_REQUEST: 'leave_request',
  LEAVE_REMINDER: 'leave_reminder',
  LEAVE_ESCALATION: 'leave_escalation',
  PAYROLL_URGENT: 'payroll_urgent',
  PAYROLL_CRITICAL: 'payroll_critical',
  PAYMENT_FAILED: 'payment_failed',
  KPI_DUE: 'kpi_due',
  KPI_OVERDUE: 'kpi_overdue',
  WAGE_URGENT: 'wage_urgent',
  CONTRACT_EXPIRING: 'contract_expiring',
  CONTRACT_EXPIRED: 'contract_expired',
  COMPLAINT_ESCALATION: 'complaint_escalation',
  COMPLAINT_REMINDER: 'complaint_reminder',
};

/**
 * Store notification in database
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Stored notification
 */
const storeNotification = async (notification) => {
  try {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, type, title, message, action_link, status, channel, sent_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.actionLink || null,
        notification.status || 'pending',
        notification.channel,
        notification.sentAt || null,
      ]
    );
    return rows[0];
  } catch (error) {
    console.error('Failed to store notification:', error.message);
    return null;
  }
};

/**
 * Send notification via specified channel
 * @param {Object} options - Notification options
 * @param {string} options.channel - Channel (email, sms, in_app)
 * @param {string} options.to - Recipient (email for email, phone for sms, userId for in_app)
 * @param {string} options.subject - Subject (for email)
 * @param {string} options.title - Title (for in_app)
 * @param {string} options.message - Message content
 * @param {string} [options.actionLink] - Action link URL
 * @param {string} [options.html] - HTML content (for email)
 * @returns {Promise<Object>} Send result
 */
const sendNotification = async ({ channel, to, subject, title, message, actionLink, html }) => {
  let result = { sent: false, channel };

  switch (channel) {
    case CHANNELS.EMAIL:
      result = await sendEmail({
        to,
        subject,
        text: message,
        html: html || message,
      });
      break;

    case CHANNELS.SMS:
      const normalizedPhone = normalizePhoneNumber(to);
      if (!normalizedPhone) {
        result = { sent: false, reason: 'Invalid phone number' };
      } else {
        const smsMessage = actionLink ? `${message} ${actionLink}` : message;
        result = await sendSMS({
          message: smsMessage,
          phone: normalizedPhone,
        });
      }
      break;

    case CHANNELS.IN_APP:
      // In-app notifications are stored in database
      result = { sent: true, stored: true };
      break;

    default:
      result = { sent: false, reason: 'Invalid channel' };
  }

  return result;
};

/**
 * Send notification to multiple channels
 * @param {Object} options - Notification options
 * @param {number} options.userId - User ID
 * @param {string} options.type - Notification type
 * @param {string} options.title - Title
 * @param {string} options.message - Message content
 * @param {string} [options.subject] - Subject (for email)
 * @param {string} [options.actionLink] - Action link URL
 * @param {string} [options.html] - HTML content (for email)
 * @param {Array<string>} options.channels - Channels to send to (email, sms, in_app)
 * @param {string} options.priority - Priority (urgent, normal)
 * @returns {Promise<Object>} Send results for all channels
 */
const sendMultiChannelNotification = async ({
  userId,
  type,
  title,
  message,
  subject,
  actionLink,
  html,
  channels = [CHANNELS.IN_APP],
  priority = PRIORITIES.NORMAL,
}) => {
  // Get user details
  const { rows: userRows } = await query(
    'SELECT u.email, e.phone, e.mpesa_phone_number FROM users u LEFT JOIN employees e ON e.user_id = u.id WHERE u.id = $1',
    [userId]
  );

  if (!userRows[0]) {
    return { success: false, reason: 'User not found' };
  }

  const user = userRows[0];
  const results = [];

  // Send to each channel
  for (const channel of channels) {
    let to = null;
    let result = null;

    switch (channel) {
      case CHANNELS.EMAIL:
        to = user.email;
        result = await sendNotification({
          channel,
          to,
          subject: subject || title,
          message,
          actionLink,
          html,
        });
        break;

      case CHANNELS.SMS:
        to = user.mpesa_phone_number || user.phone;
        result = await sendNotification({
          channel,
          to,
          title,
          message,
          actionLink,
        });
        break;

      case CHANNELS.IN_APP:
        result = await storeNotification({
          userId,
          type,
          title,
          message,
          actionLink,
          status: 'pending',
          channel: CHANNELS.IN_APP,
        });
        break;
    }

    results.push({ channel, result });

    // Store notification record
    await storeNotification({
      userId,
      type,
      title,
      message,
      actionLink,
      status: result.sent ? 'sent' : 'failed',
      channel,
      sentAt: result.sent ? new Date() : null,
    });
  }

  const allSent = results.every((r) => r.result.sent);
  return {
    success: allSent,
    results,
    priority,
  };
};

/**
 * Send urgent notification (immediate)
 * @param {Object} options - Notification options
 * @returns {Promise<Object>} Send result
 */
const sendUrgentNotification = async (options) => {
  return sendMultiChannelNotification({
    ...options,
    priority: PRIORITIES.URGENT,
  });
};

/**
 * Queue notification for batch processing
 * @param {Object} options - Notification options
 * @returns {Promise<Object>} Queue result
 */
const queueNotification = async (options) => {
  // Store in database with status 'queued'
  await storeNotification({
    ...options,
    status: 'queued',
  });

  return {
    success: true,
    queued: true,
  };
};

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {Object} filters - Filters (status, type, limit)
 * @returns {Promise<Array>} Notifications
 */
const getUserNotifications = async (userId, filters = {}) => {
  const { status, type, limit = 50 } = filters;
  
  let queryText = `
    SELECT * FROM notifications 
    WHERE user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  if (status) {
    queryText += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (type) {
    queryText += ` AND type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);

  const { rows } = await query(queryText, params);
  return rows;
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Update result
 */
const markNotificationAsRead = async (notificationId) => {
  const { rows } = await query(
    `UPDATE notifications SET status = 'read', read_at = NOW() WHERE id = $1 RETURNING *`,
    [notificationId]
  );
  return rows[0];
};

/**
 * Process queued notifications (batch job)
 * @returns {Promise<Object>} Processing result
 */
const processQueuedNotifications = async () => {
  const { rows: queued } = await query(
    `SELECT * FROM notifications WHERE status = 'queued' ORDER BY created_at ASC LIMIT 100`
  );

  const results = [];

  for (const notification of queued) {
    // Get user details
    const { rows: userRows } = await query(
      'SELECT u.email, e.phone, e.mpesa_phone_number FROM users u LEFT JOIN employees e ON e.user_id = u.id WHERE u.id = $1',
      [notification.user_id]
    );

    if (userRows[0]) {
      const user = userRows[0];
      let to = null;
      let result = null;

      switch (notification.channel) {
        case CHANNELS.EMAIL:
          to = user.email;
          result = await sendNotification({
            channel: notification.channel,
            to,
            subject: notification.title,
            message: notification.message,
            actionLink: notification.action_link,
          });
          break;

        case CHANNELS.SMS:
          to = user.mpesa_phone_number || user.phone;
          result = await sendNotification({
            channel: notification.channel,
            to,
            title: notification.title,
            message: notification.message,
            actionLink: notification.action_link,
          });
          break;

        case CHANNELS.IN_APP:
          result = { sent: true, stored: true };
          break;
      }

      // Update notification status
      await query(
        `UPDATE notifications SET status = $1, sent_at = $2 WHERE id = $3`,
        [result.sent ? 'sent' : 'failed', result.sent ? new Date() : null, notification.id]
      );

      results.push({ notificationId: notification.id, result });
    }
  }

  return {
    processed: results.length,
    results,
  };
};

module.exports = {
  CHANNELS,
  PRIORITIES,
  NOTIFICATION_TYPES,
  sendNotification,
  sendMultiChannelNotification,
  sendUrgentNotification,
  queueNotification,
  getUserNotifications,
  markNotificationAsRead,
  processQueuedNotifications,
};
