const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const mapRow = (r) => ({
  id: r.id,
  username: r.username,
  email: r.email,
  role: r.role,
  status: r.status,
  mustChangePassword: r.must_change_password,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const findByUsername = async (username) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const findAll = async ({ page = 1, limit = 50, role, status, search } = {}) => {
  let query = `SELECT id, username, email, role, status, must_change_password, created_at, updated_at FROM users WHERE 1=1`;
  const params = [];
  if (role) { params.push(role); query += ` AND role = $${params.length}`; }
  if (status) { params.push(status); query += ` AND status = $${params.length}`; }
  if (search) { params.push(`%${search}%`); query += ` AND (username ILIKE $${params.length} OR email ILIKE $${params.length})`; }
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(query, params);
  return rows.map(mapRow);
};

const create = async ({ username, email, password, role = 'employee', status = 'active', mustChangePassword = false }) => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password, role, status, must_change_password)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [username, email?.toLowerCase() || null, hashed, role, status, mustChangePassword]
  );
  return mapRow(rows[0]);
};

const update = async (id, fields) => {
  const allowed = ['email', 'role', 'status', 'must_change_password', 'reset_token', 'reset_token_expire'];
  const updates = [];
  const params = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      updates.push(`${key} = $${params.length}`);
    }
  }
  if (!updates.length) return findById(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] ? mapRow(rows[0]) : null;
};

const updatePassword = async (id, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);
  await pool.query(
    `UPDATE users SET password = $1, must_change_password = FALSE, reset_token = NULL, reset_token_expire = NULL, updated_at = NOW() WHERE id = $2`,
    [hashed, id]
  );
};

const comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed);

const remove = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = { findById, findByUsername, findByEmail, findAll, create, update, updatePassword, comparePassword, remove };
