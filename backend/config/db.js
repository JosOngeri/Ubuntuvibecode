const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/ubuntu_hrms';

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PGPOOL_MAX || 10),
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

const dbName = connectionString.match(/\/([^/?]+)$/)?.[1] || 'unknown';
console.log(`PostgreSQL connected to database: ${dbName}`);

const query = (text, params) => pool.query(text, params);

// Tables are created via init-database.sql - kept for compatibility
const initDatabase = async () => {
  console.log('Database initialized (tables should exist from init-database.sql)');
};

const connectDB = async () => {
  await initDatabase();
  const dbName = connectionString.match(/\/([^/?]+)$/)?.[1] || 'unknown';
  console.log();
  console.log(`PostgreSQL connected to database: ${dbName}`);
};

const closeDB = async () => {
  await pool.end();
};

module.exports = {
  connectDB,
  closeDB,
  initDatabase,
  pool,
  query,
};
