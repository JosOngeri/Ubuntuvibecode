const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/db');

async function initDatabase() {
  console.log('Reading init-database.sql...');
  
  const sqlPath = path.join(__dirname, '..', 'init-database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Connecting and executing SQL as a single block...');
  
  // Get a dedicated client from pool to run the full script
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✓ Database initialization complete!');
  } catch (error) {
    console.error('\n✗ SQL execution error:', error.message);
    console.error('  Position:', error.position);
    throw error;
  } finally {
    client.release();
  }
  
  // Verify users were created
  const { rows } = await query('SELECT username, role FROM users ORDER BY id');
  console.log(`\nCreated ${rows.length} users:`);
  rows.forEach(u => console.log(`  - ${u.username} (${u.role})`));
  console.log('\nPasswords: username + "123" (e.g., admin=admin123)');
}

initDatabase()
  .then(() => {
    console.log('\n✓ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n✗ Fatal error:', err.message);
    process.exit(1);
  });
