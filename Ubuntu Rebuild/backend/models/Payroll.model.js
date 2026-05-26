const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  period: r.period,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  basicPay: parseFloat(r.basic_pay),
  overtimePay: parseFloat(r.overtime_pay || 0),
  kpiBonus: parseFloat(r.kpi_bonus || 0),
  allowances: parseFloat(r.allowances || 0),
  grossPay: parseFloat(r.gross_pay),
  paye: parseFloat(r.paye || 0),
  nhif: parseFloat(r.nhif || 0),
  nssf: parseFloat(r.nssf || 0),
  otherDeductions: parseFloat(r.other_deductions || 0),
  totalDeductions: parseFloat(r.total_deductions || 0),
  netPay: parseFloat(r.net_pay),
  status: r.status,
  paymentMethod: r.payment_method,
  mpesaTransactionId: r.mpesa_transaction_id,
  urgencyLevel: r.urgency_level,
  retryCount: r.retry_count,
  notes: r.notes,
  processedBy: r.processed_by,
  paidAt: r.paid_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ employeeId, status, period, page = 1, limit = 50 } = {}) => {
  let q = `SELECT p.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM payroll p JOIN employees e ON e.id = p.employee_id WHERE 1=1`;
  const params = [];
  if (employeeId) { params.push(employeeId); q += ` AND p.employee_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND p.status = $${params.length}`; }
  if (period) { params.push(period); q += ` AND p.period = $${params.length}`; }
  q += ` ORDER BY p.period DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM payroll WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO payroll (employee_id, period, period_start, period_end, basic_pay, overtime_pay, kpi_bonus, allowances,
      gross_pay, paye, nhif, nssf, other_deductions, total_deductions, net_pay, status, payment_method, urgency_level)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [
      data.employeeId, data.period, data.periodStart, data.periodEnd, data.basicPay, data.overtimePay || 0,
      data.kpiBonus || 0, data.allowances || 0, data.grossPay, data.paye || 0, data.nhif || 0, data.nssf || 0,
      data.otherDeductions || 0, data.totalDeductions || 0, data.netPay, data.status || 'draft',
      data.paymentMethod || 'MPESA', data.urgencyLevel || 'normal'
    ]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['status','payment_method','mpesa_transaction_id','urgency_level','retry_count','notes','processed_by','paid_at'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE payroll SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findAll, findById, create, update };
