const { pool } = require('../config/db');

const SYSTEM_LOG_TABLE = 'system_logs';

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${SYSTEM_LOG_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      level VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      module VARCHAR(100),
      action VARCHAR(100),
      user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

const SystemLog = {
  createTable,

  async create(data) {
    const { level, message, module, action, user_id, ip_address, user_agent, metadata } = data;
    const res = await pool.query(
      `INSERT INTO ${SYSTEM_LOG_TABLE} (level, message, module, action, user_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [level, message, module, action, user_id, ip_address, user_agent, metadata ? JSON.stringify(metadata) : null]
    );
    return res.rows[0];
  },

  async findAll(options = {}) {
    const { level, module, action, user_id, limit = 100, offset = 0 } = options;
    
    let query = `SELECT sl.*, u.username, u.email FROM ${SYSTEM_LOG_TABLE} sl
                 LEFT JOIN users u ON sl.user_id = u.id WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (level) {
      query += ` AND sl.level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    if (module) {
      query += ` AND sl.module = $${paramIndex}`;
      params.push(module);
      paramIndex++;
    }

    if (action) {
      query += ` AND sl.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND sl.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    query += ` ORDER BY sl.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const res = await pool.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT sl.*, u.username, u.email FROM ${SYSTEM_LOG_TABLE} sl
       LEFT JOIN users u ON sl.user_id = u.id
       WHERE sl.id = $1`,
      [id]
    );
    return res.rows[0];
  },

  async getStats() {
    const res = await pool.query(`
      SELECT 
        level,
        COUNT(*) as count
      FROM ${SYSTEM_LOG_TABLE}
      GROUP BY level
      ORDER BY count DESC
    `);
    return res.rows;
  },

  async deleteOldLogs(daysToKeep = 30) {
    const res = await pool.query(
      `DELETE FROM ${SYSTEM_LOG_TABLE} 
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days' 
       RETURNING *`
    );
    return res.rowCount;
  }
};

module.exports = SystemLog;
