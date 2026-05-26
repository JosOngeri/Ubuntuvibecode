const AuditLog = require('../models/AuditLog.model');
const Employee = require('../models/Employee.model');
const logger = require('../utils/logger');

async function getLogs(req, res) {
  try {
    const {
      userId,
      action,
      entityType,
      startDate,
      endDate,
      departmentId,
      limit = 50,
      offset = 0
    } = req.query;

    const requester = req.user;
    const options = { limit: parseInt(limit), offset: parseInt(offset) };

    // Apply data scope filtering
    if (requester.role === 'admin' || requester.role === 'manager' || requester.role === 'owner') {
      // Admin/Manager/Owner can see all logs
      if (userId) options.userId = userId;
      if (departmentId) options.departmentId = departmentId;
    } else if (requester.additionalRoles?.includes('department_head')) {
      // Department head can see logs for their department
      const myDept = requester.departmentHeadAssignment?.departmentId;
      if (userId) {
        // Check if user is in same department
        const emp = await Employee.findByUserId(userId);
        if (emp?.department_id !== myDept) {
          return res.status(403).json({ error: 'Cannot access logs for other departments' });
        }
        options.userId = userId;
      } else {
        options.departmentId = myDept;
      }
    } else if (requester.additionalRoles?.includes('supervisor')) {
      // Supervisor can see logs for their supervisees
      if (userId) {
        const allocations = await SupervisorAllocation.findBySupervisor(requester.id);
        const superviseeIds = allocations.map(a => a.superviseeId);
        if (!superviseeIds.includes(userId)) {
          return res.status(403).json({ error: 'Can only access logs for your supervisees' });
        }
        options.userId = userId;
      } else {
        // Return only own logs
        options.userId = requester.id;
      }
    } else {
      // Regular users can only see their own logs
      if (userId && userId !== requester.id) {
        return res.status(403).json({ error: 'Can only access your own logs' });
      }
      options.userId = requester.id;
    }

    if (action) options.action = action;
    if (entityType) options.entityType = entityType;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const logs = await AuditLog.findAll(options);
    const total = await AuditLog.count(options);

    res.json({
      success: true,
      data: logs.map(l => l.toJSON()),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('audit.getLogs', 'Error getting logs', { error: error.message });
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
}

async function getUserLogs(req, res) {
  try {
    const { userId } = req.params;
    const { action, entityType, startDate, endDate, limit = 50 } = req.query;
    const requester = req.user;

    // Data scope check
    if (requester.role !== 'admin' && requester.role !== 'manager' && requester.role !== 'owner') {
      if (userId !== requester.id) {
        // Check if supervisor of this user
        if (requester.additionalRoles?.includes('supervisor')) {
          const allocations = await SupervisorAllocation.findBySupervisor(requester.id);
          const superviseeIds = allocations.map(a => a.superviseeId);
          if (!superviseeIds.includes(userId)) {
            return res.status(403).json({ error: 'Access denied' });
          }
        } else if (requester.additionalRoles?.includes('department_head')) {
          const myDept = requester.departmentHeadAssignment?.departmentId;
          const emp = await Employee.findByUserId(userId);
          if (emp?.department_id !== myDept) {
            return res.status(403).json({ error: 'Access denied' });
          }
        } else {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
    }

    const options = { userId, limit: parseInt(limit) };
    if (action) options.action = action;
    if (entityType) options.entityType = entityType;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const logs = await AuditLog.findByUser(userId, options);

    res.json({
      success: true,
      data: logs.map(l => l.toJSON())
    });
  } catch (error) {
    logger.error('audit.getUserLogs', 'Error getting user logs', { error: error.message });
    res.status(500).json({ error: 'Failed to get user logs' });
  }
}

async function getEntityLogs(req, res) {
  try {
    const { entityType, entityId } = req.params;
    const { action, limit = 50 } = req.query;
    const requester = req.user;

    const options = { action, limit: parseInt(limit) };
    const logs = await AuditLog.findByEntity(entityType, entityId, options);

    // Data scope filtering
    const filteredLogs = logs.filter(log => {
      if (requester.role === 'admin' || requester.role === 'manager' || requester.role === 'owner') {
        return true;
      }
      return log.userId === requester.id;
    });

    res.json({
      success: true,
      data: filteredLogs.map(l => l.toJSON())
    });
  } catch (error) {
    logger.error('audit.getEntityLogs', 'Error getting entity logs', { error: error.message });
    res.status(500).json({ error: 'Failed to get entity logs' });
  }
}

async function createLog(req, res) {
  try {
    const { action, entityType, entityId, entityName, previousData, newData, reason } = req.body;
    const user = req.user;

    const log = await AuditLog.create({
      userId: user.id,
      username: user.username,
      userRole: user.role,
      action,
      entityType,
      entityId,
      entityName,
      previousData,
      newData,
      reason,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: log.toJSON()
    });
  } catch (error) {
    logger.error('audit.createLog', 'Error creating log', { error: error.message });
    res.status(500).json({ error: 'Failed to create audit log' });
  }
}

module.exports = {
  getLogs,
  getUserLogs,
  getEntityLogs,
  createLog
};
