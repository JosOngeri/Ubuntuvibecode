const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/settings.controller');

router.get('/', auth, ctrl.getAll);
router.get('/category/:category', auth, ctrl.getByCategory);
router.get('/audit', auth, ctrl.getAuditLog);
router.post('/', auth, role(['admin','owner','manager']), ctrl.create);
router.put('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.delete('/:id', auth, role(['admin','owner']), ctrl.remove);

module.exports = router;
