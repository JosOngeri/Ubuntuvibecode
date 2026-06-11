/**
 * Job Service
 * Business logic layer for job operations
 * Handles validation, business rules, and coordinates with other services
 */

const logger = require('../../../utils/logger');
const jobRepository = require('../repositories/job.repository');

/**
 * Validate job deadline is not in the past
 * @param {Date} deadline
 * @throws {Error}
 */
const validateDeadline = deadline => {
  if (!deadline) return;

  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (deadlineDate < today) {
    throw new Error('Application deadline cannot be before today');
  }
};

/**
 * Create a new job
 * @param {Object} jobData
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const createJob = async (jobData, user) => {
  logger.info('job.service.createJob', 'Attempt', { title: jobData.title, userId: user?.id });

  // Validate deadline
  validateDeadline(jobData.applicationDeadline);

  // Add postedBy if not provided
  const dataToCreate = {
    ...jobData,
    postedBy: jobData.postedBy || user?.id,
  };

  const job = await jobRepository.create(dataToCreate);
  logger.info('job.service.createJob', 'Success', { jobId: job.id, title: job.title });

  return job;
};

/**
 * Get all jobs with optional filters
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getJobs = async (filters = {}) => {
  logger.info('job.service.getJobs', 'Attempt', filters);

  const jobs = await jobRepository.findAll(filters);
  logger.info('job.service.getJobs', 'Success', { count: jobs.length });

  return jobs;
};

/**
 * Get job by ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
const getJob = async id => {
  logger.info('job.service.getJob', 'Attempt', { id });

  const job = await jobRepository.findById(id);

  if (!job) {
    throw new Error('Job not found');
  }

  logger.info('job.service.getJob', 'Success', { id, title: job.title });
  return job;
};

/**
 * Update job
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
const updateJob = async (id, updates) => {
  logger.info('job.service.updateJob', 'Attempt', { id, updates });

  // Validate deadline if provided
  if (updates.applicationDeadline) {
    validateDeadline(updates.applicationDeadline);
  }

  const job = await jobRepository.update(id, updates);

  if (!job) {
    throw new Error('Job not found');
  }

  logger.info('job.service.updateJob', 'Success', { id });
  return job;
};

/**
 * Delete job
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const deleteJob = async id => {
  logger.info('job.service.deleteJob', 'Attempt', { id });

  const result = await jobRepository.delete(id);

  if (!result) {
    throw new Error('Job not found');
  }

  logger.info('job.service.deleteJob', 'Success', { id });
  return true;
};

/**
 * Publish job (set status to open)
 * @param {number} id
 * @returns {Promise<Object>}
 */
const publishJob = async id => {
  logger.info('job.service.publishJob', 'Attempt', { id });

  const job = await jobRepository.update(id, { status: 'open' });

  if (!job) {
    throw new Error('Job not found');
  }

  logger.info('job.service.publishJob', 'Success', { id });
  return job;
};

/**
 * Close job (set status to closed)
 * @param {number} id
 * @returns {Promise<Object>}
 */
const closeJob = async id => {
  logger.info('job.service.closeJob', 'Attempt', { id });

  const job = await jobRepository.update(id, { status: 'closed' });

  if (!job) {
    throw new Error('Job not found');
  }

  logger.info('job.service.closeJob', 'Success', { id });
  return job;
};

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  publishJob,
  closeJob,
};
