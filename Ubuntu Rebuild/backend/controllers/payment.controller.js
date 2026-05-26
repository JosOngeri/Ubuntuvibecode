const Payment = require('../models/Payment.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('payment.getAll', 'Entry', { query: req.query });
  try {
    const { payeeType, payeeId, status, page, limit } = req.query;
    const payments = await Payment.findAll({ payeeType, payeeId, status, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(payments);
  } catch (err) {
    logger.error('payment.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ msg: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    logger.error('payment.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('payment.create', 'Entry', { body: req.body });
  try {
    const payment = await Payment.create({ ...req.body, processedBy: req.user.id });
    logger.info('payment.create', 'Created', { id: payment.id });
    res.status(201).json(payment);
  } catch (err) {
    logger.error('payment.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('payment.update', 'Entry', { id: req.params.id });
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ msg: 'Payment not found' });
    const updated = await Payment.update(req.params.id, { ...req.body, processedBy: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('payment.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
