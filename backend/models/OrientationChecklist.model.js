const { Pool } = require('pg');

const pool = require('../config/db').pool;

const ORIENTATION_CHECKLIST_TABLE = 'orientation_checklists';

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${ORIENTATION_CHECKLIST_TABLE} (
      id SERIAL PRIMARY KEY,
      role VARCHAR(100) NOT NULL,
      checklist JSONB NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const OrientationChecklist = {
  async create(data) {
    const { role, checklist, isDefault = false, createdBy } = data;
    const res = await pool.query(
      `INSERT INTO ${ORIENTATION_CHECKLIST_TABLE} (role, checklist, is_default, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [role, JSON.stringify(checklist), isDefault, createdBy]
    );
    return res.rows[0];
  },

  async findByRole(role) {
    const res = await pool.query(
      `SELECT * FROM ${ORIENTATION_CHECKLIST_TABLE} WHERE role = $1 ORDER BY is_default DESC, created_at DESC`,
      [role]
    );
    return res.rows;
  },

  async getDefault() {
    const res = await pool.query(
      `SELECT * FROM ${ORIENTATION_CHECKLIST_TABLE} WHERE is_default = TRUE LIMIT 1`
    );
    return res.rows[0];
  },

  async findById(id) {
    const res = await pool.query(`SELECT * FROM ${ORIENTATION_CHECKLIST_TABLE} WHERE id = $1`, [id]);
    return res.rows[0];
  },

  async update(id, data) {
    const { role, checklist, isDefault } = data;
    const res = await pool.query(
      `UPDATE ${ORIENTATION_CHECKLIST_TABLE} 
       SET role = COALESCE($1, role), 
           checklist = COALESCE($2, checklist),
           is_default = COALESCE($3, is_default),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [role, checklist ? JSON.stringify(checklist) : null, isDefault, id]
    );
    return res.rows[0];
  },

  async delete(id) {
    await pool.query(`DELETE FROM ${ORIENTATION_CHECKLIST_TABLE} WHERE id = $1`, [id]);
    return true;
  },

  async getAll() {
    const res = await pool.query(`SELECT * FROM ${ORIENTATION_CHECKLIST_TABLE} ORDER BY is_default DESC, role ASC`);
    return res.rows;
  },

  async init() {
    await createTable();
  },
};

module.exports = OrientationChecklist;
