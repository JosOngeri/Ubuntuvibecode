const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { AppError } = require('../utils/errorHandler');

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    // Get total members count
    const membersQuery = `
      SELECT COUNT(*) as count FROM users WHERE is_active = true
    `;
    const membersResult = await pool.query(membersQuery);

    // Get total payments this month
    const paymentsQuery = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'completed'
      AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    const paymentsResult = await pool.query(paymentsQuery);

    // Get upcoming events count
    const eventsQuery = `
      SELECT COUNT(*) as count
      FROM events
      WHERE event_date >= CURRENT_DATE
      AND is_public = true
    `;
    const eventsResult = await pool.query(eventsQuery);

    // Get recent announcements count
    const announcementsQuery = `
      SELECT COUNT(*) as count
      FROM announcements
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;
    const announcementsResult = await pool.query(announcementsQuery);

    res.json({
      success: true,
      stats: {
        totalMembers: parseInt(membersResult.rows[0].count),
        totalPayments: parseFloat(paymentsResult.rows[0].total),
        upcomingEvents: parseInt(eventsResult.rows[0].count),
        recentAnnouncements: parseInt(announcementsResult.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent activities from multiple tables
    const activities = [];

    // Recent payments
    const paymentsQuery = `
      SELECT 
        'payment' as type,
        'New payment received' as title,
        CONCAT(u.first_name, ' ', u.last_name, ' paid KES ', p.amount) as description,
        p.created_at as time,
        'attach-money' as icon,
        '#22c55e' as color
      FROM payments p
      JOIN users u ON p.member_id = u.id
      WHERE p.status = 'completed'
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
    const paymentsResult = await pool.query(paymentsQuery, [limit]);
    activities.push(...paymentsResult.rows);

    // Recent announcements
    const announcementsQuery = `
      SELECT 
        'announcement' as type,
        a.title as title,
        SUBSTRING(a.content, 1, 100) as description,
        a.created_at as time,
        'campaign' as icon,
        '#3b82f6' as color
      FROM announcements a
      WHERE a.is_public = true
      ORDER BY a.created_at DESC
      LIMIT $1
    `;
    const announcementsResult = await pool.query(announcementsQuery, [limit]);
    activities.push(...announcementsResult.rows);

    // Recent events
    const eventsQuery = `
      SELECT 
        'event' as type,
        e.title as title,
        CONCAT('Scheduled for ', TO_CHAR(e.event_date, 'Mon DD, YYYY')) as description,
        e.created_at as time,
        'event' as icon,
        '#8b5cf6' as color
      FROM events e
      WHERE e.is_public = true
      ORDER BY e.created_at DESC
      LIMIT $1
    `;
    const eventsResult = await pool.query(eventsQuery, [limit]);
    activities.push(...eventsResult.rows);

    // Sort all activities by time
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Format time as relative
    const formattedActivities = activities.slice(0, limit).map(activity => ({
      ...activity,
      time: formatRelativeTime(activity.time)
    }));

    res.json({
      success: true,
      activities: formattedActivities
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return past.toLocaleDateString();
}

module.exports = router;
