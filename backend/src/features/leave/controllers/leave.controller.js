/**
 * Leave Controller
 * Request handling layer for leave endpoints
 * Uses leave service for business logic
 */

const logger = require('../../../utils/logger');
const { success, notFound, serverError } = require('../../../shared/utils/response');
const leaveService = require('../services/leave.service');

/**
 * Request leave
 */
const requestLeave = async (req, res) => {
  try {
    const leave = await leaveService.requestLeave(req.user.id, req.body, req.file);
    success(res, leave, 'Leave request submitted successfully');
  } catch (err) {
    if (err.message === 'Employee not found') {
      return notFound(res, err.message);
    }
    if (err.message === 'Insufficient leave balance') {
      return res.status(400).json({ msg: err.message });
    }
    logger.error('leave.controller.requestLeave', 'Unhandled error', err);
    serverError(res, 'Failed to submit leave request');
  }
};

/**
 * Upload leave document
 */
const uploadLeaveDocument = async (req, res) => {
  try {
    const leave = await leaveService.uploadLeaveDocument(req.params.id, req.file);
    success(res, leave, 'Document uploaded successfully');
  } catch (err) {
    if (err.message === 'Leave record not found') {
      return notFound(res, err.message);
    }
    logger.error('leave.controller.uploadLeaveDocument', 'Unhandled error', err);
    serverError(res, 'Failed to upload document');
  }
};

/**
 * Update leave status
 */
const updateLeaveStatus = async (req, res) => {
  try {
    const leave = await leaveService.updateLeaveStatus(req.params.id, req.body.status);
    success(res, leave, 'Leave status updated successfully');
  } catch (err) {
    if (err.message === 'Leave record not found') {
      return notFound(res, err.message);
    }
    logger.error('leave.controller.updateLeaveStatus', 'Unhandled error', err);
    serverError(res, 'Failed to update leave status');
  }
};

/**
 * Get leave balance
 */
const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const balance = await leaveService.getLeaveBalance(employeeId);
    success(res, balance, 'Leave balance retrieved successfully');
  } catch (err) {
    if (err.message === 'Employee not found') {
      return notFound(res, err.message);
    }
    logger.error('leave.controller.getLeaveBalance', 'Unhandled error', err);
    serverError(res, 'Failed to retrieve leave balance');
  }
};

/**
 * Check leave conflict
 */
const checkConflict = async (req, res) => {
  try {
    const conflict = await leaveService.checkConflict(req.body);
    success(res, conflict, 'Conflict check completed');
  } catch (err) {
    logger.error('leave.controller.checkConflict', 'Unhandled error', err);
    serverError(res, 'Failed to check for conflicts');
  }
};

/**
 * Get leaves
 */
const getLeaves = async (req, res) => {
  try {
    const leaves = await leaveService.getLeaves(req.user.id, req.query);
    success(res, leaves, 'Leaves retrieved successfully');
  } catch (err) {
    logger.error('leave.controller.getLeaves', 'Unhandled error', err);
    serverError(res, 'Failed to retrieve leaves');
  }
};

/**
 * Create leave
 */
const createLeave = async (req, res) => {
  try {
    const leave = await leaveService.createLeave(req.user.id, req.body, req.file);
    success(res, leave, 'Leave created successfully');
  } catch (err) {
    if (err.message === 'Employee not found') {
      return notFound(res, err.message);
    }
    if (err.message === 'Insufficient leave balance') {
      return res.status(400).json({ msg: err.message });
    }
    logger.error('leave.controller.createLeave', 'Unhandled error', err);
    serverError(res, 'Failed to create leave');
  }
};

/**
 * Update leave
 */
const updateLeave = async (req, res) => {
  try {
    const leave = await leaveService.updateLeave(req.params.id, req.body);
    success(res, leave, 'Leave updated successfully');
  } catch (err) {
    if (err.message === 'Leave record not found') {
      return notFound(res, err.message);
    }
    logger.error('leave.controller.updateLeave', 'Unhandled error', err);
    serverError(res, 'Failed to update leave');
  }
};

/**
 * Delete leave
 */
const deleteLeave = async (req, res) => {
  try {
    await leaveService.deleteLeave(req.params.id);
    success(res, null, 'Leave deleted successfully');
  } catch (err) {
    if (err.message === 'Leave record not found') {
      return notFound(res, err.message);
    }
    logger.error('leave.controller.deleteLeave', 'Unhandled error', err);
    serverError(res, 'Failed to delete leave');
  }
};

module.exports = {
  requestLeave,
  uploadLeaveDocument,
  updateLeaveStatus,
  getLeaveBalance,
  checkConflict,
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
};
