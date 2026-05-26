const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/dailyLabourer.controller');

router.get('/me', auth, ctrl.getMe);
router.get('/attendance', auth, ctrl.getAllAttendance);
router.post('/attendance', auth, role(['admin','owner','manager']), ctrl.createAttendance);
router.put('/attendance/:id', auth, role(['admin','owner','manager']), ctrl.updateAttendance);
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role(['admin','owner','manager']), ctrl.create);
router.put('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner','manager']), ctrl.update);

module.exports = router;
