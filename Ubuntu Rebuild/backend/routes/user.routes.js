const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/user.controller');

router.get('/', auth, role(['admin','owner','manager']), ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role(['admin','owner']), ctrl.create);
router.put('/:id', auth, role(['admin','owner']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner']), ctrl.update);
router.delete('/:id', auth, role(['admin','owner']), ctrl.remove);

module.exports = router;
