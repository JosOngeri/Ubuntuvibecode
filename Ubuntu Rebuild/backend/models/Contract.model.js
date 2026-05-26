const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  contractType: r.contract_type,
  startDate: r.start_date,
  endDate: r.end_date,
  terms: r.terms,
  status: r.status,
  fileUrl: r.file_url,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ employeeId, status, page = 1, limit = 50 } = {}) => {
  let q = `SELECT c.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM contracts c JOIN employees e ON e.id = c.employee_id WHERE 1=1`;
  const params = [];
  if (employeeId) { params.push(employeeId); q += ` AND c.employee_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND c.status = $${params.length}`; }
  q += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM contracts WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO contracts (employee_id, contract_type, start_date, end_date, terms, status, file_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.employeeId, data.contractType, data.startDate, data.endDate || null, data.terms || null, data.status || 'active', data.fileUrl || null, data.createdBy || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['contract_type','start_date','end_date','terms','status','file_url'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE contracts SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
