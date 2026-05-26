const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dailyLabourer.controller');

router.use(auth);

// Specific routes must come before parameterized routes
router.get('/me', ctrl.getMe);
router.get('/attendance', ctrl.getAttendance);
router.get('/wages', ctrl.getWageSummary);
router.get('/urgent', ctrl.getUrgentWages);
router.get('/by-user/:userId', ctrl.getByUserId);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/attendance', ctrl.getLabourerAttendance);
router.get('/:id/payments', ctrl.getLabourerPayments);
router.post('/', ctrl.create);
router.post('/attendance', ctrl.recordAttendance);
router.post('/batch-approve', ctrl.batchApproveWages);
router.put('/urgency', ctrl.updateWageUrgency);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/convert', ctrl.convertToEmployee);

module.exports = router;
