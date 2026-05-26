const express = require('express');
const router = express.Router();
const permissionsController = require('../controllers/permissions.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/list', permissionsController.getAllPermissionsList);
router.post('/grant', permissionsController.grantPermission);
router.delete('/revoke/:id', permissionsController.revokePermission);
router.get('/user/:userId', permissionsController.getUserPermissions);
router.get('/me', permissionsController.getMyPermissions);
router.get('/active', permissionsController.getActivePermissions);
router.get('/expiring', permissionsController.getExpiringSoon);
router.get('/role/:role', permissionsController.getRolePermissions);
router.put('/role/:role', permissionsController.updateRolePermissions);

module.exports = router;
