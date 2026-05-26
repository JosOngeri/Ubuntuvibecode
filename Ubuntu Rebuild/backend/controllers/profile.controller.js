const Profile = require('../models/Profile.model');
const logger = require('../utils/logger');

const getMe = async (req, res) => {
  try {
    const profile = await Profile.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    logger.error('profile.getMe', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('profile.create', 'Entry', { body: req.body });
  try {
    const profile = await Profile.create({ ...req.body, userId: req.user.id });
    logger.info('profile.create', 'Created', { id: profile.id });
    res.status(201).json(profile);
  } catch (err) {
    logger.error('profile.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('profile.update', 'Entry', { userId: req.user.id });
  try {
    const profile = await Profile.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    const updated = await Profile.update(profile.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('profile.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getMe, create, update };
