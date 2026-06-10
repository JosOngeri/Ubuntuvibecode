const pool = require('../config/db').pool;

const JOB_TABLE = 'jobs';

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${JOB_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      department VARCHAR(100),
      location VARCHAR(255),
      employment_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'open',
      salary_min DECIMAL(12,2),
      salary_max DECIMAL(12,2),
      requirements TEXT,
      responsibilities TEXT,
      benefits TEXT,
      closing_date DATE,
      created_by BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

// DEPRECATED: ensureColumns() removed to prevent schema drift
// All columns now managed via proper migration files in backend/migrations/
// See migration: 20240602000001_add_job_columns.sql
/*
const ensureColumns = async () => {
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS responsibilities TEXT`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS benefits TEXT`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS salary_range VARCHAR(100)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS qualifications JSONB`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS evaluation_params JSONB`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS advertisement_data JSONB`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS advertisement_image_path VARCHAR(255)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS number_of_positions INTEGER DEFAULT 1`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS career_level VARCHAR(100)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS work_schedule VARCHAR(255)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS required_languages VARCHAR(255)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS experience_level VARCHAR(100)`);
  await pool.query(`ALTER TABLE ${JOB_TABLE} ADD COLUMN IF NOT EXISTS education_requirements TEXT`);
};
*/

const JOB_SELECT_COLUMNS = `
  id,
  title,
  description,
  department,
  location,
  employment_type AS "employmentType",
  status,
  COALESCE(salary_range, CONCAT(salary_min::text, CASE WHEN salary_max IS NOT NULL THEN ' - ' || salary_max::text ELSE '' END)) AS "salaryRange",
  salary_min AS "salaryMin",
  salary_max AS "salaryMax",
  requirements,
  responsibilities,
  benefits,
  closing_date AS "applicationDeadline",
  created_by AS "postedBy",
  qualifications,
  evaluation_params AS "evaluationParams",
  advertisement_data AS "advertisementData",
  COALESCE(number_of_positions, 1) AS "numberOfPositions",
  career_level AS "careerLevel",
  contact_person AS "contactPerson",
  contact_phone AS "contactPhone",
  contact_email AS "contactEmail",
  work_schedule AS "workSchedule",
  required_languages AS "requiredLanguages",
  experience_level AS "experienceLevel",
  education_requirements AS "educationRequirements",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const Job = {
  async create(data) {
    const { title, description, department, location, employmentType, status = 'open', salaryRange, requirements, responsibilities, benefits, applicationDeadline, postedBy, qualifications, evaluationParams, advertisementData, numberOfPositions = 1, careerLevel, contactPerson, contactPhone, contactEmail, workSchedule, requiredLanguages, experienceLevel, educationRequirements } = data;
    const res = await pool.query(
      `
        INSERT INTO ${JOB_TABLE} (
          title,
          description,
          department,
          location,
          employment_type,
          status,
          salary_range,
          requirements,
          responsibilities,
          benefits,
          closing_date,
          created_by,
          qualifications,
          evaluation_params,
          advertisement_data,
          number_of_positions,
          career_level,
          contact_person,
          contact_phone,
          contact_email,
          work_schedule,
          required_languages,
          experience_level,
          education_requirements
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING ${JOB_SELECT_COLUMNS}
      `,
      [title, description, department, location, employmentType, status, salaryRange, requirements, responsibilities, benefits, applicationDeadline || null, postedBy, JSON.stringify(qualifications || []), JSON.stringify(evaluationParams || {}), JSON.stringify(advertisementData || {}), numberOfPositions, careerLevel || null, contactPerson || null, contactPhone || null, contactEmail || null, workSchedule || null, requiredLanguages || null, experienceLevel || null, educationRequirements || null]
    );
    return res.rows[0];
  },
  async findAll({ onlyOpen = false } = {}) {
    const res = await pool.query(
      `
        SELECT ${JOB_SELECT_COLUMNS}
        FROM ${JOB_TABLE}
        ${onlyOpen ? "WHERE status IN ('open', 'active')" : ''}
        ORDER BY created_at DESC
      `
    );
    return res.rows;
  },
  async findById(id) {
    const res = await pool.query(`SELECT ${JOB_SELECT_COLUMNS} FROM ${JOB_TABLE} WHERE id = $1`, [id]);
    return res.rows[0];
  },
  async update(id, data) {
    const allowed = {
      title: 'title',
      description: 'description',
      department: 'department',
      location: 'location',
      employmentType: 'employment_type',
      status: 'status',
      salaryRange: 'salary_range',
      requirements: 'requirements',
      responsibilities: 'responsibilities',
      benefits: 'benefits',
      applicationDeadline: 'closing_date',
      postedBy: 'created_by',
      qualifications: 'qualifications',
      evaluationParams: 'evaluation_params',
      numberOfPositions: 'number_of_positions',
      careerLevel: 'career_level',
      contactPerson: 'contact_person',
      contactPhone: 'contact_phone',
      contactEmail: 'contact_email',
      workSchedule: 'work_schedule',
      requiredLanguages: 'required_languages',
      experienceLevel: 'experience_level',
      educationRequirements: 'education_requirements',
    };
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, column] of Object.entries(allowed)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    if (!fields.length) {
      return this.findById(id);
    }

    values.push(id);
    const res = await pool.query(
      `UPDATE ${JOB_TABLE} SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING ${JOB_SELECT_COLUMNS}`,
      values
    );
    return res.rows[0];
  },
  async delete(id) {
    await pool.query(`DELETE FROM ${JOB_TABLE} WHERE id = $1`, [id]);
    return true;
  },
  async init() {
    await createTable();
    // ensureColumns() removed - columns managed via migrations
  },
};

module.exports = Job;
