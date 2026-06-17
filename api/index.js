const connectDB = require('../backend/src/config/database');
const app = require('../backend/src/app');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await connectDB();
    // Bootstrap admins (first-admin promotion) after the DB is
    // connected. Idempotent across warm invocations.
    if (typeof app.initialize === 'function') {
      await app.initialize();
    }
    initialized = true;
  }
  return app(req, res);
};
