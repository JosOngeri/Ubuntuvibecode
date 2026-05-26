const { query } = require('../config/db');
const { normalizeId, toDate } = require('../utils/postgres');

class AuditLog {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.userId = normalizeId(data.userId) ?? data.user_id ?? null;
    this.username = data.username ?? null;
    this.userRole = data.userRole ?? data.user_role ?? null;
    this.action = data.action ?? null;
    this.entityType = data.entityType ?? data.entity_type ?? null;
    this.entityId = normalizeId(data.entityId) ?? data.entity_id ?? null;
    this.previousData = data.previousData ?? data.oldData ?? data.old_data ?? data.previous_data ?? null;
    this.newData = data.newData ?? data.new_data ?? null;
    this.reason = data.reason ?? null;
    this.ipAddress = data.ipAddress ?? data.ip_address ?? null;
    this.userAgent = data.userAgent ?? data.user_agent ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new AuditLog({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      userRole: row.user_role,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldData: row.old_data,
      newData: row.new_data,
      reason: row.reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    });
  }

  static async create(data) {
    const log = new AuditLog(data);
    return log.save();
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT * FROM audit_logs WHERE id = $1 LIMIT 1',
      [normalizedId]
    );
    return AuditLog.fromRow(rows[0]);
  }

  static async findByUser(userId, options = {}) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return [];

    let sql = 'SELECT * FROM audit_logs WHERE user_id = $1';
    const params = [normalizedId];
    let index = 2;

    if (options.action) {
      sql += ` AND action = $${index++}`;
      params.push(options.action);
    }

    if (options.entityType) {
      sql += ` AND entity_type = $${index++}`;
      params.push(options.entityType);
    }

    if (options.startDate) {
      sql += ` AND created_at >= $${index++}`;
      params.push(toDate(options.startDate));
    }

    if (options.endDate) {
      sql += ` AND created_at <= $${index++}`;
      params.push(toDate(options.endDate));
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ` LIMIT $${index++}`;
      params.push(parseInt(options.limit));
    }

    const { rows } = await query(sql, params);
    return rows.map(AuditLog.fromRow);
  }

  static async findByEntity(entityType, entityId, options = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE entity_type = $1';
    const params = [entityType];
    let index = 2;

    if (entityId) {
      sql += ` AND entity_id = $${index++}`;
      params.push(normalizeId(entityId));
    }

    if (options.action) {
      sql += ` AND action = $${index++}`;
      params.push(options.action);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ` LIMIT $${index++}`;
      params.push(parseInt(options.limit));
    }

    const { rows } = await query(sql, params);
    return rows.map(AuditLog.fromRow);
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM audit_logs';
    const params = [];
    let index = 1;
    const conditions = [];

    if (options.userId) {
      conditions.push(`user_id = $${index++}`);
      params.push(normalizeId(options.userId));
    }

    if (options.action) {
      conditions.push(`action = $${index++}`);
      params.push(options.action);
    }

    if (options.entityType) {
      conditions.push(`entity_type = $${index++}`);
      params.push(options.entityType);
    }

    if (options.departmentId) {
      conditions.push(`department_id = $${index++}`);
      params.push(normalizeId(options.departmentId));
    }

    if (options.startDate) {
      conditions.push(`created_at >= $${index++}`);
      params.push(toDate(options.startDate));
    }

    if (options.endDate) {
      conditions.push(`created_at <= $${index++}`);
      params.push(toDate(options.endDate));
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ` LIMIT $${index++}`;
      params.push(parseInt(options.limit));
    }

    if (options.offset) {
      sql += ` OFFSET $${index++}`;
      params.push(parseInt(options.offset));
    }

    const { rows } = await query(sql, params);
    return rows.map(AuditLog.fromRow);
  }

  static async count(options = {}) {
    let sql = 'SELECT COUNT(*) FROM audit_logs';
    const params = [];
    let index = 1;
    const conditions = [];

    if (options.userId) {
      conditions.push(`user_id = $${index++}`);
      params.push(normalizeId(options.userId));
    }

    if (options.action) {
      conditions.push(`action = $${index++}`);
      params.push(options.action);
    }

    if (options.entityType) {
      conditions.push(`entity_type = $${index++}`);
      params.push(options.entityType);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count);
  }

  async save() {
    const now = new Date();

    const { rows } = await query(
      `INSERT INTO audit_logs (
        user_id, username, user_role, action, entity_type, entity_id,
        entity_name, previous_data, new_data, reason, ip_address,
        user_agent, department_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        this.userId, this.username, this.userRole, this.action,
        this.entityType, this.entityId, this.entityName,
        this.previousData ? JSON.stringify(this.previousData) : null,
        this.newData ? JSON.stringify(this.newData) : null,
        this.reason, this.ipAddress, this.userAgent,
        this.departmentId, now
      ]
    );
    Object.assign(this, AuditLog.fromRow(rows[0]));
    return this;
  }

  toJSON() {
    return {
      id: String(this.id),
      userId: this.userId ? String(this.userId) : null,
      username: this.username,
      userRole: this.userRole,
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId ? String(this.entityId) : null,
      entityName: this.entityName,
      previousData: this.previousData,
      newData: this.newData,
      reason: this.reason,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      departmentId: this.departmentId ? String(this.departmentId) : null,
      createdAt: this.createdAt,
    };
  }
}

module.exports = AuditLog;
