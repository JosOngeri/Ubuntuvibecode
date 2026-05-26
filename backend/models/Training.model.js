const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate } = require('../utils/postgres');

const mapRow = (row) => {
  if (!row) return null;
  return new Training({
    id: row.id,
    employeeId: row.employee_id,
    courseName: row.course_name,
    provider: row.provider,
    trainingType: row.training_type,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    score: row.score === null ? null : Number(row.score),
    certificateUrl: row.certificate_url,
    cost: row.cost === null ? null : Number(row.cost),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class Training {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.employeeId = data.employeeId ?? data.employee_id ?? null;
    this.courseName = data.courseName ?? data.course_name ?? null;
    this.provider = data.provider ?? null;
    this.trainingType = data.trainingType ?? data.training_type ?? 'internal';
    this.startDate = data.startDate ?? data.start_date ?? null;
    this.endDate = data.endDate ?? data.end_date ?? null;
    this.status = data.status ?? 'planned';
    this.score = data.score === null || data.score === undefined ? null : Number(data.score);
    this.certificateUrl = data.certificateUrl ?? data.certificate_url ?? null;
    this.cost = data.cost === null || data.cost === undefined ? null : Number(data.cost);
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT t.*, e.first_name, e.last_name, e.department FROM training t LEFT JOIN employees e ON t.employee_id = e.id';
    const params = [];
    const conditions = [];

    if (filter.employee_id) {
      conditions.push('t.employee_id = $' + (params.length + 1));
      params.push(filter.employee_id);
    }
    if (filter.status) {
      conditions.push('t.status = $' + (params.length + 1));
      params.push(filter.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY t.created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT t.*, e.first_name, e.last_name, e.department FROM training t LEFT JOIN employees e ON t.employee_id = e.id WHERE t.id = $1 LIMIT 1',
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM training WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const training = await Training.findById(id);
    if (!training) return null;
    training.set(update);
    await training.save();
    return training;
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) FROM training';
    const params = [];
    const conditions = [];

    if (filter.status) {
      conditions.push('status = $' + (params.length + 1));
      params.push(filter.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count);
  }

  static async aggregate(pipeline) {
    if (pipeline[0]?.$match?.cost?.$exists) {
      const { rows } = await query('SELECT COALESCE(SUM(cost), 0) as total_cost FROM training WHERE cost IS NOT NULL');
      return [{ _id: null, totalCost: Number(rows[0].total_cost) }];
    }
    return [];
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedStartDate = this.startDate ? toDate(this.startDate) : null;
    const normalizedEndDate = this.endDate ? toDate(this.endDate) : null;
    const normalizedScore = this.score === null || this.score === undefined ? null : Number(this.score);
    const normalizedCost = this.cost === null || this.cost === undefined ? null : Number(this.cost);

    if (this.id) {
      const { rows } = await query(
        `UPDATE training
         SET employee_id = $1, course_name = $2, provider = $3, training_type = $4,
             start_date = $5, end_date = $6, status = $7, score = $8,
             certificate_url = $9, cost = $10, notes = $11, updated_at = $12
         WHERE id = $13 RETURNING *`,
        [
          this.employeeId,
          this.courseName,
          this.provider,
          this.trainingType,
          normalizedStartDate,
          normalizedEndDate,
          this.status,
          normalizedScore,
          this.certificateUrl,
          normalizedCost,
          this.notes,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO training (employee_id, course_name, provider, training_type, start_date, end_date, status, score, certificate_url, cost, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        this.employeeId,
        this.courseName,
        this.provider,
        this.trainingType,
        normalizedStartDate,
        normalizedEndDate,
        this.status,
        normalizedScore,
        this.certificateUrl,
        normalizedCost,
        this.notes,
        now,
        now,
      ]
    );
    Object.assign(this, mapRow(rows[0]));
    return this;
  }

  toJSON() {
    return {
      _id: String(this.id),
      id: String(this.id),
      employee_id: this.employeeId,
      employeeId: this.employeeId,
      course_name: this.courseName,
      courseName: this.courseName,
      provider: this.provider,
      training_type: this.trainingType,
      trainingType: this.trainingType,
      start_date: this.startDate,
      startDate: this.startDate,
      end_date: this.endDate,
      endDate: this.endDate,
      status: this.status,
      score: this.score,
      certificate_url: this.certificateUrl,
      certificateUrl: this.certificateUrl,
      cost: this.cost,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Training;
