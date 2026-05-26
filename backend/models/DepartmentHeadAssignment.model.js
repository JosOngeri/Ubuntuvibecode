const { query } = require('../config/db');
const { normalizeId, toDate } = require('../utils/postgres');

class DepartmentHeadAssignment {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.userId = normalizeId(data.userId) ?? data.user_id ?? null;
    this.department = data.department ?? null;
    this.permissions = data.permissions ?? [];
    this.assignedBy = normalizeId(data.assignedBy) ?? data.assigned_by ?? null;
    this.isActive = data.isActive ?? data.is_active ?? true;
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new DepartmentHeadAssignment({
      id: row.id,
      userId: row.user_id,
      department: row.department,
      permissions: row.permissions || [],
      assignedBy: row.assigned_by,
      isActive: row.is_active,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static async findByUserId(userId) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT * FROM department_head_assignments WHERE user_id = $1 AND is_active = true LIMIT 1',
      [normalizedId]
    );
    return DepartmentHeadAssignment.fromRow(rows[0]);
  }

  static async findByDepartment(department) {
    if (!department) return null;

    const { rows } = await query(
      'SELECT * FROM department_head_assignments WHERE department = $1 AND is_active = true LIMIT 1',
      [department]
    );
    return DepartmentHeadAssignment.fromRow(rows[0]);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT * FROM department_head_assignments WHERE id = $1 LIMIT 1',
      [normalizedId]
    );
    return DepartmentHeadAssignment.fromRow(rows[0]);
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM department_head_assignments';
    const params = [];
    let index = 1;
    const conditions = [];

    if (options.department) {
      conditions.push(`department = $${index++}`);
      params.push(options.department);
    }

    if (options.userId) {
      conditions.push(`user_id = $${index++}`);
      params.push(normalizeId(options.userId));
    }

    if (options.activeOnly !== false) {
      conditions.push('is_active = true');
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(DepartmentHeadAssignment.fromRow);
  }

  async save() {
    const now = new Date();

    if (this.id) {
      const { rows } = await query(
        `UPDATE department_head_assignments
         SET user_id = $1, department = $2, permissions = $3,
             assigned_by = $4, is_active = $5, notes = $6, updated_at = $7
         WHERE id = $8
         RETURNING *`,
        [
          this.userId, this.department, this.permissions,
          this.assignedBy, this.isActive, this.notes, now, this.id
        ]
      );
      Object.assign(this, DepartmentHeadAssignment.fromRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO department_head_assignments (
        user_id, department, permissions, assigned_by, is_active,
        notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING *`,
      [
        this.userId, this.department, this.permissions,
        this.assignedBy, this.isActive !== false, this.notes, now
      ]
    );
    Object.assign(this, DepartmentHeadAssignment.fromRow(rows[0]));
    return this;
  }

  async deactivate() {
    this.isActive = false;
    return this.save();
  }

  hasPermission(permissionKey) {
    return this.permissions?.includes(permissionKey);
  }

  toJSON() {
    return {
      id: String(this.id),
      userId: String(this.userId),
      department: this.department,
      permissions: this.permissions,
      assignedBy: String(this.assignedBy),
      isActive: this.isActive,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = DepartmentHeadAssignment;
