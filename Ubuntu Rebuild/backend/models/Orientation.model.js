const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  items: r.items,
  completedBy: r.completed_by,
  completedAt: r.completed_at,
  createdAt: r.created_at,
});

const findAll = async ({ employeeId, page = 1, limit = 50 } = {}) => {
  let q = `SELECT o.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM orientation_checklists o JOIN employees e ON e.id = o.employee_id WHERE 1=1`;
  const params = [];
  if (employeeId) { params.push(employeeId); q += ` AND o.employee_id = $${params.length}`; }
  q += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM orientation_checklists WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO orientation_checklists (employee_id, items, completed_by, completed_at)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.employeeId, data.items ? JSON.stringify(data.items) : '[]', data.completedBy || null, data.completedAt || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['items','completed_by','completed_at'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' && data[f] !== null ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return findById(id);
  const { rows } = await pool.query(`UPDATE orientation_checklists SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
