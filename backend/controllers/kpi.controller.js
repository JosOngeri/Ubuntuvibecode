const { query } = require('../config/db');
const { normalizeId, toOptionalText } = require('../utils/postgres');
const logger = require('../utils/logger');

const createKPI = async (req, res) => {
  logger.info('kpi.createDef', 'Entry', { userId: req.user?.id });
  try {
    const title = toOptionalText(req.body.title);
    const description = toOptionalText(req.body.description);
    const maxScore = Number(req.body.maxScore);

    if (!title || Number.isNaN(maxScore) || maxScore <= 0) {
      logger.warn('kpi.createDef', 'Validation failed', { title, maxScore });
      return res.status(400).json({ error: 'title and maxScore are required and maxScore must be a positive number' });
    }

    const { rows } = await query(
      `INSERT INTO kpi_definitions (title, description, max_score, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [title, description, maxScore]
    );

    logger.info('kpi.createDef', 'Created', { id: rows[0]?.id });
    return res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('kpi.createDef', 'DB error', err);
    return res.status(500).json({ error: err.message });
  }
};

const getKPIs = async (req, res) => {
  logger.info('kpi.getDefs', 'Entry');
  try {
    const { rows } = await query('SELECT * FROM kpi_definitions ORDER BY created_at DESC');
    logger.info('kpi.getDefs', `Returning ${rows.length} definitions`);
    return res.json(rows);
  } catch (err) {
    logger.error('kpi.getDefs', 'DB error', err);
    return res.status(500).json({ error: err.message });
  }
};

const updateKPI = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid KPI definition id' });
    }

    const title = toOptionalText(req.body.title);
    const description = toOptionalText(req.body.description);
    const maxScore = req.body.maxScore !== undefined ? Number(req.body.maxScore) : undefined;

    const fields = [];
    const values = [];

    if (title) {
      values.push(title);
      fields.push(`title = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      fields.push(`description = $${values.length}`);
    }
    if (maxScore !== undefined) {
      if (Number.isNaN(maxScore) || maxScore <= 0) {
        return res.status(400).json({ error: 'maxScore must be a positive number' });
      }
      values.push(maxScore);
      fields.push(`max_score = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    values.push(id);
    const { rows } = await query(
      `UPDATE kpi_definitions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!rows[0]) {
      logger.warn('kpi.updateDef', 'Not found', { id });
      return res.status(404).json({ error: 'KPI definition not found' });
    }

    logger.info('kpi.updateDef', 'Updated', { id });
    return res.json(rows[0]);
  } catch (err) {
    logger.error('kpi.updateDef', 'DB error', err, { id: req.params.id });
    return res.status(500).json({ error: err.message });
  }
};

const deleteKPI = async (req, res) => {
  logger.info('kpi.deleteDef', 'Entry', { id: req.params.id });
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      logger.warn('kpi.deleteDef', 'Invalid id', { id: req.params.id });
      return res.status(400).json({ error: 'Invalid KPI definition id' });
    }

    const { rows } = await query('DELETE FROM kpi_definitions WHERE id = $1 RETURNING *', [id]);
    if (!rows[0]) {
      logger.warn('kpi.deleteDef', 'Not found', { id });
      return res.status(404).json({ error: 'KPI definition not found' });
    }

    logger.info('kpi.deleteDef', 'Deleted', { id });
    return res.json({ success: true, deleted: rows[0] });
  } catch (err) {
    logger.error('kpi.deleteDef', 'DB error', err, { id: req.params.id });
    return res.status(500).json({ error: err.message });
  }
};

const assignKPI = async (req, res) => {
  logger.info('kpi.assign', 'Entry', { employeeId: req.body.employeeId, period: req.body.period, by: req.user?.id });
  try {
    const employeeId = normalizeId(req.body.employeeId);
    const evaluatorId = normalizeId(req.body.evaluatorId);
    const period = toOptionalText(req.body.period);
    const targetValue = Number(req.body.targetValue);
    const title = toOptionalText(req.body.title);
    const description = toOptionalText(req.body.description);
    const maxScore = Number(req.body.maxScore);
    const definitionId = normalizeId(req.body.definitionId);

    if (!employeeId || !evaluatorId || !period || Number.isNaN(targetValue) || targetValue <= 0) {
      return res.status(400).json({ error: 'employeeId, evaluatorId, period, and targetValue are required' });
    }

    const employeeResult = await query('SELECT id FROM employees WHERE id = $1 LIMIT 1', [employeeId]);
    if (!employeeResult.rows[0]) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const evaluatorResult = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [evaluatorId]);
    if (!evaluatorResult.rows[0]) {
      return res.status(404).json({ error: 'Evaluator not found' });
    }

    let usedDefinitionId = null;

    if (definitionId) {
      const definitionResult = await query('SELECT id FROM kpi_definitions WHERE id = $1 LIMIT 1', [definitionId]);
      if (!definitionResult.rows[0]) {
        return res.status(404).json({ error: 'KPI definition not found' });
      }
      usedDefinitionId = definitionId;
    } else {
      if (!title || Number.isNaN(maxScore) || maxScore <= 0) {
        return res.status(400).json({ error: 'title and maxScore are required when definitionId is not provided' });
      }
      const definitionInsert = await query(
        `INSERT INTO kpi_definitions (title, description, max_score, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
        [title, description, maxScore]
      );
      usedDefinitionId = definitionInsert.rows[0].id;
    }

    const { rows } = await query(
      `INSERT INTO employee_kpis (employee_id, evaluator_id, definition_id, period, target_value, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'Pending', NOW(), NOW()) RETURNING *`,
      [employeeId, evaluatorId, usedDefinitionId, period, targetValue]
    );

    logger.info('kpi.assign', 'Assigned', { id: rows[0]?.id, employeeId });
    return res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('kpi.assign', 'DB error', err);
    return res.status(500).json({ error: err.message });
  }
};

const processPendingBonuses = async () => {
  try {
    const { rows } = await query(
      `SELECT ek.id, ek.employee_id, ek.period, ek.final_score, kd.max_score
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       WHERE ek.final_score > 90
         AND NOT EXISTS (
           SELECT 1 FROM pending_bonuses pb WHERE pb.employee_kpi_id = ek.id
         )`
    );

    for (const row of rows) {
      const bonusAmount = Number(
        ((Number(row.final_score) / 100) * Number(row.max_score) * 0.1).toFixed(2)
      );
      await query(
        `INSERT INTO pending_bonuses (employee_id, employee_kpi_id, period, bonus_type, bonus_amount, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'KPI Raise', $4, 'pending', NOW(), NOW())
         ON CONFLICT (employee_kpi_id, period) DO NOTHING`,
        [row.employee_id, row.id, row.period, bonusAmount]
      );
    }
  } catch (err) {
    logger.error('kpi.bonusProcessor', 'Error processing bonuses', err);
  }
};

const evaluateKPI = async (req, res) => {
  logger.info('kpi.evaluate', 'Entry', { id: req.params.id, achievedValue: req.body.achievedValue, by: req.user?.id });
  try {
    const id = normalizeId(req.params.id);
    const achievedValue = Number(req.body.achievedValue);

    if (!id || Number.isNaN(achievedValue) || achievedValue < 0) {
      logger.warn('kpi.evaluate', 'Validation failed', { id: req.params.id, achievedValue });
      return res.status(400).json({ error: 'A valid KPI id and achievedValue are required' });
    }

    const { rows } = await query(
      `SELECT ek.target_value, kd.max_score
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       WHERE ek.id = $1`,
      [id]
    );

    if (!rows[0]) {
      logger.warn('kpi.evaluate', 'KPI not found', { id });
      return res.status(404).json({ error: 'KPI assignment not found' });
    }

    const targetValue = Number(rows[0].target_value);
    const maxScore = Number(rows[0].max_score);

    const finalScore = targetValue > 0
      ? Math.round((achievedValue / targetValue) * 100)
      : 0;

    const status = 'Completed';
    const updateResult = await query(
      `UPDATE employee_kpis
       SET achieved_value = $1, final_score = $2, status = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [achievedValue, finalScore, status, id]
    );

    await processPendingBonuses();

    logger.info('kpi.evaluate', 'Evaluated', { id, finalScore });
    return res.json(updateResult.rows[0]);
  } catch (err) {
    logger.error('kpi.evaluate', 'DB error', err, { id: req.params.id });
    return res.status(500).json({ error: err.message });
  }
};

const getAllAssignedKPIs = async (req, res) => {
  logger.info('kpi.getAll', 'Entry', { userId: req.user?.id });
  try {
    const { rows } = await query(
      `SELECT ek.id,
              ek.employee_id,
              ek.evaluator_id,
              ek.definition_id,
              ek.period,
              ek.target_value,
              ek.achieved_value,
              ek.final_score,
              ek.status,
              ek.created_at,
              ek.updated_at,
              kd.title AS definition_title,
              kd.description AS definition_description,
              kd.max_score AS definition_max_score,
              pb.bonus_amount,
              pb.status AS bonus_status,
              e.first_name,
              e.last_name,
              e.email
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       LEFT JOIN pending_bonuses pb ON pb.employee_kpi_id = ek.id
       LEFT JOIN employees e ON e.id = ek.employee_id
       ORDER BY ek.created_at DESC`
    );

    logger.info('kpi.getAll', `Returning ${rows.length} assigned KPIs`);
    return res.json(rows);
  } catch (err) {
    logger.error('kpi.getAll', 'DB error', err);
    return res.status(500).json({ error: err.message });
  }
};

const bulkAssignKPI = async (req, res) => {
  logger.info('kpi.bulkAssign', 'Entry', { count: req.body.employeeIds?.length, by: req.user?.id });
  try {
    const { employeeIds, definitionId, evaluatorId, period, targetValue } = req.body;
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      logger.warn('kpi.bulkAssign', 'No employeeIds provided');
      return res.status(400).json({ error: 'employeeIds array is required' });
    }
    const defId = normalizeId(definitionId);
    const evId = normalizeId(evaluatorId);
    const tv = Number(targetValue);
    const p = toOptionalText(period);

    if (!defId || !evId || !p || Number.isNaN(tv) || tv <= 0) {
      return res.status(400).json({ error: 'definitionId, evaluatorId, period, and targetValue are required' });
    }

    const definitionResult = await query('SELECT id FROM kpi_definitions WHERE id = $1 LIMIT 1', [defId]);
    if (!definitionResult.rows[0]) {
      return res.status(404).json({ error: 'KPI definition not found' });
    }

    const evaluatorResult = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [evId]);
    if (!evaluatorResult.rows[0]) {
      return res.status(404).json({ error: 'Evaluator not found' });
    }

    let assignedCount = 0;
    const errors = [];

    for (const empId of employeeIds) {
      const normalizedEmpId = normalizeId(empId);
      if (!normalizedEmpId) {
        errors.push({ employeeId: empId, error: 'Invalid employee ID' });
        continue;
      }

      try {
        const empResult = await query('SELECT id FROM employees WHERE id = $1 LIMIT 1', [normalizedEmpId]);
        if (!empResult.rows[0]) {
          errors.push({ employeeId: empId, error: 'Employee not found' });
          continue;
        }

        await query(
          `INSERT INTO employee_kpis (employee_id, evaluator_id, definition_id, period, target_value, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'Pending', NOW(), NOW())`,
          [normalizedEmpId, evId, defId, p, tv]
        );
        assignedCount++;
      } catch (err) {
        errors.push({ employeeId: empId, error: err.message });
      }
    }

    logger.info('kpi.bulkAssign', 'Completed', { assigned: assignedCount, total: employeeIds.length, errors: errors.length });
    return res.json({
      success: true,
      assigned: assignedCount,
      total: employeeIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.error('kpi.bulkAssign', 'DB error', err);
    return res.status(500).json({ error: err.message });
  }
};

const selfEvaluateKPI = async (req, res) => {
  logger.info('kpi.selfEvaluate', 'Entry', { id: req.params.id, by: req.user?.id });
  try {
    const id = normalizeId(req.params.id);
    const achievedValue = Number(req.body.achievedValue);

    if (!id || Number.isNaN(achievedValue) || achievedValue < 0) {
      logger.warn('kpi.selfEvaluate', 'Validation failed', { id, achievedValue });
      return res.status(400).json({ error: 'A valid KPI id and achievedValue are required' });
    }

    const { rows } = await query(
      `SELECT ek.target_value, kd.max_score, ek.employee_id
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       WHERE ek.id = $1`,
      [id]
    );

    if (!rows[0]) {
      logger.warn('kpi.selfEvaluate', 'KPI not found', { id });
      return res.status(404).json({ error: 'KPI assignment not found' });
    }

    const targetValue = Number(rows[0].target_value);
    const maxScore = Number(rows[0].max_score);
    const employeeId = rows[0].employee_id;

    if (String(employeeId) !== String(req.user?.employeeId) && String(employeeId) !== String(req.user?.id)) {
      logger.warn('kpi.selfEvaluate', 'Unauthorized', { id, employeeId, userId: req.user?.id });
      return res.status(403).json({ error: 'You can only evaluate your own KPIs' });
    }

    const finalScore = targetValue > 0
      ? Math.round((achievedValue / targetValue) * 100)
      : 0;

    const status = 'Pending Review';
    const updateResult = await query(
      `UPDATE employee_kpis
       SET achieved_value = $1, final_score = $2, status = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [achievedValue, finalScore, status, id]
    );

    logger.info('kpi.selfEvaluate', 'Self-evaluated', { id, finalScore });
    return res.json(updateResult.rows[0]);
  } catch (err) {
    logger.error('kpi.selfEvaluate', 'DB error', err, { id: req.params.id });
    return res.status(500).json({ error: err.message });
  }
};

const getEmployeeKPIs = async (req, res) => {
  logger.info('kpi.getEmployeeKPIs', 'Entry', { employeeId: req.params.id });
  try {
    const employeeId = normalizeId(req.params.id);
    if (!employeeId) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const { rows } = await query(
      `SELECT ek.id,
              ek.employee_id,
              ek.evaluator_id,
              ek.definition_id,
              ek.period,
              ek.target_value,
              ek.achieved_value,
              ek.final_score,
              ek.status,
              ek.created_at,
              ek.updated_at,
              kd.title AS definition_title,
              kd.description AS definition_description,
              kd.max_score AS definition_max_score,
              pb.bonus_amount,
              pb.status AS bonus_status
       FROM employee_kpis ek
       JOIN kpi_definitions kd ON kd.id = ek.definition_id
       LEFT JOIN pending_bonuses pb ON pb.employee_kpi_id = ek.id
       WHERE ek.employee_id = $1
       ORDER BY ek.created_at DESC`,
      [employeeId]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createKPI,
  getKPIs,
  updateKPI,
  deleteKPI,
  assignKPI,
  bulkAssignKPI,
  selfEvaluateKPI,
  evaluateKPI,
  getEmployeeKPIs,
  getAllAssignedKPIs,
  startKpiBonusProcessor: (intervalMs = 60 * 60 * 1000) => {
    setInterval(processPendingBonuses, intervalMs);
  },
};
