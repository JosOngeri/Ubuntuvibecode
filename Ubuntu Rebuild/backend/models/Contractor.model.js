const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  userId: r.user_id,
  companyName: r.company_name,
  contactPerson: r.contact_person,
  phone: r.phone,
  email: r.email,
  kraPin: r.kra_pin,
  trade: r.trade,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapQuoteRow = (r) => ({
  id: r.id,
  contractorId: r.contractor_id,
  projectTitle: r.project_title,
  description: r.description,
  amount: r.amount ? parseFloat(r.amount) : null,
  timeline: r.timeline,
  status: r.status,
  numberOfPositions: r.number_of_positions,
  approvedBy: r.approved_by,
  approvedAt: r.approved_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapMilestoneRow = (r) => ({
  id: r.id,
  quoteId: r.quote_id,
  contractorId: r.contractor_id,
  title: r.title,
  description: r.description,
  deliverables: r.deliverables,
  deadline: r.deadline,
  budget: r.budget ? parseFloat(r.budget) : null,
  materialsRequest: r.materials_request,
  labourRequest: r.labour_request,
  downpaymentRequest: r.downpayment_request ? parseFloat(r.downpayment_request) : null,
  progressPercent: r.progress_percent,
  photos: r.photos,
  receipts: r.receipts,
  timelinessScore: r.timeliness_score ? parseFloat(r.timeliness_score) : null,
  budgetScore: r.budget_score ? parseFloat(r.budget_score) : null,
  qualityScore: r.quality_score ? parseFloat(r.quality_score) : null,
  kpiScore: r.kpi_score ? parseFloat(r.kpi_score) : null,
  status: r.status,
  verifiedBy: r.verified_by,
  verifiedAt: r.verified_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ status, trade, page = 1, limit = 50 } = {}) => {
  let q = `SELECT * FROM contractors WHERE 1=1`;
  const params = [];
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  if (trade) { params.push(trade); q += ` AND trade = $${params.length}`; }
  q += ` ORDER BY company_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM contractors WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO contractors (user_id, company_name, contact_person, phone, email, kra_pin, trade, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.userId || null, data.companyName, data.contactPerson || null, data.phone, data.email || null, data.kraPin || null, data.trade || null, data.status || 'active']
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['user_id','company_name','contact_person','phone','email','kra_pin','trade','status'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE contractors SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

const findAllQuotes = async ({ contractorId, status, page = 1, limit = 50 } = {}) => {
  let q = `SELECT q.*, c.company_name FROM contractor_quotes q JOIN contractors c ON c.id = q.contractor_id WHERE 1=1`;
  const params = [];
  if (contractorId) { params.push(contractorId); q += ` AND q.contractor_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND q.status = $${params.length}`; }
  q += ` ORDER BY q.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapQuoteRow);
};

const createQuote = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO contractor_quotes (contractor_id, project_title, description, amount, timeline, status, number_of_positions)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.contractorId, data.projectTitle, data.description || null, data.amount || null, data.timeline || null, data.status || 'pending', data.numberOfPositions || 1]
  );
  return mapQuoteRow(rows[0]);
};

const updateQuote = async (id, data) => {
  const allowed = ['status','approved_by','approved_at'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return null;
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE contractor_quotes SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapQuoteRow(rows[0]) : null;
};

const findAllMilestones = async ({ quoteId, contractorId, status, page = 1, limit = 50 } = {}) => {
  let q = `SELECT * FROM milestones WHERE 1=1`;
  const params = [];
  if (quoteId) { params.push(quoteId); q += ` AND quote_id = $${params.length}`; }
  if (contractorId) { params.push(contractorId); q += ` AND contractor_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  q += ` ORDER BY deadline ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapMilestoneRow);
};

const createMilestone = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO milestones (quote_id, contractor_id, title, description, deliverables, deadline, budget, materials_request, labour_request, downpayment_request, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [data.quoteId, data.contractorId, data.title, data.description || null, data.deliverables || null, data.deadline || null, data.budget || null,
     data.materialsRequest ? JSON.stringify(data.materialsRequest) : '[]', data.labourRequest ? JSON.stringify(data.labourRequest) : '{}',
     data.downpaymentRequest || null, data.status || 'pending']
  );
  return mapMilestoneRow(rows[0]);
};

const updateMilestone = async (id, data) => {
  const allowed = ['progress_percent','photos','receipts','timeliness_score','budget_score','quality_score','kpi_score','status','verified_by','verified_at'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' && data[f] !== null ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return null;
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE milestones SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapMilestoneRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update, findAllQuotes, createQuote, updateQuote, findAllMilestones, createMilestone, updateMilestone };
