const connectDB = require('../backend/src/config/database');
const app = require('../backend/src/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error in serverless execution:', err.message);
  }

  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }

  return app(req, res);
};