const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/profile.controller');

router.get('/me', auth, ctrl.getMe);
router.post('/', auth, ctrl.create);
router.put('/me', auth, ctrl.update);
router.patch('/me', auth, ctrl.update);

module.exports = router;
