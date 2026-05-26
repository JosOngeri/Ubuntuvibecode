const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const seedPath = path.join(__dirname, 'temporary_seed.sql');

async function runSeed() {
  return new Promise((resolve, reject) => {
    const psql = spawn('psql', [
      '-U', 'postgres',
      '-d', 'Ubuntu_hr',
      '--no-psqlrc',
      '-q'
    ], {
      stdio: ['pipe', 'inherit', 'inherit'],
      env: { ...process.env, PAGER: '' }
    });

    const fileStream = fs.createReadStream(seedPath);
    fileStream.pipe(psql.stdin);

    psql.on('close', (code) => {
      if (code === 0) {
        console.log('\nSeed completed successfully.');
        resolve();
      } else {
        reject(new Error(`psql exited with code ${code}`));
      }
    });

    psql.on('error', (err) => reject(err));
  });
}

runSeed().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
