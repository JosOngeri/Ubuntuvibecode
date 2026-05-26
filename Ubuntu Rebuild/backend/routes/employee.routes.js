const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/employee.controller');

router.get('/me', auth, ctrl.getMe);
router.get('/by-user/:userId', auth, ctrl.getByUserId);
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role(['admin','owner','manager']), ctrl.create);
router.put('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.delete('/:id', auth, role(['admin','owner']), ctrl.remove);

module.exports = router;
