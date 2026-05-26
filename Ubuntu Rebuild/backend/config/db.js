require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PGPOOL_MAX) || 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
});

pool.on('connect', () => {
  logger.info('db', 'New client connected to pool');
});

pool.on('error', (err) => {
  logger.error('db', 'Unexpected pool error', err);
});

pool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('db', 'Initial connection test FAILED', err);
  } else {
    logger.info('db', 'PostgreSQL connected — UbuntuRebuild1');
  }
});

module.exports = pool;
