const Profile = require('../models/Profile.model');
const logger = require('../utils/logger');

const profileController = {
  async getProfile(req, res) {
    const userId = req.user?.id;
    logger.info('profile.get', 'Entry', { userId });
    try {
      if (!userId) {
        logger.warn('profile.get', 'No userId in token');
        return res.status(401).json({ msg: 'Unauthorized' });
      }
      const profile = await Profile.findByUserId(userId);
      logger.info('profile.get', profile ? 'Found' : 'Not found', { userId });
      res.json(profile || {});
    } catch (err) {
      logger.error('profile.get', 'Unhandled error', err, { userId });
      res.status(500).json({ msg: 'Failed to fetch profile', error: err.message });
    }
  },
  async upsertProfile(req, res) {
    const userId = req.user?.id;
    logger.info('profile.upsert', 'Entry', { userId });
    try {
      if (!userId) {
        logger.warn('profile.upsert', 'No userId in token');
        return res.status(401).json({ msg: 'Unauthorized' });
      }
      const profile = await Profile.createOrUpdate(userId, req.body || {});
      logger.info('profile.upsert', 'Success', { userId });
      res.json(profile);
    } catch (err) {
      logger.error('profile.upsert', 'Unhandled error', err, { userId });
      res.status(400).json({ msg: 'Failed to update profile', error: err.message });
    }
  },
};

module.exports = profileController;
