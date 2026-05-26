const { query } = require('../config/db');
const { normalizeId, toDate } = require('../utils/postgres');

class Notification {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.userId = normalizeId(data.userId) ?? data.user_id ?? null;
    this.type = data.type ?? null;
    this.title = data.title ?? null;
    this.message = data.message ?? null;
    this.entityType = data.entityType ?? data.entity_type ?? null;
    this.entityId = normalizeId(data.entityId) ?? data.entity_id ?? null;
    this.isRead = data.isRead ?? data.is_read ?? false;
    this.readAt = data.readAt ?? data.read_at ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Notification({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.entity_id,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static async findByUser(userId, options = {}) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return [];

    let sql = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [normalizedId];
    let index = 2;

    if (options.type) {
      sql += ` AND type = $${index++}`;
      params.push(options.type);
    }

    if (options.readStatus !== undefined) {
      sql += ` AND is_read = $${index++}`;
      params.push(options.readStatus);
    }

    if (options.unreadOnly) {
      sql += ' AND is_read = false';
    }

    sql += ' ORDER BY is_read ASC, created_at DESC';

    if (options.limit) {
      sql += ` LIMIT $${index++}`;
      params.push(parseInt(options.limit));
    }

    const { rows } = await query(sql, params);
    return rows.map(Notification.fromRow);
  }

  static async findUnread(userId) {
    return Notification.findByUser(userId, { unreadOnly: true });
  }

  static async countUnread(userId) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return 0;

    const { rows } = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [normalizedId]
    );
    return parseInt(rows[0].count);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT * FROM notifications WHERE id = $1 LIMIT 1',
      [normalizedId]
    );
    return Notification.fromRow(rows[0]);
  }

  async save() {
    const now = new Date();

    if (this.id) {
      const { rows } = await query(
        `UPDATE notifications
         SET user_id = $1, type = $2, title = $3, message = $4,
             entity_type = $5, entity_id = $6,
             is_read = $7, read_at = $8
         WHERE id = $9
         RETURNING *`,
        [
          this.userId, this.type, this.title, this.message,
          this.entityType, this.entityId,
          this.isRead, toDate(this.readAt), this.id
        ]
      );
      Object.assign(this, Notification.fromRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id,
        is_read, read_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        this.userId, this.type, this.title, this.message,
        this.entityType, this.entityId,
        this.isRead || false, toDate(this.readAt), now
      ]
    );
    Object.assign(this, Notification.fromRow(rows[0]));
    return this;
  }

  async markAsRead() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }

  static async markAllAsRead(userId) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return 0;

    const { rowCount } = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = $1 
       WHERE user_id = $2 AND is_read = false`,
      [new Date(), normalizedId]
    );
    return rowCount;
  }

  static async deleteOld(userId, days = 30) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { rowCount } = await query(
      `DELETE FROM notifications 
       WHERE user_id = $1 AND created_at < $2 AND is_read = true`,
      [normalizedId, cutoffDate]
    );
    return rowCount;
  }

  async delete() {
    if (!this.id) return;
    await query('DELETE FROM notifications WHERE id = $1', [this.id]);
  }

  toJSON() {
    return {
      id: String(this.id),
      userId: String(this.userId),
      type: this.type,
      title: this.title,
      message: this.message,
      entityType: this.entityType,
      entityId: this.entityId ? String(this.entityId) : null,
      link: this.link,
      isRead: this.isRead,
      readAt: this.readAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Notification;
