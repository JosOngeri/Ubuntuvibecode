const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  attendanceReport,
  leaveReport,
  payrollReport,
  kpiReport,
  employeeReport,
  recruitmentReport,
  complaintsReport,
  dailyLabourReport,
  dashboardSummary,
  generatePdfReport,
} = require('../controllers/report.controller');

router.use(auth);

router.get('/attendance', attendanceReport);
router.get('/leave', leaveReport);
router.get('/payroll', payrollReport);
router.get('/kpi', kpiReport);
router.get('/employee', employeeReport);
router.get('/recruitment', recruitmentReport);
router.get('/complaints', complaintsReport);
router.get('/daily-labour', dailyLabourReport);
router.get('/dashboard-summary', dashboardSummary);
router.get('/pdf', generatePdfReport);

module.exports = router;
