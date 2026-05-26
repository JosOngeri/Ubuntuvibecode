const Payroll = require('../models/Payroll.model');
const Employee = require('../models/Employee.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('payroll.getAll', 'Entry', { query: req.query });
  try {
    const { employeeId, status, period, page, limit } = req.query;
    const records = await Payroll.findAll({ employeeId, status, period, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(records);
  } catch (err) {
    logger.error('payroll.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'Payroll record not found' });
    res.json(record);
  } catch (err) {
    logger.error('payroll.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('payroll.create', 'Entry', { body: req.body });
  try {
    const record = await Payroll.create(req.body);
    logger.info('payroll.create', 'Created', { id: record.id });
    res.status(201).json(record);
  } catch (err) {
    logger.error('payroll.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('payroll.update', 'Entry', { id: req.params.id });
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'Payroll record not found' });
    const updated = await Payroll.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('payroll.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
