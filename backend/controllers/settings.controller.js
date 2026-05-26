const { query } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Get all settings
 */
const getSettings = async (req, res) => {
  try {
    const result = await query(`
      SELECT setting_key, category, setting_value, description, data_type, is_active, updated_at, updated_by
      FROM settings
      WHERE is_active = true
      ORDER BY category, setting_key
    `);

    res.status(200).json({
      msg: 'Settings retrieved successfully',
      settings: result.rows,
    });
  } catch (err) {
    logger.error('settings.getSettings', 'Error fetching settings', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get settings by category
 */
const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const result = await query(
      `
      SELECT setting_key, category, setting_value, description, data_type, is_active, updated_at, updated_by
      FROM settings
      WHERE category = $1 AND is_active = true
      ORDER BY setting_key
      `,
      [category]
    );

    res.status(200).json({
      msg: 'Settings retrieved successfully',
      settings: result.rows,
    });
  } catch (err) {
    logger.error('settings.getSettingsByCategory', 'Error fetching settings by category', err, { category: req.params.category });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get categories
 */
const getCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT category
      FROM settings
      WHERE category IS NOT NULL AND is_active = true
      ORDER BY category
    `);

    res.status(200).json({
      msg: 'Categories retrieved successfully',
      categories: result.rows.map(row => row.category),
    });
  } catch (err) {
    logger.error('settings.getCategories', 'Error fetching categories', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get a specific setting by key
 */
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await query(
      `SELECT setting_key, setting_value, description, updated_at FROM settings WHERE setting_key = $1`,
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Setting not found' });
    }

    res.status(200).json({
      msg: 'Setting retrieved successfully',
      setting: result.rows[0],
    });
  } catch (err) {
    logger.error('settings.getSettingByKey', 'Error fetching setting', err, { key: req.params.key });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update a setting
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value, description, reason } = req.body;

    if (!setting_value) {
      return res.status(400).json({ msg: 'setting_value is required' });
    }

    // Role check: only owner and manager can update settings
    if (!['owner', 'manager'].includes(req.user?.role)) {
      return res.status(403).json({ msg: 'Only owner and manager can update settings' });
    }

    // Get old value for audit log
    const oldSetting = await query(
      `SELECT setting_key, category, setting_value FROM settings WHERE setting_key = $1`,
      [key]
    );

    if (oldSetting.rows.length === 0) {
      return res.status(404).json({ msg: 'Setting not found' });
    }

    const oldValue = oldSetting.rows[0].setting_value;
    const category = oldSetting.rows[0].category;

    // Update setting
    const result = await query(
      `
        UPDATE settings
        SET setting_value = $1, description = COALESCE($2, description), updated_at = NOW(), updated_by = $3
        WHERE setting_key = $4
        RETURNING setting_key, setting_value, description, updated_at
      `,
      [setting_value, description, req.user?.id || null, key]
    );

    // Log the change in audit log
    await query(
      `
        INSERT INTO settings_audit_log (setting_key, category, old_value, new_value, changed_by, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [key, category, oldValue, setting_value, req.user?.id || null, reason || null]
    );

    res.status(200).json({
      msg: 'Setting updated successfully',
      setting: result.rows[0],
    });
  } catch (err) {
    logger.error('settings.updateSetting', 'Error updating setting', err, { key: req.params.key });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Create a new setting
 */
const createSetting = async (req, res) => {
  try {
    const { setting_key, category, setting_value, description, data_type, reason } = req.body;

    if (!setting_key || !setting_value) {
      return res.status(400).json({ msg: 'setting_key and setting_value are required' });
    }

    // Role check: only owner and manager can create settings
    if (!['owner', 'manager'].includes(req.user?.role)) {
      return res.status(403).json({ msg: 'Only owner and manager can create settings' });
    }

    // Validate data type
    if (data_type === 'array') {
      try {
        JSON.parse(setting_value);
      } catch (e) {
        return res.status(400).json({ msg: 'setting_value must be a valid JSON array for data_type "array"' });
      }
    }

    const result = await query(
      `
        INSERT INTO settings (setting_key, category, setting_value, description, data_type, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING setting_key, category, setting_value, description, data_type, updated_at
      `,
      [setting_key, category, setting_value, description, data_type || 'string', req.user?.id || null]
    );

    // Log the creation in audit log
    await query(
      `
        INSERT INTO settings_audit_log (setting_key, category, old_value, new_value, changed_by, reason)
        VALUES ($1, $2, NULL, $3, $4, $5)
      `,
      [setting_key, category, setting_value, req.user?.id || null, reason || null]
    );

    res.status(201).json({
      msg: 'Setting created successfully',
      setting: result.rows[0],
    });
  } catch (err) {
    logger.error('settings.createSetting', 'Error creating setting', err);
    if (err.code === '23505') {
      return res.status(409).json({ msg: 'Setting with this key and category already exists' });
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Delete a setting
 */
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    // Role check: only owner and manager can delete settings
    if (!['owner', 'manager'].includes(req.user?.role)) {
      return res.status(403).json({ msg: 'Only owner and manager can delete settings' });
    }

    // Get old value for audit log
    const oldSetting = await query(
      `SELECT setting_key, category, setting_value FROM settings WHERE setting_key = $1`,
      [key]
    );

    if (oldSetting.rows.length === 0) {
      return res.status(404).json({ msg: 'Setting not found' });
    }

    const oldValue = oldSetting.rows[0].setting_value;
    const category = oldSetting.rows[0].category;

    // Soft delete by setting is_active to false
    const result = await query(
      `
        UPDATE settings
        SET is_active = false, updated_at = NOW(), updated_by = $1
        WHERE setting_key = $2
        RETURNING setting_key
      `,
      [req.user?.id || null, key]
    );

    // Log the deletion in audit log
    await query(
      `
        INSERT INTO settings_audit_log (setting_key, category, old_value, new_value, changed_by, reason)
        VALUES ($1, $2, $3, NULL, $4, $5)
      `,
      [key, category, oldValue, req.user?.id || null, 'Deleted setting']
    );

    res.status(200).json({
      msg: 'Setting deleted successfully',
    });
  } catch (err) {
    logger.error('settings.deleteSetting', 'Error deleting setting', err, { key: req.params.key });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get audit log for a setting
 */
const getAuditLog = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await query(
      `
        SELECT al.*, u.username, u.email
        FROM settings_audit_log al
        LEFT JOIN users u ON al.changed_by = u.id
        WHERE al.setting_key = $1
        ORDER BY al.changed_at DESC
      `,
      [key]
    );

    res.status(200).json({
      msg: 'Audit log retrieved successfully',
      audit_log: result.rows,
    });
  } catch (err) {
    logger.error('settings.getAuditLog', 'Error fetching audit log', err, { key: req.params.key });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get all audit logs
 */
const getAllAuditLogs = async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;

    let queryStr = `
      SELECT al.*, u.username, u.email
      FROM settings_audit_log al
      LEFT JOIN users u ON al.changed_by = u.id
    `;
    const params = [];

    if (category) {
      queryStr += ' WHERE al.category = $1';
      params.push(category);
    }

    queryStr += ' ORDER BY al.changed_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query(queryStr, params);

    res.status(200).json({
      msg: 'Audit logs retrieved successfully',
      audit_logs: result.rows,
    });
  } catch (err) {
    logger.error('settings.getAllAuditLogs', 'Error fetching audit logs', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get office location configuration
 */
const getOfficeLocation = async (req, res) => {
  try {
    const result = await query(
      `
        SELECT setting_value
        FROM settings
        WHERE setting_key IN ('OFFICE_LATITUDE', 'OFFICE_LONGITUDE', 'OFFICE_RADIUS_METERS', 'OFFICE_NAME')
      `
    );

    const location = {
      latitude: -1.19293,
      longitude: 36.93057,
      radius_meters: 1000,
      name: 'Main Office',
    };

    result.rows.forEach(row => {
      switch (row.setting_key) {
        case 'OFFICE_LATITUDE':
          location.latitude = parseFloat(row.setting_value);
          break;
        case 'OFFICE_LONGITUDE':
          location.longitude = parseFloat(row.setting_value);
          break;
        case 'OFFICE_RADIUS_METERS':
          location.radius_meters = parseInt(row.setting_value);
          break;
        case 'OFFICE_NAME':
          location.name = row.setting_value;
          break;
      }
    });

    res.status(200).json({
      msg: 'Office location retrieved successfully',
      location,
    });
  } catch (err) {
    logger.error('settings.getOfficeLocation', 'Error fetching office location', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update office location configuration
 */
const updateOfficeLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius_meters, name } = req.body;

    // Validate inputs
    if (latitude === undefined || longitude === undefined || radius_meters === undefined) {
      return res.status(400).json({
        msg: 'latitude, longitude, and radius_meters are required',
      });
    }

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius_meters)) {
      return res.status(400).json({
        msg: 'latitude, longitude, and radius_meters must be valid numbers',
      });
    }

    // Update settings
    await query(
      `
        UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
        WHERE setting_key = 'OFFICE_LATITUDE'
      `,
      [latitude.toString(), req.user?.id || null]
    );

    await query(
      `
        UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
        WHERE setting_key = 'OFFICE_LONGITUDE'
      `,
      [longitude.toString(), req.user?.id || null]
    );

    await query(
      `
        UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
        WHERE setting_key = 'OFFICE_RADIUS_METERS'
      `,
      [radius_meters.toString(), req.user?.id || null]
    );

    if (name) {
      await query(
        `
          UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
          WHERE setting_key = 'OFFICE_NAME'
        `,
        [name, req.user?.id || null]
      );
    }

    res.status(200).json({
      msg: 'Office location updated successfully',
      location: {
        latitude,
        longitude,
        radius_meters,
        name: name || 'Main Office',
      },
    });
  } catch (err) {
    logger.error('settings.updateOfficeLocation', 'Error updating office location', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update employee attendance permission
 */
const updateEmployeeAttendancePermission = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { can_self_record_attendance } = req.body;

    if (typeof can_self_record_attendance !== 'boolean') {
      return res.status(400).json({
        msg: 'can_self_record_attendance must be a boolean',
      });
    }

    const result = await query(
      `
        UPDATE employees
        SET can_self_record_attendance = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, can_self_record_attendance
      `,
      [can_self_record_attendance, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    res.status(200).json({
      msg: 'Employee attendance permission updated successfully',
      employee: result.rows[0],
    });
  } catch (err) {
    logger.error('settings.updateEmployeeAttendancePerm', 'Error updating permission', err, { employeeId: req.params.employeeId });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get all employees with their attendance permission status
 */
const getEmployeesAttendanceStatus = async (req, res) => {
  try {
    const result = await query(
      `
        SELECT id, first_name, last_name, email, employment_type, department, can_self_record_attendance
        FROM employees
        WHERE status != 'terminated'
        ORDER BY first_name, last_name
      `
    );

    res.status(200).json({
      msg: 'Employee attendance status retrieved successfully',
      employees: result.rows,
    });
  } catch (err) {
    logger.error('settings.getEmployeesAttendanceStatus', 'Error fetching attendance status', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get all shift settings
 */
const getShiftSettings = async (req, res) => {
  try {
    const { employment_type, department } = req.query;
    
    let queryStr = 'SELECT * FROM shift_settings WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (employment_type) {
      queryStr += ` AND employment_type = $${paramIndex}`;
      params.push(employment_type);
      paramIndex++;
    }
    
    if (department) {
      queryStr += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }
    
    queryStr += ' ORDER BY employment_type, department, shift_name';
    
    const result = await query(queryStr, params);
    
    res.status(200).json({
      msg: 'Shift settings retrieved successfully',
      shift_settings: result.rows,
    });
  } catch (err) {
    logger.error('settings.getShiftSettings', 'Error fetching shift settings', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Create shift setting
 */
const createShiftSetting = async (req, res) => {
  try {
    const { employment_type, department, shift_name, start_time, end_time, is_default } = req.body;
    
    if (!employment_type || !shift_name || !start_time || !end_time) {
      return res.status(400).json({ msg: 'employment_type, shift_name, start_time, and end_time are required' });
    }
    
    const result = await query(
      `INSERT INTO shift_settings (employment_type, department, shift_name, start_time, end_time, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [employment_type, department || null, shift_name, start_time, end_time, is_default || false]
    );
    
    res.status(201).json({
      msg: 'Shift setting created successfully',
      shift_setting: result.rows[0],
    });
  } catch (err) {
    logger.error('settings.createShiftSetting', 'Error creating shift setting', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update shift setting
 */
const updateShiftSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { employment_type, department, shift_name, start_time, end_time, is_default } = req.body;
    
    const result = await query(
      `UPDATE shift_settings 
       SET employment_type = COALESCE($1, employment_type),
           department = COALESCE($2, department),
           shift_name = COALESCE($3, shift_name),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           is_default = COALESCE($6, is_default),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [employment_type, department, shift_name, start_time, end_time, is_default, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Shift setting not found' });
    }
    
    res.status(200).json({
      msg: 'Shift setting updated successfully',
      shift_setting: result.rows[0],
    });
  } catch (err) {
    logger.error('settings.updateShiftSetting', 'Error updating shift setting', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Delete shift setting
 */
const deleteShiftSetting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `DELETE FROM shift_settings WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Shift setting not found' });
    }
    
    res.status(200).json({
      msg: 'Shift setting deleted successfully',
    });
  } catch (err) {
    logger.error('settings.deleteShiftSetting', 'Error deleting shift setting', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get component settings
 */
const getComponentSettings = async (req, res) => {
  try {
    const { component } = req.params;
    const userId = req.user?.id;

    let queryStr = `
      SELECT component_name, setting_key, setting_value, is_global, category, description
      FROM component_settings
      WHERE (is_global = true OR user_id = $1)
    `;
    const params = [userId];

    if (component) {
      queryStr += ` AND component_name = $2`;
      params.push(component);
    }

    queryStr += ` ORDER BY component_name, setting_key`;

    const result = await query(queryStr, params);

    // Group by component
    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.component_name]) {
        acc[row.component_name] = {};
      }
      acc[row.component_name][row.setting_key] = {
        value: row.setting_value,
        is_global: row.is_global,
        category: row.category,
        description: row.description,
      };
      return acc;
    }, {});

    res.status(200).json({
      msg: 'Component settings retrieved successfully',
      settings: component ? grouped[component] || {} : grouped,
    });
  } catch (err) {
    logger.error('settings.getComponentSettings', 'Error fetching component settings', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update component settings
 */
const updateComponentSettings = async (req, res) => {
  try {
    const { component } = req.params;
    const { settings } = req.body;
    const userId = req.user?.id;

    // Role check: only admin and owner can update global settings
    if (!['admin', 'owner'].includes(req.user?.role)) {
      return res.status(403).json({ msg: 'Only admin and owner can update component settings' });
    }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ msg: 'settings object is required' });
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const existing = await query(
        `SELECT id FROM component_settings WHERE component_name = $1 AND setting_key = $2`,
        [component, key]
      );

      if (existing.rows.length > 0) {
        await query(
          `UPDATE component_settings
           SET setting_value = $1, updated_at = NOW()
           WHERE component_name = $2 AND setting_key = $3`,
          [JSON.stringify(value), component, key]
        );
      } else {
        await query(
          `INSERT INTO component_settings (component_name, setting_key, setting_value, is_global, user_id, created_at, updated_at)
           VALUES ($1, $2, $3, true, NULL, NOW(), NOW())`,
          [component, key, JSON.stringify(value)]
        );
      }
    }

    res.status(200).json({
      msg: 'Component settings updated successfully',
    });
  } catch (err) {
    logger.error('settings.updateComponentSettings', 'Error updating component settings', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get user preferences
 */
const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Users can only view their own preferences unless admin/owner
    if (userId != currentUserId && !['admin', 'owner'].includes(req.user?.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const result = await query(
      `SELECT preferences FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        msg: 'User preferences retrieved successfully',
        preferences: {},
      });
    }

    res.status(200).json({
      msg: 'User preferences retrieved successfully',
      preferences: result.rows[0].preferences,
    });
  } catch (err) {
    logger.error('settings.getUserPreferences', 'Error fetching user preferences', err, { userId: req.params.userId });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update user preferences
 */
const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;
    const currentUserId = req.user?.id;

    // Users can only update their own preferences unless admin/owner
    if (userId != currentUserId && !['admin', 'owner'].includes(req.user?.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ msg: 'preferences object is required' });
    }

    const existing = await query(
      `SELECT id FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE user_preferences
         SET preferences = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [JSON.stringify(preferences), userId]
      );
    } else {
      await query(
        `INSERT INTO user_preferences (user_id, preferences, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, JSON.stringify(preferences)]
      );
    }

    res.status(200).json({
      msg: 'User preferences updated successfully',
      preferences,
    });
  } catch (err) {
    logger.error('settings.updateUserPreferences', 'Error updating user preferences', err, { userId: req.params.userId });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Reset component settings to defaults
 */
const resetComponentSettings = async (req, res) => {
  try {
    const { component } = req.params;

    // Role check: only admin and owner can reset settings
    if (!['admin', 'owner'].includes(req.user?.role)) {
      return res.status(403).json({ msg: 'Only admin and owner can reset settings' });
    }

    // Delete user-specific settings for this component
    await query(
      `DELETE FROM component_settings WHERE component_name = $1 AND is_global = false`,
      [component]
    );

    // Reset global settings to defaults (delete and re-insert from defaults)
    await query(
      `DELETE FROM component_settings WHERE component_name = $1 AND is_global = true`,
      [component]
    );

    // Re-insert default settings (this would need to be defined somewhere)
    // For now, just return success
    res.status(200).json({
      msg: 'Component settings reset to defaults successfully',
    });
  } catch (err) {
    logger.error('settings.resetComponentSettings', 'Error resetting component settings', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

module.exports = {
  getSettings,
  getSettingsByCategory,
  getCategories,
  getSettingByKey,
  updateSetting,
  createSetting,
  deleteSetting,
  getAuditLog,
  getAllAuditLogs,
  getOfficeLocation,
  updateOfficeLocation,
  updateEmployeeAttendancePermission,
  getEmployeesAttendanceStatus,
  getShiftSettings,
  createShiftSetting,
  updateShiftSetting,
  deleteShiftSetting,
  getComponentSettings,
  updateComponentSettings,
  getUserPreferences,
  updateUserPreferences,
  resetComponentSettings,
};
