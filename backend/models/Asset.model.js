const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new Asset({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    serialNumber: row.serial_number,
    condition: row.condition,
    assignedTo: row.assigned_to,
    assignedDate: row.assigned_date,
    returnDate: row.return_date,
    returnCondition: row.return_condition,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class Asset {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.name = data.name ?? null;
    this.type = data.type ?? null;
    this.description = data.description ?? null;
    this.serialNumber = data.serialNumber ?? data.serial_number ?? null;
    this.condition = data.condition ?? 'new';
    this.assignedTo = data.assignedTo ?? data.assigned_to ?? null;
    this.assignedDate = data.assignedDate ?? data.assigned_date ?? null;
    this.returnDate = data.returnDate ?? data.return_date ?? null;
    this.returnCondition = data.returnCondition ?? data.return_condition ?? null;
    this.status = data.status ?? 'available';
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT a.*, e.first_name, e.last_name FROM assets a LEFT JOIN employees e ON a.assigned_to = e.id';
    const params = [];
    const conditions = [];

    if (filter.type) {
      conditions.push('a.type = $' + (params.length + 1));
      params.push(filter.type);
    }
    if (filter.status) {
      conditions.push('a.status = $' + (params.length + 1));
      params.push(filter.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY a.created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT a.*, e.first_name, e.last_name FROM assets a LEFT JOIN employees e ON a.assigned_to = e.id WHERE a.id = $1 LIMIT 1',
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM assets WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const asset = await Asset.findById(id);
    if (!asset) return null;
    asset.set(update);
    await asset.save();
    return asset;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedAssignedDate = this.assignedDate ? toDate(this.assignedDate) : null;
    const normalizedReturnDate = this.returnDate ? toDate(this.returnDate) : null;

    if (this.id) {
      const { rows } = await query(
        `UPDATE assets
         SET name = $1, type = $2, description = $3, serial_number = $4, condition = $5,
             assigned_to = $6, assigned_date = $7, return_date = $8, return_condition = $9,
             status = $10, notes = $11, updated_at = $12
         WHERE id = $13 RETURNING *`,
        [
          this.name,
          this.type,
          this.description,
          this.serialNumber,
          this.condition,
          this.assignedTo,
          normalizedAssignedDate,
          normalizedReturnDate,
          this.returnCondition,
          this.status,
          this.notes,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO assets (name, type, description, serial_number, condition, assigned_to, assigned_date, return_date, return_condition, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        this.name,
        this.type,
        this.description,
        this.serialNumber,
        this.condition,
        this.assignedTo,
        normalizedAssignedDate,
        normalizedReturnDate,
        this.returnCondition,
        this.status,
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
      name: this.name,
      type: this.type,
      description: this.description,
      serialNumber: this.serialNumber,
      condition: this.condition,
      assignedTo: this.assignedTo,
      assignedDate: this.assignedDate,
      returnDate: this.returnDate,
      returnCondition: this.returnCondition,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Asset;
