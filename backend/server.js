const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const app = require('./app');
const { startKpiBonusProcessor } = require('./controllers/kpi.controller');
const Job = require('./models/Job.model');
// const { initScheduledJobs } = require('./jobs/index');

dotenv.config();

const startServer = async () => {
  await connectDB();
  try { await Job.init(); } catch (e) { console.error('Job table init error:', e.message); }
  try { startKpiBonusProcessor(); } catch (e) { console.error('KPI processor error:', e.message); }
  // initScheduledJobs(); // Disabled temporarily to fix issues

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Full startup error:', err);
    process.exit(1);
  });
}

module.exports = app;