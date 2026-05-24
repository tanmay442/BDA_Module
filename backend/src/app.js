require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { clerkMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware({ publishableKey: process.env.CLERK_PUBLISHABLE_KEY }));


app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/leads', require('./modules/leads/lead.routes'));
app.use('/api/tasks', require('./modules/tasks/task.routes'));
app.use('/api/quotations', require('./modules/quotations/quotation.routes'));
app.use('/api/activities', require('./modules/activities/activity.routes'));
app.use('/api/clients', require('./modules/clients/client.routes'));
app.use('/api/users', require('./modules/users/user.routes'));
app.use('/api/reminders', require('./modules/reminders/reminder.routes'));

app.use(errorHandler);


if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}

module.exports = app;