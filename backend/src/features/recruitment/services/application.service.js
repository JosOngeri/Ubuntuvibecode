/**
 * Job Application Service
 * Business logic layer for job application operations
 * Handles validation, business rules, and coordinates with other services
 */

const crypto = require('crypto');
const logger = require('../../../utils/logger');
const { sendEmail } = require('../../../utils/email');
const applicationRepository = require('../repositories/application.repository');
const jobRepository = require('../repositories/job.repository');
const onboardingService = require('../../onboarding/services/onboarding.service');

/**
 * Generate offer token
 * @param {number} expiryHours
 * @returns {Object} { token, expiresAt }
 */
const generateOfferToken = (expiryHours = 72) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return { token, expiresAt };
};

/**
 * Create a new job application
 * @param {Object} applicationData
 * @returns {Promise<Object>}
 */
const createApplication = async applicationData => {
  logger.info('application.service.createApplication', 'Attempt', {
    jobId: applicationData.jobId,
    email: applicationData.applicantEmail,
  });

  // Verify job exists and is open
  const job = await jobRepository.findById(applicationData.jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  if (job.status !== 'open') {
    throw new Error('Job is not accepting applications');
  }

  const application = await applicationRepository.create(applicationData);
  logger.info('application.service.createApplication', 'Success', {
    applicationId: application.id,
  });

  return application;
};

/**
 * Get application by ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
const getApplication = async id => {
  logger.info('application.service.getApplication', 'Attempt', { id });

  const application = await applicationRepository.findById(id);

  if (!application) {
    throw new Error('Application not found');
  }

  logger.info('application.service.getApplication', 'Success', { id });
  return application;
};

/**
 * Get applications by job ID
 * @param {number} jobId
 * @returns {Promise<Array>}
 */
const getApplicationsByJob = async jobId => {
  logger.info('application.service.getApplicationsByJob', 'Attempt', { jobId });

  const applications = await applicationRepository.findByJobId(jobId);
  logger.info('application.service.getApplicationsByJob', 'Success', {
    count: applications.length,
  });

  return applications;
};

/**
 * Get applications by user ID
 * @param {number} userId
 * @returns {Promise<Array>}
 */
const getApplicationsByUser = async userId => {
  logger.info('application.service.getApplicationsByUser', 'Attempt', { userId });

  const applications = await applicationRepository.findByUserId(userId);
  logger.info('application.service.getApplicationsByUser', 'Success', {
    count: applications.length,
  });

  return applications;
};

/**
 * Get all applications with job details
 * @returns {Promise<Array>}
 */
const getAllApplications = async () => {
  logger.info('application.service.getAllApplications', 'Attempt');

  const applications = await applicationRepository.findAllWithJobs();
  logger.info('application.service.getAllApplications', 'Success', { count: applications.length });

  return applications;
};

/**
 * Get shortlisted applications
 * @returns {Promise<Array>}
 */
const getShortlistedApplications = async () => {
  logger.info('application.service.getShortlistedApplications', 'Attempt');

  const applications = await applicationRepository.findShortlisted();
  logger.info('application.service.getShortlistedApplications', 'Success', {
    count: applications.length,
  });

  return applications;
};

/**
 * Update application status
 * @param {number} id
 * @param {string} status
 * @param {number} userId - User ID triggering the status change
 * @returns {Promise<Object>}
 */
const updateStatus = async (id, status, userId) => {
  logger.info('application.service.updateStatus', 'Attempt', { id, status });

  const validStatuses = [
    'pending',
    'shortlisted',
    'interview_scheduled',
    'interview_completed',
    'offer_sent',
    'hired',
    'rejected',
  ];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const application = await applicationRepository.update(id, { status });

  if (!application) {
    throw new Error('Application not found');
  }

  // If status is changed to 'hired', trigger onboarding
  if (status === 'hired' && userId) {
    try {
      await onboardingService.startOnboarding(id, userId);
      logger.info('application.service.updateStatus', 'Onboarding triggered', { applicationId: id });
    } catch (error) {
      logger.error('application.service.updateStatus', 'Failed to trigger onboarding', error);
      // Don't fail the status update if onboarding fails
    }
  }

  logger.info('application.service.updateStatus', 'Success', { id, status });
  return application;
};

/**
 * Shortlist application
 * @param {number} id
 * @returns {Promise<Object>}
 */
const shortlistApplication = async id => {
  logger.info('application.service.shortlistApplication', 'Attempt', { id });

  const application = await applicationRepository.update(id, { status: 'shortlisted' });

  if (!application) {
    throw new Error('Application not found');
  }

  logger.info('application.service.shortlistApplication', 'Success', { id });
  return application;
};

/**
 * Schedule interview
 * @param {number} id
 * @param {Object} interviewData
 * @returns {Promise<Object>}
 */
const scheduleInterview = async (id, interviewData) => {
  logger.info('application.service.scheduleInterview', 'Attempt', { id, interviewData });

  const { interviewDate, interviewStatus = 'scheduled' } = interviewData;

  const application = await applicationRepository.update(id, {
    status: 'interview_scheduled',
    interviewDate,
    interviewStatus,
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Send interview invitation email
  if (application.applicantEmail) {
    await sendEmail({
      to: application.applicantEmail,
      subject: 'Interview Invitation - Ubuntu HRMS',
      text: `Hello ${application.applicantName},\n\nYou have been shortlisted for an interview.\n\nInterview Date: ${interviewDate}\n\nPlease confirm your attendance.`,
      html: `<p>Hello ${application.applicantName},</p><p>You have been shortlisted for an interview.</p><p><strong>Interview Date:</strong> ${interviewDate}</p><p>Please confirm your attendance.</p>`,
    });
  }

  logger.info('application.service.scheduleInterview', 'Success', { id });
  return application;
};

/**
 * Send job offer
 * @param {number} id
 * @param {Object} offerData
 * @returns {Promise<Object>}
 */
const sendOffer = async (id, offerData) => {
  logger.info('application.service.sendOffer', 'Attempt', { id, offerData });

  const { offeredSalary } = offerData;
  const { token, expiresAt } = generateOfferToken();

  const application = await applicationRepository.update(id, {
    status: 'offer_sent',
    offeredSalary,
    offerToken: token,
    offerTokenExpiresAt: expiresAt,
    offerSentAt: new Date(),
    offerStatus: 'pending',
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Send offer email
  if (application.applicantEmail) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5177';
    const offerLink = `${frontendUrl}/offer-response?token=${token}`;

    await sendEmail({
      to: application.applicantEmail,
      subject: 'Job Offer - Ubuntu HRMS',
      text: `Hello ${application.applicantName},\n\nCongratulations! We are pleased to offer you the position.\n\nOffer Details:\nSalary: ${offeredSalary}\n\nPlease respond to this offer using the link below:\n${offerLink}\n\nThis offer expires on ${expiresAt.toDateString()}.`,
      html: `<p>Hello ${application.applicantName},</p><p>Congratulations! We are pleased to offer you the position.</p><p><strong>Offer Details:</strong></p><p>Salary: ${offeredSalary}</p><p>Please respond to this offer using the link below:</p><p><a href="${offerLink}">Respond to Offer</a></p><p>This offer expires on ${expiresAt.toDateString()}.</p>`,
    });
  }

  logger.info('application.service.sendOffer', 'Success', { id });
  return application;
};

/**
 * Respond to offer
 * @param {string} token
 * @param {string} response
 * @returns {Promise<Object>}
 */
const respondToOffer = async (token, response) => {
  logger.info('application.service.respondToOffer', 'Attempt', { token, response });

  const validResponses = ['accepted', 'rejected'];
  if (!validResponses.includes(response)) {
    throw new Error(`Invalid response. Must be one of: ${validResponses.join(', ')}`);
  }

  const application = await applicationRepository.findByOfferToken(token);

  if (!application) {
    throw new Error('Invalid or expired offer token');
  }

  const now = new Date();
  if (application.offerTokenExpiresAt && now > application.offerTokenExpiresAt) {
    throw new Error('Offer has expired');
  }

  const updates = {
    offerStatus: response,
    status: response === 'accepted' ? 'hired' : 'rejected',
  };

  const updatedApplication = await applicationRepository.update(application.id, updates);

  logger.info('application.service.respondToOffer', 'Success', {
    applicationId: application.id,
    response,
  });
  return updatedApplication;
};

/**
 * Reject application
 * @param {number} id
 * @param {string} reason
 * @returns {Promise<Object>}
 */
const rejectApplication = async (id, reason = '') => {
  logger.info('application.service.rejectApplication', 'Attempt', { id, reason });

  const application = await applicationRepository.update(id, {
    status: 'rejected',
    managerNotes: reason,
  });

  if (!application) {
    throw new Error('Application not found');
  }

  logger.info('application.service.rejectApplication', 'Success', { id });
  return application;
};

/**
 * Delete application
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const deleteApplication = async id => {
  logger.info('application.service.deleteApplication', 'Attempt', { id });

  const result = await applicationRepository.delete(id);

  if (!result) {
    throw new Error('Application not found');
  }

  logger.info('application.service.deleteApplication', 'Success', { id });
  return true;
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
