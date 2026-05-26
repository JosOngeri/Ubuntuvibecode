const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new ContractorQuote({
    id: row.id,
    contractorId: row.contractor_id,
    projectTitle: row.project_title,
    description: row.description,
    amount: row.amount === null ? null : Number(row.amount),
    timeline: row.timeline,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    isDailyWage: row.is_daily_wage,
    dailyRate: row.daily_rate === null ? null : Number(row.daily_rate),
    estimatedDays: row.estimated_days === null ? null : Number(row.estimated_days),
    attachments: parseJson(row.attachments, []),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class ContractorQuote {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.contractorId = data.contractorId ?? data.contractor_id ?? null;
    this.projectTitle = data.projectTitle ?? data.project_title ?? null;
    this.description = data.description ?? null;
    this.amount = data.amount === null || data.amount === undefined ? null : Number(data.amount);
    this.timeline = data.timeline ?? null;
    this.status = data.status ?? 'pending';
    this.approvedBy = data.approvedBy ?? data.approved_by ?? null;
    this.approvedAt = data.approvedAt ?? data.approved_at ?? null;
    this.rejectionReason = data.rejectionReason ?? data.rejection_reason ?? null;
    this.isDailyWage = data.isDailyWage ?? data.is_daily_wage ?? false;
    this.dailyRate = data.dailyRate === null || data.dailyRate === undefined ? null : Number(data.dailyRate);
    this.estimatedDays = data.estimatedDays === null || data.estimatedDays === undefined ? null : Number(data.estimatedDays);
    this.attachments = data.attachments ?? [];
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT cq.*, u.username as contractor_name FROM contractor_quotes cq LEFT JOIN users u ON cq.contractor_id = u.id';
    const params = [];
    const conditions = [];

    if (filter.contractor_id) {
      conditions.push('cq.contractor_id = $' + (params.length + 1));
      params.push(filter.contractor_id);
    }
    if (filter.status) {
      conditions.push('cq.status = $' + (params.length + 1));
      params.push(filter.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY cq.created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT cq.*, u.username as contractor_name FROM contractor_quotes cq LEFT JOIN users u ON cq.contractor_id = u.id WHERE cq.id = $1 LIMIT 1',
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM contractor_quotes WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const quote = await ContractorQuote.findById(id);
    if (!quote) return null;
    quote.set(update);
    await quote.save();
    return quote;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedAmount = this.amount === null || this.amount === undefined ? null : Number(this.amount);
    const normalizedDailyRate = this.dailyRate === null || this.dailyRate === undefined ? null : Number(this.dailyRate);
    const normalizedEstimatedDays = this.estimatedDays === null || this.estimatedDays === undefined ? null : Number(this.estimatedDays);
    const normalizedApprovedAt = this.approvedAt ? toDate(this.approvedAt) : null;

    if (this.id) {
      const { rows } = await query(
        `UPDATE contractor_quotes
         SET contractor_id = $1, project_title = $2, description = $3, amount = $4, timeline = $5,
             status = $6, approved_by = $7, approved_at = $8, rejection_reason = $9,
             is_daily_wage = $10, daily_rate = $11, estimated_days = $12, attachments = $13, notes = $14, updated_at = $15
         WHERE id = $16 RETURNING *`,
        [
          this.contractorId,
          this.projectTitle,
          this.description,
          normalizedAmount,
          this.timeline,
          this.status,
          this.approvedBy,
          normalizedApprovedAt,
          this.rejectionReason,
          this.isDailyWage,
          normalizedDailyRate,
          normalizedEstimatedDays,
          toJsonb(this.attachments),
          this.notes,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO contractor_quotes (contractor_id, project_title, description, amount, timeline, status, approved_by, approved_at, rejection_reason, is_daily_wage, daily_rate, estimated_days, attachments, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        this.contractorId,
        this.projectTitle,
        this.description,
        normalizedAmount,
        this.timeline,
        this.status,
        this.approvedBy,
        normalizedApprovedAt,
        this.rejectionReason,
        this.isDailyWage,
        normalizedDailyRate,
        normalizedEstimatedDays,
        toJsonb(this.attachments),
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
      contractorId: this.contractorId,
      projectTitle: this.projectTitle,
      description: this.description,
      amount: this.amount,
      timeline: this.timeline,
      status: this.status,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      rejectionReason: this.rejectionReason,
      isDailyWage: this.isDailyWage,
      dailyRate: this.dailyRate,
      estimatedDays: this.estimatedDays,
      attachments: this.attachments,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = ContractorQuote;
