const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate, parseJson } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) return null;
  return new DailyLabourer({
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    idNumber: row.id_number,
    photo: row.photo,
    skills: parseJson(row.skills, []),
    dailyRate: row.daily_rate === null ? null : Number(row.daily_rate),
    status: row.status,
    convertedToEmployeeId: row.converted_to_employee_id,
    registeredBy: row.registered_by,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class DailyLabourer {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.userId = data.userId ?? data.user_id ?? null;
    this.firstName = data.firstName ?? data.first_name ?? null;
    this.lastName = data.lastName ?? data.last_name ?? null;
    this.phone = data.phone ?? null;
    this.idNumber = data.idNumber ?? data.id_number ?? null;
    this.photo = data.photo ?? null;
    this.skills = data.skills ?? [];
    this.dailyRate = data.dailyRate === null || data.dailyRate === undefined ? 500 : Number(data.dailyRate);
    this.status = data.status ?? 'active';
    this.convertedToEmployeeId = data.convertedToEmployeeId ?? data.converted_to_employee_id ?? null;
    this.registeredBy = data.registeredBy ?? data.registered_by ?? null;
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(filter = {}) {
    let sql = 'SELECT * FROM daily_labourers';
    const params = [];
    const conditions = [];

    if (filter.status) {
      conditions.push('status = $' + (params.length + 1));
      params.push(filter.status);
    }
    if (filter.skills) {
      conditions.push('skills @> $' + (params.length + 1));
      params.push(JSON.stringify([filter.skills]));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('SELECT * FROM daily_labourers WHERE id = $1 LIMIT 1', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findOne(criteria = {}) {
    console.log('[DailyLabourer.findOne] criteria:', criteria);
    if (criteria.userId !== undefined) {
      const normalizedUserId = normalizeId(criteria.userId);
      console.log('[DailyLabourer.findOne] normalizedUserId:', normalizedUserId);
      if (!normalizedUserId) {
        console.log('[DailyLabourer.findOne] normalizedUserId is null - returning null');
        return null;
      }

      const { rows } = await query(
        'SELECT * FROM daily_labourers WHERE user_id = $1 LIMIT 1',
        [normalizedUserId]
      );
      console.log('[DailyLabourer.findOne] query result rows:', rows);
      const result = mapRow(rows[0]);
      console.log('[DailyLabourer.findOne] mapped result:', result);
      return result;
    }

    console.log('[DailyLabourer.findOne] No userId in criteria - returning null');
    return null;
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;

    const { rows } = await query('DELETE FROM daily_labourers WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const labourer = await DailyLabourer.findById(id);
    if (!labourer) return null;
    labourer.set(update);
    await labourer.save();
    return labourer;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedDailyRate = this.dailyRate === null || this.dailyRate === undefined ? 500 : Number(this.dailyRate);

    if (this.id) {
      const { rows } = await query(
        `UPDATE daily_labourers
         SET user_id = $1, first_name = $2, last_name = $3, phone = $4, id_number = $5, photo = $6,
             skills = $7, daily_rate = $8, status = $9, converted_to_employee_id = $10,
             registered_by = $11, notes = $12, updated_at = $13
         WHERE id = $14 RETURNING *`,
        [
          this.userId,
          this.firstName,
          this.lastName,
          this.phone,
          this.idNumber,
          this.photo,
          toJsonb(this.skills),
          normalizedDailyRate,
          this.status,
          this.convertedToEmployeeId,
          this.registeredBy,
          this.notes,
          now,
          this.id,
        ]
      );
      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `INSERT INTO daily_labourers (user_id, first_name, last_name, phone, id_number, photo, skills, daily_rate, status, converted_to_employee_id, registered_by, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        this.userId,
        this.firstName,
        this.lastName,
        this.phone,
        this.idNumber,
        this.photo,
        toJsonb(this.skills),
        normalizedDailyRate,
        this.status,
        this.convertedToEmployeeId,
        this.registeredBy,
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
      userId: this.userId,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      idNumber: this.idNumber,
      photo: this.photo,
      skills: this.skills,
      dailyRate: this.dailyRate,
      status: this.status,
      convertedToEmployeeId: this.convertedToEmployeeId,
      registeredBy: this.registeredBy,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = DailyLabourer;
