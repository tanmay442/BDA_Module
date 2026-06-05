require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { clerkMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: process.env.FRONTEND_URL || (isProduction ? false : true),
    credentials: false,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(clerkMiddleware({ publishableKey: process.env.CLERK_PUBLISHABLE_KEY }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/leads', require('./modules/leads/lead.routes'));
app.use('/api/tasks', require('./modules/tasks/task.routes'));
app.use('/api/quotations', require('./modules/quotations/quotation.routes'));
app.use('/api/activities', require('./modules/activities/activity.routes'));
app.use('/api/clients', require('./modules/clients/client.routes'));
app.use('/api/users', require('./modules/users/user.routes'));
app.use('/api/demo', require('./modules/demo/demo.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/api/reminders', require('./modules/reminders/reminder.routes'));

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to MongoDB on startup:', err.message);
    process.exit(1);
  }

  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
