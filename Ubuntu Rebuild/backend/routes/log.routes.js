const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/log.controller');

router.get('/system', auth, role(['admin','owner']), ctrl.getSystemLogs);
router.get('/activity', auth, role(['admin','owner']), ctrl.getActivityLogs);

module.exports = router;
