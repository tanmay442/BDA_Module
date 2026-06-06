const connectDB = require('../backend/src/config/database');
const app = require('../backend/src/app');

module.exports = async (req, res) => {
  // 1. Ensure MongoDB is connected in the serverless environment
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error in serverless execution:', err.message);
  }

  // 2. Fix Vercel's path-stripping behavior
  // If Vercel stripped the "/api" prefix, prepend it so Express can match the routes
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }

  // 3. Delegate the request handling to the Express app
  return app(req, res);
};