const SupervisorAllocation = require('../models/SupervisorAllocation.model');
const Notification = require('../models/Notification.model');
const AuditLog = require('../models/AuditLog.model');
const logger = require('../utils/logger');

async function createAllocation(req, res) {
  try {
    const { supervisorId, superviseeId, type, startDate, endDate, permissions, notes } = req.body;
    const creator = req.user;

    if (!supervisorId || !superviseeId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['permanent', 'temporary', 'ad_hoc', 'undefined'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid allocation type' });
    }

    const allocation = new SupervisorAllocation({
      supervisorId,
      superviseeId,
      type,
      startDate: startDate || new Date(),
      endDate: type === 'permanent' || type === 'undefined' ? null : endDate,
      permissions: permissions || [],
      assignedBy: creator.id,
      notes,
      isActive: true
    });

    await allocation.save();

    const notification = new Notification({
      userId: supervisorId,
      type: 'supervisor_assigned',
      title: 'Supervisor Assignment',
      message: `You have been assigned as a supervisor${type === 'temporary' ? ' until ' + new Date(endDate).toLocaleDateString() : ''}.`,
      entityType: 'supervisor_allocation',
      entityId: allocation.id
    });
    await notification.save();

    await AuditLog.create({
      userId: creator.id,
      username: creator.username,
      userRole: creator.role,
      action: 'create_supervisor_allocation',
      entityType: 'supervisor_allocation',
      entityId: allocation.id,
      newData: allocation.toJSON()
    });

    logger.info('supervisor.create', 'Allocation created', {
      creator: creator.id,
      supervisor: supervisorId,
      supervisee: superviseeId,
      type
    });

    res.status(201).json({
      success: true,
      data: allocation.toJSON()
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An allocation already exists for this supervisor and supervisee. Edit the existing one instead.' });
    }
    console.error('[supervisor.create] FULL ERROR:', error);
    logger.error('supervisor.create', 'Error creating allocation', { error: error.message, code: error.code, detail: error.detail });
    res.status(500).json({ error: 'Failed to create allocation', detail: error.message, code: error.code });
  }
}

async function getAllocations(req, res) {
  try {
    const { supervisorId, superviseeId, type, activeOnly } = req.query;
    const options = {};

    if (supervisorId) options.supervisorId = supervisorId;
    if (superviseeId) options.superviseeId = superviseeId;
    if (type) options.type = type;
    if (activeOnly !== undefined) options.activeOnly = activeOnly === 'true';

    const allocations = await SupervisorAllocation.findAll(options);

    res.json({
      success: true,
      data: allocations.map(a => a.toJSON())
    });
  } catch (error) {
    logger.error('supervisor.getAll', 'Error getting allocations', { error: error.message });
    res.status(500).json({ error: 'Failed to get allocations' });
  }
}

async function getAllocationById(req, res) {
  try {
    const { id } = req.params;
    const allocation = await SupervisorAllocation.findById(id);

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    res.json({
      success: true,
      data: allocation.toJSON()
    });
  } catch (error) {
    logger.error('supervisor.getById', 'Error getting allocation', { error: error.message });
    res.status(500).json({ error: 'Failed to get allocation' });
  }
}

async function updateAllocation(req, res) {
  try {
    const { id } = req.params;
    const { type, startDate, endDate, permissions, notes, isActive } = req.body;
    const updater = req.user;

    const allocation = await SupervisorAllocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    if (type) allocation.type = type;
    if (startDate) allocation.startDate = startDate;
    if (endDate !== undefined) allocation.endDate = endDate;
    if (permissions) allocation.permissions = permissions;
    if (notes !== undefined) allocation.notes = notes;
    if (isActive !== undefined) allocation.isActive = isActive;

    await allocation.save();

    await AuditLog.create({
      userId: updater.id,
      username: updater.username,
      userRole: updater.role,
      action: 'update_supervisor_allocation',
      entityType: 'supervisor_allocation',
      entityId: allocation.id,
      newData: allocation.toJSON()
    });

    res.json({
      success: true,
      data: allocation.toJSON()
    });
  } catch (error) {
    logger.error('supervisor.update', 'Error updating allocation', { error: error.message });
    res.status(500).json({ error: 'Failed to update allocation' });
  }
}

async function deleteAllocation(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const deleter = req.user;

    const allocation = await SupervisorAllocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    await allocation.deactivate();

    const notification = new Notification({
      userId: allocation.supervisorId,
      type: 'supervisor_unassigned',
      title: 'Supervisor Assignment Ended',
      message: 'Your supervisor assignment has been ended.',
      entityType: 'supervisor_allocation',
      entityId: allocation.id
    });
    await notification.save();

    await AuditLog.create({
      userId: deleter.id,
      username: deleter.username,
      userRole: deleter.role,
      action: 'delete_supervisor_allocation',
      entityType: 'supervisor_allocation',
      entityId: allocation.id,
      previousData: allocation.toJSON(),
      reason: reason || 'Allocation ended'
    });

    res.json({
      success: true,
      message: 'Allocation deleted successfully'
    });
  } catch (error) {
    logger.error('supervisor.delete', 'Error deleting allocation', { error: error.message });
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
}

async function getMySupervisees(req, res) {
  try {
    const { id } = req.user;
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();

    const allocations = await SupervisorAllocation.findBySupervisor(id, checkDate);

    res.json({
      success: true,
      data: allocations.map(a => a.toJSON())
    });
  } catch (error) {
    logger.error('supervisor.getMySupervisees', 'Error getting supervisees', { error: error.message });
    res.status(500).json({ error: 'Failed to get supervisees' });
  }
}

async function getMySupervisors(req, res) {
  try {
    const { id } = req.user;
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();

    const allocations = await SupervisorAllocation.findBySupervisee(id, checkDate);

    res.json({
      success: true,
      data: allocations.map(a => a.toJSON())
    });
  } catch (error) {
    logger.error('supervisor.getMySupervisors', 'Error getting supervisors', { error: error.message });
    res.status(500).json({ error: 'Failed to get supervisors' });
  }
}

module.exports = {
  createAllocation,
  getAllocations,
  getAllocationById,
  updateAllocation,
  deleteAllocation,
  getMySupervisees,
  getMySupervisors
};
