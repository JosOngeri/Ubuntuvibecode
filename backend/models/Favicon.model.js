const { Pool } = require('pg');

const pool = require('../config/db').pool;

const FAVICON_TABLE = 'favicons';

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${FAVICON_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      svg_content TEXT NOT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      uploaded_by BIGINT REFERENCES users(id),
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

const Favicon = {
  async findOne(options) {
    const { where } = options;
    let query = `SELECT * FROM ${FAVICON_TABLE}`;
    const params = [];
    
    if (where) {
      const conditions = [];
      if (where.isActive !== undefined) {
        conditions.push('is_active = $1');
        params.push(where.isActive);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    query += ' LIMIT 1';
    const res = await pool.query(query, params);
    return res.rows[0];
  },

  async findAll(options) {
    let query = `SELECT * FROM ${FAVICON_TABLE}`;
    if (options && options.order) {
      query += ' ORDER BY uploaded_at DESC';
    }
    const res = await pool.query(query);
    return res.rows;
  },

  async create(data) {
    const { svg_content, is_active, uploaded_by } = data;
    const res = await pool.query(
      `INSERT INTO ${FAVICON_TABLE} (svg_content, is_active, uploaded_by, uploaded_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [svg_content, is_active || false, uploaded_by]
    );
    return res.rows[0];
  },

  async update(data, options) {
    const { where } = options;
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key in data) {
      const dbKey = key === 'isActive' ? 'is_active' : key;
      fields.push(`${dbKey} = $${idx}`);
      values.push(data[key]);
      idx++;
    }

    if (where) {
      if (Object.keys(where).length === 0) {
        // Update all rows
        const res = await pool.query(`UPDATE ${FAVICON_TABLE} SET ${fields.join(', ')} RETURNING *`, values);
        return res.rows;
      }
    }

    const res = await pool.query(`UPDATE ${FAVICON_TABLE} SET ${fields.join(', ')} RETURNING *`, values);
    return res.rows[0];
  },

  async findByPk(id) {
    const res = await pool.query(`SELECT * FROM ${FAVICON_TABLE} WHERE id = $1`, [id]);
    return res.rows[0];
  },

  async destroy() {
    // This is a simplified version - actual implementation would need the instance
    return true;
  },

  async init() {
    await createTable();
  },
};

module.exports = Favicon;
