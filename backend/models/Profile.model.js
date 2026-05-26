const { Pool } = require('pg');
const pool = require('../config/db').pool;


const PROFILE_TABLE = 'profiles';

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${PROFILE_TABLE} (
      id SERIAL PRIMARY KEY,
      userId INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      -- Personal Info
      fullName VARCHAR(255),
      photoUrl TEXT,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      dateOfBirth DATE,
      nationalId VARCHAR(100),
      emergencyContact JSONB,
      professionalHeadline TEXT,
      summary TEXT,

      -- Employment/HR Header
      employeeId VARCHAR(50),
      jobTitle VARCHAR(100),
      department VARCHAR(100),
      status VARCHAR(50),
      dateOfJoining DATE,
      employmentType VARCHAR(50),
      workLocation TEXT,
      reportingManager VARCHAR(100),

      -- Certifications (array of objects)
      certifications JSONB,

      -- Work History (array of objects)
      workHistory JSONB,

      -- Education (array of objects)
      education JSONB,

      -- Skills (array of objects: name, proficiency)
      skills JSONB,

      -- Projects/Portfolio (array of objects)
      projects JSONB,

      -- Awards & Recognitions (array of objects)
      awards JSONB,

      -- Languages (array of objects: name, proficiency)
      languages JSONB,

      -- Professional Memberships (array of objects)
      memberships JSONB,

      -- References (array of objects)
      "references" JSONB,

      -- Volunteer Experience (array of objects)
      volunteer JSONB,

      -- Publications (array of objects)
      publications JSONB,

      -- Interests (array of strings)
      interests TEXT[],

      -- HRMS-specific
      payroll JSONB,
      leaveInfo JSONB,
      contracts JSONB,
      performance JSONB,
      documents JSONB,
      disclosures JSONB,

      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const Profile = {
  async createOrUpdate(userId, data) {
    const res = await pool.query(
      `INSERT INTO ${PROFILE_TABLE} (
        user_id, full_name, photo_url, email, phone, address, date_of_birth, national_id, emergency_contact, professional_headline, summary,
        employee_id, job_title, department, status, date_of_joining, employment_type, work_location, reporting_manager,
        certifications, work_history, education, skills, projects, awards, languages, memberships, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        photo_url = EXCLUDED.photo_url,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        date_of_birth = EXCLUDED.date_of_birth,
        national_id = EXCLUDED.national_id,
        emergency_contact = EXCLUDED.emergency_contact,
        professional_headline = EXCLUDED.professional_headline,
        summary = EXCLUDED.summary,
        employee_id = EXCLUDED.employee_id,
        job_title = EXCLUDED.job_title,
        department = EXCLUDED.department,
        status = EXCLUDED.status,
        date_of_joining = EXCLUDED.date_of_joining,
        employment_type = EXCLUDED.employment_type,
        work_location = EXCLUDED.work_location,
        reporting_manager = EXCLUDED.reporting_manager,
        certifications = EXCLUDED.certifications,
        work_history = EXCLUDED.work_history,
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        projects = EXCLUDED.projects,
        awards = EXCLUDED.awards,
        languages = EXCLUDED.languages,
        memberships = EXCLUDED.memberships,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userId, data.fullName, data.photoUrl, data.email, data.phone, data.address, data.dateOfBirth, data.nationalId, toJsonb(data.emergencyContact, {}), data.professionalHeadline, data.summary,
        data.employeeId, data.jobTitle, data.department, data.status, data.dateOfJoining, data.employmentType, data.workLocation, data.reportingManager,
        data.certifications, toJsonb(data.workHistory, []), toJsonb(data.education, []), data.skills, toJsonb(data.projects, []), toJsonb(data.awards, []), toJsonb(data.languages, []), toJsonb(data.memberships, [])
      ]
    );
    return res.rows[0];
  },
  async findByUserId(userId) {
    const res = await pool.query(`SELECT * FROM ${PROFILE_TABLE} WHERE user_id = $1`, [userId]);
    return res.rows[0];
  },
  async init() {
    await createTable();
  },
};

module.exports = Profile;
