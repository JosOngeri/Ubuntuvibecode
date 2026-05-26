const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/onboarding.controller');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role(['admin','owner','manager','hr']), ctrl.initiate);
router.put('/:id', auth, role(['admin','owner','manager','hr']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner','manager','hr']), ctrl.update);

module.exports = router;
