const Asset = require('../models/Asset.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('asset.getAll', 'Entry', { query: req.query });
  try {
    const { type, assignedTo, page, limit } = req.query;
    const assets = await Asset.findAll({ type, assignedTo, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(assets);
  } catch (err) {
    logger.error('asset.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ msg: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    logger.error('asset.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('asset.create', 'Entry', { body: req.body });
  try {
    const asset = await Asset.create(req.body);
    logger.info('asset.create', 'Created', { id: asset.id });
    res.status(201).json(asset);
  } catch (err) {
    logger.error('asset.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('asset.update', 'Entry', { id: req.params.id });
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ msg: 'Asset not found' });
    const updated = await Asset.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('asset.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update };
