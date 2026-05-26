const { query } = require('../config/db');
const { verifyCandidate } = require('../utils/ruleBasedVerification');
const logger = require('../utils/logger');

/**
 * Verify a job application using rule-based verification
 */
const verifyApplication = async (req, res) => {
  try {
    const { appId } = req.params;
    const userId = req.user?.id;

    // Get the application
    const { rows: applications } = await query(
      `SELECT * FROM job_applications WHERE id = $1`,
      [appId]
    );

    if (!applications || applications.length === 0) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    const application = applications[0];

    // Get job requirements for skill matching
    const { rows: jobs } = await query(
      `SELECT requirements, skills FROM jobs WHERE id = $1`,
      [application.job_id]
    );

    const job = jobs[0] || {};
    const jobRequirements = {
      skills: job.skills ? JSON.parse(job.skills) : [],
      requirements: job.requirements || ''
    };

    // Prepare application data for verification
    const applicationData = {
      personalInfo: application.personal_info ? JSON.parse(application.personal_info) : {},
      education: application.education ? JSON.parse(application.education) : {},
      employmentHistory: application.employment_history ? JSON.parse(application.employment_history) : [],
      skills: application.skills ? JSON.parse(application.skills) : {}
    };

    // Run verification
    const verificationResult = await verifyCandidate(applicationData, jobRequirements);

    // Update application with verification results
    await query(
      `UPDATE job_applications 
       SET verification_status = $1,
           verification_score = $2,
           verification_results = $3,
           verification_flags = $4,
           ai_ranking = $5,
           ai_ranking_breakdown = $6,
           verified_at = NOW(),
           verified_by = $7
       WHERE id = $8`,
      [
        verificationResult.verification_status,
        verificationResult.verification_score,
        JSON.stringify(verificationResult.verification_results),
        JSON.stringify(verificationResult.verification_flags),
        verificationResult.ai_ranking,
        JSON.stringify(verificationResult.ai_ranking_breakdown),
        userId,
        appId
      ]
    );

    res.json({
      success: true,
      verification: verificationResult
    });
  } catch (error) {
    logger.error('verification.verifyApplication', 'Verification error', error, { appId: req.params.appId });
    res.status(500).json({ msg: 'Verification failed', error: error.message });
  }
};

/**
 * Get verification results for an application
 */
const getVerificationResults = async (req, res) => {
  try {
    const { appId } = req.params;

    const { rows: applications } = await query(
      `SELECT verification_status, verification_score, verification_results, 
              verification_flags, ai_ranking, ai_ranking_breakdown, 
              verified_at, verified_by 
       FROM job_applications WHERE id = $1`,
      [appId]
    );

    if (!applications || applications.length === 0) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    const application = applications[0];

    res.json({
      verification_status: application.verification_status,
      verification_score: application.verification_score,
      verification_results: application.verification_results,
      verification_flags: application.verification_flags,
      ai_ranking: application.ai_ranking,
      ai_ranking_breakdown: application.ai_ranking_breakdown,
      verified_at: application.verified_at,
      verified_by: application.verified_by
    });
  } catch (error) {
    logger.error('verification.getResults', 'Error getting results', error, { appId: req.params.appId });
    res.status(500).json({ msg: 'Failed to get verification results', error: error.message });
  }
};

/**
 * Verify all applications for a job
 */
const verifyAllApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    // Get all applications for the job
    const { rows: applications } = await query(
      `SELECT * FROM job_applications WHERE job_id = $1`,
      [jobId]
    );

    if (!applications || applications.length === 0) {
      return res.json({ success: true, message: 'No applications to verify', results: [] });
    }

    // Get job requirements (skills column may not exist in jobs table)
    let jobRequirements = { skills: [], requirements: '' };
    try {
      const { rows: jobs } = await query(
        `SELECT requirements, skills FROM jobs WHERE id = $1`,
        [jobId]
      );
      const job = jobs[0] || {};
      jobRequirements = {
        skills: job.skills ? JSON.parse(job.skills) : [],
        requirements: job.requirements || ''
      };
    } catch (jobErr) {
      // If skills column doesn't exist, try with just requirements
      try {
        const { rows: jobs } = await query(
          `SELECT requirements FROM jobs WHERE id = $1`,
          [jobId]
        );
        const job = jobs[0] || {};
        jobRequirements.requirements = job.requirements || '';
      } catch (reqErr) {
        logger.warn('verification.verifyAll', 'Could not get job requirements', { jobId });
      }
    }

    const results = [];

    // Verify each application
    for (const application of applications) {
      const applicationData = {
        personalInfo: application.personal_info ? JSON.parse(application.personal_info) : {},
        education: application.education ? JSON.parse(application.education) : {},
        employmentHistory: application.employment_history ? JSON.parse(application.employment_history) : [],
        skills: application.skills ? JSON.parse(application.skills) : {}
      };

      const verificationResult = await verifyCandidate(applicationData, jobRequirements);

      // Update application with verification results
      await query(
        `UPDATE job_applications 
         SET verification_status = $1,
             verification_score = $2,
             verification_results = $3,
             verification_flags = $4,
             ai_ranking = $5,
             ai_ranking_breakdown = $6,
             verified_at = NOW(),
             verified_by = $7
         WHERE id = $8`,
        [
          verificationResult.verification_status,
          verificationResult.verification_score,
          JSON.stringify(verificationResult.verification_results),
          JSON.stringify(verificationResult.verification_flags),
          verificationResult.ai_ranking,
          JSON.stringify(verificationResult.ai_ranking_breakdown),
          userId,
          application.id
        ]
      );

      results.push({
        applicationId: application.id,
        applicantName: application.applicantname,
        verification: verificationResult
      });
    }

    res.json({
      success: true,
      message: `Verified ${results.length} applications`,
      results
    });
  } catch (error) {
    logger.error('verification.verifyAll', 'Batch verification error', error, { jobId: req.params.jobId });
    res.status(500).json({ msg: 'Batch verification failed', error: error.message });
  }
};

/**
 * Update manager ranking
 */
const updateManagerRanking = async (req, res) => {
  try {
    const { appId } = req.params;
    const { ranking, notes } = req.body;
    const userId = req.user?.id;

    if (ranking === undefined || ranking < 0 || ranking > 100) {
      return res.status(400).json({ msg: 'Ranking must be between 0 and 100' });
    }

    await query(
      `UPDATE job_applications 
       SET manager_ranking = $1,
           manager_notes = $2,
           manager_reviewed_at = NOW(),
           manager_reviewed_by = $3
       WHERE id = $4`,
      [ranking, notes || null, userId, appId]
    );

    res.json({ success: true, message: 'Manager ranking updated' });
  } catch (error) {
    logger.error('verification.updateManagerRanking', 'Error updating ranking', error, { appId: req.params.appId });
    res.status(500).json({ msg: 'Failed to update manager ranking', error: error.message });
  }
};

/**
 * Update owner approval
 */
const updateOwnerApproval = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Status must be either approved or rejected' });
    }

    await query(
      `UPDATE job_applications 
       SET owner_status = $1,
           owner_notes = $2,
           owner_reviewed_at = NOW(),
           owner_reviewed_by = $3
       WHERE id = $4`,
      [status, notes || null, userId, appId]
    );

    res.json({ success: true, message: `Application ${status}` });
  } catch (error) {
    logger.error('verification.updateOwnerApproval', 'Error updating approval', error, { appId: req.params.appId });
    res.status(500).json({ msg: 'Failed to update owner approval', error: error.message });
  }
};

module.exports = {
  verifyApplication,
  getVerificationResults,
  verifyAllApplications,
  updateManagerRanking,
  updateOwnerApproval
};
