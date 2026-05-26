const { query } = require('../config/db');
const { normalizeId, toDate } = require('../utils/postgres');

class UserPermissionOverride {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.userId = normalizeId(data.userId) ?? data.user_id ?? null;
    this.permissionKey = data.permissionKey ?? data.permission_key ?? null;
    this.isGranted = data.isGranted ?? data.is_granted ?? true;
    this.grantedBy = normalizeId(data.grantedBy) ?? data.granted_by ?? null;
    this.grantedAt = data.grantedAt ?? data.granted_at ?? null;
    this.expiresAt = data.expiresAt ?? data.expires_at ?? null;
    this.durationType = data.durationType ?? data.duration_type ?? 'days';
    this.durationValue = data.durationValue ?? data.duration_value ?? null;
    this.reason = data.reason ?? null;
    this.revokedAt = data.revokedAt ?? data.revoked_at ?? null;
    this.revokedBy = normalizeId(data.revokedBy) ?? data.revoked_by ?? null;
    this.revokeReason = data.revokeReason ?? data.revoke_reason ?? null;
    this.isActive = data.isActive ?? data.is_active ?? true;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new UserPermissionOverride({
      id: row.id,
      userId: row.user_id,
      permissionKey: row.permission_key,
      isGranted: row.is_granted,
      grantedBy: row.granted_by,
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
      durationType: row.duration_type,
      durationValue: row.duration_value,
      reason: row.reason,
      revokedAt: row.revoked_at,
      revokedBy: row.revoked_by,
      revokeReason: row.revoke_reason,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static async findByUserId(userId, options = {}) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return [];

    let sql = 'SELECT * FROM user_permission_overrides WHERE user_id = $1';
    const params = [normalizedId];
    let index = 2;

    if (options.activeOnly) {
      sql += ` AND is_active = true AND (expires_at IS NULL OR expires_at > $${index})`;
      params.push(new Date());
      index++;
    }

    if (options.permissionKey) {
      sql += ` AND permission_key = $${index}`;
      params.push(options.permissionKey);
      index++;
    }

    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(UserPermissionOverride.fromRow);
  }

  static async findActiveByUserId(userId) {
    return UserPermissionOverride.findByUserId(userId, { activeOnly: true });
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT * FROM user_permission_overrides WHERE id = $1 LIMIT 1',
      [normalizedId]
    );
    return UserPermissionOverride.fromRow(rows[0]);
  }

  static async findExpired() {
    const { rows } = await query(
      `SELECT * FROM user_permission_overrides 
       WHERE is_active = true 
       AND expires_at IS NOT NULL 
       AND expires_at <= $1`,
      [new Date()]
    );
    return rows.map(UserPermissionOverride.fromRow);
  }

  static async findExpiringSoon(minutes = 10) {
    const now = new Date();
    const threshold = new Date(now.getTime() + minutes * 60000);
    
    const { rows } = await query(
      `SELECT * FROM user_permission_overrides 
       WHERE is_active = true 
       AND is_granted = true
       AND expires_at IS NOT NULL 
       AND expires_at > $1 
       AND expires_at <= $2`,
      [now, threshold]
    );
    return rows.map(UserPermissionOverride.fromRow);
  }

  async save() {
    const now = new Date();

    if (this.id) {
      const { rows } = await query(
        `UPDATE user_permission_overrides
         SET user_id = $1, permission_key = $2, granted_by = $3,
             duration_type = $4, quantity = $5, granted_at = $6,
             expires_at = $7, is_active = $8, is_granted = $9,
             reverted_at = $10, reverted_by = $11, updated_at = $12
         WHERE id = $13
         RETURNING *`,
        [
          this.userId, this.permissionKey, this.grantedBy,
          this.durationType, this.quantity, toDate(this.grantedAt),
          toDate(this.expiresAt), this.isActive, this.isGranted,
          toDate(this.revertedAt), this.revertedBy, now, this.id
        ]
      );
      Object.assign(this, UserPermissionOverride.fromRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO user_permission_overrides (
        user_id, permission_key, granted_by, duration_type, quantity,
        granted_at, expires_at, is_active, is_granted, reverted_at,
        reverted_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING *`,
      [
        this.userId, this.permissionKey, this.grantedBy,
        this.durationType, this.quantity, toDate(this.grantedAt) || now,
        toDate(this.expiresAt), this.isActive !== false, this.isGranted !== false,
        toDate(this.revertedAt), this.revertedBy, now
      ]
    );
    Object.assign(this, UserPermissionOverride.fromRow(rows[0]));
    return this;
  }

  async deactivate(revertedBy = null) {
    this.isActive = false;
    this.revertedAt = new Date();
    this.revertedBy = revertedBy;
    return this.save();
  }

  isExpired() {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }

  getRemainingTime() {
    if (!this.expiresAt || !this.isActive) return null;
    const remaining = new Date(this.expiresAt) - new Date();
    return remaining > 0 ? remaining : 0;
  }

  toJSON() {
    return {
      id: String(this.id),
      userId: String(this.userId),
      permissionKey: this.permissionKey,
      grantedBy: String(this.grantedBy),
      durationType: this.durationType,
      quantity: this.quantity,
      grantedAt: this.grantedAt,
      expiresAt: this.expiresAt,
      isActive: this.isActive,
      isGranted: this.isGranted,
      revertedAt: this.revertedAt,
      revertedBy: this.revertedBy ? String(this.revertedBy) : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isExpired: this.isExpired(),
      remainingTime: this.getRemainingTime()
    };
  }
}

module.exports = UserPermissionOverride;
