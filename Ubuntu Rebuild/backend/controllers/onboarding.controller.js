const Onboarding = require('../models/Onboarding.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('onboarding.getAll', 'Entry', { query: req.query });
  try {
    const { status, currentStep, page, limit } = req.query;
    const records = await Onboarding.findAll({ status, currentStep, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(records);
  } catch (err) {
    logger.error('onboarding.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const record = await Onboarding.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'Onboarding not found' });
    res.json(record);
  } catch (err) {
    logger.error('onboarding.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const initiate = async (req, res) => {
  logger.info('onboarding.initiate', 'Entry', { body: req.body });
  try {
    const record = await Onboarding.create({ ...req.body, initiatedBy: req.user.id });
    logger.info('onboarding.initiate', 'Created', { id: record.id });
    res.status(201).json(record);
  } catch (err) {
    logger.error('onboarding.initiate', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('onboarding.update', 'Entry', { id: req.params.id });
  try {
    const record = await Onboarding.findById(req.params.id);
    if (!record) return res.status(404).json({ msg: 'Onboarding not found' });
    const updated = await Onboarding.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('onboarding.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, initiate, update };
