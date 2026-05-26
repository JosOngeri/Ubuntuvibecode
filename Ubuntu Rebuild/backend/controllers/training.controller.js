const Training = require('../models/Training.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('training.getAll', 'Entry', { query: req.query });
  try {
    const { department, status, page, limit } = req.query;
    const records = await Training.findAll({ department, status, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(records);
  } catch (err) {
    logger.error('training.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const record = await Training.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'Training not found' });
    res.json(record);
  } catch (err) {
    logger.error('training.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('training.create', 'Entry', { body: req.body });
  try {
    const record = await Training.create({ ...req.body, createdBy: req.user.id });
    logger.info('training.create', 'Created', { id: record.id });
    res.status(201).json(record);
  } catch (err) {
    logger.error('training.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('training.update', 'Entry', { id: req.params.id });
  try {
    const record = await Training.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'Training not found' });
    const updated = await Training.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('training.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
