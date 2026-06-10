/**
 * Attendance Service
 * Business logic layer for attendance operations
 * Handles validation, business rules, and coordinates with other services
 */

const logger = require('../../../../utils/logger');
const attendanceRepository = require('../repositories/attendance.repository');
const Employee = require('../../../../models/Employee.model');

/**
 * Find or create attendance record for employee and date
 * @param {number} employeeId
 * @param {Date} punchTime
 * @param {string} shift
 * @returns {Promise<Object>}
 */
const findOrCreateAttendance = async (employeeId, punchTime, shift) => {
  const attendanceDate = punchTime.toISOString().split('T')[0];
  let attendance = await attendanceRepository.findByEmployeeAndDate(employeeId, attendanceDate);

  if (!attendance) {
    attendance = await attendanceRepository.create({
      employeeId,
      attendanceDate,
      shift: shift || 'Morning',
      status: 'Present',
    });
  } else if (!attendance.shift && shift) {
    attendance = await attendanceRepository.update(attendance.id, { shift });
  }

  return attendance;
};

/**
 * Process biometric punch
 * @param {Object} punchData
 * @returns {Promise<Object>}
 */
const processBiometricPunch = async punchData => {
  logger.info('attendance.service.processBiometricPunch', 'Attempt', {
    biometricDeviceId: punchData.biometricDeviceId,
  });

  const { biometricDeviceId, timestamp, punchState, shift } = punchData;

  // Find employee by biometric device ID
  const employee = await Employee.findOne({ biometricDeviceId });
  if (!employee) {
    throw new Error('Employee not found');
  }

  // Find or create attendance record
  const attendance = await findOrCreateAttendance(employee.id, new Date(timestamp), shift);

  // Update punch state
  const updates = { punchState };

  if (punchState === 'check_in') {
    updates.checkIn = new Date(timestamp);
  } else if (punchState === 'check_out') {
    updates.checkOut = new Date(timestamp);
  } else if (punchState === 'break_out') {
    updates.breakOut = new Date(timestamp);
  } else if (punchState === 'break_in') {
    updates.breakIn = new Date(timestamp);
  }

  const updatedAttendance = await attendanceRepository.update(attendance.id, updates);

  logger.info('attendance.service.processBiometricPunch', 'Success', { employeeId: employee.id });
  return updatedAttendance;
};

/**
 * Get attendance by employee
 * @param {number} employeeId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getAttendanceByEmployee = async (employeeId, filters = {}) => {
  logger.info('attendance.service.getAttendanceByEmployee', 'Attempt', { employeeId, filters });

  const attendance = await attendanceRepository.findByEmployee(employeeId, filters);
  logger.info('attendance.service.getAttendanceByEmployee', 'Success', {
    count: attendance.length,
  });

  return attendance;
};

/**
 * Get attendance by date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>}
 */
const getAttendanceByDateRange = async (startDate, endDate) => {
  logger.info('attendance.service.getAttendanceByDateRange', 'Attempt', { startDate, endDate });

  const attendance = await attendanceRepository.findByDateRange(startDate, endDate);
  logger.info('attendance.service.getAttendanceByDateRange', 'Success', {
    count: attendance.length,
  });

  return attendance;
};

/**
 * Get attendance summary for employee
 * @param {number} employeeId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getAttendanceSummary = async (employeeId, startDate, endDate) => {
  logger.info('attendance.service.getAttendanceSummary', 'Attempt', {
    employeeId,
    startDate,
    endDate,
  });

  const summary = await attendanceRepository.getSummary(employeeId, startDate, endDate);
  logger.info('attendance.service.getAttendanceSummary', 'Success', { employeeId });

  return summary;
};

/**
 * Update attendance
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
const updateAttendance = async (id, updates) => {
  logger.info('attendance.service.updateAttendance', 'Attempt', { id, updates });

  const attendance = await attendanceRepository.update(id, updates);

  if (!attendance) {
    throw new Error('Attendance record not found');
  }

  logger.info('attendance.service.updateAttendance', 'Success', { id });
  return attendance;
};

/**
 * Delete attendance
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const deleteAttendance = async id => {
  logger.info('attendance.service.deleteAttendance', 'Attempt', { id });

  const result = await attendanceRepository.delete(id);

  if (!result) {
    throw new Error('Attendance record not found');
  }

  logger.info('attendance.service.deleteAttendance', 'Success', { id });
  return true;
};

module.exports = {
  processBiometricPunch,
  getAttendanceByEmployee,
  getAttendanceByDateRange,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance,
};
