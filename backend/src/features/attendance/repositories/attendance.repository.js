/**
 * Attendance Repository
 * Pure data access layer for attendance operations
 * No business logic, only SQL/database operations
 */

const Attendance = require('../../../../models/Attendance.model');

const attendanceRepository = {
  /**
   * Create attendance record
   * @param {Object} attendanceData
   * @returns {Promise<Object>}
   */
  async create(attendanceData) {
    const attendance = new Attendance(attendanceData);
    await attendance.save();
    return attendance;
  },

  /**
   * Find attendance by employee and date
   * @param {number} employeeId
   * @param {Date} attendanceDate
   * @returns {Promise<Object|null>}
   */
  async findByEmployeeAndDate(employeeId, attendanceDate) {
    return await Attendance.findOne({ employeeId, attendanceDate });
  },

  /**
   * Find attendance by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Attendance.findById(id);
  },

  /**
   * Find attendance by employee
   * @param {number} employeeId
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async findByEmployee(employeeId, filters = {}) {
    const { startDate, endDate } = filters;
    return await Attendance.findByEmployee(employeeId, startDate, endDate);
  },

  /**
   * Find attendance by date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async findByDateRange(startDate, endDate) {
    return await Attendance.findByDateRange(startDate, endDate);
  },

  /**
   * Update attendance
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    return await Attendance.update(id, updates);
  },

  /**
   * Delete attendance
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return await Attendance.delete(id);
  },

  /**
   * Get attendance summary for employee
   * @param {number} employeeId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>}
   */
  async getSummary(employeeId, startDate, endDate) {
    return await Attendance.getSummary(employeeId, startDate, endDate);
  },
};

module.exports = attendanceRepository;
