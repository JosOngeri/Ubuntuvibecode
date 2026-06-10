const express = require('express');
const router = express.Router();
const {
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
  getPayrollSettings,
  updatePayrollSettings,
} = require('../controllers/settings.controller');
const auth = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// All settings routes require authentication
router.use(auth);

/**
 * Settings CRUD endpoints
 */
router.get('/', getSettings);
router.get('/categories', getCategories);
router.get('/category/:category', getSettingsByCategory);
router.get('/components', roleMiddleware(['admin', 'owner']), getComponentSettings);
router.get('/components/:component', roleMiddleware(['admin', 'owner']), getComponentSettings);
router.get('/:key', getSettingByKey);
router.put('/:key', roleMiddleware(['owner', 'manager']), updateSetting);
router.post('/', roleMiddleware(['owner', 'manager']), createSetting);
router.delete('/:key', roleMiddleware(['owner', 'manager']), deleteSetting);

/**
 * Audit log endpoints (owner/manager/admin only)
 */
router.get('/audit/:key', roleMiddleware(['owner', 'manager', 'admin']), getAuditLog);
router.get('/audit/all', roleMiddleware(['owner', 'manager', 'admin']), getAllAuditLogs);

/**
 * Office Location endpoints (admin only)
 */
router.get('/location/office', getOfficeLocation);
router.put('/location/office', roleMiddleware(['admin', 'manager']), updateOfficeLocation);

/**
 * Employee Attendance Permission endpoints (admin only)
 */
router.get('/attendance/employees', roleMiddleware(['admin', 'manager']), getEmployeesAttendanceStatus);
router.put('/attendance/employee/:employeeId', roleMiddleware(['admin', 'manager']), updateEmployeeAttendancePermission);

/**
 * Shift Settings endpoints (admin only)
 */
router.get('/shifts', roleMiddleware(['admin', 'manager']), getShiftSettings);
router.post('/shifts', roleMiddleware(['admin', 'manager']), createShiftSetting);
router.put('/shifts/:id', roleMiddleware(['admin', 'manager']), updateShiftSetting);
router.delete('/shifts/:id', roleMiddleware(['admin', 'manager']), deleteShiftSetting);

/**
 * Component Settings endpoints (admin/owner only)
 */
router.put('/components/:component', roleMiddleware(['admin', 'owner']), updateComponentSettings);
router.post('/components/:component/reset', roleMiddleware(['admin', 'owner']), resetComponentSettings);

/**
 * User Preferences endpoints
 */
router.get('/user/:userId', getUserPreferences);
router.put('/user/:userId', updateUserPreferences);

/**
 * Payroll Settings endpoints (owner/manager only)
 */
router.get('/payroll', roleMiddleware(['owner', 'manager']), getPayrollSettings);
router.put('/payroll', roleMiddleware(['owner', 'manager']), updatePayrollSettings);

module.exports = router;
