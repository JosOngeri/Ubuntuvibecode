const express = require('express');
const auth = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const { getEmployees, getMyEmployee, getEmployeeById, addEmployee, updateEmployee, deleteEmployee, getEmployeeAssets, getOrientationProgress } = require('../src/features/employees/controllers/employee.controller');

const router = express.Router();

router.get('/', auth, roleMiddleware(['admin', 'manager', 'supervisor']), getEmployees);
router.get('/me', auth, roleMiddleware(['admin', 'manager', 'supervisor', 'employee']), getMyEmployee);
router.get('/:id', auth, roleMiddleware(['admin', 'manager', 'supervisor', 'employee']), getEmployeeById);
router.get('/:id/assets', auth, roleMiddleware(['admin', 'manager', 'supervisor', 'employee']), getEmployeeAssets);
router.get('/:id/orientation', auth, roleMiddleware(['admin', 'manager', 'supervisor', 'employee']), getOrientationProgress);
router.post('/', auth, roleMiddleware(['admin', 'manager']), addEmployee);  // Create: Admin and Manager
router.put('/:id', auth, roleMiddleware(['admin', 'manager']), updateEmployee);  // Update: Admin and Manager
router.delete('/:id', auth, roleMiddleware(['admin', 'manager']), deleteEmployee);  // Delete: Admin and Manager

module.exports = router;
