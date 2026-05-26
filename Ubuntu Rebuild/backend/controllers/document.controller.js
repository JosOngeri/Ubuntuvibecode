const EmployeeDocument = require('../models/EmployeeDocument.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('document.getAll', 'Entry', { query: req.query });
  try {
    const { employeeId, documentType, verified, page, limit } = req.query;
    const documents = await EmployeeDocument.findAll({ employeeId, documentType, verified, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(documents);
  } catch (err) {
    logger.error('document.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const document = await EmployeeDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    res.json(document);
  } catch (err) {
    logger.error('document.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('document.create', 'Entry', { body: req.body });
  try {
    const document = await EmployeeDocument.create(req.body);
    logger.info('document.create', 'Created', { id: document.id });
    res.status(201).json(document);
  } catch (err) {
    logger.error('document.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('document.update', 'Entry', { id: req.params.id });
  try {
    const document = await EmployeeDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    const updated = await EmployeeDocument.update(req.params.id, { ...req.body, verifiedBy: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('document.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
