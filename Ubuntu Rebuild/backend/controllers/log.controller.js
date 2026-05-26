const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const logger = require('../utils/logger');

const getSystemLogs = async (req, res) => {
  try {
    const logFile = path.join(__dirname, '../logs/system.log');
    if (!fs.existsSync(logFile)) return res.json({ logs: [] });
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const limit = parseInt(req.query.limit) || 100;
    res.json({ logs: lines.slice(-limit) });
  } catch (err) {
    logger.error('log.getSystemLogs', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const { userId, action, from, to, limit = 100 } = req.query;
    let q = `SELECT * FROM user_activity_logs WHERE 1=1`;
    const params = [];
    if (userId) { params.push(userId); q += ` AND user_id = $${params.length}`; }
    if (action) { params.push(action); q += ` AND action = $${params.length}`; }
    if (from) { params.push(from); q += ` AND timestamp >= $${params.length}`; }
    if (to) { params.push(to); q += ` AND timestamp <= $${params.length}`; }
    q += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    logger.error('log.getActivityLogs', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getSystemLogs, getActivityLogs };
