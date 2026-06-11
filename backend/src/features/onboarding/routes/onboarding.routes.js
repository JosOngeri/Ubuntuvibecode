const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboarding.controller');
const auth = require('../../../../middleware/auth');

// All onboarding routes require authentication
router.use(auth);

// Start onboarding process
router.post('/start/:applicationId', onboardingController.startOnboarding);

// Save onboarding step
router.post('/:applicationId/step/:stepNumber', onboardingController.saveStep);

// Get onboarding progress
router.get('/:applicationId/progress', onboardingController.getProgress);

// Complete onboarding
router.post('/:applicationId/complete', onboardingController.completeOnboarding);

// Department management
router.get('/departments', onboardingController.getDepartments);
router.post('/departments', onboardingController.createDepartment);

// Get potential supervisors
router.get('/supervisors', onboardingController.getPotentialSupervisors);

// Get available assets
router.get('/assets/available', onboardingController.getAvailableAssets);

// Document management
router.post('/documents', onboardingController.uploadDocument);
router.get('/documents/application/:applicationId', onboardingController.getApplicationDocuments);
router.get('/documents/employee/:employeeId', onboardingController.getEmployeeDocuments);
router.delete('/documents/:documentId', onboardingController.deleteDocument);

// Asset return tracking
router.put('/assets/:assetId/return', onboardingController.updateAssetReturnStatus);
router.get('/assets/pending-return', onboardingController.getAssetsPendingReturn);

module.exports = router;
