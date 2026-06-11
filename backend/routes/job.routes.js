const express = require('express');
const router = express.Router();
const jobController = require('../src/features/recruitment/controllers/job.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/cvUpload');

// 3.4.1 Job Posting CRUD (protected)
router.post('/', auth, role(['admin', 'manager', 'hr']), jobController.createJob);
router.get('/', auth, jobController.getJobs);
// 3.4.4 Available Jobs Listing (public)
router.get('/public/list', jobController.listOpenJobs);
router.get('/public/:id', jobController.getPublicJob);
router.get('/my-applications', auth, jobController.getMyApplications);

router.get('/:id', auth, jobController.getJob);
router.put('/:id', auth, role(['admin', 'manager', 'hr']), jobController.updateJob);
router.delete('/:id', auth, role(['admin', 'manager', 'hr']), jobController.deleteJob);
router.put('/:id/extend-deadline', auth, role(['admin', 'manager', 'hr']), jobController.extendDeadline);

// 3.4.5 Application Submission (public, with CV upload)
router.post('/:id/apply', upload.fields([{ name: 'cv' }, { name: 'coverLetter' }]), jobController.applyToJob);

// 3.4.6 Application Review (manager/HR only)
router.get('/:id/applications', auth, role(['admin', 'manager', 'hr']), jobController.getApplications);
router.put('/applications/:appId/status', auth, role(['admin', 'manager', 'hr']), jobController.updateApplicationStatus);
router.get('/:jobId/applicants/:appId', auth, role(['admin', 'manager', 'hr']), jobController.getApplicant);
router.put('/:jobId/applicants/:appId', auth, role(['admin', 'manager', 'hr']), jobController.updateApplicant);
router.delete('/:jobId/applicants/:appId', auth, role(['admin', 'manager', 'hr']), jobController.deleteApplicant);

// Applicant scoring
router.post('/:id/score-applicants', auth, role(['admin', 'manager', 'hr']), jobController.scoreApplicants);
router.post('/:id/filter-applicants', auth, role(['admin', 'manager', 'hr']), jobController.filterApplicants);
router.post('/applications/reallocate-rating', auth, role(['admin', 'manager', 'hr']), jobController.reallocateRating);

// Cross-job views — MUST be before :appId wildcard routes
router.get('/applications/shortlisted/all', auth, role(['admin', 'manager', 'hr']), jobController.getShortlisted);
router.get('/applications/all', auth, role(['admin', 'manager', 'hr']), jobController.getAllApplications);

// Get single application by ID — static segment, before :appId wildcards
router.get('/applications/:appId', auth, role(['admin', 'manager', 'hr']), jobController.getApplicationById);

// Get applications by employee/applicant — static segments, before :appId wildcards
router.get('/applications/employee/:employeeId', auth, role(['admin', 'manager', 'hr']), jobController.getApplicationsByEmployee);
router.get('/applications/applicant/:email', auth, role(['admin', 'manager', 'hr']), jobController.getApplicationsByApplicant);

// :appId wildcard routes
router.post('/applications/:applicationId/reverse-rating', auth, role(['admin', 'manager', 'hr']), jobController.reverseRating);
router.post('/applications/:appId/shortlist', auth, role(['admin', 'manager', 'hr']), jobController.shortlistApplication);
router.put('/applications/:appId/interview-score', auth, role(['admin', 'manager', 'hr']), jobController.updateInterviewScore);
router.post('/applications/:appId/send-offer', auth, role(['admin', 'manager', 'hr']), jobController.sendOffer);
router.post('/applications/:appId/interview-invite', jobController.createInterviewInvite);
router.post('/applications/:appId/input-scores', auth, role(['admin', 'manager', 'hr']), jobController.inputPanelistScores);
router.post('/applications/:appId/interview-feedback/:token', jobController.submitInterviewFeedback);
router.get('/applications/:appId/interview-summary', auth, role(['admin', 'manager', 'hr']), jobController.getInterviewSummary);
router.get('/applications/:appId/interview-detail', auth, role(['admin', 'manager', 'hr']), jobController.getInterviewDetail);
router.post('/applications/:appId/import-to-employee/:employeeId', auth, role(['admin', 'manager', 'hr']), jobController.importApplicationToEmployee);

// Offer response (public endpoints for applicants)
router.post('/offers/validate', jobController.validateOffer);
router.post('/offers/accept', jobController.acceptOfferWithVerification);
router.post('/offers/negotiate', jobController.negotiateSalaryWithVerification);

module.exports = router;
