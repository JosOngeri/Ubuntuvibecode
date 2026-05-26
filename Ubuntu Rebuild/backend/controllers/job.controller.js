const Job = require('../models/Job.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('job.getAll', 'Entry', { query: req.query });
  try {
    const { status, department, page, limit } = req.query;
    const jobs = await Job.findAll({ status, department, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(jobs);
  } catch (err) {
    logger.error('job.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    res.json(job);
  } catch (err) {
    logger.error('job.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('job.create', 'Entry', { body: req.body });
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user.id });
    logger.info('job.create', 'Created', { id: job.id });
    res.status(201).json(job);
  } catch (err) {
    logger.error('job.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('job.update', 'Entry', { id: req.params.id });
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    const updated = await Job.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('job.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const { jobId, status, page, limit } = req.query;
    const applications = await Job.findAllApplications({ jobId, status, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(applications);
  } catch (err) {
    logger.error('job.getAllApplications', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await Job.findApplicationById(req.params.applicationId);
    if (!application) return res.status(404).json({ msg: 'Application not found' });
    res.json(application);
  } catch (err) {
    logger.error('job.getApplicationById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const createApplication = async (req, res) => {
  logger.info('job.createApplication', 'Entry', { body: req.body });
  try {
    const application = await Job.createApplication({ ...req.body, userId: req.user.id });
    logger.info('job.createApplication', 'Created', { id: application.id });
    res.status(201).json(application);
  } catch (err) {
    logger.error('job.createApplication', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateApplication = async (req, res) => {
  logger.info('job.updateApplication', 'Entry', { id: req.params.applicationId });
  try {
    const application = await Job.findApplicationById(req.params.applicationId);
    if (!application) return res.status(404).json({ msg: 'Application not found' });
    const updated = await Job.updateApplication(req.params.applicationId, { ...req.body, reviewedBy: req.user.id });
    res.json(updated);
  } catch (err) {
    logger.error('job.updateApplication', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const scoreApplicants = async (req, res) => {
  logger.info('job.scoreApplicants', 'Entry', { jobId: req.params.id });
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    const applications = await Job.findAllApplications({ jobId: req.params.id });
    const evaluationParams = job.evaluationParams || {};
    const keywords = evaluationParams.keywords || [];
    const criteria = evaluationParams.criteria || [];
    const results = [];
    for (const app of applications) {
      let keywordScore = 0;
      let criteriaScore = 0;
      const text = [
        app.employmentHistory?.map((e) => e.description).join(' ') || '',
        app.personalInfo?.coverLetter || '',
        app.skills?.join(' ') || ''
      ].join(' ').toLowerCase();
      for (const kw of keywords) {
        const count = (text.match(new RegExp(kw.toLowerCase(), 'g')) || []).length;
        keywordScore += count;
      }
      keywordScore = Math.min(100, keywordScore * 10);
      for (const crit of criteria) {
        if (crit.name === 'yearsExperience' && crit.operator === '>=') {
          const years = app.employmentHistory?.reduce((sum, e) => sum + (e.years || 0), 0) || 0;
          if (years >= crit.value) criteriaScore += (crit.weight || 10);
        } else if (crit.name === 'hasDegree' && crit.operator === 'boolean') {
          const hasDegree = app.education?.furtherEducation?.some((e) => e.qualification === 'degree' || e.qualification === 'bachelor');
          if (hasDegree) criteriaScore += (crit.weight || 10);
        }
      }
      const totalScore = (keywordScore * 0.4) + (criteriaScore * 0.6);
      await Job.updateApplication(app.id, { autoScore: totalScore, scoreBreakdown: { keywordScore, criteriaScore } });
      results.push({ applicationId: app.id, autoScore: totalScore, keywordScore, criteriaScore });
    }
    res.json(results);
  } catch (err) {
    logger.error('job.scoreApplicants', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update, getAllApplications, getApplicationById, createApplication, updateApplication, scoreApplicants };
