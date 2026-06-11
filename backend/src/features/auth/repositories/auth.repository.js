/**
 * Auth Repository
 * Pure data access layer for authentication operations
 * No business logic, only SQL/database operations
 */

const User = require('../../../../models/User.model');

const authRepository = {
  /**
   * Find user by username
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  async findByUsername(username) {
    return await User.findOne({ username });
  },

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return await User.findOne({ email });
  },

  /**
   * Find user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await User.findById(id);
  },

  /**
   * Find user by reset token
   * @param {string} resetTokenHash
   * @returns {Promise<Object|null>}
   */
  async findByResetToken(resetTokenHash) {
    return await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpire: { $gt: Date.now() },
    });
  },

  /**
   * Create new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    const user = new User(userData);
    await user.save();
    return user;
  },

  /**
   * Update user
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    const user = await User.findById(id);
    if (!user) return null;

    Object.assign(user, updates);
    await user.save();
    return user;
  },

  /**
   * Update user password
   * @param {number} id
   * @param {string} hashedPassword
   * @returns {Promise<Object>}
   */
  async updatePassword(id, hashedPassword) {
    return await this.update(id, { password: hashedPassword });
  },

  /**
   * Set reset token for user
   * @param {number} id
   * @param {string} resetTokenHash
   * @param {Date} expiry
   * @returns {Promise<Object>}
   */
  async setResetToken(id, resetTokenHash, expiry) {
    return await this.update(id, {
      resetToken: resetTokenHash,
      resetTokenExpire: expiry,
    });
  },

  /**
   * Clear reset token for user
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async clearResetToken(id) {
    return await this.update(id, {
      resetToken: null,
      resetTokenExpire: null,
    });
  },
};

module.exports = authRepository;
