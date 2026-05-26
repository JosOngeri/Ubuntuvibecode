const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', auditController.getLogs);
router.get('/user/:userId', auditController.getUserLogs);
router.get('/entity/:entityType/:entityId', auditController.getEntityLogs);
router.post('/log', auditController.createLog);

module.exports = router;
