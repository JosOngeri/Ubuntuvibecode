const Contractor = require('../models/Contractor.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('contractor.getAll', 'Entry', { query: req.query });
  try {
    const { status, trade, page, limit } = req.query;
    const contractors = await Contractor.findAll({ status, trade, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(contractors);
  } catch (err) {
    logger.error('contractor.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) return res.status(404).json({ msg: 'Contractor not found' });
    res.json(contractor);
  } catch (err) {
    logger.error('contractor.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('contractor.create', 'Entry', { body: req.body });
  try {
    const contractor = await Contractor.create(req.body);
    logger.info('contractor.create', 'Created', { id: contractor.id });
    res.status(201).json(contractor);
  } catch (err) {
    logger.error('contractor.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('contractor.update', 'Entry', { id: req.params.id });
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) return res.status(404).json({ msg: 'Contractor not found' });
    const updated = await Contractor.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('contractor.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllQuotes = async (req, res) => {
  try {
    const { contractorId, status, page, limit } = req.query;
    const quotes = await Contractor.findAllQuotes({ contractorId, status, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(quotes);
  } catch (err) {
    logger.error('contractor.getAllQuotes', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const createQuote = async (req, res) => {
  logger.info('contractor.createQuote', 'Entry', { body: req.body });
  try {
    const quote = await Contractor.createQuote(req.body);
    logger.info('contractor.createQuote', 'Created', { id: quote.id });
    res.status(201).json(quote);
  } catch (err) {
    logger.error('contractor.createQuote', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateQuote = async (req, res) => {
  logger.info('contractor.updateQuote', 'Entry', { id: req.params.id });
  try {
    const quote = await Contractor.updateQuote(req.params.id, req.body);
    if (!quote) return res.status(404).json({ msg: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    logger.error('contractor.updateQuote', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllMilestones = async (req, res) => {
  try {
    const { quoteId, contractorId, status, page, limit } = req.query;
    const milestones = await Contractor.findAllMilestones({ quoteId, contractorId, status, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(milestones);
  } catch (err) {
    logger.error('contractor.getAllMilestones', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const createMilestone = async (req, res) => {
  logger.info('contractor.createMilestone', 'Entry', { body: req.body });
  try {
    const milestone = await Contractor.createMilestone(req.body);
    logger.info('contractor.createMilestone', 'Created', { id: milestone.id });
    res.status(201).json(milestone);
  } catch (err) {
    logger.error('contractor.createMilestone', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateMilestone = async (req, res) => {
  logger.info('contractor.updateMilestone', 'Entry', { id: req.params.id });
  try {
    const milestone = await Contractor.updateMilestone(req.params.id, { ...req.body, verifiedBy: req.user.id });
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    res.json(milestone);
  } catch (err) {
    logger.error('contractor.updateMilestone', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update, getAllQuotes, createQuote, updateQuote, getAllMilestones, createMilestone, updateMilestone };
