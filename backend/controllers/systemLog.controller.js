const SystemLog = require('../models/SystemLog.model');
const logger = require('../utils/logger');

// Get all system logs with optional filters
exports.getAllSystemLogs = async (req, res) => {
  try {
    const { level, module, action, user_id, limit = 100, offset = 0 } = req.query;

    // Check if user has permission to view system logs
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const logs = await SystemLog.findAll({
      level,
      module,
      action,
      user_id: user_id ? parseInt(user_id) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      msg: 'System logs retrieved successfully',
      logs,
      count: logs.length
    });
  } catch (err) {
    logger.error('systemLog.getAll', 'Error fetching system logs', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get system log by ID
exports.getSystemLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const log = await SystemLog.findById(id);

    if (!log) {
      return res.status(404).json({ msg: 'System log not found' });
    }

    res.status(200).json({
      msg: 'System log retrieved successfully',
      log
    });
  } catch (err) {
    logger.error('systemLog.getById', 'Error fetching system log', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get system log statistics
exports.getSystemLogStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const stats = await SystemLog.getStats();

    res.status(200).json({
      msg: 'System log statistics retrieved successfully',
      stats
    });
  } catch (err) {
    logger.error('systemLog.getStats', 'Error fetching system log stats', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete old system logs (maintenance)
exports.deleteOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const deletedCount = await SystemLog.deleteOldLogs(parseInt(daysToKeep));

    res.status(200).json({
      msg: `Deleted ${deletedCount} old system logs`,
      deletedCount
    });
  } catch (err) {
    logger.error('systemLog.deleteOld', 'Error deleting old logs', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
