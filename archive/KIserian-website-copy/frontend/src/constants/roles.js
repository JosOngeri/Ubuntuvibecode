/**
 * Role constants
 */

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  PASTOR: 'Pastor',
  FIRST_ELDER: 'First Elder',
  DEPARTMENT_HEAD: 'Department Head',
  MEMBER: 'Member',
}

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.PASTOR, ROLES.FIRST_ELDER]

export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
  [ROLES.PASTOR]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
  [ROLES.FIRST_ELDER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
  [ROLES.DEPARTMENT_HEAD]: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
  [ROLES.MEMBER]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200',
}

export const hasAdminRole = (roles) => {
  return roles?.some(role => ADMIN_ROLES.includes(role))
}
