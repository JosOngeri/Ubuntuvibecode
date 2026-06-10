/**
 * Role-Based Access Control (RBAC) Configuration
 */

// Role Definitions
export const BASE_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  DAILY_LABOURER: 'daily_labourer',
  CONTRACTOR: 'contractor',
};

export const ADDITIONAL_ROLES = {
  SUPERVISOR: 'supervisor',
  DEPARTMENT_HEAD: 'department_head',
};

export const ALL_ROLES = { ...BASE_ROLES, ...ADDITIONAL_ROLES };

// Role hierarchy values (higher = more permissions)
export const ROLE_HIERARCHY = {
  owner: 100,
  admin: 90,
  manager: 80,
  department_head: 70,
  supervisor: 60,
  employee: 50,
  daily_labourer: 40,
  contractor: 30,
};

// Permission Groups
export const PERMISSION_GROUPS = {
  HR_FUNCTIONS: {
    label: 'HR Functions',
    permissions: {
      VIEW_EMPLOYEES: 'view_employees',
      EDIT_EMPLOYEES: 'edit_employees',
      DELETE_EMPLOYEES: 'delete_employees',
      APPROVE_LEAVES: 'approve_leaves',
      ASSESS_KPIS: 'assess_kpis',
    },
  },
  ATTENDANCE_FUNCTIONS: {
    label: 'Attendance Functions',
    permissions: {
      VIEW_ATTENDANCE: 'view_attendance',
      MARK_ATTENDANCE_SELF: 'mark_attendance_self',
      CLOCK_IN_OUT_OTHERS: 'clock_in_out_others',
      VIEW_ATTENDANCE_REPORTS: 'view_attendance_reports',
    },
  },
  LEAVE_FUNCTIONS: {
    label: 'Leave Functions',
    permissions: {
      VIEW_LEAVES: 'view_leaves',
      REQUEST_LEAVE: 'request_leave',
      APPROVE_LEAVES_DEPT: 'approve_leaves_department',
      VIEW_LEAVE_BALANCE: 'view_leave_balance',
    },
  },
  KPI_FUNCTIONS: {
    label: 'KPI Functions',
    permissions: {
      VIEW_KPIS: 'view_kpis',
      SELF_ASSESSMENT: 'self_assessment',
      ASSESS_OTHERS: 'assess_others',
      VIEW_KPI_REPORTS: 'view_kpi_reports',
    },
  },
  PAYROLL_FUNCTIONS: {
    label: 'Payroll Functions',
    permissions: {
      VIEW_OWN_PAYROLL: 'view_own_payroll',
      VIEW_DEPT_PAYROLL: 'view_department_payroll',
      PROCESS_PAYROLL: 'process_payroll',
      VIEW_PAYROLL_REPORTS: 'view_payroll_reports',
    },
  },
  SYSTEM_FUNCTIONS: {
    label: 'System Functions',
    permissions: {
      MANAGE_USERS: 'manage_users',
      MANAGE_PERMISSIONS: 'manage_permissions',
      MANAGE_ROLES: 'manage_roles',
      SYSTEM_SETTINGS: 'system_settings',
      VIEW_AUDIT_LOGS: 'view_audit_logs',
    },
  },
  COMMUNICATION_FUNCTIONS: {
    label: 'Communication Functions',
    permissions: {
      SEND_MESSAGES: 'send_messages',
      VIEW_ALL_CONVERSATIONS: 'view_all_conversations',
      RESOLVE_COMPLAINTS: 'resolve_complaints',
    },
  },
};

// Flatten permissions
export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).reduce(
  (acc, group) => ({ ...acc, ...group.permissions }),
  {}
);

// Time-based duration types
export const DURATION_TYPES = {
  PERMANENT: 'permanent',
  DAYS: 'days',
  HOURS: 'hours',
  MINUTES: 'minutes',
};

export const DEFAULT_DURATION = {
  [DURATION_TYPES.DAYS]: 1,
  [DURATION_TYPES.HOURS]: 2,
  [DURATION_TYPES.MINUTES]: 10,
};

export const DURATION_LIMITS = {
  [DURATION_TYPES.DAYS]: { min: 1, max: 365 },
  [DURATION_TYPES.HOURS]: { min: 1, max: 168 },
  [DURATION_TYPES.MINUTES]: { min: 5, max: 1440 },
};

// Data scope
export const DATA_SCOPE = {
  ALL: 'all',
  DEPARTMENT: 'department',
  TEAM: 'team',
  SELF: 'self',
  NONE: 'none',
};

export const ROLE_DATA_SCOPE = {
  owner: DATA_SCOPE.ALL,
  admin: DATA_SCOPE.ALL,
  manager: DATA_SCOPE.ALL,
  department_head: DATA_SCOPE.DEPARTMENT,
  supervisor: DATA_SCOPE.TEAM,
  employee: DATA_SCOPE.SELF,
  daily_labourer: DATA_SCOPE.SELF,
  contractor: DATA_SCOPE.SELF,
};

// Default permissions per role
export const DEFAULT_ROLE_PERMISSIONS = {
  owner: Object.values(ALL_PERMISSIONS).filter(p => p !== 'delete_employees'),
  admin: Object.values(ALL_PERMISSIONS),
  manager: [
    'view_employees',
    'edit_employees',
    'approve_leaves',
    'assess_kpis',
    'view_attendance',
    'mark_attendance_self',
    'clock_in_out_others',
    'view_leaves',
    'request_leave',
    'approve_leaves_department',
    'view_kpis',
    'self_assessment',
    'assess_others',
    'view_own_payroll',
    'view_department_payroll',
    'send_messages',
    'resolve_complaints',
    'view_audit_logs',
  ],
  department_head: [
    'view_employees',
    'edit_employees',
    'view_attendance',
    'view_leaves',
    'request_leave',
    'approve_leaves_department',
    'view_kpis',
    'self_assessment',
    'assess_others',
    'view_own_payroll',
    'send_messages',
    'resolve_complaints',
  ],
  supervisor: [
    'view_employees',
    'view_attendance',
    'mark_attendance_self',
    'clock_in_out_others',
    'view_leaves',
    'request_leave',
    'view_kpis',
    'self_assessment',
    'assess_others',
    'view_own_payroll',
    'send_messages',
    'resolve_complaints',
  ],
  employee: [
    'view_employees',
    'view_attendance',
    'mark_attendance_self',
    'view_leaves',
    'request_leave',
    'view_leave_balance',
    'view_kpis',
    'self_assessment',
    'view_own_payroll',
    'send_messages',
  ],
  daily_labourer: [
    'view_attendance',
    'mark_attendance_self',
    'view_own_payroll',
    'send_messages',
    'resolve_complaints',
  ],
  contractor: ['view_attendance', 'view_own_payroll', 'send_messages'],
};

// Utility functions
export function hasPermission(user, permission, overrides = []) {
  if (!user?.role) return false;

  // Admin or owner in admin mode has all permissions
  if (user.role === 'admin' || (user.role === 'owner' && user.isAdminMode)) {
    return true;
  }

  // Check role permissions
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  const hasRolePerm = rolePerms.includes(permission);

  // Check additional roles
  let hasAddRolePerm = false;
  if (user.additionalRoles?.length) {
    hasAddRolePerm = user.additionalRoles.some(role => {
      const perms = DEFAULT_ROLE_PERMISSIONS[role] || [];
      return perms.includes(permission);
    });
  }

  // Check active overrides
  const now = new Date();
  const override = overrides.find(
    o => o.permissionKey === permission && o.isActive && new Date(o.expiresAt) > now
  );

  if (override) return override.isGranted !== false;

  return hasRolePerm || hasAddRolePerm;
}

export function canAccessPage(user, page) {
  const pagePerms = {
    'hr-management': ['view_employees'],
    'daily-labour': ['view_attendance'],
    reports: ['view_attendance_reports'],
    messages: ['send_messages'],
    hierarchy: ['view_employees'],
    settings: ['system_settings', 'manage_users'],
    permissions: ['manage_permissions'],
    'audit-logs': ['view_audit_logs'],
  };

  const required = pagePerms[page] || [];
  if (!required.length) return true;
  return required.some(p => hasPermission(user, p));
}

export function getDataScope(user) {
  if (!user?.role) return DATA_SCOPE.NONE;
  if (user.departmentHeadAssignment?.departmentId) return DATA_SCOPE.DEPARTMENT;
  if (user.supervisorAllocations?.length > 0) return DATA_SCOPE.TEAM;
  return ROLE_DATA_SCOPE[user.role] || DATA_SCOPE.SELF;
}

export function canDelete(user) {
  if (!user) return false;
  if (user.role === 'owner') return user.isAdminMode === true;
  if (user.role === 'admin') return true;
  return hasPermission(user, 'delete_employees');
}

export function canGrantPermission(granter, permission) {
  if (granter.role === 'admin') return true;
  if (granter.role === 'owner') {
    if (permission === 'delete_employees') return granter.isAdminMode;
    return true;
  }
  return hasPermission(granter, permission);
}

export function calculateExpiryDate(durationType, quantity) {
  if (durationType === DURATION_TYPES.PERMANENT) return null;

  const expiry = new Date();
  switch (durationType) {
    case DURATION_TYPES.DAYS:
      expiry.setDate(expiry.getDate() + quantity);
      break;
    case DURATION_TYPES.HOURS:
      expiry.setHours(expiry.getHours() + quantity);
      break;
    case DURATION_TYPES.MINUTES:
      expiry.setMinutes(expiry.getMinutes() + quantity);
      break;
  }
  return expiry;
}

export function getEffectivePermissions(user, overrides = []) {
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[user?.role] || [];
  const addPerms = [];

  if (user?.additionalRoles) {
    user.additionalRoles.forEach(role => {
      addPerms.push(...(DEFAULT_ROLE_PERMISSIONS[role] || []));
    });
  }

  const base = [...new Set([...rolePerms, ...addPerms])];
  const now = new Date();

  const active = overrides.filter(o => o.isActive && new Date(o.expiresAt) > now);
  const granted = [...base];
  const revoked = [];

  active.forEach(o => {
    if (o.isGranted === false) {
      const idx = granted.indexOf(o.permissionKey);
      if (idx > -1) granted.splice(idx, 1);
      revoked.push(o.permissionKey);
    } else if (!granted.includes(o.permissionKey)) {
      granted.push(o.permissionKey);
    }
  });

  return { granted, revoked, overrides: active };
}

export function formatPermissionLabel(key) {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default {
  BASE_ROLES,
  ADDITIONAL_ROLES,
  ALL_ROLES,
  ROLE_HIERARCHY,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  DURATION_TYPES,
  DEFAULT_DURATION,
  DURATION_LIMITS,
  DATA_SCOPE,
  ROLE_DATA_SCOPE,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
  canAccessPage,
  getDataScope,
  canDelete,
  canGrantPermission,
  calculateExpiryDate,
  getEffectivePermissions,
  formatPermissionLabel,
};
