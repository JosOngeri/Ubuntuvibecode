const EmployeeDocument = require('../models/EmployeeDocument.model');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  logger.info('document.getAll', 'Entry', { filter: req.query });
  try {
    const filter = {};
    if (req.query.employee_id) filter.employee_id = req.query.employee_id;
    if (req.query.doc_type) filter.doc_type = req.query.doc_type;
    const docs = await EmployeeDocument.find(filter)
      .populate('employee_id', 'first_name last_name department')
      .populate('verified_by', 'username email')
      .sort({ createdAt: -1 });
    logger.info('document.getAll', `Returning ${docs.length} docs`);
    res.json(docs);
  } catch (err) {
    logger.error('document.getAll', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  logger.info('document.getById', 'Entry', { id: req.params.id });
  try {
    const doc = await EmployeeDocument.findById(req.params.id)
      .populate('employee_id', 'first_name last_name');
    if (!doc) {
      logger.warn('document.getById', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Document not found' });
    }
    res.json(doc);
  } catch (err) {
    logger.error('document.getById', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  logger.info('document.create', 'Entry', { userId: req.user?.id });
  try {
    const doc = await EmployeeDocument.create(req.body);
    logger.info('document.create', 'Created', { id: doc.id || doc._id });
    res.status(201).json(doc);
  } catch (err) {
    logger.error('document.create', 'Validation/DB error', err);
    res.status(400).json({ msg: 'Validation error', error: err.message });
  }
};

exports.update = async (req, res) => {
  logger.info('document.update', 'Entry', { id: req.params.id });
  try {
    const doc = await EmployeeDocument.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) {
      logger.warn('document.update', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Document not found' });
    }
    logger.info('document.update', 'Updated', { id: req.params.id });
    res.json(doc);
  } catch (err) {
    logger.error('document.update', 'Validation/DB error', err, { id: req.params.id });
    res.status(400).json({ msg: 'Validation error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  logger.info('document.remove', 'Entry', { id: req.params.id });
  try {
    const doc = await EmployeeDocument.findByIdAndDelete(req.params.id);
    if (!doc) {
      logger.warn('document.remove', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Document not found' });
    }
    logger.info('document.remove', 'Deleted', { id: req.params.id });
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    logger.error('document.remove', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.verify = async (req, res) => {
  logger.info('document.verify', 'Entry', { id: req.params.id, by: req.user?.id });
  try {
    const doc = await EmployeeDocument.findByIdAndUpdate(
      req.params.id,
      { verified: true, verified_by: req.user?.id, verified_at: new Date() },
      { new: true }
    );
    if (!doc) {
      logger.warn('document.verify', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Document not found' });
    }
    logger.info('document.verify', 'Verified', { id: req.params.id });
    res.json(doc);
  } catch (err) {
    logger.error('document.verify', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  logger.info('document.getSummary', 'Entry');
  try {
    const total = await EmployeeDocument.countDocuments();
    const verified = await EmployeeDocument.countDocuments({ verified: true });
    const unverified = total - verified;
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = await EmployeeDocument.countDocuments({
      expiry_date: { $gte: today, $lte: in30Days },
    });
    const expired = await EmployeeDocument.countDocuments({
      expiry_date: { $lt: today },
    });
    res.json({ total, verified, unverified, expiring_soon: expiringSoon, expired });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
