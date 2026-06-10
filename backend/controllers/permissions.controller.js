const UserPermissionOverride = require('../models/UserPermissionOverride.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const AuditLog = require('../models/AuditLog.model');
const logger = require('../utils/logger');

const DURATION_TYPES = {
  PERMANENT: 'permanent',
  DAYS: 'days',
  HOURS: 'hours',
  MINUTES: 'minutes'
};

const ALL_PERMISSIONS = [
  'view_employees', 'edit_employees', 'delete_employees', 'approve_leaves', 'assess_kpis',
  'view_attendance', 'mark_attendance_self', 'clock_in_out_others', 'view_attendance_reports',
  'view_leaves', 'request_leave', 'approve_leaves_department', 'view_leave_balance',
  'view_kpis', 'self_assessment', 'assess_others', 'view_kpi_reports',
  'view_own_payroll', 'view_department_payroll', 'process_payroll', 'view_payroll_reports',
  'manage_users', 'manage_permissions', 'manage_roles', 'system_settings', 'view_audit_logs',
  'send_messages', 'view_all_conversations', 'resolve_complaints'
];

const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,
  owner: ALL_PERMISSIONS.filter(p => p !== 'delete_employees'),
  manager: [
    'view_employees', 'edit_employees', 'approve_leaves', 'assess_kpis',
    'view_attendance', 'mark_attendance_self', 'clock_in_out_others',
    'view_leaves', 'request_leave', 'approve_leaves_department',
    'view_kpis', 'self_assessment', 'assess_others',
    'view_own_payroll', 'view_department_payroll',
    'send_messages', 'resolve_complaints', 'view_audit_logs', 'manage_permissions'
  ],
  department_head: [
    'view_employees', 'edit_employees', 'view_attendance',
    'view_leaves', 'request_leave', 'approve_leaves_department',
    'view_kpis', 'self_assessment', 'assess_others',
    'view_own_payroll', 'send_messages', 'resolve_complaints'
  ],
  supervisor: [
    'view_employees', 'view_attendance', 'mark_attendance_self',
    'clock_in_out_others', 'view_leaves', 'request_leave',
    'view_kpis', 'self_assessment', 'assess_others',
    'view_own_payroll', 'send_messages', 'resolve_complaints'
  ]
};

function calculateExpiryDate(durationType, quantity) {
  if (durationType === DURATION_TYPES.PERMANENT) return null;
  
  const expiry = new Date();
  switch (durationType) {
    case DURATION_TYPES.DAYS: expiry.setDate(expiry.getDate() + quantity); break;
    case DURATION_TYPES.HOURS: expiry.setHours(expiry.getHours() + quantity); break;
    case DURATION_TYPES.MINUTES: expiry.setMinutes(expiry.getMinutes() + quantity); break;
  }
  return expiry;
}

function canGrantPermission(granter, permission) {
  if (granter.role === 'admin') return true;
  if (granter.role === 'manager') return true;
  if (granter.role === 'owner') return true;
  
  const granterPerms = ROLE_PERMISSIONS[granter.role] || [];
  const granterAdditional = granter.additionalRoles?.flatMap(r => ROLE_PERMISSIONS[r] || []) || [];
  const allGranterPerms = [...new Set([...granterPerms, ...granterAdditional])];
  
  return allGranterPerms.includes(permission);
}

async function grantPermission(req, res) {
  try {
    const { userId, permissionKey, durationType, quantity, isGranted = true } = req.body;
    const granter = req.user;

    if (!userId || !permissionKey || !durationType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!ALL_PERMISSIONS.includes(permissionKey)) {
      return res.status(400).json({ error: 'Invalid permission key' });
    }

    if (!Object.values(DURATION_TYPES).includes(durationType)) {
      return res.status(400).json({ error: 'Invalid duration type' });
    }

    if (durationType !== DURATION_TYPES.PERMANENT && (!quantity || quantity < 1)) {
      return res.status(400).json({ error: 'Quantity required for non-permanent duration' });
    }

    if (durationType === DURATION_TYPES.PERMANENT && granter.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can grant permanent permissions' });
    }

    if (!canGrantPermission(granter, permissionKey)) {
      return res.status(403).json({ error: 'Cannot grant permission you do not possess' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const expiresAt = calculateExpiryDate(durationType, quantity);

    const override = new UserPermissionOverride({
      userId,
      permissionKey,
      grantedBy: granter.id,
      durationType,
      quantity: durationType === DURATION_TYPES.PERMANENT ? null : quantity,
      grantedAt: new Date(),
      expiresAt,
      isActive: true,
      isGranted
    });

    await override.save();

    const notification = new Notification({
      userId,
      type: 'permission_granted',
      title: `Permission ${isGranted ? 'Granted' : 'Revoked'}: ${permissionKey}`,
      message: `You have been ${isGranted ? 'granted' : 'denied'} the permission "${permissionKey}"${expiresAt ? ` until ${expiresAt.toLocaleString()}` : ' permanently'}.`,
      entityType: 'permission',
      entityId: override.id
    });
    await notification.save();

    await AuditLog.create({
      userId: granter.id,
      username: granter.username,
      userRole: granter.role,
      action: 'grant_permission',
      entityType: 'permission_override',
      entityId: override.id,
      newData: { userId, permissionKey, durationType, quantity, expiresAt, isGranted },
      reason: req.body.reason || 'Permission grant via UI'
    });

    logger.info('permissions.grant', 'Permission granted', {
      granter: granter.id,
      target: userId,
      permission: permissionKey,
      durationType,
      quantity
    });

    res.json({
      success: true,
      data: override.toJSON(),
      message: `Permission ${isGranted ? 'granted' : 'revoked'} successfully`
    });
  } catch (error) {
    logger.error('permissions.grant', 'Error granting permission', { error: error.message });
    res.status(500).json({ error: 'Failed to grant permission' });
  }
}

async function revokePermission(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const granter = req.user;

    const override = await UserPermissionOverride.findById(id);
    if (!override) {
      return res.status(404).json({ error: 'Permission override not found' });
    }

    if (!canGrantPermission(granter, override.permissionKey)) {
      return res.status(403).json({ error: 'Cannot revoke permission you do not possess' });
    }

    await override.deactivate(granter.id);

    const notification = new Notification({
      userId: override.userId,
      type: 'permission_revoked',
      title: `Permission Revoked: ${override.permissionKey}`,
      message: `The permission "${override.permissionKey}" has been manually revoked.`,
      entityType: 'permission',
      entityId: override.id
    });
    await notification.save();

    await AuditLog.create({
      userId: granter.id,
      username: granter.username,
      userRole: granter.role,
      action: 'revoke_permission',
      entityType: 'permission_override',
      entityId: override.id,
      previousData: { isActive: true },
      newData: { isActive: false, revertedBy: granter.id },
      reason: reason || 'Manual revocation'
    });

    logger.info('permissions.revoke', 'Permission revoked', {
      granter: granter.id,
      overrideId: id
    });

    res.json({
      success: true,
      message: 'Permission revoked successfully'
    });
  } catch (error) {
    logger.error('permissions.revoke', 'Error revoking permission', { error: error.message });
    res.status(500).json({ error: 'Failed to revoke permission' });
  }
}

async function getUserPermissions(req, res) {
  try {
    const { userId } = req.params;
    const requester = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const overrides = await UserPermissionOverride.findActiveByUserId(userId);

    const rolePerms = ROLE_PERMISSIONS[targetUser.role] || [];
    const effectivePerms = new Set(rolePerms);

    overrides.forEach(o => {
      if (o.isGranted) {
        effectivePerms.add(o.permissionKey);
      } else {
        effectivePerms.delete(o.permissionKey);
      }
    });

    res.json({
      success: true,
      data: {
        role: targetUser.role,
        rolePermissions: rolePerms,
        overrides: overrides.map(o => o.toJSON()),
        effectivePermissions: Array.from(effectivePerms)
      }
    });
  } catch (error) {
    logger.error('permissions.getUser', 'Error getting user permissions', { error: error.message });
    res.status(500).json({ error: 'Failed to get user permissions' });
  }
}

async function getMyPermissions(req, res) {
  try {
    const user = req.user;
    const overrides = await UserPermissionOverride.findActiveByUserId(user.id);

    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    const additionalPerms = (user.additionalRoles || [])
      .flatMap(r => ROLE_PERMISSIONS[r] || []);
    const basePerms = [...new Set([...rolePerms, ...additionalPerms])];

    const effectivePerms = new Set(basePerms);
    overrides.forEach(o => {
      if (o.isGranted) {
        effectivePerms.add(o.permissionKey);
      } else {
        effectivePerms.delete(o.permissionKey);
      }
    });

    res.json({
      success: true,
      data: {
        role: user.role,
        additionalRoles: user.additionalRoles || [],
        rolePermissions: basePerms,
        overrides: overrides.map(o => o.toJSON()),
        effectivePermissions: Array.from(effectivePerms)
      }
    });
  } catch (error) {
    logger.error('permissions.getMy', 'Error getting my permissions', { error: error.message });
    res.status(500).json({ error: 'Failed to get permissions' });
  }
}

async function getActivePermissions(req, res) {
  try {
    const requester = req.user;

    if (!['admin', 'manager', 'owner'].includes(requester.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const expired = await UserPermissionOverride.findExpired();

    for (const override of expired) {
      await override.deactivate();

      const notification = new Notification({
        userId: override.userId,
        type: 'permission_expired',
        title: `Permission Expired: ${override.permissionKey}`,
        message: `Your temporary permission "${override.permissionKey}" has expired and reverted to default settings.`,
        entityType: 'permission',
        entityId: override.id
      });
      await notification.save();
    }

    res.json({
      success: true,
      message: `Processed ${expired.length} expired permissions`
    });
  } catch (error) {
    logger.error('permissions.processExpired', 'Error processing expired permissions', { error: error.message });
    res.status(500).json({ error: 'Failed to process expired permissions' });
  }
}

async function getExpiringSoon(req, res) {
  try {
    const { minutes = 10 } = req.query;
    const requester = req.user;

    if (!['admin', 'manager', 'owner'].includes(requester.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const expiring = await UserPermissionOverride.findExpiringSoon(parseInt(minutes));

    res.json({
      success: true,
      data: expiring.map(o => o.toJSON())
    });
  } catch (error) {
    logger.error('permissions.expiringSoon', 'Error getting expiring permissions', { error: error.message });
    res.status(500).json({ error: 'Failed to get expiring permissions' });
  }
}

async function getRolePermissions(req, res) {
  try {
    const { role } = req.params;
    const requester = req.user;

    if (requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view role permissions' });
    }

    const permissions = ROLE_PERMISSIONS[role] || [];

    res.json({
      success: true,
      data: {
        role,
        permissions
      }
    });
  } catch (error) {
    logger.error('permissions.getRole', 'Error getting role permissions', { error: error.message });
    res.status(500).json({ error: 'Failed to get role permissions' });
  }
}

async function updateRolePermissions(req, res) {
  try {
    const { role } = req.params;
    const { permissions } = req.body;
    const requester = req.user;

    if (requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update role permissions' });
    }

    const validPerms = permissions.filter(p => ALL_PERMISSIONS.includes(p));
    ROLE_PERMISSIONS[role] = validPerms;

    await AuditLog.create({
      userId: requester.id,
      username: requester.username,
      userRole: requester.role,
      action: 'update_role_permissions',
      entityType: 'role',
      entityId: role,
      newData: { role, permissions: validPerms }
    });

    res.json({
      success: true,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    logger.error('permissions.updateRole', 'Error updating role permissions', { error: error.message });
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
}

async function getAllPermissionsList(req, res) {
  res.json({
    success: true,
    data: {
      permissions: ALL_PERMISSIONS,
      durationTypes: DURATION_TYPES,
      roles: Object.keys(ROLE_PERMISSIONS)
    }
  });
}

module.exports = {
  grantPermission,
  revokePermission,
  getUserPermissions,
  getMyPermissions,
  getActivePermissions,
  getExpiringSoon,
  getRolePermissions,
  updateRolePermissions,
  getAllPermissionsList
};
