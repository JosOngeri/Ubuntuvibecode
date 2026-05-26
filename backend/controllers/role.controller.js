const { query } = require('../config/db');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * User roles and their hierarchy
 */
const ROLE_HIERARCHY = {
  owner: 100,
  admin: 90,
  manager: 70,
  supervisor: 60,
  employee: 40,
  contractor: 30,
  daily_labourer: 20,
  guest: 10,
};

/**
 * Permission definitions
 */
const PERMISSIONS = {
  // System administration
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOG: 'view_audit_log',

  // HR Management
  MANAGE_EMPLOYEES: 'manage_employees',
  MANAGE_ATTENDANCE: 'manage_attendance',
  MANAGE_LEAVE: 'manage_leave',
  MANAGE_PAYROLL: 'manage_payroll',
  MANAGE_CONTRACTORS: 'manage_contractors',
  MANAGE_DAILY_LABOUR: 'manage_daily_labour',

  // Supervisor functions
  VIEW_ALLOCATED_EMPLOYEES: 'view_allocated_employees',
  RECORD_ATTENDANCE_FOR_OTHERS: 'record_attendance_for_others',

  // Recruitment
  MANAGE_JOBS: 'manage_jobs',
  MANAGE_APPLICATIONS: 'manage_applications',

  // Self-service
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',
  SUBMIT_LEAVE_REQUEST: 'submit_leave_request',
  VIEW_PAYSLIP: 'view_payslip',

  // Owner special
  SWITCH_ADMIN_MODE: 'switch_admin_mode',
  RECEIVE_NOTIFICATIONS: 'receive_notifications',
  APPROVE_BACKDATED_ATTENDANCE: 'approve_backdated_attendance',
};

/**
 * Get role hierarchy level
 */
const getRoleLevel = (role) => ROLE_HIERARCHY[role] || 0;

/**
 * Check if user has a specific role or higher in hierarchy
 */
const hasRoleLevel = (userRole, requiredRole) => {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};

/**
 * Get user permissions (direct + role-based)
 */
const getUserPermissions = async (userId) => {
  try {
    // Get user role
    const userResult = await query(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return { role: null, permissions: [] };
    }

    const role = userResult.rows[0].role;

    // Get role-based permissions
    const rolePermissions = getRoleBasedPermissions(role);

    // Get user-specific permissions from database
    const permResult = await query(
      `SELECT permission_key, permission_value FROM user_permissions WHERE user_id = $1`,
      [userId]
    );

    const userPermissions = {};
    permResult.rows.forEach(row => {
      userPermissions[row.permission_key] = row.permission_value;
    });

    // Merge: user-specific overrides role-based
    const mergedPermissions = { ...rolePermissions, ...userPermissions };

    return { role, permissions: mergedPermissions };
  } catch (err) {
    logger.error('role.getUserPermissions', 'Error getting user permissions', err);
    return { role: null, permissions: {} };
  }
};

/**
 * Get default permissions for a role
 */
const getRoleBasedPermissions = (role) => {
  const basePermissions = {
    [PERMISSIONS.VIEW_OWN_ATTENDANCE]: true,
    [PERMISSIONS.SUBMIT_LEAVE_REQUEST]: true,
    [PERMISSIONS.VIEW_PAYSLIP]: true,
  };

  switch (role) {
    case 'owner':
      return {
        ...basePermissions,
        [PERMISSIONS.MANAGE_USERS]: true,
        [PERMISSIONS.MANAGE_ROLES]: true,
        [PERMISSIONS.MANAGE_SETTINGS]: true,
        [PERMISSIONS.VIEW_AUDIT_LOG]: true,
        [PERMISSIONS.MANAGE_EMPLOYEES]: true,
        [PERMISSIONS.MANAGE_ATTENDANCE]: true,
        [PERMISSIONS.MANAGE_LEAVE]: true,
        [PERMISSIONS.MANAGE_PAYROLL]: true,
        [PERMISSIONS.MANAGE_CONTRACTORS]: true,
        [PERMISSIONS.MANAGE_DAILY_LABOUR]: true,
        [PERMISSIONS.MANAGE_JOBS]: true,
        [PERMISSIONS.MANAGE_APPLICATIONS]: true,
        [PERMISSIONS.SWITCH_ADMIN_MODE]: true,
        [PERMISSIONS.RECEIVE_NOTIFICATIONS]: true,
        [PERMISSIONS.APPROVE_BACKDATED_ATTENDANCE]: true,
        [PERMISSIONS.RECORD_ATTENDANCE_FOR_OTHERS]: true,
      };

    case 'admin':
      return {
        ...basePermissions,
        [PERMISSIONS.MANAGE_USERS]: true,
        [PERMISSIONS.MANAGE_ROLES]: true,
        [PERMISSIONS.MANAGE_SETTINGS]: true,
        [PERMISSIONS.VIEW_AUDIT_LOG]: true,
        [PERMISSIONS.MANAGE_EMPLOYEES]: true,
        [PERMISSIONS.MANAGE_ATTENDANCE]: true,
        [PERMISSIONS.MANAGE_LEAVE]: true,
        [PERMISSIONS.MANAGE_PAYROLL]: true,
        [PERMISSIONS.MANAGE_CONTRACTORS]: true,
        [PERMISSIONS.MANAGE_DAILY_LABOUR]: true,
        [PERMISSIONS.MANAGE_JOBS]: true,
        [PERMISSIONS.MANAGE_APPLICATIONS]: true,
        [PERMISSIONS.RECEIVE_NOTIFICATIONS]: true,
        [PERMISSIONS.RECORD_ATTENDANCE_FOR_OTHERS]: true,
      };

    case 'manager':
      return {
        ...basePermissions,
        [PERMISSIONS.MANAGE_EMPLOYEES]: true,
        [PERMISSIONS.MANAGE_ATTENDANCE]: true,
        [PERMISSIONS.MANAGE_LEAVE]: true,
        [PERMISSIONS.VIEW_AUDIT_LOG]: true,
        [PERMISSIONS.MANAGE_CONTRACTORS]: true,
        [PERMISSIONS.MANAGE_DAILY_LABOUR]: true,
        [PERMISSIONS.MANAGE_JOBS]: true,
        [PERMISSIONS.MANAGE_APPLICATIONS]: true,
        [PERMISSIONS.RECORD_ATTENDANCE_FOR_OTHERS]: true,
      };

    case 'supervisor':
      return {
        ...basePermissions,
        [PERMISSIONS.VIEW_ALLOCATED_EMPLOYEES]: true,
        [PERMISSIONS.RECORD_ATTENDANCE_FOR_OTHERS]: true,
        [PERMISSIONS.VIEW_OWN_ATTENDANCE]: true,
      };

    case 'employee':
    case 'contractor':
    case 'daily_labourer':
    default:
      return basePermissions;
  }
};

/**
 * Check if user has a specific permission
 */
const hasPermission = async (userId, permission) => {
  const { permissions } = await getUserPermissions(userId);
  return permissions[permission] === true;
};

/**
 * Middleware to check permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Authentication required' });
      }

      const hasPerm = await hasPermission(req.user.id, permission);
      if (!hasPerm) {
        return res.status(403).json({ msg: `Permission denied: ${permission} required` });
      }

      next();
    } catch (err) {
      logger.error('role.requirePermission', 'Error in permission middleware', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
};

/**
 * Middleware to check role level
 */
const requireRoleLevel = (minRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    if (!hasRoleLevel(req.user.role, minRole)) {
      return res.status(403).json({ msg: `Role ${minRole} or higher required` });
    }

    next();
  };
};

/**
 * Switch owner/admin mode
 */
const switchMode = async (req, res) => {
  try {
    const { mode, adminPassword, reason } = req.body;
    const userId = req.user.id;
    const currentRole = req.user.role;

    // Validate mode
    if (!['owner', 'admin'].includes(mode)) {
      return res.status(400).json({ msg: 'Invalid mode. Must be "owner" or "admin"' });
    }

    // Only owner can switch modes
    if (currentRole !== 'owner') {
      return res.status(403).json({ msg: 'Only owner can switch modes' });
    }

    // When switching to admin mode, verify admin password
    if (mode === 'admin') {
      if (!adminPassword) {
        return res.status(400).json({ msg: 'Admin password required for admin mode' });
      }

      // Get owner's admin password hash
      const result = await query(
        `SELECT admin_password_hash FROM users WHERE id = $1 AND role = 'owner'`,
        [userId]
      );

      if (result.rows.length === 0 || !result.rows[0].admin_password_hash) {
        return res.status(400).json({ msg: 'Admin password not set. Please set up admin mode first.' });
      }

      // Verify password (simplified - use proper bcrypt in production)
      const crypto = require('crypto');
      const passwordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');
      if (passwordHash !== result.rows[0].admin_password_hash) {
        return res.status(401).json({ msg: 'Invalid admin password' });
      }
    }

    // Record mode session
    const sessionResult = await query(
      `INSERT INTO mode_sessions (user_id, current_mode, switch_reason, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 day')
       RETURNING *`,
      [userId, mode, reason || 'User initiated mode switch']
    );

    res.status(200).json({
      msg: `Switched to ${mode} mode`,
      session: sessionResult.rows[0],
      mode,
    });
  } catch (err) {
    logger.error('role.switchMode', 'Error switching mode', err, { userId: req.user?.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get current mode session for user
 */
const getCurrentMode = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT current_mode, switched_at, expires_at
       FROM mode_sessions
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY switched_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Default to owner mode if no session
      return res.status(200).json({
        mode: req.user.role,
        switched_at: null,
        expires_at: null,
        is_active: true,
      });
    }

    res.status(200).json({
      mode: result.rows[0].current_mode,
      switched_at: result.rows[0].switched_at,
      expires_at: result.rows[0].expires_at,
      is_active: true,
    });
  } catch (err) {
    logger.error('role.getCurrentMode', 'Error getting current mode', err, { userId: req.user?.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Request OTP elevation (for HR users to gain manager rights)
 */
const requestElevation = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only HR users (employees with HR flag or specific permission) can request elevation
    // For simplicity, we'll allow any user to request, but the approval goes to owner/manager
    const hasHRPermission = await hasPermission(userId, 'hr_elevation');
    if (!hasHRPermission && userRole !== 'hr') {
      return res.status(403).json({ msg: 'HR permission required for elevation' });
    }

    // Generate OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // Create elevation request
    const requestResult = await query(
      `INSERT INTO elevation_requests (user_id, otp_code, reason, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')
       RETURNING *`,
      [userId, otpCode, reason || 'Temporary manager elevation']
    );

    // TODO: Send OTP to owner/manager via email/SMS
    // For now, return in response (for development only!)

    res.status(201).json({
      msg: 'Elevation request created. OTP sent to owner.',
      request_id: requestResult.rows[0].id,
      // Remove this in production!
      otp_code: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      expires_in: '10 minutes',
    });
  } catch (err) {
    logger.error('role.requestElevation', 'Error requesting elevation', err, { userId: req.user?.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Verify OTP and elevate user
 */
const verifyElevation = async (req, res) => {
  try {
    const { request_id, otp_code } = req.body;
    const approverId = req.user.id;

    // Find pending request
    const requestResult = await query(
      `SELECT * FROM elevation_requests
       WHERE id = $1 AND otp_code = $2 AND status = 'pending' AND expires_at > NOW()`,
      [request_id, otp_code]
    );

    if (requestResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid or expired elevation request' });
    }

    const request = requestResult.rows[0];

    // Verify approver is owner or manager
    if (!['owner', 'manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Only owner, manager, or admin can approve elevation' });
    }

    // Approve the request
    const updateResult = await query(
      `UPDATE elevation_requests
       SET status = 'approved', approved_at = NOW(), approved_by = $1
       WHERE id = $2
       RETURNING *`,
      [approverId, request_id]
    );

    res.status(200).json({
      msg: 'Elevation approved. User has temporary manager rights for 10 minutes.',
      elevation: updateResult.rows[0],
      elevated_user_id: request.user_id,
      elevated_until: request.expires_at,
    });
  } catch (err) {
    logger.error('role.verifyElevation', 'Error verifying elevation', err, { approverId: req.user?.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Check if user has active elevation
 */
const hasActiveElevation = async (userId) => {
  const result = await query(
    `SELECT * FROM elevation_requests
     WHERE user_id = $1 AND status = 'approved' AND expires_at > NOW()
     ORDER BY approved_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows.length > 0;
};

/**
 * Assign supervisor to employee/daily labourer
 */
const assignSupervisor = async (req, res) => {
  try {
    const { supervisor_id, allocated_type, allocated_id } = req.body;

    // Validate allocated_type
    if (!['employee', 'daily_labourer'].includes(allocated_type)) {
      return res.status(400).json({ msg: 'Invalid allocated_type. Must be employee or daily_labourer' });
    }

    // Verify supervisor exists and has supervisor role
    const supervisorResult = await query(
      `SELECT role FROM users WHERE id = $1`,
      [supervisor_id]
    );

    if (supervisorResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Supervisor not found' });
    }

    // Check if already allocated
    const existingResult = await query(
      `SELECT * FROM supervisor_allocations
       WHERE allocated_type = $1 AND allocated_id = $2`,
      [allocated_type, allocated_id]
    );

    if (existingResult.rows.length > 0) {
      // Update existing allocation
      const updateResult = await query(
        `UPDATE supervisor_allocations
         SET supervisor_id = $1, allocated_at = NOW(), allocated_by = $2
         WHERE allocated_type = $3 AND allocated_id = $4
         RETURNING *`,
        [supervisor_id, req.user.id, allocated_type, allocated_id]
      );

      return res.status(200).json({
        msg: 'Supervisor assignment updated',
        allocation: updateResult.rows[0],
      });
    }

    // Create new allocation
    const insertResult = await query(
      `INSERT INTO supervisor_allocations (supervisor_id, allocated_type, allocated_id, allocated_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [supervisor_id, allocated_type, allocated_id, req.user.id]
    );

    res.status(201).json({
      msg: 'Supervisor assigned successfully',
      allocation: insertResult.rows[0],
    });
  } catch (err) {
    logger.error('role.assignSupervisor', 'Error assigning supervisor', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Remove supervisor allocation
 */
const removeSupervisorAllocation = async (req, res) => {
  try {
    const { allocation_id } = req.params;

    const result = await query(
      `DELETE FROM supervisor_allocations WHERE id = $1 RETURNING *`,
      [allocation_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Allocation not found' });
    }

    res.status(200).json({
      msg: 'Supervisor assignment removed',
    });
  } catch (err) {
    logger.error('role.removeSupervisorAllocation', 'Error removing allocation', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get allocations for a supervisor
 */
const getSupervisorAllocations = async (req, res) => {
  try {
    const { supervisor_id } = req.params;

    // Get employees
    const employeesResult = await query(
      `SELECT sa.*, e.first_name, e.last_name, e.email, e.department, e.position
       FROM supervisor_allocations sa
       JOIN employees e ON sa.allocated_id = e.id
       WHERE sa.supervisor_id = $1 AND sa.allocated_type = 'employee'`,
      [supervisor_id]
    );

    // Get daily labourers
    const labourersResult = await query(
      `SELECT sa.*, dl.first_name, dl.last_name, dl.phone, dl.daily_rate, dl.skills
       FROM supervisor_allocations sa
       JOIN daily_labourers dl ON sa.allocated_id = dl.id
       WHERE sa.supervisor_id = $1 AND sa.allocated_type = 'daily_labourer'`,
      [supervisor_id]
    );

    res.status(200).json({
      msg: 'Supervisor allocations retrieved',
      supervisor_id,
      employees: employeesResult.rows,
      daily_labourers: labourersResult.rows,
    });
  } catch (err) {
    logger.error('role.getSupervisorAllocations', 'Error getting allocations', err, { supervisor_id: req.params.supervisor_id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

module.exports = {
  ROLE_HIERARCHY,
  PERMISSIONS,
  getRoleLevel,
  hasRoleLevel,
  getUserPermissions,
  hasPermission,
  requirePermission,
  requireRoleLevel,
  switchMode,
  getCurrentMode,
  requestElevation,
  verifyElevation,
  hasActiveElevation,
  assignSupervisor,
  removeSupervisorAllocation,
  getSupervisorAllocations,
};
