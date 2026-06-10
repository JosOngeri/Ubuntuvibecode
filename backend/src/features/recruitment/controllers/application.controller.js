/**
 * Job Application Controller
 * Request handling layer for job application endpoints
 * Uses application service for business logic
 */

const logger = require('../../../utils/logger');
const {
  success,
  created,
  badRequest,
  notFound,
  serverError,
} = require('../../../shared/utils/response');
const applicationService = require('../services/application.service');

/**
 * Create a new job application
 */
const createApplication = async (req, res) => {
  try {
    const application = await applicationService.createApplication(req.body);
    created(res, application, 'Application submitted successfully');
  } catch (err) {
    if (err.message.includes('Job not found') || err.message.includes('not accepting')) {
      return badRequest(res, err.message);
    }
    logger.error('application.controller.createApplication', 'Unhandled error', err);
    serverError(res, 'Failed to submit application');
  }
};

/**
 * Get application by ID
 */
const getApplication = async (req, res) => {
  try {
    const application = await applicationService.getApplication(req.params.id);
    success(res, application, 'Application retrieved successfully');
  } catch (err) {
    if (err.message === 'Application not found') {
      return notFound(res, err.message);
    }
    logger.error('application.controller.getApplication', 'Unhandled error', err);
    serverError(res, 'Failed to retrieve application');
  }
};

/**
 * Get applications by job ID
 */
const getApplicationsByJob = async (req, res) => {
  try {
    const applications = await applicationService.getApplicationsByJob(req.params.jobId);
    success(res, applications, 'Applications retrieved successfully');
  } catch (err) {
    logger.error('application.controller.getApplicationsByJob', 'Unhandled error', err);
    serverError(res, 'Failed to retrieve applications');
  }
};

/**
 * Get applications by user ID
 */
const getApplicationsByUser = async (req, res) => {
  try {
    const applications = await applicationService.getApplicationsByUser(req.params.userId);
    success(res, applications, 'Applications retrieved successfully');
  } catch (err) {
    logger.error('application.controller.getApplicationsByUser', 'Unhandled error', err);
    serverError(res, 'Failed to retrieve applications');
  }
};

/**
 * Get all applications
 */
const getAllApplications = async (req, res) => {
  try {
    const applications = await applicationService.getAllApplications();
    success(res, applications, 'Applications retrieved successfully');
  } catch (err) {
    logger.error('application.controller.getAllApplications', 'Unhandled error', err);
    serverError(res, 'Failed to retrieve applications');
  }
};

/**
 * Get shortlisted applications
 */
const getShortlistedApplications = async (req, res) => {
  try {
    const applications = await applicationService.getShortlistedApplications();
    success(res, applications, 'Shortlisted applications retrieved successfully');
  } catch (err) {
    logger.error('application.controller.getShortlistedApplications', 'Unhandled error', err);
    serverError(res, 'Failed to retrieve shortlisted applications');
  }
};

/**
 * Update application status
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await applicationService.updateStatus(req.params.id, status);
    success(res, application, 'Application status updated successfully');
  } catch (err) {
    if (err.message === 'Application not found') {
      return notFound(res, err.message);
    }
    if (err.message.includes('Invalid status')) {
      return badRequest(res, err.message);
    }
    logger.error('application.controller.updateStatus', 'Unhandled error', err);
    serverError(res, 'Failed to update application status');
  }
};

/**
 * Shortlist application
 */
const shortlistApplication = async (req, res) => {
  try {
    const application = await applicationService.shortlistApplication(req.params.id);
    success(res, application, 'Application shortlisted successfully');
  } catch (err) {
    if (err.message === 'Application not found') {
      return notFound(res, err.message);
    }
    logger.error('application.controller.shortlistApplication', 'Unhandled error', err);
    serverError(res, 'Failed to shortlist application');
  }
};

/**
 * Schedule interview
 */
const scheduleInterview = async (req, res) => {
  try {
    const application = await applicationService.scheduleInterview(req.params.id, req.body);
    success(res, application, 'Interview scheduled successfully');
  } catch (err) {
    if (err.message === 'Application not found') {
      return notFound(res, err.message);
    }
    logger.error('application.controller.scheduleInterview', 'Unhandled error', err);
    serverError(res, 'Failed to schedule interview');
  }
};

/**
 * Send job offer
 */
const sendOffer = async (req, res) => {
  try {
    const application = await applicationService.sendOffer(req.params.id, req.body);
    success(res, application, 'Job offer sent successfully');
  } catch (err) {
    if (err.message === 'Application not found') {
      return notFound(res, err.message);
    }
    logger.error('application.controller.sendOffer', 'Unhandled error', err);
    serverError(res, 'Failed to send job offer');
  }
};

/**
 * Respond to offer
 */
const respondToOffer = async (req, res) => {
  try {
    const { token, response } = req.body;
    const application = await applicationService.respondToOffer(token, response);
    success(res, application, 'Offer response recorded successfully');
  } catch (err) {
    if (err.message.includes('Invalid') || err.message.includes('expired')) {
      return badRequest(res, err.message);
    }
    logger.error('application.controller.respondToOffer', 'Unhandled error', err);
    serverError(res, 'Failed to record offer response');
  }
};

/**
 * Reject application
 */
const rejectApplication = async (req, res) => {
  try {
    const { reason } = req.body;
    const application = await applicationService.rejectApplication(req.params.id, reason);
    success(res, application, 'Application rejected successfully');
  } catch (err) {
    if (err.message === 'Application not found') {
      return notFound(res, err.message);
    }
    logger.error('application.controller.rejectApplication', 'Unhandled error', err);
    serverError(res, 'Failed to reject application');
  }
};

/**
 * Delete application
 */
const deleteApplication = async (req, res) => {
  try {
    await applicationService.deleteApplication(req.params.id);
    success(res, null, 'Application deleted successfully');
  } catch (err) {
    if (err.message === 'Application not found') {
      return notFound(res, err.message);
    }
    logger.error('application.controller.deleteApplication', 'Unhandled error', err);
    serverError(res, 'Failed to delete application');
  }
};

module.exports = {
  createApplication,
  getApplication,
  getApplicationsByJob,
  getApplicationsByUser,
  getAllApplications,
  getShortlistedApplications,
  updateStatus,
  shortlistApplication,
  scheduleInterview,
  sendOffer,
  respondToOffer,
  rejectApplication,
  deleteApplication,
};
