const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  assignedTo: r.assigned_to,
  assignedDate: r.assigned_date,
  returnDate: r.return_date,
  condition: r.condition,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ type, assignedTo, page = 1, limit = 50 } = {}) => {
  let q = `SELECT a.*, CONCAT(e.first_name,' ',e.surname) as assigned_to_name
           FROM assets a LEFT JOIN employees e ON e.id = a.assigned_to WHERE 1=1`;
  const params = [];
  if (type) { params.push(type); q += ` AND a.type = $${params.length}`; }
  if (assignedTo) { params.push(assignedTo); q += ` AND a.assigned_to = $${params.length}`; }
  q += ` ORDER BY a.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO assets (name, type, assigned_to, assigned_date, return_date, condition, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.name, data.type, data.assignedTo || null, data.assignedDate || null, data.returnDate || null, data.condition || 'good', data.notes || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['name','type','assigned_to','assigned_date','return_date','condition','notes'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE assets SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
