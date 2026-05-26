const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  definitionId: r.definition_id,
  definitionTitle: r.definition_title,
  period: r.period,
  targetValue: parseFloat(r.target_value),
  achievedValue: r.achieved_value ? parseFloat(r.achieved_value) : null,
  score: r.score ? parseFloat(r.score) : null,
  kpiBonus: parseFloat(r.kpi_bonus || 0),
  status: r.status,
  evaluatorId: r.evaluator_id,
  evaluatedAt: r.evaluated_at,
  dueDate: r.due_date,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapDefinitionRow = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  department: r.department,
  category: r.category,
  measurementUnit: r.measurement_unit,
  isActive: r.is_active,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

const findAll = async ({ employeeId, status, period, page = 1, limit = 50 } = {}) => {
  let q = `SELECT k.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM kpi k JOIN employees e ON e.id = k.employee_id WHERE 1=1`;
  const params = [];
  if (employeeId) { params.push(employeeId); q += ` AND k.employee_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND k.status = $${params.length}`; }
  if (period) { params.push(period); q += ` AND k.period = $${params.length}`; }
  q += ` ORDER BY k.due_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findAllDefinitions = async ({ department, category, isActive } = {}) => {
  let q = `SELECT * FROM kpi_definitions WHERE 1=1`;
  const params = [];
  if (department) { params.push(department); q += ` AND department = $${params.length}`; }
  if (category) { params.push(category); q += ` AND category = $${params.length}`; }
  if (isActive !== undefined) { params.push(isActive); q += ` AND is_active = $${params.length}`; }
  q += ` ORDER BY title`;
  const { rows } = await pool.query(q, params);
  return rows.map(mapDefinitionRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM kpi WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO kpi (employee_id, definition_id, definition_title, period, target_value, due_date, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.employeeId, data.definitionId || null, data.definitionTitle, data.period, data.targetValue, data.dueDate, data.status || 'pending', data.notes || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['achieved_value','score','kpi_bonus','status','evaluator_id','evaluated_at','due_date','notes'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE kpi SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

const createDefinition = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO kpi_definitions (title, description, department, category, measurement_unit, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.title, data.description || null, data.department || null, data.category || null, data.measurementUnit || 'percentage', data.isActive !== false, data.createdBy || null]
  );
  return mapDefinitionRow(rows[0]);
};

module.exports = { findAll, findAllDefinitions, findById, create, update, createDefinition };
