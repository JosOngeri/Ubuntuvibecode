const Settings = require('../models/Settings.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  try {
    const settings = await Settings.getAll();
    res.json(settings);
  } catch (err) {
    logger.error('settings.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getByCategory = async (req, res) => {
  try {
    const settings = await Settings.getByCategory(req.params.category);
    res.json(settings);
  } catch (err) {
    logger.error('settings.getByCategory', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('settings.create', 'Entry', { body: req.body });
  try {
    const setting = await Settings.create(req.body);
    logger.info('settings.create', 'Created', { id: setting.id });
    res.status(201).json(setting);
  } catch (err) {
    logger.error('settings.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('settings.update', 'Entry', { id: req.params.id });
  try {
    const existing = await require('../models/Settings.model').findByKey(req.body.settingKey, req.body.category);
    if (existing) {
      await Settings.logAudit({
        settingKey: req.body.settingKey,
        category: req.body.category,
        oldValue: existing.settingValue,
        newValue: req.body.settingValue,
        changedBy: req.user.id,
        impactAnalysis: req.body.impactAnalysis,
        reason: req.body.reason,
      });
    }
    const updated = await Settings.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ msg: 'Setting not found' });
    res.json(updated);
  } catch (err) {
    logger.error('settings.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    await Settings.remove(req.params.id);
    res.json({ msg: 'Setting deleted' });
  } catch (err) {
    logger.error('settings.remove', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAuditLog = async (req, res) => {
  try {
    const { settingKey, category, limit } = req.query;
    const logs = await Settings.getAuditLog({ settingKey, category, limit: parseInt(limit)||100 });
    res.json(logs);
  } catch (err) {
    logger.error('settings.getAuditLog', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getByCategory, create, update, remove, getAuditLog };
