const { query } = require('../config/db');
const { normalizeId, toDate } = require('../utils/postgres');

class Message {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.senderId = normalizeId(data.senderId) ?? data.sender_id ?? null;
    this.recipientId = normalizeId(data.recipientId) ?? data.recipient_id ?? null;
    this.subject = data.subject ?? null;
    this.content = data.content ?? null;
    this.messageType = data.messageType ?? data.message_type ?? 'general';
    this.parentId = normalizeId(data.parentId) ?? data.parent_id ?? null;
    this.isRead = data.isRead ?? data.is_read ?? false;
    this.readAt = data.readAt ?? data.read_at ?? null;
    this.isResolved = data.isResolved ?? data.is_resolved ?? false;
    this.resolvedAt = data.resolvedAt ?? data.resolved_at ?? null;
    this.resolvedBy = normalizeId(data.resolvedBy) ?? data.resolved_by ?? null;
    this.resolutionNotes = data.resolutionNotes ?? data.resolution_notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Message({
      id: row.id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      subject: row.subject,
      content: row.content,
      messageType: row.message_type,
      parentId: row.parent_id,
      isRead: row.is_read,
      readAt: row.read_at,
      isResolved: row.is_resolved,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by,
      resolutionNotes: row.resolution_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT * FROM messages WHERE id = $1 LIMIT 1',
      [normalizedId]
    );
    return Message.fromRow(rows[0]);
  }

  static async findByRecipient(recipientId, options = {}) {
    const normalizedId = normalizeId(recipientId);
    if (!normalizedId) return [];

    let sql = 'SELECT * FROM messages WHERE recipient_id = $1';
    const params = [normalizedId];
    let index = 2;

    if (options.type) {
      sql += ` AND type = $${index++}`;
      params.push(options.type);
    }

    if (options.unreadOnly) {
      sql += ' AND is_read = false';
    }

    if (options.isResolved !== undefined) {
      sql += ` AND is_resolved = $${index++}`;
      params.push(options.isResolved);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ` LIMIT $${index++}`;
      params.push(parseInt(options.limit));
    }

    const { rows } = await query(sql, params);
    return rows.map(Message.fromRow);
  }

  static async findBySender(senderId, options = {}) {
    const normalizedId = normalizeId(senderId);
    if (!normalizedId) return [];

    let sql = 'SELECT * FROM messages WHERE sender_id = $1';
    const params = [normalizedId];
    let index = 2;

    if (options.type) {
      sql += ` AND type = $${index++}`;
      params.push(options.type);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ` LIMIT $${index++}`;
      params.push(parseInt(options.limit));
    }

    const { rows } = await query(sql, params);
    return rows.map(Message.fromRow);
  }

  static async findConversations(userId, options = {}) {
    const normalizedId = normalizeId(userId);
    if (!normalizedId) return [];

    const { rows } = await query(
      `SELECT DISTINCT ON (conversation_id)
        m.*,
        CASE 
          WHEN m.sender_id = $1 THEN m.recipient_id 
          ELSE m.sender_id 
        END as other_party_id,
        CASE 
          WHEN m.sender_id = $1 THEN m.recipient_name 
          ELSE m.sender_name 
        END as other_party_name
      FROM messages m
      WHERE (m.sender_id = $1 OR m.recipient_id = $1)
      AND m.parent_id IS NULL
      ORDER BY conversation_id, m.created_at DESC`,
      [normalizedId]
    );
    return rows.map(row => ({
      ...Message.fromRow(row),
      otherPartyId: row.other_party_id,
      otherPartyName: row.other_party_name
    }));
  }

  static async findConversationMessages(conversationId, options = {}) {
    const normalizedId = normalizeId(conversationId);
    if (!normalizedId) return [];

    let sql = 'SELECT * FROM messages WHERE conversation_id = $1';
    const params = [normalizedId];
    let index = 2;

    sql += ' ORDER BY created_at ASC';

    if (options.limit) {
      sql += ` LIMIT $${index++}`;
      params.push(parseInt(options.limit));
    }

    const { rows } = await query(sql, params);
    return rows.map(Message.fromRow);
  }

  static async findComplaints(options = {}) {
    let sql = `SELECT * FROM messages WHERE type = 'complaint'`;
    const params = [];
    let index = 1;

    if (options.resolved !== undefined) {
      sql += ` AND is_resolved = $${index++}`;
      params.push(options.resolved);
    }

    if (options.recipientId) {
      sql += ` AND recipient_id = $${index++}`;
      params.push(normalizeId(options.recipientId));
    }

    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(Message.fromRow);
  }

  async save() {
    const now = new Date();

    if (this.id) {
      const { rows } = await query(
        `UPDATE messages
         SET sender_id = $1, sender_name = $2, recipient_id = $3, recipient_name = $4,
             subject = $5, content = $6, type = $7, tags = $8, is_read = $9,
             read_at = $10, parent_id = $11, conversation_id = $12, attachments = $13,
             is_resolved = $14, resolved_by = $15, resolved_at = $16,
             resolution_notes = $17, updated_at = $18
         WHERE id = $19
         RETURNING *`,
        [
          this.senderId, this.senderName, this.recipientId, this.recipientName,
          this.subject, this.content, this.type, this.tags, this.isRead,
          toDate(this.readAt), this.parentId, this.conversationId, this.attachments,
          this.isResolved, this.resolvedBy, toDate(this.resolvedAt),
          this.resolutionNotes, now, this.id
        ]
      );
      Object.assign(this, Message.fromRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO messages (
        sender_id, sender_name, recipient_id, recipient_name, subject,
        content, type, tags, is_read, read_at, parent_id, conversation_id,
        attachments, is_resolved, resolved_by, resolved_at, resolution_notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18)
      RETURNING *`,
      [
        this.senderId, this.senderName, this.recipientId, this.recipientName,
        this.subject, this.content, this.type, this.tags, this.isRead || false,
        toDate(this.readAt), this.parentId, this.conversationId, this.attachments,
        this.isResolved || false, this.resolvedBy, toDate(this.resolvedAt),
        this.resolutionNotes, now
      ]
    );
    Object.assign(this, Message.fromRow(rows[0]));
    return this;
  }

  async markAsRead() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }

  async resolve(resolvedBy, notes = '') {
    this.isResolved = true;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.resolutionNotes = notes;
    return this.save();
  }

  toJSON() {
    return {
      id: String(this.id),
      senderId: String(this.senderId),
      senderName: this.senderName,
      recipientId: this.recipientId ? String(this.recipientId) : null,
      recipientName: this.recipientName,
      subject: this.subject,
      content: this.content,
      type: this.type,
      tags: this.tags,
      isRead: this.isRead,
      readAt: this.readAt,
      parentId: this.parentId ? String(this.parentId) : null,
      conversationId: this.conversationId ? String(this.conversationId) : null,
      attachments: this.attachments,
      isResolved: this.isResolved,
      resolvedBy: this.resolvedBy ? String(this.resolvedBy) : null,
      resolvedAt: this.resolvedAt,
      resolutionNotes: this.resolutionNotes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Message;
