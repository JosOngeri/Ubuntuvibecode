const Leave = require('../models/Leave.model');
const Employee = require('../models/Employee.model');
const { validateLeavePayload } = require('../utils/validation');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('leave.getAll', 'Entry', { query: req.query });
  try {
    const { employeeId, status, leaveType, page, limit } = req.query;
    const leaves = await Leave.findAll({ employeeId, status, leaveType, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(leaves);
  } catch (err) {
    logger.error('leave.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });
    res.json(leave);
  } catch (err) {
    logger.error('leave.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('leave.create', 'Entry', { userId: req.user.id, body: req.body });
  const { normalized, errors } = validateLeavePayload(req.body);
  if (errors.length) {
    logger.warn('leave.create', 'Validation failed', { errors });
    return res.status(400).json({ msg: 'Validation failed', errors });
  }
  try {
    const emp = await Employee.findByUserId(req.user.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    const leave = await Leave.create({ ...normalized, employeeId: emp.id });
    logger.info('leave.create', 'Created', { id: leave.id });
    res.status(201).json(leave);
  } catch (err) {
    logger.error('leave.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const approve = async (req, res) => {
  logger.info('leave.approve', 'Entry', { id: req.params.id });
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });
    const updated = await Leave.update(req.params.id, { status: 'approved', approverId: req.user.id, approvedAt: new Date() });
    res.json(updated);
  } catch (err) {
    logger.error('leave.approve', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const reject = async (req, res) => {
  logger.info('leave.reject', 'Entry', { id: req.params.id, reason: req.body.reason });
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ msg: 'Rejection reason is required' });
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });
    const updated = await Leave.update(req.params.id, { status: 'rejected', approverId: req.user.id, rejectionReason: reason });
    res.json(updated);
  } catch (err) {
    logger.error('leave.reject', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const cancel = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });
    if (leave.status !== 'pending') return res.status(400).json({ msg: 'Can only cancel pending leave' });
    const updated = await Leave.update(req.params.id, { status: 'cancelled' });
    res.json(updated);
  } catch (err) {
    logger.error('leave.cancel', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, approve, reject, cancel };
