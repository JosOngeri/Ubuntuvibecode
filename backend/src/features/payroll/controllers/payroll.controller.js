/**
 * Payroll Controller
 * Request handling layer for payroll endpoints
 * Uses payroll service for business logic
 */

// Temporary delegation to old controller for functions not yet migrated
const oldPayrollController = require('../../../../controllers/payroll.controller');

// Delegate all functions to old controller since the service layer needs full refactoring
const batchGeneratePayroll = (req, res) => oldPayrollController.batchGeneratePayroll(req, res);
const calculatePayroll = (req, res) => oldPayrollController.calculatePayroll(req, res);
const approvePayroll = (req, res) => oldPayrollController.approvePayroll(req, res);
const disbursePayroll = (req, res) => oldPayrollController.disbursePayroll(req, res);
const generatePayslipPdf = (req, res) => oldPayrollController.generatePayslipPdf(req, res);
const handleMpesaCallback = (req, res) => oldPayrollController.handleMpesaCallback(req, res);
const getPayslips = (req, res) => oldPayrollController.getPayslips(req, res);

module.exports = {
  batchGeneratePayroll,
  calculatePayroll,
  approvePayroll,
  disbursePayroll,
  generatePayslipPdf,
  handleMpesaCallback,
  getPayslips,
};
