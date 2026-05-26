const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  verifyApplication,
  getVerificationResults,
  verifyAllApplications,
  updateManagerRanking,
  updateOwnerApproval
} = require('../controllers/verification.controller');

// Verify a single application (manager only)
router.post('/jobs/:jobId/applications/:appId/verify', auth, role(['manager', 'admin']), verifyApplication);

// Get verification results (manager/admin only)
router.get('/jobs/:jobId/applications/:appId/verification', auth, role(['manager', 'admin']), getVerificationResults);

// Verify all applications for a job (manager only)
router.post('/jobs/:jobId/applications/verify-batch', auth, role(['manager', 'admin']), verifyAllApplications);

// Update manager ranking (manager only)
router.put('/jobs/:jobId/applications/:appId/manager-ranking', auth, role(['manager', 'admin']), updateManagerRanking);

// Update owner approval (owner/admin only)
router.put('/jobs/:jobId/applications/:appId/owner-approval', auth, role(['owner', 'admin']), updateOwnerApproval);

module.exports = router;
