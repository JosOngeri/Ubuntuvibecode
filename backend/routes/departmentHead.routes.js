const express = require('express');
const router = express.Router();
const departmentHeadController = require('../controllers/departmentHead.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', departmentHeadController.createAssignment);
router.get('/', departmentHeadController.getAssignments);
router.get('/me', departmentHeadController.getMyAssignment);
router.get('/department/:departmentId', departmentHeadController.getDepartmentHead);
router.get('/:id', departmentHeadController.getAssignmentById);
router.put('/:id', departmentHeadController.updateAssignment);
router.delete('/:id', departmentHeadController.deleteAssignment);

module.exports = router;
