const Kpi = require('../models/Kpi.model');
const Employee = require('../models/Employee.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('kpi.getAll', 'Entry', { query: req.query });
  try {
    const { employeeId, status, period, page, limit } = req.query;
    const records = await Kpi.findAll({ employeeId, status, period, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(records);
  } catch (err) {
    logger.error('kpi.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllDefinitions = async (req, res) => {
  try {
    const { department, category, isActive } = req.query;
    const definitions = await Kpi.findAllDefinitions({ department, category, isActive });
    res.json(definitions);
  } catch (err) {
    logger.error('kpi.getAllDefinitions', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const record = await Kpi.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'KPI not found' });
    res.json(record);
  } catch (err) {
    logger.error('kpi.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('kpi.create', 'Entry', { body: req.body });
  try {
    const record = await Kpi.create(req.body);
    logger.info('kpi.create', 'Created', { id: record.id });
    res.status(201).json(record);
  } catch (err) {
    logger.error('kpi.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const createDefinition = async (req, res) => {
  logger.info('kpi.createDefinition', 'Entry', { body: req.body });
  try {
    const definition = await Kpi.createDefinition({ ...req.body, createdBy: req.user.id });
    logger.info('kpi.createDefinition', 'Created', { id: definition.id });
    res.status(201).json(definition);
  } catch (err) {
    logger.error('kpi.createDefinition', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('kpi.update', 'Entry', { id: req.params.id });
  try {
    const record = await Kpi.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'KPI not found' });
    const updated = await Kpi.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('kpi.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getAllDefinitions, getById, create, createDefinition, update };
