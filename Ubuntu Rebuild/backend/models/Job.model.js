const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  title: r.title,
  department: r.department,
  description: r.description,
  requirements: r.requirements,
  qualifications: r.qualifications,
  evaluationParams: r.evaluation_params,
  employmentType: r.employment_type,
  salaryRange: r.salary_range,
  numberOfPositions: r.number_of_positions,
  location: r.location,
  status: r.status,
  applicationClosingDate: r.application_closing_date,
  postedBy: r.posted_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapApplicationRow = (r) => ({
  id: r.id,
  jobId: r.job_id,
  userId: r.user_id,
  personalInfo: r.personal_info,
  addressInfo: r.address_info,
  positionDetails: r.position_details,
  education: r.education,
  employmentHistory: r.employment_history,
  applicantReferences: r.applicant_references,
  skills: r.skills,
  declaration: r.declaration,
  cvUrl: r.cv_url,
  status: r.status,
  autoScore: r.auto_score ? parseFloat(r.auto_score) : null,
  manualScore: r.manual_score ? parseFloat(r.manual_score) : null,
  scoreBreakdown: r.score_breakdown,
  reviewerNotes: r.reviewer_notes,
  interviewScore: r.interview_score ? parseFloat(r.interview_score) : null,
  interviewNotes: r.interview_notes,
  interviewDate: r.interview_date,
  interviewStatus: r.interview_status,
  offeredSalary: r.offered_salary ? parseFloat(r.offered_salary) : null,
  offerToken: r.offer_token,
  offerSentAt: r.offer_sent_at,
  offerStatus: r.offer_status,
  counterOfferSalary: r.counter_offer_salary ? parseFloat(r.counter_offer_salary) : null,
  finalSalary: r.final_salary ? parseFloat(r.final_salary) : null,
  reviewedBy: r.reviewed_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ status, department, page = 1, limit = 50 } = {}) => {
  let q = `SELECT * FROM jobs WHERE 1=1`;
  const params = [];
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  if (department) { params.push(department); q += ` AND department = $${params.length}`; }
  q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO jobs (title, department, description, requirements, qualifications, evaluation_params, employment_type, salary_range, number_of_positions, location, status, application_closing_date, posted_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [data.title, data.department || null, data.description || null, data.requirements || null,
     data.qualifications ? JSON.stringify(data.qualifications) : '[]',
     data.evaluationParams ? JSON.stringify(data.evaluationParams) : '{}',
     data.employmentType || null, data.salaryRange || null, data.numberOfPositions || 1,
     data.location || 'Ubuntu Eco Lodge', data.status || 'open', data.applicationClosingDate || null, data.postedBy || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['title','department','description','requirements','qualifications','evaluation_params','employment_type','salary_range','number_of_positions','location','status','application_closing_date'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' && data[f] !== null ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

const findAllApplications = async ({ jobId, status, page = 1, limit = 50 } = {}) => {
  let q = `SELECT ja.*, u.username FROM job_applications ja LEFT JOIN users u ON u.id = ja.user_id WHERE 1=1`;
  const params = [];
  if (jobId) { params.push(jobId); q += ` AND ja.job_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND ja.status = $${params.length}`; }
  q += ` ORDER BY ja.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapApplicationRow);
};

const findApplicationById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM job_applications WHERE id = $1', [id]);
  return rows[0] ? mapApplicationRow(rows[0]) : null;
};

const createApplication = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO job_applications (job_id, user_id, personal_info, address_info, position_details, education, employment_history, applicant_references, skills, declaration, cv_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [data.jobId, data.userId || null, data.personalInfo ? JSON.stringify(data.personalInfo) : null,
     data.addressInfo ? JSON.stringify(data.addressInfo) : null, data.positionDetails ? JSON.stringify(data.positionDetails) : null,
     data.education ? JSON.stringify(data.education) : null, data.employmentHistory ? JSON.stringify(data.employmentHistory) : null,
     data.applicantReferences ? JSON.stringify(data.applicantReferences) : null, data.skills ? JSON.stringify(data.skills) : null,
     data.declaration ? JSON.stringify(data.declaration) : null, data.cvUrl || null, data.status || 'applied']
  );
  return mapApplicationRow(rows[0]);
};

const updateApplication = async (id, data) => {
  const allowed = ['status','auto_score','manual_score','score_breakdown','reviewer_notes','interview_score','interview_notes','interview_date','interview_status','offered_salary','offer_token','offer_sent_at','offer_status','counter_offer_salary','final_salary','reviewed_by'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' && data[f] !== null ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return findApplicationById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE job_applications SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapApplicationRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update, findAllApplications, findApplicationById, createApplication, updateApplication };
