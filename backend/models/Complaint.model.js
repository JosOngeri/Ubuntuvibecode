const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new Complaint({
    id: row.id,
    type: row.type,
    category: row.category,
    subCategory: row.sub_category,
    description: row.description,
    urgency: row.urgency,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedOnBehalfOf: row.submitted_on_behalf_of,
    guestName: row.guest_name,
    guestContact: row.guest_contact,
    guestRoom: row.guest_room,
    respondentId: row.respondent_id,
    assignedTo: row.assigned_to,
    department: row.department,
    timeline: parseJson(row.timeline, []),
    resolution: row.resolution,
    resolutionDate: row.resolution_date,
    complainantConfirmed: row.complainant_confirmed,
    slaDeadline: row.sla_deadline,
    attachments: parseJson(row.attachments, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class Complaint {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.type = data.type ?? null;
    this.category = data.category ?? null;
    this.subCategory = data.subCategory ?? data.sub_category ?? null;
    this.description = data.description ?? null;
    this.urgency = data.urgency ?? 'medium';
    this.status = data.status ?? 'open';
    this.submittedBy = data.submittedBy ?? data.submitted_by ?? null;
    this.submittedOnBehalfOf = data.submittedOnBehalfOf ?? data.submitted_on_behalf_of ?? null;
    this.guestName = data.guestName ?? data.guest_name ?? null;
    this.guestContact = data.guestContact ?? data.guest_contact ?? null;
    this.guestRoom = data.guestRoom ?? data.guest_room ?? null;
    this.respondentId = data.respondentId ?? data.respondent_id ?? null;
    this.assignedTo = data.assignedTo ?? data.assigned_to ?? null;
    this.department = data.department ?? null;
    this.timeline = data.timeline ?? [];
    this.resolution = data.resolution ?? null;
    this.resolutionDate = data.resolutionDate ?? data.resolution_date ?? null;
    this.complainantConfirmed = data.complainantConfirmed ?? data.complainant_confirmed ?? false;
    this.slaDeadline = data.slaDeadline ?? data.sla_deadline ?? null;
    this.attachments = data.attachments ?? [];
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT c.*, u.username as submitted_by_name, e.first_name, e.last_name FROM complaints c LEFT JOIN users u ON c.submitted_by = u.id LEFT JOIN employees e ON c.respondent_id = e.id';
    const params = [];
    const conditions = [];

    if (filter.type) {
      conditions.push('c.type = $' + (params.length + 1));
      params.push(filter.type);
    }
    if (filter.status) {
      conditions.push('c.status = $' + (params.length + 1));
      params.push(filter.status);
    }
    if (filter.assignedTo) {
      conditions.push('c.assigned_to = $' + (params.length + 1));
      params.push(filter.assignedTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY c.created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT c.*, u.username as submitted_by_name, e.first_name, e.last_name FROM complaints c LEFT JOIN users u ON c.submitted_by = u.id LEFT JOIN employees e ON c.respondent_id = e.id WHERE c.id = $1 LIMIT 1',
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM complaints WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const complaint = await Complaint.findById(id);
    if (!complaint) return null;
    complaint.set(update);
    await complaint.save();
    return complaint;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedResolutionDate = this.resolutionDate ? toDate(this.resolutionDate) : null;
    const normalizedSlaDeadline = this.slaDeadline ? toDate(this.slaDeadline) : null;

    if (this.id) {
      const { rows } = await query(
        `UPDATE complaints
         SET type = $1, category = $2, sub_category = $3, description = $4, urgency = $5,
             status = $6, submitted_by = $7, submitted_on_behalf_of = $8, guest_name = $9,
             guest_contact = $10, guest_room = $11, respondent_id = $12, assigned_to = $13,
             department = $14, timeline = $15, resolution = $16, resolution_date = $17,
             complainant_confirmed = $18, sla_deadline = $19, attachments = $20, updated_at = $21
         WHERE id = $22 RETURNING *`,
        [
          this.type,
          this.category,
          this.subCategory,
          this.description,
          this.urgency,
          this.status,
          this.submittedBy,
          this.submittedOnBehalfOf,
          this.guestName,
          this.guestContact,
          this.guestRoom,
          this.respondentId,
          this.assignedTo,
          this.department,
          toJsonb(this.timeline),
          this.resolution,
          normalizedResolutionDate,
          this.complainantConfirmed,
          normalizedSlaDeadline,
          toJsonb(this.attachments),
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO complaints (type, category, sub_category, description, urgency, status, submitted_by, submitted_on_behalf_of, guest_name, guest_contact, guest_room, respondent_id, assigned_to, department, timeline, resolution, resolution_date, complainant_confirmed, sla_deadline, attachments, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
      [
        this.type,
        this.category,
        this.subCategory,
        this.description,
        this.urgency,
        this.status,
        this.submittedBy,
        this.submittedOnBehalfOf,
        this.guestName,
        this.guestContact,
        this.guestRoom,
        this.respondentId,
        this.assignedTo,
        this.department,
        toJsonb(this.timeline),
        this.resolution,
        normalizedResolutionDate,
        this.complainantConfirmed,
        normalizedSlaDeadline,
        toJsonb(this.attachments),
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
      type: this.type,
      category: this.category,
      subCategory: this.subCategory,
      description: this.description,
      urgency: this.urgency,
      status: this.status,
      submittedBy: this.submittedBy,
      submittedOnBehalfOf: this.submittedOnBehalfOf,
      guestName: this.guestName,
      guestContact: this.guestContact,
      guestRoom: this.guestRoom,
      respondentId: this.respondentId,
      assignedTo: this.assignedTo,
      department: this.department,
      timeline: this.timeline,
      resolution: this.resolution,
      resolutionDate: this.resolutionDate,
      complainantConfirmed: this.complainantConfirmed,
      slaDeadline: this.slaDeadline,
      attachments: this.attachments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Complaint;
