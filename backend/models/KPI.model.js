const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new KPI({
    id: row.id,
    name: row.name,
    description: row.description,
    target: row.target === null ? null : Number(row.target),
    createdAt: row.created_at,
  });
};

class KPI {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.name = data.name ?? null;
    this.description = data.description ?? null;
    this.target = data.target === null || data.target === undefined ? null : Number(data.target);
    this.createdAt = data.createdAt ?? data.created_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT * FROM kpi_definitions';
    const params = [];
    const conditions = [];

    if (filter.name) {
      conditions.push('name = $' + (params.length + 1));
      params.push(filter.name);
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
    const normalizedTarget = this.target === null || this.target === undefined ? null : Number(this.target);

    if (this.id) {
      const { rows } = await query(
        `UPDATE kpi_definitions
         SET name = $1, description = $2, target = $3, created_at = $4
         WHERE id = $5 RETURNING *`,
        [
          this.name,
          this.description,
          normalizedTarget,
          this.createdAt || now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO kpi_definitions (name, description, target, created_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        this.name,
        this.description,
        normalizedTarget,
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
      name: this.name,
      description: this.description,
      target: this.target,
      createdAt: this.createdAt,
    };
  }
}

module.exports = KPI;
