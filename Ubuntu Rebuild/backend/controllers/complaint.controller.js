const Complaint = require('../models/Complaint.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('complaint.getAll', 'Entry', { query: req.query });
  try {
    const { type, status, urgency, page, limit } = req.query;
    const complaints = await Complaint.findAll({ type, status, urgency, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(complaints);
  } catch (err) {
    logger.error('complaint.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    logger.error('complaint.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('complaint.create', 'Entry', { body: req.body });
  try {
    const complaint = await Complaint.create({ ...req.body, submittedBy: req.user.id });
    logger.info('complaint.create', 'Created', { id: complaint.id });
    res.status(201).json(complaint);
  } catch (err) {
    logger.error('complaint.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('complaint.update', 'Entry', { id: req.params.id });
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });
    const updated = await Complaint.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('complaint.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
