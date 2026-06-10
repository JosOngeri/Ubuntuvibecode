/**
 * Attendance Controller
 * Request handling layer for attendance endpoints
 * Uses attendance service for business logic
 */

const logger = require('../../../../utils/logger');
const attendanceService = require('../services/attendance.service');

// Temporary delegation to old controller for functions not yet migrated
const oldAttendanceController = require('../../../../controllers/attendance.controller');

/**
 * Process biometric punch
 */
const pushBiometric = async (req, res) => {
  try {
    const attendance = await attendanceService.processBiometricPunch(req.body);
    res.json(attendance);
  } catch (err) {
    if (err.message === 'Employee not found') {
      return res.status(404).json({ msg: err.message });
    }
    logger.error('attendance.controller.pushBiometric', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to process biometric punch' });
  }
};

/**
 * Manual self punch - delegated to old controller
 */
const manualSelfPunch = oldAttendanceController.manualSelfPunch;

/**
 * Manager punch for employee - delegated to old controller
 */
const managerPunchForEmployee = oldAttendanceController.managerPunchForEmployee;

/**
 * Get attendance by employee
 */
const getAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const attendance = await attendanceService.getAttendanceByEmployee(employeeId, filters);
    res.json(attendance);
  } catch (err) {
    logger.error('attendance.controller.getAttendance', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to retrieve attendance' });
  }
};

/**
 * Get attendance by ID - delegated to old controller
 */
const getAttendanceById = oldAttendanceController.getAttendanceById;

/**
 * Adjust attendance - delegated to old controller
 */
const adjustAttendance = oldAttendanceController.adjustAttendance;

/**
 * Get today's attendance - delegated to old controller
 */
const getTodayAttendance = oldAttendanceController.getTodayAttendance;

/**
 * Get all attendance - delegated to old controller
 */
const getAllAttendance = oldAttendanceController.getAllAttendance;

module.exports = {
  pushBiometric,
  manualSelfPunch,
  managerPunchForEmployee,
  getAttendance,
  getAttendanceById,
  adjustAttendance,
  getTodayAttendance,
  getAllAttendance,
};
