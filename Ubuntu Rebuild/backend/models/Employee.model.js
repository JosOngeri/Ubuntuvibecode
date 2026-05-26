const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  userId: r.user_id,
  status: r.status,
  surname: r.surname,
  firstName: r.first_name,
  otherNames: r.other_names,
  fullName: `${r.first_name} ${r.surname}`,
  email: r.email,
  phone: r.phone,
  biometricDeviceId: r.biometric_device_id,
  mpesaPhoneNumber: r.mpesa_phone_number,
  employmentType: r.employment_type,
  wageRate: parseFloat(r.wage_rate),
  department: r.department,
  dateJoined: r.date_joined,
  dateOfBirth: r.date_of_birth,
  gender: r.gender,
  maritalStatus: r.marital_status,
  nationality: r.nationality,
  nationalId: r.national_id,
  residentialAddress: r.residential_address,
  emergencyContact: r.emergency_contact,
  educationHistory: r.education_history,
  employmentHistory: r.employment_history,
  skills: r.skills,
  certifications: r.certifications,
  bankAccountNumber: r.bank_account_number,
  bankCode: r.bank_code,
  paymentMethod: r.payment_method,
  canSelfRecordAttendance: r.can_self_record_attendance,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const findByUserId = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM employees WHERE user_id = $1', [userId]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const findAll = async ({ page = 1, limit = 100, department, status, employmentType, search } = {}) => {
  let q = `SELECT e.*, u.username, u.email as user_email FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE 1=1`;
  const params = [];
  if (department) { params.push(department); q += ` AND e.department = $${params.length}`; }
  if (status) { params.push(status); q += ` AND e.status = $${params.length}`; }
  if (employmentType) { params.push(employmentType); q += ` AND e.employment_type = $${params.length}`; }
  if (search) {
    params.push(`%${search}%`);
    q += ` AND (e.first_name ILIKE $${params.length} OR e.surname ILIKE $${params.length} OR e.phone ILIKE $${params.length} OR e.email ILIKE $${params.length})`;
  }
  q += ` ORDER BY e.surname, e.first_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const count = async ({ department, status, employmentType } = {}) => {
  let q = `SELECT COUNT(*) FROM employees WHERE 1=1`;
  const params = [];
  if (department) { params.push(department); q += ` AND department = $${params.length}`; }
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  if (employmentType) { params.push(employmentType); q += ` AND employment_type = $${params.length}`; }
  const { rows } = await pool.query(q, params);
  return parseInt(rows[0].count);
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO employees (user_id, status, surname, first_name, other_names, email, phone, biometric_device_id,
      mpesa_phone_number, employment_type, wage_rate, department, date_joined, date_of_birth, gender, marital_status,
      nationality, national_id, residential_address, emergency_contact, payment_method, can_self_record_attendance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     RETURNING *`,
    [
      data.user_id || null, data.status || 'active', data.surname, data.first_name,
      data.other_names || null, data.email || null, data.phone, data.biometric_device_id || null,
      data.mpesa_phone_number, data.employment_type, data.wage_rate, data.department,
      data.date_joined || new Date(), data.date_of_birth || null, data.gender || null,
      data.marital_status || null, data.nationality || null, data.national_id || null,
      data.residential_address ? JSON.stringify(data.residential_address) : null,
      data.emergency_contact ? JSON.stringify(data.emergency_contact) : null,
      data.payment_method || 'MPESA', data.can_self_record_attendance !== false,
    ]
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const fields = ['status','surname','first_name','other_names','email','phone','biometric_device_id',
    'mpesa_phone_number','employment_type','wage_rate','department','date_joined','date_of_birth',
    'gender','marital_status','nationality','national_id','residential_address','emergency_contact',
    'education_history','employment_history','skills','certifications','bank_account_number',
    'bank_code','payment_method','can_self_record_attendance','user_id'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    const camel = f.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    const val = data[f] !== undefined ? data[f] : data[camel];
    if (val !== undefined) {
      params.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(
    `UPDATE employees SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] ? mapRow(rows[0]) : null;
};

const remove = async (id) => {
  await pool.query('DELETE FROM employees WHERE id = $1', [id]);
};

module.exports = { findById, findByUserId, findAll, count, create, update, remove };
