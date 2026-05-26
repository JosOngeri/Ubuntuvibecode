const Contract = require('../models/Contract.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('contract.getAll', 'Entry', { query: req.query });
  try {
    const { employeeId, status, page, limit } = req.query;
    const contracts = await Contract.findAll({ employeeId, status, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(contracts);
  } catch (err) {
    logger.error('contract.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ msg: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    logger.error('contract.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('contract.create', 'Entry', { body: req.body });
  try {
    const contract = await Contract.create({ ...req.body, createdBy: req.user.id });
    logger.info('contract.create', 'Created', { id: contract.id });
    res.status(201).json(contract);
  } catch (err) {
    logger.error('contract.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('contract.update', 'Entry', { id: req.params.id });
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ msg: 'Contract not found' });
    const updated = await Contract.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('contract.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
