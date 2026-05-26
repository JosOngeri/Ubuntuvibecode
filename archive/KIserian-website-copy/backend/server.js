require('dotenv').config();
const { connectDB } = require('./config/database');
const app = require('./app');

const startServer = async () => {
  try {
    // Connect to database (optional - server will start even if DB fails)
    try {
      await connectDB();
      console.log(`PostgreSQL connected to ${process.env.PGDATABASE || 'kiserian_main_db'}`);
    } catch (dbError) {
      console.warn('Database connection failed, starting server anyway:', dbError.message);
    }
    
    const PORT = 5005;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
