const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  settingKey: r.setting_key,
  category: r.category,
  settingValue: r.setting_value,
  description: r.description,
  dataType: r.data_type,
  isActive: r.is_active,
  validationRules: r.validation_rules,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapAuditRow = (r) => ({
  id: r.id,
  settingKey: r.setting_key,
  category: r.category,
  oldValue: r.old_value,
  newValue: r.new_value,
  changedBy: r.changed_by,
  changedAt: r.changed_at,
  impactAnalysis: r.impact_analysis,
  reason: r.reason,
});

const getByCategory = async (category) => {
  const { rows } = await pool.query('SELECT * FROM settings WHERE category = $1 AND is_active = TRUE ORDER BY setting_key', [category]);
  return rows.map(mapRow);
};

const getAll = async () => {
  const { rows } = await pool.query('SELECT * FROM settings WHERE is_active = TRUE ORDER BY category, setting_key');
  return rows.map(mapRow);
};

const findByKey = async (settingKey, category = 'general') => {
  const { rows } = await pool.query('SELECT * FROM settings WHERE setting_key = $1 AND category = $2', [settingKey, category]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO settings (setting_key, category, setting_value, description, data_type, is_active, validation_rules)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.settingKey, data.category || 'general', data.settingValue, data.description || null, data.dataType || 'string', data.isActive !== false, data.validationRules ? JSON.stringify(data.validationRules) : null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['setting_value','description','data_type','is_active','validation_rules'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' && data[f] !== null ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return null;
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE settings SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

const remove = async (id) => {
  await pool.query('DELETE FROM settings WHERE id = $1', [id]);
};

const getAuditLog = async ({ settingKey, category, limit = 100 } = {}) => {
  let q = `SELECT * FROM settings_audit_log WHERE 1=1`;
  const params = [];
  if (settingKey) { params.push(settingKey); q += ` AND setting_key = $${params.length}`; }
  if (category) { params.push(category); q += ` AND category = $${params.length}`; }
  q += ` ORDER BY changed_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapAuditRow);
};

const logAudit = async ({ settingKey, category, oldValue, newValue, changedBy, impactAnalysis, reason }) => {
  await pool.query(
    `INSERT INTO settings_audit_log (setting_key, category, old_value, new_value, changed_by, impact_analysis, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [settingKey, category, oldValue, newValue, changedBy, impactAnalysis, reason]
  );
};

module.exports = { getByCategory, getAll, findByKey, create, update, remove, getAuditLog, logAudit };
