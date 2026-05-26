const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  leaveType: r.leave_type,
  startDate: r.start_date,
  endDate: r.end_date,
  daysCount: r.days_count,
  reason: r.reason,
  status: r.status,
  approverId: r.approver_id,
  approvedAt: r.approved_at,
  rejectionReason: r.rejection_reason,
  escalated: r.escalated,
  escalationLevel: r.escalation_level,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ employeeId, status, leaveType, page = 1, limit = 50 } = {}) => {
  let q = `SELECT l.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM leaves l JOIN employees e ON e.id = l.employee_id WHERE 1=1`;
  const params = [];
  if (employeeId) { params.push(employeeId); q += ` AND l.employee_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND l.status = $${params.length}`; }
  if (leaveType) { params.push(leaveType); q += ` AND l.leave_type = $${params.length}`; }
  q += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM leaves WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days_count, reason, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.employeeId, data.leaveType, data.startDate, data.endDate, data.daysCount || 1, data.reason || null, data.status || 'pending']
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['status','approver_id','approved_at','rejection_reason','escalated','escalation_level'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE leaves SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

const remove = async (id) => {
  await pool.query('DELETE FROM leaves WHERE id = $1', [id]);
};

module.exports = { findAll, findById, create, update, remove };
