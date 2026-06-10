/**
 * Leave Service
 * Business logic layer for leave operations
 * TODO: Refactor to extract business logic from controller
 */

const oldLeaveController = require('../../../../controllers/leave.controller');

// Temporary delegation to old controller until refactoring is complete
const requestLeave = async (userId, body, file) => {
  return oldLeaveController.requestLeave({ user: { id: userId }, body, file }, { json: (data) => data, status: (code) => ({ json: data => data }) });
};

const uploadLeaveDocument = async (id, file) => {
  return oldLeaveController.uploadLeaveDocument({ params: { id }, file }, { json: (data) => data });
};

const updateLeaveStatus = async (id, status) => {
  return oldLeaveController.updateLeaveStatus({ params: { id }, body: { status } }, { json: (data) => data });
};

const getLeaveBalance = async (employeeId) => {
  return oldLeaveController.getLeaveBalance({ params: { employeeId } }, { json: (data) => data });
};

const checkConflict = async (body) => {
  return oldLeaveController.checkConflict({ body }, { json: (data) => data });
};

const getLeaves = async (userId, query) => {
  return oldLeaveController.getLeaves({ user: { id: userId }, query }, { json: (data) => data });
};

const createLeave = async (userId, body, file) => {
  return oldLeaveController.createLeave({ user: { id: userId }, body, file }, { json: (data) => data });
};

const updateLeave = async (id, body) => {
  return oldLeaveController.updateLeave({ params: { id }, body }, { json: (data) => data });
};

const deleteLeave = async (id) => {
  return oldLeaveController.deleteLeave({ params: { id } }, { json: (data) => data });
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
