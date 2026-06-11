/**
 * Job Controller
 * Request handling layer for job endpoints
 * Uses job service for business logic
 */

const logger = require('../../../../utils/logger');
const jobService = require('../services/job.service');

// Temporary delegation to old controller for functions not yet migrated
const oldJobController = require('../../../../controllers/job.controller');

/**
 * Create a new job
 */
const createJob = async (req, res) => {
  try {
    const job = await jobService.createJob(req.body, req.user);
    res.json(job);
  } catch (err) {
    if (err.message.includes('deadline')) {
      return res.status(400).json({ msg: err.message });
    }
    logger.error('job.controller.createJob', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to create job' });
  }
};

/**
 * Get all jobs
 */
const getJobs = async (req, res) => {
  try {
    const filters = {
      onlyOpen: req.query.open === 'true',
    };
    const jobs = await jobService.getJobs(filters);
    res.json(jobs);
  } catch (err) {
    logger.error('job.controller.getJobs', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to retrieve jobs' });
  }
};

/**
 * Get job by ID
 */
const getJob = async (req, res) => {
  try {
    const job = await jobService.getJob(req.params.id);
    res.json(job);
  } catch (err) {
    if (err.message === 'Job not found') {
      return res.status(404).json({ msg: err.message });
    }
    logger.error('job.controller.getJob', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to retrieve job' });
  }
};

/**
 * Update job
 */
const updateJob = async (req, res) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.body);
    res.json(job);
  } catch (err) {
    if (err.message === 'Job not found') {
      return res.status(404).json({ msg: err.message });
    }
    if (err.message.includes('deadline')) {
      return res.status(400).json({ msg: err.message });
    }
    logger.error('job.controller.updateJob', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to update job' });
  }
};

/**
 * Delete job
 */
const deleteJob = async (req, res) => {
  try {
    await jobService.deleteJob(req.params.id);
    res.json({ msg: 'Job deleted successfully' });
  } catch (err) {
    if (err.message === 'Job not found') {
      return res.status(404).json({ msg: err.message });
    }
    logger.error('job.controller.deleteJob', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to delete job' });
  }
};

/**
 * Extend deadline - delegated to old controller
 */
const extendDeadline = (req, res) => oldJobController.extendDeadline(req, res);

/**
 * List open jobs - delegated to old controller
 */
const listOpenJobs = (req, res) => oldJobController.listOpenJobs(req, res);

/**
 * Get public job - delegated to old controller
 */
const getPublicJob = (req, res) => oldJobController.getPublicJob(req, res);

/**
 * Get my applications - delegated to old controller
 */
const getMyApplications = (req, res) => oldJobController.getMyApplications(req, res);

/**
 * Apply to job - delegated to old controller
 */
const applyToJob = (req, res) => oldJobController.applyToJob(req, res);

/**
 * Get applications - delegated to old controller
 */
const getApplications = (req, res) => oldJobController.getApplications(req, res);

/**
 * Update application status - delegated to old controller
 */
const updateApplicationStatus = (req, res) => oldJobController.updateApplicationStatus(req, res);

/**
 * Get applicant - delegated to old controller
 */
const getApplicant = (req, res) => oldJobController.getApplicant(req, res);

/**
 * Update applicant - delegated to old controller
 */
const updateApplicant = (req, res) => oldJobController.updateApplicant(req, res);

/**
 * Delete applicant - delegated to old controller
 */
const deleteApplicant = (req, res) => oldJobController.deleteApplicant(req, res);

/**
 * Score applicants - delegated to old controller
 */
const scoreApplicants = (req, res) => oldJobController.scoreApplicants(req, res);

/**
 * Filter applicants - delegated to old controller
 */
const filterApplicants = (req, res) => oldJobController.filterApplicants(req, res);

/**
 * Reallocate rating - delegated to old controller
 */
const reallocateRating = (req, res) => oldJobController.reallocateRating(req, res);

/**
 * Get shortlisted applications - delegated to old controller
 */
const getShortlisted = (req, res) => oldJobController.getShortlisted(req, res);

/**
 * Get all applications - delegated to old controller
 */
const getAllApplications = (req, res) => oldJobController.getAllApplications(req, res);

/**
 * Get application by ID - delegated to old controller
 */
const getApplicationById = (req, res) => oldJobController.getApplicationById(req, res);

/**
 * Get applications by employee - delegated to old controller
 */
const getApplicationsByEmployee = (req, res) => oldJobController.getApplicationsByEmployee(req, res);

/**
 * Get applications by applicant - delegated to old controller
 */
const getApplicationsByApplicant = (req, res) => oldJobController.getApplicationsByApplicant(req, res);

/**
 * Reverse rating - delegated to old controller
 */
const reverseRating = (req, res) => oldJobController.reverseRating(req, res);

/**
 * Shortlist application - delegated to old controller
 */
const shortlistApplication = (req, res) => oldJobController.shortlistApplication(req, res);

/**
 * Update interview score - delegated to old controller
 */
const updateInterviewScore = (req, res) => oldJobController.updateInterviewScore(req, res);

/**
 * Send offer - delegated to old controller
 */
const sendOffer = (req, res) => oldJobController.sendOffer(req, res);

/**
 * Create interview invite - delegated to old controller
 */
const createInterviewInvite = (req, res) => oldJobController.createInterviewInvite(req, res);

/**
 * Input panelist scores - delegated to old controller
 */
const inputPanelistScores = (req, res) => oldJobController.inputPanelistScores(req, res);

/**
 * Submit interview feedback - delegated to old controller
 */
const submitInterviewFeedback = (req, res) => oldJobController.submitInterviewFeedback(req, res);

/**
 * Get interview summary - delegated to old controller
 */
const getInterviewSummary = (req, res) => oldJobController.getInterviewSummary(req, res);

/**
 * Get interview detail - delegated to old controller
 */
const getInterviewDetail = (req, res) => oldJobController.getInterviewDetail(req, res);

/**
 * Import application to employee - delegated to old controller
 */
const importApplicationToEmployee = (req, res) => oldJobController.importApplicationToEmployee(req, res);

/**
 * Validate offer - delegated to old controller
 */
const validateOffer = (req, res) => oldJobController.validateOffer(req, res);

/**
 * Accept offer with verification - delegated to old controller
 */
const acceptOfferWithVerification = (req, res) => oldJobController.acceptOfferWithVerification(req, res);

/**
 * Negotiate salary with verification - delegated to old controller
 */
const negotiateSalaryWithVerification = (req, res) => oldJobController.negotiateSalaryWithVerification(req, res);

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  extendDeadline,
  listOpenJobs,
  getPublicJob,
  getMyApplications,
  applyToJob,
  getApplications,
  updateApplicationStatus,
  getApplicant,
  updateApplicant,
  deleteApplicant,
  scoreApplicants,
  filterApplicants,
  reallocateRating,
  getShortlisted,
  getAllApplications,
  getApplicationById,
  getApplicationsByEmployee,
  getApplicationsByApplicant,
  reverseRating,
  shortlistApplication,
  updateInterviewScore,
  sendOffer,
  createInterviewInvite,
  inputPanelistScores,
  submitInterviewFeedback,
  getInterviewSummary,
  getInterviewDetail,
  importApplicationToEmployee,
  validateOffer,
  acceptOfferWithVerification,
  negotiateSalaryWithVerification,
};
