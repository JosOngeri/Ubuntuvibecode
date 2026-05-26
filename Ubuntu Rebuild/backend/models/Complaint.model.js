const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  type: r.type,
  category: r.category,
  description: r.description,
  urgency: r.urgency,
  status: r.status,
  submittedBy: r.submitted_by,
  assignedTo: r.assigned_to,
  escalationLevel: r.escalation_level,
  slaDeadline: r.sla_deadline,
  acknowledgedAt: r.acknowledged_at,
  resolvedAt: r.resolved_at,
  resolutionNotes: r.resolution_notes,
  compensation: r.compensation,
  timeline: r.timeline,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ type, status, urgency, page = 1, limit = 50 } = {}) => {
  let q = `SELECT c.*, u.username as submitted_by_username FROM complaints c LEFT JOIN users u ON u.id = c.submitted_by WHERE 1=1`;
  const params = [];
  if (type) { params.push(type); q += ` AND c.type = $${params.length}`; }
  if (status) { params.push(status); q += ` AND c.status = $${params.length}`; }
  if (urgency) { params.push(urgency); q += ` AND c.urgency = $${params.length}`; }
  q += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO complaints (type, category, description, urgency, status, submitted_by, assigned_to, escalation_level, sla_deadline, timeline)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.type, data.category, data.description, data.urgency || 'medium', data.status || 'open', data.submittedBy || null, data.assignedTo || null, 0, data.slaDeadline || null, data.timeline ? JSON.stringify(data.timeline) : '[]']
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['status','assigned_to','escalation_level','acknowledged_at','resolved_at','resolution_notes','compensation','timeline'];
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
  const { rows } = await pool.query(`UPDATE complaints SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
