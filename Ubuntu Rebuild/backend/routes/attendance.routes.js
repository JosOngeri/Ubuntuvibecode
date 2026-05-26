const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/attendance.controller');

router.get('/today', auth, ctrl.getToday);
router.get('/employee/:employeeId', auth, ctrl.getByEmployee);
router.get('/', auth, ctrl.getAll);
router.post('/punch', auth, ctrl.punch);
router.post('/manager/:employeeId', auth, role(['admin','owner','manager','supervisor']), ctrl.managerPunchForEmployee);
router.put('/:employeeId/:date', auth, role(['admin','owner','manager']), ctrl.upsert);

module.exports = router;
