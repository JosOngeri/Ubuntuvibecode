const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  switchMode,
  getCurrentMode,
  requestElevation,
  verifyElevation,
  assignSupervisor,
  removeSupervisorAllocation,
  getSupervisorAllocations,
} = require('../controllers/role.controller');

// @route   POST api/roles/switch-mode
// @desc    Switch owner/admin mode
// @access  Private (Owner only)
router.post('/switch-mode', auth, switchMode);

// @route   GET api/roles/current-mode
// @desc    Get current mode session
// @access  Private
router.get('/current-mode', auth, getCurrentMode);

// @route   POST api/roles/elevation-request
// @desc    Request OTP elevation for manager rights
// @access  Private (HR users)
router.post('/elevation-request', auth, requestElevation);

// @route   POST api/roles/verify-elevation
// @desc    Verify OTP and approve elevation
// @access  Private (Owner/Manager/Admin only)
router.post('/verify-elevation', auth, verifyElevation);

// @route   POST api/roles/supervisor-assign
// @desc    Assign supervisor to employee/daily labourer
// @access  Private (Manager/Admin/Owner only)
router.post('/supervisor-assign', auth, assignSupervisor);

// @route   DELETE api/roles/supervisor-assign/:allocation_id
// @desc    Remove supervisor allocation
// @access  Private (Manager/Admin/Owner only)
router.delete('/supervisor-assign/:allocation_id', auth, removeSupervisorAllocation);

// @route   GET api/roles/supervisor-allocations/:supervisor_id
// @desc    Get allocations for a supervisor
// @access  Private
router.get('/supervisor-allocations/:supervisor_id', auth, getSupervisorAllocations);

module.exports = router;
