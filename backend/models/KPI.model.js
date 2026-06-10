const { query } = require('../config/db');
const { normalizeId, toOptionalText } = require('../utils/postgres');

const mapRow = (row) => {
  if (!row) return null;
  return new KPI({
    id: row.id,
    title: row.title,
    description: row.description,
    maxScore: row.max_score === null ? null : Number(row.max_score),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class KPI {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.title = data.title ?? null;
    this.description = data.description ?? null;
    this.maxScore = data.maxScore === null || data.maxScore === undefined ? null : Number(data.maxScore);
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT * FROM kpi_definitions';
    const params = [];
    const conditions = [];

    if (filter.title) {
      conditions.push('title = $' + (params.length + 1));
      params.push(filter.title);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('SELECT * FROM kpi_definitions WHERE id = $1 LIMIT 1', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM kpi_definitions WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const kpi = await KPI.findById(id);
    if (!kpi) return null;
    kpi.set(update);
    await kpi.save();
    return kpi;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedMaxScore = this.maxScore === null || this.maxScore === undefined ? null : Number(this.maxScore);

    if (this.id) {
      const { rows } = await query(
        `UPDATE kpi_definitions
         SET title = $1, description = $2, max_score = $3, updated_at = $4
         WHERE id = $5 RETURNING *`,
        [
          this.title,
          this.description,
          normalizedMaxScore,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO kpi_definitions (title, description, max_score, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4) RETURNING *`,
      [
        this.title,
        this.description,
        normalizedMaxScore,
        this.createdAt || now,
      ]
    );
    Object.assign(this, mapRow(rows[0]));
    return this;
  }

  toJSON() {
    return {
      _id: String(this.id),
      id: String(this.id),
      title: this.title,
      description: this.description,
      maxScore: this.maxScore,
      max_score: this.maxScore,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = KPI;
