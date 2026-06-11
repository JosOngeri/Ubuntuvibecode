/**
 * Settings Service
 * Centralized service for managing system configuration settings
 */

const { query } = require('../../config/db');
const logger = require('../../utils/logger');

const settingsService = {
  /**
   * Get a setting value by key
   * @param {string} key - Setting key
   * @returns {Promise<any>}
   */
  async getSetting(key) {
    try {
      const { rows } = await query('SELECT value FROM settings WHERE key = $1 LIMIT 1', [key]);

      if (rows.length === 0) {
        return null;
      }

      // Parse JSON if stored as JSON
      const value = rows[0].value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('settings.service.getSetting', 'Failed', { key, error: error.message });
      throw error;
    }
  },

  /**
   * Get multiple settings by keys
   * @param {Array<string>} keys - Array of setting keys
   * @returns {Promise<Object>}
   */
  async getSettings(keys) {
    try {
      const { rows } = await query('SELECT key, value FROM settings WHERE key = ANY($1)', [keys]);

      const settings = {};
      rows.forEach(row => {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      });

      return settings;
    } catch (error) {
      logger.error('settings.service.getSettings', 'Failed', { keys, error: error.message });
      throw error;
    }
  },

  /**
   * Get all settings
   * @returns {Promise<Object>}
   */
  async getAllSettings() {
    try {
      const { rows } = await query('SELECT key, value FROM settings ORDER BY key');

      const settings = {};
      rows.forEach(row => {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      });

      return settings;
    } catch (error) {
      logger.error('settings.service.getAllSettings', 'Failed', { error: error.message });
      throw error;
    }
  },

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   * @returns {Promise<boolean>}
   */
  async setSetting(key, value) {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      const { rows } = await query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
         RETURNING key`,
        [key, stringValue]
      );

      logger.info('settings.service.setSetting', 'Success', { key });
      return rows.length > 0;
    } catch (error) {
      logger.error('settings.service.setSetting', 'Failed', { key, error: error.message });
      throw error;
    }
  },

  /**
   * Set multiple settings
   * @param {Object} settings - Object with key-value pairs
   * @returns {Promise<boolean>}
   */
  async setSettings(settings) {
    try {
      const keys = Object.keys(settings);
      const values = Object.values(settings);

      const queries = keys.map((key, index) => {
        const value = values[index];
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, stringValue]
        );
      });

      await Promise.all(queries);

      logger.info('settings.service.setSettings', 'Success', { keys });
      return true;
    } catch (error) {
      logger.error('settings.service.setSettings', 'Failed', { error: error.message });
      throw error;
    }
  },

  /**
   * Delete a setting
   * @param {string} key - Setting key
   * @returns {Promise<boolean>}
   */
  async deleteSetting(key) {
    try {
      const { rowCount } = await query('DELETE FROM settings WHERE key = $1', [key]);

      logger.info('settings.service.deleteSetting', 'Success', { key });
      return rowCount > 0;
    } catch (error) {
      logger.error('settings.service.deleteSetting', 'Failed', { key, error: error.message });
      throw error;
    }
  },

  /**
   * Get setting with default value
   * @param {string} key - Setting key
   * @param {any} defaultValue - Default value if setting not found
   * @returns {Promise<any>}
   */
  async getSettingWithDefault(key, defaultValue) {
    const value = await this.getSetting(key);
    return value !== null ? value : defaultValue;
  },

  /**
   * Check if backdated attendance is allowed
   * @returns {Promise<boolean>}
   */
  async isBackdatedAttendanceAllowed() {
    return await this.getSettingWithDefault('allow_backdated_attendance', false);
  },

  /**
   * Get attendance grace period in minutes
   * @returns {Promise<number>}
   */
  async getAttendanceGracePeriod() {
    return await this.getSettingWithDefault('attendance_grace_period', 15);
  },

  /**
   * Get payroll processing day (day of month)
   * @returns {Promise<number>}
   */
  async getPayrollProcessingDay() {
    return await this.getSettingWithDefault('payroll_processing_day', 25);
  },

  /**
   * Get company name
   * @returns {Promise<string>}
   */
  async getCompanyName() {
    return await this.getSettingWithDefault('company_name', 'Ubuntu HRMS');
  },

  /**
   * Get company logo URL
   * @returns {Promise<string>}
   */
  async getCompanyLogo() {
    return await this.getSettingWithDefault('company_logo', '');
  },
};

module.exports = settingsService;
