/**
 * Job Repository
 * Pure data access layer for job operations
 * No business logic, only SQL/database operations
 */

const Job = require('../../../../models/Job.model');

const jobRepository = {
  /**
   * Create a new job
   * @param {Object} jobData
   * @returns {Promise<Object>}
   */
  async create(jobData) {
    return await Job.create(jobData);
  },

  /**
   * Find all jobs with optional filters
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    const { onlyOpen = false } = options;
    return await Job.findAll({ onlyOpen });
  },

  /**
   * Find job by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Job.findById(id);
  },

  /**
   * Update job
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    return await Job.update(id, updates);
  },

  /**
   * Delete job
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return await Job.delete(id);
  },

  /**
   * Find jobs by department
   * @param {string} department
   * @returns {Promise<Array>}
   */
  async findByDepartment(department) {
    const jobs = await Job.findAll();
    return jobs.filter(job => job.department === department);
  },

  /**
   * Find jobs by status
   * @param {string} status
   * @returns {Promise<Array>}
   */
  async findByStatus(status) {
    const jobs = await Job.findAll({ onlyOpen: false });
    return jobs.filter(job => job.status === status);
  },
};

module.exports = jobRepository;
