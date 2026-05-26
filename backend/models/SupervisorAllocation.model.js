const { query } = require('../config/db');
const { normalizeId, toDate } = require('../utils/postgres');

class SupervisorAllocation {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.supervisorId = normalizeId(data.supervisorId) ?? data.supervisor_id ?? null;
    this.superviseeId = normalizeId(data.superviseeId) ?? data.supervisee_id ?? null;
    this.type = data.type ?? 'temporary';
    this.startDate = data.startDate ?? data.start_date ?? null;
    this.endDate = data.endDate ?? data.end_date ?? null;
    this.permissions = data.permissions ?? [];
    this.assignedBy = normalizeId(data.assignedBy) ?? data.assigned_by ?? null;
    this.isActive = data.isActive ?? data.is_active ?? true;
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new SupervisorAllocation({
      id: row.id,
      supervisorId: row.supervisor_id,
      superviseeId: row.supervisee_id,
      type: row.type,
      startDate: row.start_date,
      endDate: row.end_date,
      permissions: row.permissions || [],
      assignedBy: row.assigned_by,
      isActive: row.is_active,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static async findBySupervisor(supervisorId, date = new Date()) {
    const normalizedId = normalizeId(supervisorId);
    if (!normalizedId) return [];

    const { rows } = await query(
      `SELECT * FROM supervisor_allocations 
       WHERE supervisor_id = $1 
       AND is_active = true
       AND start_date <= $2
       AND (type = 'permanent' OR type = 'undefined' OR end_date IS NULL OR end_date >= $2)
       ORDER BY created_at DESC`,
      [normalizedId, toDate(date)]
    );
    return rows.map(SupervisorAllocation.fromRow);
  }

  static async findBySupervisee(superviseeId, date = new Date()) {
    const normalizedId = normalizeId(superviseeId);
    if (!normalizedId) return [];

    const { rows } = await query(
      `SELECT * FROM supervisor_allocations 
       WHERE supervisee_id = $1 
       AND is_active = true
       AND start_date <= $2
       AND (type = 'permanent' OR type = 'undefined' OR end_date IS NULL OR end_date >= $2)
       ORDER BY created_at DESC`,
      [normalizedId, toDate(date)]
    );
    return rows.map(SupervisorAllocation.fromRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT * FROM supervisor_allocations WHERE id = $1 LIMIT 1',
      [normalizedId]
    );
    return SupervisorAllocation.fromRow(rows[0]);
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM supervisor_allocations';
    const params = [];
    let index = 1;
    const conditions = [];

    if (options.supervisorId) {
      conditions.push(`supervisor_id = $${index++}`);
      params.push(normalizeId(options.supervisorId));
    }

    if (options.superviseeId) {
      conditions.push(`supervisee_id = $${index++}`);
      params.push(normalizeId(options.superviseeId));
    }

    if (options.activeOnly) {
      conditions.push('is_active = true');
    }

    if (options.type) {
      conditions.push(`type = $${index++}`);
      params.push(options.type);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(SupervisorAllocation.fromRow);
  }

  async save() {
    const now = new Date();

    const permissionsJson = JSON.stringify(Array.isArray(this.permissions) ? this.permissions : []);

    if (this.id) {
      const { rows } = await query(
        `UPDATE supervisor_allocations
         SET supervisor_id = $1, supervisee_id = $2, type = $3,
             start_date = $4, end_date = $5, permissions = $6,
             assigned_by = $7, is_active = $8, notes = $9, updated_at = $10
         WHERE id = $11
         RETURNING *`,
        [
          this.supervisorId, this.superviseeId, this.type,
          toDate(this.startDate), toDate(this.endDate), permissionsJson,
          this.assignedBy, this.isActive, this.notes, now, this.id
        ]
      );
      Object.assign(this, SupervisorAllocation.fromRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO supervisor_allocations (
        supervisor_id, supervisee_id, type, start_date, end_date,
        permissions, assigned_by, is_active, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      RETURNING *`,
      [
        this.supervisorId, this.superviseeId, this.type,
        toDate(this.startDate) || now, toDate(this.endDate), permissionsJson,
        this.assignedBy, this.isActive !== false, this.notes, now
      ]
    );
    Object.assign(this, SupervisorAllocation.fromRow(rows[0]));
    return this;
  }

  async deactivate() {
    this.isActive = false;
    return this.save();
  }

  isActiveOnDate(date = new Date()) {
    if (!this.isActive) return false;
    const checkDate = new Date(date);
    const start = new Date(this.startDate);
    
    if (checkDate < start) return false;
    
    if (this.type === 'permanent' || this.type === 'undefined' || !this.endDate) {
      return true;
    }
    
    return checkDate <= new Date(this.endDate);
  }

  toJSON() {
    return {
      id: String(this.id),
      supervisorId: String(this.supervisorId),
      superviseeId: String(this.superviseeId),
      type: this.type,
      startDate: this.startDate,
      endDate: this.endDate,
      permissions: this.permissions,
      assignedBy: String(this.assignedBy),
      isActive: this.isActive,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = SupervisorAllocation;
