const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  documentType: r.document_type,
  fileUrl: r.file_url,
  documentNumber: r.document_number,
  expiryDate: r.expiry_date,
  verified: r.verified,
  verifiedBy: r.verified_by,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ employeeId, documentType, verified, page = 1, limit = 50 } = {}) => {
  let q = `SELECT d.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM employee_documents d JOIN employees e ON e.id = d.employee_id WHERE 1=1`;
  const params = [];
  if (employeeId) { params.push(employeeId); q += ` AND d.employee_id = $${params.length}`; }
  if (documentType) { params.push(documentType); q += ` AND d.document_type = $${params.length}`; }
  if (verified !== undefined) { params.push(verified); q += ` AND d.verified = $${params.length}`; }
  q += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM employee_documents WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO employee_documents (employee_id, document_type, file_url, document_number, expiry_date, verified, verified_by, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.employeeId, data.documentType, data.fileUrl || null, data.documentNumber || null, data.expiryDate || null, data.verified || false, data.verifiedBy || null, data.notes || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['document_type','file_url','document_number','expiry_date','verified','verified_by','notes'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE employee_documents SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
