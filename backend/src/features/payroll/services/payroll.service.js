/**
 * Payroll Service
 * Business logic layer for payroll operations
 * Handles validation, business rules, and calculations
 */

const logger = require('../../../../utils/logger');
const payrollRepository = require('../repositories/payroll.repository');

/**
 * Parse period string (YYYY-MM)
 * @param {string} value
 * @returns {Object|null}
 */
const parsePeriod = value => {
  if (!value) return null;

  const source = String(value).trim();
  const match = source.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  return {
    period: source,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

/**
 * Calculate payroll for employee for a period
 * @param {number} employeeId
 * @param {string} period
 * @returns {Promise<Object>}
 */
const calculatePayroll = async (employeeId, period) => {
  logger.info('payroll.service.calculatePayroll', 'Attempt', { employeeId, period });

  const periodData = parsePeriod(period);
  if (!periodData) {
    throw new Error('Invalid period format. Use YYYY-MM');
  }

  // Get employee and pay rate
  const employee = await payrollRepository.getEmployee(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const payRate = await payrollRepository.getPayRate(employeeId);
  if (!payRate) {
    throw new Error('Pay rate not found for employee');
  }

  // Get attendance hours
  const hoursWorked = await payrollRepository.getAttendanceHours(
    employeeId,
    periodData.startDate,
    periodData.endDate
  );

  // Calculate gross pay
  const grossPay = hoursWorked * payRate.hourly_rate;

  // Calculate deductions (simplified - 10% tax)
  const deductions = grossPay * 0.1;
  const netPay = grossPay - deductions;

  const payrollData = {
    employeeId,
    period,
    grossPay,
    deductions,
    netPay,
    hoursWorked,
    hourlyRate: payRate.hourly_rate,
  };

  logger.info('payroll.service.calculatePayroll', 'Success', { employeeId, period, netPay });
  return payrollData;
};

/**
 * Generate payslip
 * @param {number} employeeId
 * @param {string} period
 * @returns {Promise<Object>}
 */
const generatePayslip = async (employeeId, period) => {
  logger.info('payroll.service.generatePayslip', 'Attempt', { employeeId, period });

  const payrollData = await calculatePayroll(employeeId, period);
  const payslip = await payrollRepository.createPayslip(payrollData);

  logger.info('payroll.service.generatePayslip', 'Success', { payslipId: payslip.id });
  return payslip;
};

/**
 * Get payslips for employee
 * @param {number} employeeId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getPayslips = async (employeeId, filters = {}) => {
  logger.info('payroll.service.getPayslips', 'Attempt', { employeeId, filters });

  const payslips = await payrollRepository.getPayslips(employeeId, filters);

  logger.info('payroll.service.getPayslips', 'Success', { count: payslips.length });
  return payslips;
};

/**
 * Get payslip by ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
const getPayslip = async id => {
  logger.info('payroll.service.getPayslip', 'Attempt', { id });

  const payslip = await payrollRepository.getPayslip(id);

  if (!payslip) {
    throw new Error('Payslip not found');
  }

  logger.info('payroll.service.getPayslip', 'Success', { id });
  return payslip;
};

/**
 * Update payslip
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
const updatePayslip = async (id, updates) => {
  logger.info('payroll.service.updatePayslip', 'Attempt', { id, updates });

  const payslip = await payrollRepository.updatePayslip(id, updates);

  if (!payslip) {
    throw new Error('Payslip not found');
  }

  logger.info('payroll.service.updatePayslip', 'Success', { id });
  return payslip;
};

/**
 * Approve payslip
 * @param {number} id
 * @returns {Promise<Object>}
 */
const approvePayslip = async id => {
  logger.info('payroll.service.approvePayslip', 'Attempt', { id });

  const payslip = await payrollRepository.updatePayslip(id, { status: 'approved' });

  if (!payslip) {
    throw new Error('Payslip not found');
  }

  logger.info('payroll.service.approvePayslip', 'Success', { id });
  return payslip;
};

/**
 * Delete payslip
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const deletePayslip = async id => {
  logger.info('payroll.service.deletePayslip', 'Attempt', { id });

  const result = await payrollRepository.deletePayslip(id);

  if (!result) {
    throw new Error('Payslip not found');
  }

  logger.info('payroll.service.deletePayslip', 'Success', { id });
  return true;
};

module.exports = {
  calculatePayroll,
  generatePayslip,
  getPayslips,
  getPayslip,
  updatePayslip,
  approvePayslip,
  deletePayslip,
};
