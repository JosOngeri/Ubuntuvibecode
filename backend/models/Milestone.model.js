const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new Milestone({
    id: row.id,
    quoteId: row.quote_id,
    contractorId: row.contractor_id,
    title: row.title,
    description: row.description,
    deliverables: row.deliverables,
    deadline: row.deadline,
    budget: row.budget === null ? null : Number(row.budget),
    materialsRequest: parseJson(row.materials_request, []),
    labourRequest: parseJson(row.labour_request, []),
    downpaymentRequest: row.downpayment_request === null ? null : Number(row.downpayment_request),
    downpaymentApproved: row.downpayment_approved,
    downpaymentPaid: row.downpayment_paid,
    progress: row.progress === null ? null : Number(row.progress),
    photos: parseJson(row.photos, []),
    receipts: parseJson(row.receipts, []),
    status: row.status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    kpiScore: parseJson(row.kpi_score, {}),
    paymentReleased: row.payment_released,
    paymentAmount: row.payment_amount === null ? null : Number(row.payment_amount),
    paymentDate: row.payment_date,
    dailyWageMode: row.daily_wage_mode,
    dailyWageDays: parseJson(row.daily_wage_days, []),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class Milestone {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.quoteId = data.quoteId ?? data.quote_id ?? null;
    this.contractorId = data.contractorId ?? data.contractor_id ?? null;
    this.title = data.title ?? null;
    this.description = data.description ?? null;
    this.deliverables = data.deliverables ?? null;
    this.deadline = data.deadline ?? null;
    this.budget = data.budget === null || data.budget === undefined ? null : Number(data.budget);
    this.materialsRequest = data.materialsRequest ?? data.materials_request ?? [];
    this.labourRequest = data.labourRequest ?? data.labour_request ?? [];
    this.downpaymentRequest = data.downpaymentRequest === null || data.downpaymentRequest === undefined ? null : Number(data.downpaymentRequest);
    this.downpaymentApproved = data.downpaymentApproved ?? data.downpayment_approved ?? false;
    this.downpaymentPaid = data.downpaymentPaid ?? data.downpayment_paid ?? false;
    this.progress = data.progress === null || data.progress === undefined ? 0 : Number(data.progress);
    this.photos = data.photos ?? [];
    this.receipts = data.receipts ?? [];
    this.status = data.status ?? 'pending';
    this.verifiedBy = data.verifiedBy ?? data.verified_by ?? null;
    this.verifiedAt = data.verifiedAt ?? data.verified_at ?? null;
    this.kpiScore = data.kpiScore ?? data.kpi_score ?? {};
    this.paymentReleased = data.paymentReleased ?? data.payment_released ?? false;
    this.paymentAmount = data.paymentAmount === null || data.paymentAmount === undefined ? null : Number(data.paymentAmount);
    this.paymentDate = data.paymentDate ?? data.payment_date ?? null;
    this.dailyWageMode = data.dailyWageMode ?? data.daily_wage_mode ?? false;
    this.dailyWageDays = data.dailyWageDays ?? data.daily_wage_days ?? [];
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT m.*, u.username as contractor_name FROM milestones m LEFT JOIN users u ON m.contractor_id = u.id';
    const params = [];
    const conditions = [];

    if (filter.quote_id) {
      conditions.push('m.quote_id = $' + (params.length + 1));
      params.push(filter.quote_id);
    }
    if (filter.contractor_id) {
      conditions.push('m.contractor_id = $' + (params.length + 1));
      params.push(filter.contractor_id);
    }
    if (filter.status) {
      conditions.push('m.status = $' + (params.length + 1));
      params.push(filter.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY m.created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT m.*, u.username as contractor_name FROM milestones m LEFT JOIN users u ON m.contractor_id = u.id WHERE m.id = $1 LIMIT 1',
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM milestones WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const milestone = await Milestone.findById(id);
    if (!milestone) return null;
    milestone.set(update);
    await milestone.save();
    return milestone;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedBudget = this.budget === null || this.budget === undefined ? null : Number(this.budget);
    const normalizedDownpaymentRequest = this.downpaymentRequest === null || this.downpaymentRequest === undefined ? null : Number(this.downpaymentRequest);
    const normalizedProgress = this.progress === null || this.progress === undefined ? 0 : Number(this.progress);
    const normalizedPaymentAmount = this.paymentAmount === null || this.paymentAmount === undefined ? null : Number(this.paymentAmount);
    const normalizedDeadline = this.deadline ? toDate(this.deadline) : null;
    const normalizedVerifiedAt = this.verifiedAt ? toDate(this.verifiedAt) : null;
    const normalizedPaymentDate = this.paymentDate ? toDate(this.paymentDate) : null;

    if (this.id) {
      const { rows } = await query(
        `UPDATE milestones
         SET quote_id = $1, contractor_id = $2, title = $3, description = $4, deliverables = $5,
             deadline = $6, budget = $7, materials_request = $8, labour_request = $9,
             downpayment_request = $10, downpayment_approved = $11, downpayment_paid = $12,
             progress = $13, photos = $14, receipts = $15, status = $16, verified_by = $17,
             verified_at = $18, kpi_score = $19, payment_released = $20, payment_amount = $21,
             payment_date = $22, daily_wage_mode = $23, daily_wage_days = $24, notes = $25, updated_at = $26
         WHERE id = $27 RETURNING *`,
        [
          this.quoteId,
          this.contractorId,
          this.title,
          this.description,
          this.deliverables,
          normalizedDeadline,
          normalizedBudget,
          toJsonb(this.materialsRequest),
          toJsonb(this.labourRequest),
          normalizedDownpaymentRequest,
          this.downpaymentApproved,
          this.downpaymentPaid,
          normalizedProgress,
          toJsonb(this.photos),
          toJsonb(this.receipts),
          this.status,
          this.verifiedBy,
          normalizedVerifiedAt,
          toJsonb(this.kpiScore),
          this.paymentReleased,
          normalizedPaymentAmount,
          normalizedPaymentDate,
          this.dailyWageMode,
          toJsonb(this.dailyWageDays),
          this.notes,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO milestones (quote_id, contractor_id, title, description, deliverables, deadline, budget, materials_request, labour_request, downpayment_request, downpayment_approved, downpayment_paid, progress, photos, receipts, status, verified_by, verified_at, kpi_score, payment_released, payment_amount, payment_date, daily_wage_mode, daily_wage_days, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27) RETURNING *`,
      [
        this.quoteId,
        this.contractorId,
        this.title,
        this.description,
        this.deliverables,
        normalizedDeadline,
        normalizedBudget,
        toJsonb(this.materialsRequest),
        toJsonb(this.labourRequest),
        normalizedDownpaymentRequest,
        this.downpaymentApproved,
        this.downpaymentPaid,
        normalizedProgress,
        toJsonb(this.photos),
        toJsonb(this.receipts),
        this.status,
        this.verifiedBy,
        normalizedVerifiedAt,
        toJsonb(this.kpiScore),
        this.paymentReleased,
        normalizedPaymentAmount,
        normalizedPaymentDate,
        this.dailyWageMode,
        toJsonb(this.dailyWageDays),
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
      quoteId: this.quoteId,
      contractorId: this.contractorId,
      title: this.title,
      description: this.description,
      deliverables: this.deliverables,
      deadline: this.deadline,
      budget: this.budget,
      materialsRequest: this.materialsRequest,
      labourRequest: this.labourRequest,
      downpaymentRequest: this.downpaymentRequest,
      downpaymentApproved: this.downpaymentApproved,
      downpaymentPaid: this.downpaymentPaid,
      progress: this.progress,
      photos: this.photos,
      receipts: this.receipts,
      status: this.status,
      verifiedBy: this.verifiedBy,
      verifiedAt: this.verifiedAt,
      kpiScore: this.kpiScore,
      paymentReleased: this.paymentReleased,
      paymentAmount: this.paymentAmount,
      paymentDate: this.paymentDate,
      dailyWageMode: this.dailyWageMode,
      dailyWageDays: this.dailyWageDays,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Milestone;
