/**
 * Payroll Repository
 * Pure data access layer for payroll operations
 * No business logic, only SQL/database operations
 */

const { query } = require('../../../../config/db');

const payrollRepository = {
  /**
   * Get employee by ID
   * @param {number} employeeId
   * @returns {Promise<Object|null>}
   */
  async getEmployee(employeeId) {
    const { rows } = await query('SELECT * FROM employees WHERE id = $1 LIMIT 1', [employeeId]);
    return rows[0] || null;
  },

  /**
   * Get pay rate for employee
   * @param {number} employeeId
   * @returns {Promise<Object|null>}
   */
  async getPayRate(employeeId) {
    const { rows } = await query('SELECT * FROM pay_rates WHERE employee_id = $1 LIMIT 1', [
      employeeId,
    ]);
    return rows[0] || null;
  },

  /**
   * Get attendance hours for employee in date range
   * @param {number} employeeId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<number>}
   */
  async getAttendanceHours(employeeId, startDate, endDate) {
    const { rows } = await query(
      `SELECT COALESCE(SUM(total_hours_worked), 0) AS total_hours
       FROM attendance
       WHERE employee_id = $1
         AND attendance_date BETWEEN $2 AND $3`,
      [employeeId, startDate, endDate]
    );
    return parseFloat(rows[0].total_hours) || 0;
  },

  /**
   * Get payslips for employee
   * @param {number} employeeId
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async getPayslips(employeeId, filters = {}) {
    const { period, status } = filters;
    let queryStr = 'SELECT * FROM payslips WHERE employee_id = $1';
    const params = [employeeId];
    let paramIndex = 2;

    if (period) {
      queryStr += ` AND period = $${paramIndex}`;
      params.push(period);
      paramIndex++;
    }

    if (status) {
      queryStr += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryStr += ' ORDER BY created_at DESC';

    const { rows } = await query(queryStr, params);
    return rows;
  },

  /**
   * Get payslip by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async getPayslip(id) {
    const { rows } = await query('SELECT * FROM payslips WHERE id = $1 LIMIT 1', [id]);
    return rows[0] || null;
  },

  /**
   * Create payslip
   * @param {Object} payslipData
   * @returns {Promise<Object>}
   */
  async createPayslip(payslipData) {
    const {
      employeeId,
      period,
      grossPay,
      deductions,
      netPay,
      hoursWorked,
      hourlyRate,
      status = 'pending',
    } = payslipData;

    const { rows } = await query(
      `INSERT INTO payslips (employee_id, period, gross_pay, deductions, net_pay, hours_worked, hourly_rate, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [employeeId, period, grossPay, deductions, netPay, hoursWorked, hourlyRate, status]
    );
    return rows[0];
  },

  /**
   * Update payslip
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updatePayslip(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);

    const { rows } = await query(
      `UPDATE payslips SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0];
  },

  /**
   * Delete payslip
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deletePayslip(id) {
    const { rowCount } = await query('DELETE FROM payslips WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = payrollRepository;
