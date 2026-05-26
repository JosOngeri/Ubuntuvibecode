const express = require('express');
const router = express.Router();
const orientationChecklistController = require('../controllers/orientationChecklist.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, role(['admin', 'manager', 'hr']), orientationChecklistController.getAll);
router.get('/role/:role', auth, role(['admin', 'manager', 'hr']), orientationChecklistController.getByRole);
router.get('/:id', auth, role(['admin', 'manager', 'hr']), orientationChecklistController.getById);
router.post('/', auth, role(['admin', 'manager', 'hr']), orientationChecklistController.create);
router.put('/:id', auth, role(['admin', 'manager', 'hr']), orientationChecklistController.update);
router.delete('/:id', auth, role(['admin', 'manager', 'hr']), orientationChecklistController.delete);

module.exports = router;
