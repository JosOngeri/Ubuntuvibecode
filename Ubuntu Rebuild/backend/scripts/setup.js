const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: false,
});

async function setup() {
  console.log('Starting Ubuntu HRMS Rebuild database setup...');

  try {
    await pool.query('DROP DATABASE IF EXISTS UbuntuRebuild1');
    console.log('Dropped existing database UbuntuRebuild1');

    await pool.query('CREATE DATABASE UbuntuRebuild1');
    console.log('Created database UbuntuRebuild1');

    await pool.end();

    const targetPool = new Pool({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/UbuntuRebuild1',
      ssl: false,
    });

    const initSqlPath = path.join(__dirname, '../../init-database.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await targetPool.query(initSql);
    console.log('Ran init-database.sql');

    const seedSqlPath = path.join(__dirname, '../../seed-data.sql');
    if (fs.existsSync(seedSqlPath)) {
      const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
      await targetPool.query(seedSql);
      console.log('Ran seed-data.sql');
    } else {
      console.log('seed-data.sql not found, skipping');
    }

    await targetPool.end();
    console.log('Database setup complete!');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
