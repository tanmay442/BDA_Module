require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const corsMiddleware = require('./config/cors');
const { clerkMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { ensureBootstrapAdmins } = require('./services/bootstrap');
const { generalLimiter, webhookLimiter } = require('./middleware/rateLimit');

const app = express();

// ============================================================================
// 1. WEBHOOK ROUTE
//    Must come FIRST: needs the raw request body for Svix signature
//    verification, so it must NOT go through express.json().
// ============================================================================
app.use(
  '/api/webhooks',
  webhookLimiter,
  require('./modules/webhooks/webhook.routes')
);

// ============================================================================
// 2. CORS + JSON PARSING + CLERK MIDDLEWARE
// ============================================================================
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(clerkMiddleware({ publishableKey: process.env.CLERK_PUBLISHABLE_KEY }));

// ============================================================================
// 3. DATABASE CONNECTION MIDDLEWARE
// ============================================================================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 4. PATH NORMALIZATION FOR VERCEL SERVERLESS
//    Vercel's gateway sometimes appends / strips the /api prefix.
// ============================================================================
app.use((req, res, next) => {
  if (req.url) {
    if (req.url.includes('index.js')) {
      req.url = req.url.replace('/api/index.js', '').replace('index.js', '');
    }
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});

// ============================================================================
// 5. HEALTH (no auth, no rate limit)
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// 6. AUTHENTICATED ROUTES (rate-limited per-IP)
// ============================================================================
app.use('/api/leads', generalLimiter, require('./modules/leads/lead.routes'));
app.use('/api/tasks', generalLimiter, require('./modules/tasks/task.routes'));
app.use('/api/quotations', generalLimiter, require('./modules/quotations/quotation.routes'));
app.use('/api/activities', generalLimiter, require('./modules/activities/activity.routes'));
app.use('/api/clients', generalLimiter, require('./modules/clients/client.routes'));
app.use('/api/users', generalLimiter, require('./modules/users/user.routes'));
app.use('/api/reminders', generalLimiter, require('./modules/reminders/reminder.routes'));

// ============================================================================
// 7. ERROR HANDLER
// ============================================================================
app.use(errorHandler);

// ============================================================================
// 8. STARTUP TASKS
// ============================================================================
let bootstrapPromise = null;
async function runBootstrap() {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = ensureBootstrapAdmins().catch((err) => {
    console.error('[bootstrap] failed:', err.message);
  });
  return bootstrapPromise;
}

// Fire-and-forget on every cold start; promise is cached so we don't
// run it again for the lifetime of the warm function instance.
if (process.env.NODE_ENV !== 'test') {
  runBootstrap();
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}

module.exports = app;
