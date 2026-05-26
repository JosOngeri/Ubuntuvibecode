const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/complaint.controller');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.put('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner','manager']), ctrl.update);

module.exports = router;
