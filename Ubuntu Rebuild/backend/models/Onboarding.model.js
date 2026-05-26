const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  applicationId: r.application_id,
  status: r.status,
  currentStep: r.current_step,
  completedSteps: r.completed_steps,
  personalInfo: r.personal_info,
  documentsChecklist: r.documents_checklist,
  supervisorId: r.supervisor_id,
  assetsAssigned: r.assets_assigned,
  probationEnd: r.probation_end,
  review1Date: r.review_1_date,
  review2Date: r.review_2_date,
  review3Date: r.review_3_date,
  finalReviewDate: r.final_review_date,
  initiatedBy: r.initiated_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ status, currentStep, page = 1, limit = 50 } = {}) => {
  let q = `SELECT o.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM onboarding o LEFT JOIN employees e ON e.id = o.employee_id WHERE 1=1`;
  const params = [];
  if (status) { params.push(status); q += ` AND o.status = $${params.length}`; }
  if (currentStep) { params.push(currentStep); q += ` AND o.current_step = $${params.length}`; }
  q += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM onboarding WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO onboarding (employee_id, application_id, status, current_step, completed_steps, personal_info, documents_checklist, supervisor_id, assets_assigned, probation_end, review_1_date, review_2_date, review_3_date, final_review_date, initiated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [data.employeeId || null, data.applicationId || null, data.status || 'in_progress', data.currentStep || 'offer_letter',
     data.completedSteps ? JSON.stringify(data.completedSteps) : '[]', data.personalInfo ? JSON.stringify(data.personalInfo) : null,
     data.documentsChecklist ? JSON.stringify(data.documentsChecklist) : '{}', data.supervisorId || null,
     data.assetsAssigned ? JSON.stringify(data.assetsAssigned) : '[]', data.probationEnd || null,
     data.review1Date || null, data.review2Date || null, data.review3Date || null, data.finalReviewDate || null, data.initiatedBy || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['status','current_step','completed_steps','personal_info','documents_checklist','supervisor_id','assets_assigned','probation_end','review_1_date','review_2_date','review_3_date','final_review_date'];
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
  const { rows } = await pool.query(`UPDATE onboarding SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
