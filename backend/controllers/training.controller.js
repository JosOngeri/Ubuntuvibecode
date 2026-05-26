const Training = require('../models/Training.model');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  logger.info('training.getAll', 'Entry', { filter: req.query });
  try {
    const filter = {};
    if (req.query.employee_id) filter.employee_id = req.query.employee_id;
    if (req.query.status) filter.status = req.query.status;
    const records = await Training.find(filter);
    logger.info('training.getAll', `Returning ${records.length} records`);
    res.json(records);
  } catch (err) {
    logger.error('training.getAll', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  logger.info('training.getById', 'Entry', { id: req.params.id });
  try {
    const record = await Training.findById(req.params.id);
    if (!record) {
      logger.warn('training.getById', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Training record not found' });
    }
    res.json(record);
  } catch (err) {
    logger.error('training.getById', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  logger.info('training.create', 'Entry', { userId: req.user?.id });
  try {
    const training = new Training(req.body);
    const record = await training.save();
    logger.info('training.create', 'Created', { id: record.id });
    res.status(201).json(record);
  } catch (err) {
    logger.error('training.create', 'Validation/DB error', err);
    res.status(400).json({ msg: 'Validation error', error: err.message });
  }
};

exports.update = async (req, res) => {
  logger.info('training.update', 'Entry', { id: req.params.id });
  try {
    const record = await Training.findByIdAndUpdate(req.params.id, req.body);
    if (!record) {
      logger.warn('training.update', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Training record not found' });
    }
    logger.info('training.update', 'Updated', { id: req.params.id });
    res.json(record);
  } catch (err) {
    logger.error('training.update', 'Validation/DB error', err, { id: req.params.id });
    res.status(400).json({ msg: 'Validation error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  logger.info('training.remove', 'Entry', { id: req.params.id });
  try {
    const record = await Training.findByIdAndDelete(req.params.id);
    if (!record) {
      logger.warn('training.remove', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Training record not found' });
    }
    logger.info('training.remove', 'Deleted', { id: req.params.id });
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    logger.error('training.remove', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  logger.info('training.getSummary', 'Entry');
  try {
    const total = await Training.countDocuments();
    const completed = await Training.countDocuments({ status: 'completed' });
    const inProgress = await Training.countDocuments({ status: 'in_progress' });
    const planned = await Training.countDocuments({ status: 'planned' });
    const costAgg = await Training.aggregate([
      { $match: { cost: { $exists: true, $ne: null } } },
      { $group: { _id: null, totalCost: { $sum: '$cost' } } },
    ]);
    res.json({
      total,
      completed,
      in_progress: inProgress,
      planned,
      total_cost: costAgg[0]?.totalCost || 0,
    });
  } catch (err) {
    logger.error('training.getSummary', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
