const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/leave.controller');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.post('/:id/approve', auth, role(['admin','owner','manager']), ctrl.approve);
router.post('/:id/reject', auth, role(['admin','owner','manager']), ctrl.reject);
router.post('/:id/cancel', auth, ctrl.cancel);

module.exports = router;
