const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  employeeName: r.employee_name || null,
  attendanceDate: r.attendance_date,
  checkIn: r.check_in,
  checkOut: r.check_out,
  breakOut: r.break_out,
  breakIn: r.break_in,
  punchState: r.punch_state,
  status: r.status,
  totalHoursWorked: r.total_hours_worked ? parseFloat(r.total_hours_worked) : null,
  overtimeHours: parseFloat(r.overtime_hours || 0),
  notes: r.notes,
  recordedBy: r.recorded_by,
  isBackdated: r.is_backdated,
  backdatedReason: r.backdated_reason,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const calcHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const diff = (new Date(checkOut) - new Date(checkIn)) / 3600000;
  return Math.round(diff * 100) / 100;
};

const findByEmployee = async (employeeId, { from, to, limit = 31 } = {}) => {
  let q = `SELECT a.*, CONCAT(e.first_name,' ',e.surname) as employee_name
           FROM attendance a JOIN employees e ON e.id = a.employee_id
           WHERE a.employee_id = $1`;
  const params = [employeeId];
  if (from) { params.push(from); q += ` AND a.attendance_date >= $${params.length}`; }
  if (to) { params.push(to); q += ` AND a.attendance_date <= $${params.length}`; }
  q += ` ORDER BY a.attendance_date DESC LIMIT $${params.length + 1}`;
  params.push(limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findAll = async ({ from, to, department, employeeId, page = 1, limit = 50 } = {}) => {
  let q = `SELECT a.*, CONCAT(e.first_name,' ',e.surname) as employee_name, e.department
           FROM attendance a JOIN employees e ON e.id = a.employee_id WHERE 1=1`;
  const params = [];
  if (employeeId) { params.push(employeeId); q += ` AND a.employee_id = $${params.length}`; }
  if (department) { params.push(department); q += ` AND e.department = $${params.length}`; }
  if (from) { params.push(from); q += ` AND a.attendance_date >= $${params.length}`; }
  if (to) { params.push(to); q += ` AND a.attendance_date <= $${params.length}`; }
  q += ` ORDER BY a.attendance_date DESC, a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(q, params);
  return rows.map(mapRow);
};

const findTodayByEmployee = async (employeeId) => {
  const { rows } = await pool.query(
    `SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = CURRENT_DATE`,
    [employeeId]
  );
  return rows[0] ? mapRow(rows[0]) : null;
};

const punch = async (employeeId, punchState, { notes, recordedBy, isBackdated, backdatedReason, customTime } = {}) => {
  const now = customTime ? new Date(customTime) : new Date();
  const today = now.toISOString().split('T')[0];

  let record = await findTodayByEmployee(employeeId);
  if (!record && customTime) {
    const { rows } = await pool.query('SELECT * FROM attendance WHERE employee_id=$1 AND attendance_date=$2', [employeeId, today]);
    record = rows[0] ? mapRow(rows[0]) : null;
  }

  if (punchState === 'checkIn') {
    if (record) {
      await pool.query(
        `UPDATE attendance SET check_in=$1, punch_state='checkIn', status='Present', is_backdated=$2, backdated_reason=$3, updated_at=NOW()
         WHERE employee_id=$4 AND attendance_date=$5`,
        [now, !!isBackdated, backdatedReason || null, employeeId, today]
      );
    } else {
      await pool.query(
        `INSERT INTO attendance (employee_id, attendance_date, check_in, punch_state, status, is_backdated, backdated_reason, recorded_by)
         VALUES ($1,$2,$3,'checkIn','Present',$4,$5,$6)`,
        [employeeId, today, now, !!isBackdated, backdatedReason || null, recordedBy || null]
      );
    }
  } else if (punchState === 'checkOut') {
    const checkIn = record?.checkIn;
    const hours = checkIn ? calcHours(checkIn, now) : null;
    const overtime = hours && hours > 8 ? Math.round((hours - 8) * 100) / 100 : 0;
    await pool.query(
      `UPDATE attendance SET check_out=$1, punch_state='checkOut', total_hours_worked=$2, overtime_hours=$3,
       notes=$4, updated_at=NOW() WHERE employee_id=$5 AND attendance_date=$6`,
      [now, hours, overtime, notes || null, employeeId, today]
    );
  } else if (punchState === 'breakOut') {
    await pool.query(
      `UPDATE attendance SET break_out=$1, punch_state='breakOut', updated_at=NOW() WHERE employee_id=$2 AND attendance_date=$3`,
      [now, employeeId, today]
    );
  } else if (punchState === 'breakIn') {
    await pool.query(
      `UPDATE attendance SET break_in=$1, punch_state='breakIn', updated_at=NOW() WHERE employee_id=$2 AND attendance_date=$3`,
      [now, employeeId, today]
    );
  }
  return findTodayByEmployee(employeeId);
};

const upsert = async (employeeId, date, data) => {
  const { rows: existing } = await pool.query(
    'SELECT id FROM attendance WHERE employee_id=$1 AND attendance_date=$2', [employeeId, date]
  );
  if (existing.length) {
    const fields = [];
    const params = [];
    const allowed = ['check_in','check_out','status','total_hours_worked','notes','punch_state'];
    for (const f of allowed) {
      if (data[f] !== undefined) { params.push(data[f]); fields.push(`${f}=$${params.length}`); }
    }
    if (fields.length) {
      params.push(new Date(), employeeId, date);
      await pool.query(`UPDATE attendance SET ${fields.join(',')}, updated_at=$${params.length-2} WHERE employee_id=$${params.length-1} AND attendance_date=$${params.length}`, params);
    }
  } else {
    await pool.query(
      `INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status, total_hours_worked, notes, punch_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [employeeId, date, data.check_in||null, data.check_out||null, data.status||'Present', data.total_hours_worked||null, data.notes||null, data.punch_state||'checkIn']
    );
  }
};

module.exports = { findByEmployee, findAll, findTodayByEmployee, punch, upsert };
