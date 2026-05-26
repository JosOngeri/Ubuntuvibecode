const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate } = require('../utils/postgres');

const mapRow = (row) => {
  if (!row) return null;
  return new EmployeeDocument({
    id: row.id,
    employeeId: row.employee_id,
    docType: row.doc_type,
    docName: row.doc_name,
    filename: row.filename,
    url: row.url,
    expiryDate: row.expiry_date,
    uploadedAt: row.uploaded_at,
    notes: row.notes,
    verified: row.verified,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class EmployeeDocument {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.employeeId = data.employeeId ?? data.employee_id ?? null;
    this.docType = data.docType ?? data.doc_type ?? 'national_id';
    this.docName = data.docName ?? data.doc_name ?? null;
    this.filename = data.filename ?? null;
    this.url = data.url ?? null;
    this.expiryDate = data.expiryDate ?? data.expiry_date ?? null;
    this.uploadedAt = data.uploadedAt ?? data.uploaded_at ?? null;
    this.notes = data.notes ?? null;
    this.verified = data.verified ?? false;
    this.verifiedBy = data.verifiedBy ?? data.verified_by ?? null;
    this.verifiedAt = data.verifiedAt ?? data.verified_at ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT d.*, e.first_name, e.last_name, e.department FROM employee_documents d LEFT JOIN employees e ON d.employee_id = e.id';
    const params = [];
    const conditions = [];

    if (filter.employee_id) {
      conditions.push('d.employee_id = $' + (params.length + 1));
      params.push(filter.employee_id);
    }
    if (filter.doc_type) {
      conditions.push('d.doc_type = $' + (params.length + 1));
      params.push(filter.doc_type);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY d.created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT d.*, e.first_name, e.last_name, e.department FROM employee_documents d LEFT JOIN employees e ON d.employee_id = e.id WHERE d.id = $1 LIMIT 1',
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM employee_documents WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const doc = await EmployeeDocument.findById(id);
    if (!doc) return null;
    doc.set(update);
    await doc.save();
    return doc;
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) FROM employee_documents';
    const params = [];
    const conditions = [];

    if (filter.verified !== undefined) {
      conditions.push('verified = $' + (params.length + 1));
      params.push(filter.verified);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count);
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedExpiryDate = this.expiryDate ? toDate(this.expiryDate) : null;
    const normalizedUploadedAt = this.uploadedAt ? toDate(this.uploadedAt) : now;
    const normalizedVerifiedAt = this.verifiedAt ? toDate(this.verifiedAt) : null;

    if (this.id) {
      const { rows } = await query(
        `UPDATE employee_documents
         SET employee_id = $1, doc_type = $2, doc_name = $3, filename = $4, url = $5,
             expiry_date = $6, uploaded_at = $7, notes = $8, verified = $9,
             verified_by = $10, verified_at = $11, updated_at = $12
         WHERE id = $13 RETURNING *`,
        [
          this.employeeId,
          this.docType,
          this.docName,
          this.filename,
          this.url,
          normalizedExpiryDate,
          normalizedUploadedAt,
          this.notes,
          this.verified,
          this.verifiedBy,
          normalizedVerifiedAt,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO employee_documents (employee_id, doc_type, doc_name, filename, url, expiry_date, uploaded_at, notes, verified, verified_by, verified_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        this.employeeId,
        this.docType,
        this.docName,
        this.filename,
        this.url,
        normalizedExpiryDate,
        normalizedUploadedAt,
        this.notes,
        this.verified,
        this.verifiedBy,
        normalizedVerifiedAt,
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
      employee_id: this.employeeId,
      employeeId: this.employeeId,
      doc_type: this.docType,
      docType: this.docType,
      doc_name: this.docName,
      docName: this.docName,
      filename: this.filename,
      url: this.url,
      expiry_date: this.expiryDate,
      expiryDate: this.expiryDate,
      uploaded_at: this.uploadedAt,
      uploadedAt: this.uploadedAt,
      notes: this.notes,
      verified: this.verified,
      verified_by: this.verifiedBy,
      verifiedBy: this.verifiedBy,
      verified_at: this.verifiedAt,
      verifiedAt: this.verifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = EmployeeDocument;
