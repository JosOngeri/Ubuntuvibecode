const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

// Get all settings (admin only)
exports.getAllSettings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM settings ORDER BY category, key'
    );
    
    // Group settings by category
    const grouped = result.rows.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({ success: true, settings: grouped });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
};

// Get public settings (accessible by all users)
exports.getPublicSettings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT key, value, value_type FROM settings WHERE is_public = true ORDER BY key'
    );
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = parseValue(row.value, row.value_type);
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch public settings' });
  }
};

// Get setting by key
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }

    const setting = result.rows[0];
    setting.value = parseValue(setting.value, setting.value_type);

    res.json({ success: true, setting });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch setting' });
  }
};

// Create new setting (admin only)
exports.createSetting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { key, value, value_type, category, label, description, is_public, is_editable, validation_rules } = req.body;

    const result = await pool.query(
      `INSERT INTO settings (key, value, value_type, category, label, description, is_public, is_editable, validation_rules)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [key, value, value_type, category, label, description, is_public, is_editable, validation_rules]
    );

    res.status(201).json({ success: true, setting: result.rows[0] });
  } catch (error) {
    console.error('Error creating setting:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Setting with this key already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create setting' });
  }
};

// Update setting (admin only)
exports.updateSetting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { key } = req.params;
    const { value, label, description, is_public, is_editable, validation_rules } = req.body;

    const settingResult = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );

    if (settingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }

    const setting = settingResult.rows[0];

    if (!setting.is_editable) {
      return res.status(403).json({ success: false, error: 'This setting cannot be edited' });
    }

    const result = await pool.query(
      `UPDATE settings 
       SET value = COALESCE($1, value),
           label = COALESCE($2, label),
           description = COALESCE($3, description),
           is_public = COALESCE($4, is_public),
           is_editable = COALESCE($5, is_editable),
           validation_rules = COALESCE($6, validation_rules)
       WHERE key = $7
       RETURNING *`,
      [value, label, description, is_public, is_editable, validation_rules, key]
    );

    res.json({ success: true, setting: result.rows[0] });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
};

// Update multiple settings (admin only)
exports.updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, error: 'Settings must be an array' });
    }

    const updated = [];
    const errors = [];

    for (const settingData of settings) {
      try {
        const { key, value } = settingData;

        const settingResult = await pool.query(
          'SELECT * FROM settings WHERE key = $1',
          [key]
        );

        if (settingResult.rows.length === 0) {
          errors.push({ key, error: 'Setting not found' });
          continue;
        }

        const setting = settingResult.rows[0];

        if (!setting.is_editable) {
          errors.push({ key, error: 'This setting cannot be edited' });
          continue;
        }

        const result = await pool.query(
          'UPDATE settings SET value = $1 WHERE key = $2 RETURNING *',
          [value, key]
        );

        updated.push(result.rows[0]);
      } catch (error) {
        errors.push({ key: settingData.key, error: error.message });
      }
    }

    res.json({ 
      success: true, 
      updated, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error) {
    console.error('Error updating multiple settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};

// Delete setting (admin only)
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const settingResult = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );

    if (settingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }

    const setting = settingResult.rows[0];

    if (!setting.is_editable) {
      return res.status(403).json({ success: false, error: 'This setting cannot be deleted' });
    }

    await pool.query('DELETE FROM settings WHERE key = $1', [key]);

    res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ success: false, error: 'Failed to delete setting' });
  }
};

// Helper function to parse values based on type
function parseValue(value, type) {
  switch (type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true';
    case 'json':
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    default:
      return value;
  }
}

// Validate setting value
exports.validateSettingValue = (value, validation_rules) => {
  if (!validation_rules) return { valid: true };

  const rules = typeof validation_rules === 'string' 
    ? JSON.parse(validation_rules) 
    : validation_rules;

  if (rules.minLength && value.length < rules.minLength) {
    return { valid: false, error: `Value must be at least ${rules.minLength} characters` };
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return { valid: false, error: `Value must not exceed ${rules.maxLength} characters` };
  }

  if (rules.min && parseFloat(value) < rules.min) {
    return { valid: false, error: `Value must be at least ${rules.min}` };
  }

  if (rules.max && parseFloat(value) > rules.max) {
    return { valid: false, error: `Value must not exceed ${rules.max}` };
  }

  if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
    return { valid: false, error: 'Value format is invalid' };
  }

  if (rules.enum && !rules.enum.includes(value)) {
    return { valid: false, error: `Value must be one of: ${rules.enum.join(', ')}` };
  }

  return { valid: true };
};
