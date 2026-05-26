const DepartmentHeadAssignment = require('../models/DepartmentHeadAssignment.model');
const Notification = require('../models/Notification.model');
const AuditLog = require('../models/AuditLog.model');
const logger = require('../utils/logger');

async function createAssignment(req, res) {
  try {
    const { userId, department, permissions, notes } = req.body;
    const creator = req.user;

    if (!userId || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await DepartmentHeadAssignment.findByDepartment(department);
    if (existing && existing.isActive) {
      return res.status(409).json({ error: 'Department already has an active head' });
    }

    const assignment = new DepartmentHeadAssignment({
      userId,
      department,
      permissions: permissions || [],
      assignedBy: creator.id,
      notes,
      isActive: true
    });

    await assignment.save();

    const notification = new Notification({
      userId,
      type: 'department_head_assigned',
      title: 'Department Head Assignment',
      message: 'You have been assigned as a Department Head.',
      entityType: 'department_head_assignment',
      entityId: assignment.id
    });
    await notification.save();

    await AuditLog.create({
      userId: creator.id,
      username: creator.username,
      userRole: creator.role,
      action: 'create_department_head_assignment',
      entityType: 'department_head_assignment',
      entityId: assignment.id,
      newData: assignment.toJSON()
    });

    logger.info('deptHead.create', 'Assignment created', {
      creator: creator.id,
      user: userId,
      department: department
    });

    res.status(201).json({
      success: true,
      data: assignment.toJSON()
    });
  } catch (error) {
    logger.error('deptHead.create', 'Error creating assignment', { error: error.message });
    res.status(500).json({ error: 'Failed to create assignment' });
  }
}

async function getAssignments(req, res) {
  try {
    const { department, userId } = req.query;
    const options = {};

    if (department) options.department = department;
    if (userId) options.userId = userId;

    const assignments = await DepartmentHeadAssignment.findAll(options);

    res.json({
      success: true,
      data: assignments.map(a => a.toJSON())
    });
  } catch (error) {
    logger.error('deptHead.getAll', 'Error getting assignments', { error: error.message });
    res.status(500).json({ error: 'Failed to get assignments' });
  }
}

async function getAssignmentById(req, res) {
  try {
    const { id } = req.params;
    const assignment = await DepartmentHeadAssignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      success: true,
      data: assignment.toJSON()
    });
  } catch (error) {
    logger.error('deptHead.getById', 'Error getting assignment', { error: error.message });
    res.status(500).json({ error: 'Failed to get assignment' });
  }
}

async function updateAssignment(req, res) {
  try {
    const { id } = req.params;
    const { permissions, notes } = req.body;
    const updater = req.user;

    const assignment = await DepartmentHeadAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (permissions) assignment.permissions = permissions;
    if (notes !== undefined) assignment.notes = notes;

    await assignment.save();

    await AuditLog.create({
      userId: updater.id,
      username: updater.username,
      userRole: updater.role,
      action: 'update_department_head_assignment',
      entityType: 'department_head_assignment',
      entityId: assignment.id,
      newData: assignment.toJSON()
    });

    res.json({
      success: true,
      data: assignment.toJSON()
    });
  } catch (error) {
    logger.error('deptHead.update', 'Error updating assignment', { error: error.message });
    res.status(500).json({ error: 'Failed to update assignment' });
  }
}

async function deleteAssignment(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const deleter = req.user;

    const assignment = await DepartmentHeadAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await assignment.deactivate();

    const notification = new Notification({
      userId: assignment.userId,
      type: 'department_head_removed',
      title: 'Department Head Assignment Ended',
      message: 'Your Department Head assignment has been ended.',
      entityType: 'department_head_assignment',
      entityId: assignment.id
    });
    await notification.save();

    await AuditLog.create({
      userId: deleter.id,
      username: deleter.username,
      userRole: deleter.role,
      action: 'delete_department_head_assignment',
      entityType: 'department_head_assignment',
      entityId: assignment.id,
      oldData: assignment.toJSON(),
      reason: reason || 'Assignment ended'
    });

    res.json({
      success: true,
      message: 'Assignment ended successfully'
    });
  } catch (error) {
    logger.error('deptHead.delete', 'Error deleting assignment', { error: error.message });
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
}

async function getMyAssignment(req, res) {
  try {
    const { id } = req.user;
    const assignment = await DepartmentHeadAssignment.findByUserId(id);

    if (!assignment) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: assignment.toJSON()
    });
  } catch (error) {
    logger.error('deptHead.getMy', 'Error getting my assignment', { error: error.message });
    res.status(500).json({ error: 'Failed to get assignment' });
  }
}

async function getDepartmentHead(req, res) {
  try {
    const { departmentId } = req.params;
    const assignment = await DepartmentHeadAssignment.findByDepartment(departmentId);

    if (!assignment) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: assignment.toJSON()
    });
  } catch (error) {
    logger.error('deptHead.getByDept', 'Error getting department head', { error: error.message });
    res.status(500).json({ error: 'Failed to get department head' });
  }
}

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getMyAssignment,
  getDepartmentHead
};
