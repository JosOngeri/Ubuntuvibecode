const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  department: r.department,
  trainer: r.trainer,
  startDate: r.start_date,
  endDate: r.end_date,
  status: r.status,
  participants: r.participants,
  notes: r.notes,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ department, status, page = 1, limit = 50 } = {}) => {
  let q = `SELECT * FROM training WHERE 1=1`;
  const params = [];
  if (department) { params.push(department); q += ` AND department = $${params.length}`; }
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  q += ` ORDER BY start_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM training WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO training (title, description, department, trainer, start_date, end_date, status, participants, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.title, data.description || null, data.department || null, data.trainer || null, data.startDate, data.endDate || null, data.status || 'scheduled', data.participants ? JSON.stringify(data.participants) : '[]', data.notes || null, data.createdBy || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['title','description','department','trainer','start_date','end_date','status','participants','notes'];
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
  const { rows } = await pool.query(`UPDATE training SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
