const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/complaint.controller');

router.use(auth);

router.get('/', ctrl.getAll);
router.get('/stats', ctrl.getStats);
router.get('/employee/:employeeId', ctrl.getByEmployee);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id/status', ctrl.updateStatus);
router.put('/:id/resolve', ctrl.resolve);
router.put('/:id/close', ctrl.close);

module.exports = router;
