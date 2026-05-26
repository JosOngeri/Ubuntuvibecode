const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  userId: r.user_id,
  surname: r.surname,
  firstName: r.first_name,
  phone: r.phone,
  nationalId: r.national_id,
  photoUrl: r.photo_url,
  skillSet: r.skill_set,
  dailyRate: parseFloat(r.daily_rate),
  status: r.status,
  department: r.department,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapAttendanceRow = (r) => ({
  id: r.id,
  labourerId: r.labourer_id,
  attendanceDate: r.attendance_date,
  checkIn: r.check_in,
  checkOut: r.check_out,
  assignedTo: r.assigned_to,
  assignedType: r.assigned_type,
  wageForDay: r.wage_for_day ? parseFloat(r.wage_for_day) : null,
  isPaid: r.is_paid,
  isUrgent: r.is_urgent,
  status: r.status,
  recordedBy: r.recorded_by,
  createdAt: r.created_at,
});

const findAll = async ({ status, department, page = 1, limit = 50 } = {}) => {
  let q = `SELECT * FROM daily_labourers WHERE 1=1`;
  const params = [];
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  if (department) { params.push(department); q += ` AND department = $${params.length}`; }
  q += ` ORDER BY surname, first_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM daily_labourers WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const findByUserId = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM daily_labourers WHERE user_id = $1', [userId]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO daily_labourers (user_id, surname, first_name, phone, national_id, photo_url, skill_set, daily_rate, status, department)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.userId || null, data.surname, data.firstName, data.phone, data.nationalId || null, data.photoUrl || null,
     data.skillSet ? JSON.stringify(data.skillSet) : '[]', data.dailyRate || 600, data.status || 'active', data.department || null]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['surname','first_name','phone','national_id','photo_url','skill_set','daily_rate','status','department','user_id'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' && data[f] !== null ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE daily_labourers SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

const findAllAttendance = async ({ labourerId, isPaid, isUrgent, from, to, page = 1, limit = 50 } = {}) => {
  let q = `SELECT da.*, CONCAT(dl.first_name,' ',dl.surname) as labourer_name
           FROM daily_attendance da JOIN daily_labourers dl ON dl.id = da.labourer_id WHERE 1=1`;
  const params = [];
  if (labourerId) { params.push(labourerId); q += ` AND da.labourer_id = $${params.length}`; }
  if (isPaid !== undefined) { params.push(isPaid); q += ` AND da.is_paid = $${params.length}`; }
  if (isUrgent !== undefined) { params.push(isUrgent); q += ` AND da.is_urgent = $${params.length}`; }
  if (from) { params.push(from); q += ` AND da.attendance_date >= $${params.length}`; }
  if (to) { params.push(to); q += ` AND da.attendance_date <= $${params.length}`; }
  q += ` ORDER BY da.attendance_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapAttendanceRow);
};

const createAttendance = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO daily_attendance (labourer_id, attendance_date, check_in, check_out, assigned_to, assigned_type, wage_for_day, is_urgent, status, recorded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.labourerId, data.attendanceDate || new Date().toISOString().split('T')[0], data.checkIn || null, data.checkOut || null,
     data.assignedTo || null, data.assignedType || null, data.wageForDay || null, data.isUrgent || false, data.status || 'present', data.recordedBy || null]
  );
  return mapAttendanceRow(rows[0]);
};

const updateAttendance = async (id, data) => {
  const allowed = ['check_in','check_out','assigned_to','assigned_type','wage_for_day','is_paid','is_urgent','status'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) { params.push(data[f]); updates.push(`${f} = $${params.length}`); }
  }
  if (!updates.length) return null;
  const { rows } = await pool.query(`UPDATE daily_attendance SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapAttendanceRow(rows[0]) : null;
};

module.exports = { findAll, findById, findByUserId, create, update, findAllAttendance, createAttendance, updateAttendance };
