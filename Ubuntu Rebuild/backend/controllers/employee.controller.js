const Employee = require('../models/Employee.model');
const User = require('../models/User.model');
const { validateEmployeePayload } = require('../utils/validation');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('employee.getAll', 'Entry', { query: req.query });
  try {
    const { department, status, employmentType, search, page, limit } = req.query;
    const employees = await Employee.findAll({ department, status, employmentType, search, page: parseInt(page)||1, limit: parseInt(limit)||100 });
    const total = await Employee.count({ department, status, employmentType });
    res.json({ employees, total });
  } catch (err) {
    logger.error('employee.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    logger.error('employee.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const emp = await Employee.findByUserId(req.user.id);
    if (!emp) return res.status(404).json({ msg: 'Employee profile not found' });
    res.json(emp);
  } catch (err) {
    logger.error('employee.getMe', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getByUserId = async (req, res) => {
  try {
    const emp = await Employee.findByUserId(req.params.userId);
    if (!emp) return res.status(404).json({ msg: 'Employee not found for this user' });
    res.json(emp);
  } catch (err) {
    logger.error('employee.getByUserId', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('employee.create', 'Entry', { body: req.body });
  const { normalized, errors } = validateEmployeePayload(req.body);
  if (errors.length) {
    logger.warn('employee.create', 'Validation failed', { errors });
    return res.status(400).json({ msg: 'Validation failed', errors });
  }
  try {
    const emp = await Employee.create(normalized);
    logger.info('employee.create', 'Created', { id: emp.id });
    res.status(201).json(emp);
  } catch (err) {
    logger.error('employee.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('employee.update', 'Entry', { id: req.params.id });
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    const updated = await Employee.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('employee.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    await Employee.remove(req.params.id);
    res.json({ msg: 'Employee deleted' });
  } catch (err) {
    logger.error('employee.remove', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, getMe, getByUserId, create, update, remove };
