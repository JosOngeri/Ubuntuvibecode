const { query } = require('../config/db');
const { normalizeId } = require('../utils/postgres');

// Columns managed via migrations:
//   005_fix_onboarding_schema.sql
//   20240602000003_add_onboarding_columns.sql
//   20240602000012_create_onboarding_documents.sql

const mapRow = (row) => {
  if (!row) return null;
  return new Onboarding({
    id: row.id,
    employeeId: row.employee_id,
    applicationId: row.application_id,
    userId: row.user_id,
    department: row.department,
    position: row.position,
    supervisorId: row.supervisor_id,
    startDate: row.start_date,
    endDate: row.end_date,
    probationEndDate: row.probation_end_date,
    status: row.status,
    steps: row.steps ?? [],
    orientationChecklist: row.orientation_checklist ?? [],
    documents: row.documents ?? [],
    assetsAssigned: row.assets_assigned ?? [],
    probationReviews: row.probation_reviews ?? [],
    offerLetterGenerated: row.offer_letter_generated ?? false,
    offerLetterUrl: row.offer_letter_url,
    notes: row.notes,
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class Onboarding {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.employeeId = data.employeeId ?? data.employee_id ?? null;
    this.applicationId = data.applicationId ?? data.application_id ?? null;
    this.userId = data.userId ?? data.user_id ?? null;
    this.department = data.department ?? null;
    this.position = data.position ?? null;
    this.supervisorId = data.supervisorId ?? data.supervisor_id ?? null;
    this.startDate = data.startDate ?? data.start_date ?? null;
    this.endDate = data.endDate ?? data.end_date ?? null;
    this.probationEndDate = data.probationEndDate ?? data.probation_end_date ?? null;
    this.status = data.status ?? 'in_progress';
    this.steps = data.steps ?? [];
    this.orientationChecklist = data.orientationChecklist ?? data.orientation_checklist ?? [];
    this.documents = data.documents ?? [];
    this.assetsAssigned = data.assetsAssigned ?? data.assets_assigned ?? [];
    this.probationReviews = data.probationReviews ?? data.probation_reviews ?? [];
    this.offerLetterGenerated = data.offerLetterGenerated ?? data.offer_letter_generated ?? false;
    this.offerLetterUrl = data.offerLetterUrl ?? data.offer_letter_url ?? null;
    this.notes = data.notes ?? null;
    this.confirmedAt = data.confirmedAt ?? data.confirmed_at ?? null;
    this.confirmedBy = data.confirmedBy ?? data.confirmed_by ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  // --- Query helpers ---

  static async find(filter = {}) {
    let sql = `
      SELECT o.*, e.first_name, e.last_name, e.email AS employee_email
      FROM onboarding o
      LEFT JOIN employees e ON e.id = o.employee_id
    `;
    const params = [];
    const conditions = [];

    if (filter.status) {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(filter.status);
    }
    if (filter.employeeId) {
      conditions.push(`o.employee_id = $${params.length + 1}`);
      params.push(normalizeId(filter.employeeId));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY o.created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      `SELECT o.*, e.first_name, e.last_name, e.email AS employee_email
       FROM onboarding o
       LEFT JOIN employees e ON e.id = o.employee_id
       WHERE o.id = $1 LIMIT 1`,
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findOne(criteria = {}) {
    const results = await Onboarding.find(criteria);
    return results[0] ?? null;
  }

  static async findByEmployeeId(employeeId) {
    const normalizedId = normalizeId(employeeId);
    if (!normalizedId) return [];

    const { rows } = await query(
      'SELECT * FROM onboarding WHERE employee_id = $1 ORDER BY created_at DESC',
      [normalizedId]
    );
    return rows.map(mapRow);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const record = await Onboarding.findById(id);
    if (!record) return null;
    record.set(update);
    await record.save();
    return record;
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM onboarding WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();

    if (this.id) {
      const { rows } = await query(
        `UPDATE onboarding SET
           employee_id = $1,
           application_id = $2,
           user_id = $3,
           department = $4,
           position = $5,
           supervisor_id = $6,
           start_date = $7,
           end_date = $8,
           probation_end_date = $9,
           status = $10,
           steps = $11,
           orientation_checklist = $12,
           documents = $13,
           assets_assigned = $14,
           probation_reviews = $15,
           offer_letter_generated = $16,
           offer_letter_url = $17,
           notes = $18,
           confirmed_at = $19,
           confirmed_by = $20,
           updated_at = $21
         WHERE id = $22 RETURNING *`,
        [
          this.employeeId,
          this.applicationId,
          this.userId,
          this.department,
          this.position,
          this.supervisorId,
          this.startDate,
          this.endDate,
          this.probationEndDate,
          this.status,
          JSON.stringify(this.steps),
          JSON.stringify(this.orientationChecklist),
          JSON.stringify(this.documents),
          JSON.stringify(this.assetsAssigned),
          JSON.stringify(this.probationReviews),
          this.offerLetterGenerated,
          this.offerLetterUrl,
          this.notes,
          this.confirmedAt,
          this.confirmedBy,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO onboarding (
         employee_id, application_id, user_id, department, position, supervisor_id,
         start_date, end_date, probation_end_date, status, steps, orientation_checklist,
         documents, assets_assigned, probation_reviews, offer_letter_generated,
         offer_letter_url, notes, confirmed_at, confirmed_by, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16,
         $17, $18, $19, $20, $21, $21
       ) RETURNING *`,
      [
        this.employeeId,
        this.applicationId,
        this.userId,
        this.department,
        this.position,
        this.supervisorId,
        this.startDate,
        this.endDate,
        this.probationEndDate,
        this.status ?? 'in_progress',
        JSON.stringify(this.steps ?? []),
        JSON.stringify(this.orientationChecklist ?? []),
        JSON.stringify(this.documents ?? []),
        JSON.stringify(this.assetsAssigned ?? []),
        JSON.stringify(this.probationReviews ?? []),
        this.offerLetterGenerated ?? false,
        this.offerLetterUrl,
        this.notes,
        this.confirmedAt,
        this.confirmedBy,
        this.createdAt || now,
      ]
    );
    Object.assign(this, mapRow(rows[0]));
    return this;
  }

  // Keep backward-compat stub used at server startup
  static async init() {}

  toJSON() {
    return {
      _id: String(this.id),
      id: String(this.id),
      employeeId: this.employeeId,
      employee_id: this.employeeId,
      applicationId: this.applicationId,
      application_id: this.applicationId,
      userId: this.userId,
      user_id: this.userId,
      department: this.department,
      position: this.position,
      supervisorId: this.supervisorId,
      supervisor_id: this.supervisorId,
      startDate: this.startDate,
      start_date: this.startDate,
      endDate: this.endDate,
      end_date: this.endDate,
      probationEndDate: this.probationEndDate,
      probation_end_date: this.probationEndDate,
      status: this.status,
      steps: this.steps,
      orientationChecklist: this.orientationChecklist,
      orientation_checklist: this.orientationChecklist,
      documents: this.documents,
      assetsAssigned: this.assetsAssigned,
      assets_assigned: this.assetsAssigned,
      probationReviews: this.probationReviews,
      probation_reviews: this.probationReviews,
      offerLetterGenerated: this.offerLetterGenerated,
      offer_letter_generated: this.offerLetterGenerated,
      offerLetterUrl: this.offerLetterUrl,
      offer_letter_url: this.offerLetterUrl,
      notes: this.notes,
      confirmedAt: this.confirmedAt,
      confirmed_at: this.confirmedAt,
      confirmedBy: this.confirmedBy,
      confirmed_by: this.confirmedBy,
      createdAt: this.createdAt,
      created_at: this.createdAt,
      updatedAt: this.updatedAt,
      updated_at: this.updatedAt,
    };
  }
}

module.exports = Onboarding;
