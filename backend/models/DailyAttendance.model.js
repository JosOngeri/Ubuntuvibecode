const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new DailyAttendance({
    id: row.id,
    labourerId: row.labourer_id,
    date: row.date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    assignedTo: row.assigned_to,
    assignedContractorId: row.assigned_contractor_id,
    assignedMilestoneId: row.assigned_milestone_id,
    wageForDay: row.wage_for_day === null ? null : Number(row.wage_for_day),
    recordedBy: row.recorded_by,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class DailyAttendance {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.labourerId = data.labourerId ?? data.labourer_id ?? null;
    this.date = data.date ?? null;
    this.checkIn = data.checkIn ?? data.check_in ?? null;
    this.checkOut = data.checkOut ?? data.check_out ?? null;
    this.status = data.status ?? 'present';
    this.assignedTo = data.assignedTo ?? data.assigned_to ?? 'other';
    this.assignedContractorId = data.assignedContractorId ?? data.assigned_contractor_id ?? null;
    this.assignedMilestoneId = data.assignedMilestoneId ?? data.assigned_milestone_id ?? null;
    this.wageForDay = data.wageForDay === null || data.wageForDay === undefined ? null : Number(data.wageForDay);
    this.recordedBy = data.recordedBy ?? data.recorded_by ?? null;
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT * FROM daily_attendance';
    const params = [];
    const conditions = [];

    if (filter.labourer_id) {
      conditions.push('labourer_id = $' + (params.length + 1));
      params.push(filter.labourer_id);
    }
    if (filter.date) {
      conditions.push('date = $' + (params.length + 1));
      params.push(filter.date);
    }
    if (filter.assigned_to) {
      conditions.push('assigned_to = $' + (params.length + 1));
      params.push(filter.assigned_to);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY date DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('SELECT * FROM daily_attendance WHERE id = $1 LIMIT 1', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM daily_attendance WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const attendance = await DailyAttendance.findById(id);
    if (!attendance) return null;
    attendance.set(update);
    await attendance.save();
    return attendance;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedDate = this.date ? toDate(this.date) : now;
    const normalizedCheckIn = this.checkIn ? toDate(this.checkIn) : null;
    const normalizedCheckOut = this.checkOut ? toDate(this.checkOut) : null;
    const normalizedWageForDay = this.wageForDay === null || this.wageForDay === undefined ? null : Number(this.wageForDay);

    if (this.id) {
      const { rows } = await query(
        `UPDATE daily_attendance
         SET labourer_id = $1, date = $2, check_in = $3, check_out = $4, status = $5,
             assigned_to = $6, assigned_contractor_id = $7, assigned_milestone_id = $8,
             wage_for_day = $9, recorded_by = $10, notes = $11, updated_at = $12
         WHERE id = $13 RETURNING *`,
        [
          this.labourerId,
          normalizedDate,
          normalizedCheckIn,
          normalizedCheckOut,
          this.status,
          this.assignedTo,
          this.assignedContractorId,
          this.assignedMilestoneId,
          normalizedWageForDay,
          this.recordedBy,
          this.notes,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO daily_attendance (labourer_id, date, check_in, check_out, status, assigned_to, assigned_contractor_id, assigned_milestone_id, wage_for_day, recorded_by, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        this.labourerId,
        normalizedDate,
        normalizedCheckIn,
        normalizedCheckOut,
        this.status,
        this.assignedTo,
        this.assignedContractorId,
        this.assignedMilestoneId,
        normalizedWageForDay,
        this.recordedBy,
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
      labourerId: this.labourerId,
      date: this.date,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      status: this.status,
      assignedTo: this.assignedTo,
      assignedContractorId: this.assignedContractorId,
      assignedMilestoneId: this.assignedMilestoneId,
      wageForDay: this.wageForDay,
      recordedBy: this.recordedBy,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = DailyAttendance;
