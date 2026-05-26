const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new Payment({
    id: row.id,
    employee: row.employee_id,
    amount: row.amount === null ? null : Number(row.amount),
    date: row.date,
    transactionId: row.transaction_id,
    status: row.status,
    wageComponents: parseJson(row.wage_components, {}),
    notes: row.notes,
  });
};

class Payment {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.employee = data.employee ?? data.employee_id ?? null;
    this.amount = data.amount === null || data.amount === undefined ? null : Number(data.amount);
    this.date = data.date ?? null;
    this.transactionId = data.transactionId ?? data.transaction_id ?? null;
    this.status = data.status ?? 'pending';
    this.wageComponents = data.wageComponents ?? data.wage_components ?? {};
    this.notes = data.notes ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT p.*, e.first_name, e.last_name FROM payments p LEFT JOIN employees e ON p.employee_id = e.id';
    const params = [];
    const conditions = [];

    if (filter.employee_id) {
      conditions.push('p.employee_id = $' + (params.length + 1));
      params.push(filter.employee_id);
    }
    if (filter.status) {
      conditions.push('p.status = $' + (params.length + 1));
      params.push(filter.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY p.date DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query(
      'SELECT p.*, e.first_name, e.last_name FROM payments p LEFT JOIN employees e ON p.employee_id = e.id WHERE p.id = $1 LIMIT 1',
      [normalizedId]
    );
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM payments WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const payment = await Payment.findById(id);
    if (!payment) return null;
    payment.set(update);
    await payment.save();
    return payment;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedAmount = this.amount === null || this.amount === undefined ? null : Number(this.amount);
    const normalizedDate = this.date ? toDate(this.date) : now;

    if (this.id) {
      const { rows } = await query(
        `UPDATE payments
         SET employee_id = $1, amount = $2, date = $3, transaction_id = $4, status = $5,
             wage_components = $6, notes = $7
         WHERE id = $8 RETURNING *`,
        [
          this.employee,
          normalizedAmount,
          normalizedDate,
          this.transactionId,
          this.status,
          toJsonb(this.wageComponents),
          this.notes,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO payments (employee_id, amount, date, transaction_id, status, wage_components, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        this.employee,
        normalizedAmount,
        normalizedDate,
        this.transactionId,
        this.status,
        toJsonb(this.wageComponents),
        this.notes,
      ]
    );
    Object.assign(this, mapRow(rows[0]));
    return this;
  }

  toJSON() {
    return {
      _id: String(this.id),
      id: String(this.id),
      employee: this.employee,
      amount: this.amount,
      date: this.date,
      transactionId: this.transactionId,
      status: this.status,
      wageComponents: this.wageComponents,
      notes: this.notes,
    };
  }
}

module.exports = Payment;
