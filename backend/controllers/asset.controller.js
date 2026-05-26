const Asset = require('../models/Asset.model');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  logger.info('asset.getAll', 'Entry', { filter: req.query });
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const assets = await Asset.find(filter);
    logger.info('asset.getAll', `Returning ${assets.length} assets`);
    res.json(assets);
  } catch (err) {
    logger.error('asset.getAll', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  logger.info('asset.create', 'Entry', { userId: req.user?.id });
  try {
    const asset = new Asset(req.body);
    await asset.save();
    logger.info('asset.create', 'Created', { assetId: asset.id });
    res.status(201).json(asset);
  } catch (err) {
    logger.error('asset.create', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  logger.info('asset.update', 'Entry', { id: req.params.id });
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body);
    if (!asset) {
      logger.warn('asset.update', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Asset not found' });
    }
    logger.info('asset.update', 'Updated', { id: req.params.id });
    res.json(asset);
  } catch (err) {
    logger.error('asset.update', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  logger.info('asset.remove', 'Entry', { id: req.params.id });
  try {
    await Asset.findByIdAndDelete(req.params.id);
    logger.info('asset.remove', 'Removed', { id: req.params.id });
    res.json({ msg: 'Asset removed' });
  } catch (err) {
    logger.error('asset.remove', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.returnAsset = async (req, res) => {
  logger.info('asset.return', 'Entry', { id: req.params.id });
  try {
    const { returnCondition } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      logger.warn('asset.return', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Asset not found' });
    }
    asset.status = 'returned';
    asset.returnDate = new Date();
    asset.returnCondition = returnCondition || asset.condition;
    asset.assignedTo = null;
    await asset.save();
    logger.info('asset.return', 'Returned', { id: req.params.id });
    res.json(asset);
  } catch (err) {
    logger.error('asset.return', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
