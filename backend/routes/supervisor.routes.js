const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorAllocation.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', supervisorController.createAllocation);
router.get('/', supervisorController.getAllocations);
router.get('/me/supervisees', supervisorController.getMySupervisees);
router.get('/me/supervisors', supervisorController.getMySupervisors);
router.get('/:id', supervisorController.getAllocationById);
router.put('/:id', supervisorController.updateAllocation);
router.delete('/:id', supervisorController.deleteAllocation);

module.exports = router;
