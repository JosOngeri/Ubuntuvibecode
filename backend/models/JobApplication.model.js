const { Pool } = require('pg');
const path = require('path');

const pool = require('../config/db').pool;

const JOB_APPLICATION_TABLE = 'job_applications';
const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const APPLICATION_SELECT_COLUMNS = `
  id,
  job_id AS "jobId",
  CONCAT(first_name, ' ', last_name) AS "applicantName",
  email AS "applicantEmail",
  phone AS "applicantPhone",
  resume_url AS "cvPath",
  status,
  created_at AS "appliedAt",
  cover_letter AS "coverLetter",
  education_history AS "education",
  employment_history AS "employmentHistory",
  skills,
  certifications,
  experience_years,
  availability_weeks,
  right_to_work,
  salary_expectation,
  date_of_birth AS "dob",
  gender,
  marital_status,
  nationality,
  national_id,
  residential_address AS "address",
  emergency_contact,
  notes,
  verification_status,
  verification_score,
  verification_results,
  verification_flags,
  ai_ranking,
  ai_ranking_breakdown,
  verified_at,
  verified_by,
  manager_ranking,
  manager_notes,
  manager_reviewed_at,
  manager_reviewed_by,
  owner_status,
  owner_notes,
  owner_reviewed_at,
  owner_reviewed_by,
  interview_score AS "interviewScore",
  interview_notes AS "interviewNotes",
  interview_status AS "interviewStatus",
  interview_date AS "interviewDate",
  interview_invitations AS "interviewInvitations",
  interview_feedbacks AS "interviewFeedbacks",
  created_at,
  updated_at
`;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${JOB_APPLICATION_TABLE} (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      applicantName VARCHAR(255) NOT NULL,
      applicantEmail VARCHAR(255) NOT NULL,
      applicantPhone VARCHAR(50),
      cvPath VARCHAR(255),
      coverLetter TEXT,
      applicationData JSONB,
      recruiterAnnouncement TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureColumns = async () => {
  // Check if jobid column exists (old schema) and rename it to job_id
  try {
    const { rows } = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = '${JOB_APPLICATION_TABLE}' AND column_name = 'jobid'
    `);
    if (rows.length > 0) {
      await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} RENAME COLUMN jobid TO job_id`);
    }
  } catch (e) {
    // Column might not exist or table has different structure
  }

  // Add job_id column if it doesn't exist (for backward compatibility)
  try {
    await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE`);
  } catch (e) {
    // Column might already exist or table has different structure
  }
  
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS coverletter TEXT`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS coverletterpath VARCHAR(255)`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS applicationdata JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS recruiterannouncement TEXT`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS auto_score DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS manual_score DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS score_breakdown JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS reviewer_notes TEXT`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS personal_info JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS address_info JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS position_details JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS education JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS employment_history JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS skills JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS declaration JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS disclosures JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS offer_token VARCHAR(255)`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS offer_sent_at TIMESTAMP`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS offer_status VARCHAR(50)`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS counter_offer_salary DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS final_salary DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS interview_score DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS interview_notes TEXT`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS offered_salary DECIMAL`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS interview_status VARCHAR(50)`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id)`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS offer_token_expires_at TIMESTAMP`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS availability_date DATE`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS interview_invitations JSONB`);
  await pool.query(`ALTER TABLE ${JOB_APPLICATION_TABLE} ADD COLUMN IF NOT EXISTS interview_feedbacks JSONB`);
};

const JobApplication = {
  async create(data) {
    const { userId = null, jobId, applicantName, applicantEmail, applicantPhone, cvPath, coverLetter, applicationData, recruiterAnnouncement, status = 'pending' } = data;
    // Split applicantName into first_name and last_name
    const nameParts = (applicantName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const res = await pool.query(
      `INSERT INTO ${JOB_APPLICATION_TABLE} (user_id, job_id, first_name, last_name, email, phone, resume_url, cover_letter, education_history, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${APPLICATION_SELECT_COLUMNS}`,
      [userId, jobId, firstName, lastName, applicantEmail, applicantPhone, cvPath, coverLetter || null, toJsonb(applicationData, null), status]
    );
    return res.rows[0];
  },
  async findByJob(jobId) {
    try {
      const res = await pool.query(
        `SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE job_id = $1 ORDER BY created_at DESC`,
        [jobId]
      );
      return res.rows;
    } catch (err) {
      console.error('JobApplication.findByJob error:', err);
      throw err;
    }
  },
  async findShortlisted() {
    try {
      const res = await pool.query(
        `SELECT
          ja.id,
          ja.job_id AS "jobId",
          j.title AS "jobTitle",
          j.department AS "jobDepartment",
          CONCAT(ja.first_name, ' ', ja.last_name) AS "applicantName",
          ja.email AS "applicantEmail",
          ja.phone AS "applicantPhone",
          ja.resume_url AS "cvPath",
          ja.status,
          ja.created_at AS "appliedAt",
          ja.interview_score AS "interviewScore",
          ja.interview_notes AS "interviewNotes",
          ja.interview_status AS "interviewStatus",
          ja.interview_date AS "interviewDate",
          ja.interview_invitations AS "interviewInvitations",
          ja.interview_feedbacks AS "interviewFeedbacks",
          ja.salary_expectation,
          ja.notes,
          ja.created_at,
          ja.updated_at
        FROM ${JOB_APPLICATION_TABLE} ja
        LEFT JOIN jobs j ON ja.job_id = j.id
        WHERE ja.status IN ('shortlisted', 'interview_scheduled', 'interview_completed', 'offer_sent', 'hired')
        ORDER BY ja.interview_score DESC NULLS LAST, ja.created_at DESC`
      );
      console.log('JobApplication.findShortlisted found:', res.rows.length, 'applications');
      return res.rows;
    } catch (err) {
      console.error('JobApplication.findShortlisted error:', err);
      throw err;
    }
  },
  async findByApplicantEmail(applicantEmail) {
    const res = await pool.query(
      `SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE email = $1 ORDER BY created_at DESC`,
      [applicantEmail]
    );
    return res.rows;
  },
  async findByUserId(userId) {
    const res = await pool.query(
      `SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  },
  async findByEmployeeId(employeeId) {
    const res = await pool.query(
      `SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE employee_id = $1 ORDER BY created_at DESC`,
      [employeeId]
    );
    return res.rows;
  },
  async linkToUser(applicationId, userId, reason = 'manual') {
    const res = await pool.query(
      `
        UPDATE ${JOB_APPLICATION_TABLE}
        SET user_id = $1,
            linked_via = $3,
            linked_at = NOW()
        WHERE id = $2
        RETURNING ${APPLICATION_SELECT_COLUMNS}
      `,
      [userId, applicationId, reason]
    );
    await pool.query(
      `
        INSERT INTO application_user_links (application_id, user_id, link_reason, linked_by)
        VALUES ($1, $2, $3, 'manual')
        ON CONFLICT (application_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          link_reason = EXCLUDED.link_reason,
          linked_by = EXCLUDED.linked_by,
          updated_at = NOW()
      `,
      [applicationId, userId, reason]
    );
    return res.rows[0];
  },
  async backfillLinks() {
    const res = await pool.query(`SELECT id, email FROM ${JOB_APPLICATION_TABLE} WHERE user_id IS NULL`);
    const users = await pool.query(`SELECT id, email FROM users WHERE email IS NOT NULL`);
    const userEmailMap = new Map(users.rows.map((user) => [normalizeEmail(user.email), user.id]));

    for (const row of res.rows) {
      const matchedUserId = userEmailMap.get(normalizeEmail(row.email));
      if (!matchedUserId) continue;
      await this.linkToUser(row.id, matchedUserId, 'migration:email');
    }
  },
  async findById(id) {
    const res = await pool.query(`SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE id = $1`, [id]);
    return res.rows[0];
  },
  async findByOfferToken(token) {
    const res = await pool.query(`SELECT ${APPLICATION_SELECT_COLUMNS} FROM ${JOB_APPLICATION_TABLE} WHERE offer_token = $1`, [token]);
    return res.rows[0];
  },
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
    values.push(id);
    const res = await pool.query(
      `UPDATE ${JOB_APPLICATION_TABLE} SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${APPLICATION_SELECT_COLUMNS}`,
      values
    );
    return res.rows[0];
  },
  async delete(id) {
    await pool.query(`DELETE FROM ${JOB_APPLICATION_TABLE} WHERE id = $1`, [id]);
    return true;
  },
  async findAllWithJobs() {
    const res = await pool.query(
      `SELECT 
        ja.id,
        ja.job_id AS "jobId",
        j.title AS "jobTitle",
        j.department AS "jobDepartment",
        CONCAT(ja.first_name, ' ', ja.last_name) AS "applicantName",
        ja.email AS "applicantEmail",
        ja.phone AS "applicantPhone",
        ja.resume_url AS "cvPath",
        ja.status,
        ja.created_at AS "appliedAt",
        ja.ai_ranking,
        ja.ai_ranking_breakdown,
        ja.salary_expectation,
        ja.experience_years,
        ja.gender,
        ja.nationality,
        ja.education_history,
        ja.skills,
        ja.notes
      FROM ${JOB_APPLICATION_TABLE} ja
      LEFT JOIN jobs j ON ja.job_id = j.id
      ORDER BY ja.created_at DESC`
    );
    return res.rows;
  },
  async init() {
    await createTable();
    await ensureColumns();
  },
};

module.exports = JobApplication;
