const Orientation = require('../models/Orientation.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('orientation.getAll', 'Entry', { query: req.query });
  try {
    const { employeeId, page, limit } = req.query;
    const checklists = await Orientation.findAll({ employeeId, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(checklists);
  } catch (err) {
    logger.error('orientation.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const checklist = await Orientation.findById(req.params.id);
    if (!checklist) return res.status(404).json({ msg: 'Orientation checklist not found' });
    res.json(checklist);
  } catch (err) {
    logger.error('orientation.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('orientation.create', 'Entry', { body: req.body });
  try {
    const checklist = await Orientation.create(req.body);
    logger.info('orientation.create', 'Created', { id: checklist.id });
    res.status(201).json(checklist);
  } catch (err) {
    logger.error('orientation.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('orientation.update', 'Entry', { id: req.params.id });
  try {
    const checklist = await Orientation.findById(req.params.id);
    if (!checklist) return res.status(404).json({ msg: 'Orientation checklist not found' });
    const updated = await Orientation.update(req.params.id, { ...req.body, completedBy: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('orientation.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
