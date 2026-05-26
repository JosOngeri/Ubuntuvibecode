const User = require('../models/User.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('user.getAll', 'Entry', { query: req.query });
  try {
    const { role, status, search, page, limit } = req.query;
    const users = await User.findAll({ role, status, search, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(users);
  } catch (err) {
    logger.error('user.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('user.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('user.create', 'Entry', { body: req.body });
  try {
    const user = await User.create(req.body);
    logger.info('user.create', 'Created', { id: user.id });
    res.status(201).json(user);
  } catch (err) {
    logger.error('user.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('user.update', 'Entry', { id: req.params.id });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const updated = await User.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('user.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    await User.remove(req.params.id);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    logger.error('user.remove', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update, remove };
