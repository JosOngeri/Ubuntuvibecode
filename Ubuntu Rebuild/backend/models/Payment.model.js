const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  payeeType: r.payee_type,
  payeeId: r.payee_id,
  milestoneId: r.milestone_id,
  amount: parseFloat(r.amount),
  paymentMethod: r.payment_method,
  transactionId: r.transaction_id,
  status: r.status,
  notes: r.notes,
  processedBy: r.processed_by,
  paidAt: r.paid_at,
  createdAt: r.created_at,
});

const findAll = async ({ payeeType, payeeId, status, page = 1, limit = 50 } = {}) => {
  let q = `SELECT * FROM payments WHERE 1=1`;
  const params = [];
  if (payeeType) { params.push(payeeType); q += ` AND payee_type = $${params.length}`; }
  if (payeeId) { params.push(payeeId); q += ` AND payee_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO payments (payee_type, payee_id, milestone_id, amount, payment_method, transaction_id, status, notes, processed_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.payeeType, data.payeeId, data.milestoneId || null, data.amount, data.paymentMethod || 'MPESA', data.transactionId || null, data.status || 'pending', data.notes || null, data.processedBy || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['transaction_id','status','notes','processed_by','paid_at'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  const { rows } = await pool.query(`UPDATE payments SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
