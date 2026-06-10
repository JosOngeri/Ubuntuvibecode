/**
 * Job Application Repository
 * Pure data access layer for job application operations
 * No business logic, only SQL/database operations
 */

const JobApplication = require('../../../../models/JobApplication.model');

const applicationRepository = {
  /**
   * Create a new job application
   * @param {Object} applicationData
   * @returns {Promise<Object>}
   */
  async create(applicationData) {
    return await JobApplication.create(applicationData);
  },

  /**
   * Find application by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await JobApplication.findById(id);
  },

  /**
   * Find applications by job ID
   * @param {number} jobId
   * @returns {Promise<Array>}
   */
  async findByJobId(jobId) {
    return await JobApplication.findByJob(jobId);
  },

  /**
   * Find applications by applicant email
   * @param {string} email
   * @returns {Promise<Array>}
   */
  async findByEmail(email) {
    return await JobApplication.findByApplicantEmail(email);
  },

  /**
   * Find applications by user ID
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    return await JobApplication.findByUserId(userId);
  },

  /**
   * Find applications by employee ID
   * @param {number} employeeId
   * @returns {Promise<Array>}
   */
  async findByEmployeeId(employeeId) {
    return await JobApplication.findByEmployeeId(employeeId);
  },

  /**
   * Find all applications with job details
   * @returns {Promise<Array>}
   */
  async findAllWithJobs() {
    return await JobApplication.findAllWithJobs();
  },

  /**
   * Find shortlisted applications
   * @returns {Promise<Array>}
   */
  async findShortlisted() {
    return await JobApplication.findShortlisted();
  },

  /**
   * Find application by offer token
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  async findByOfferToken(token) {
    return await JobApplication.findByOfferToken(token);
  },

  /**
   * Update application
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    return await JobApplication.update(id, updates);
  },

  /**
   * Delete application
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return await JobApplication.delete(id);
  },

  /**
   * Link application to user
   * @param {number} applicationId
   * @param {number} userId
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async linkToUser(applicationId, userId, reason = 'manual') {
    return await JobApplication.linkToUser(applicationId, userId, reason);
  },

  /**
   * Backfill user links for applications
   * @returns {Promise<void>}
   */
  async backfillLinks() {
    return await JobApplication.backfillLinks();
  },
};

module.exports = applicationRepository;
