const rateLimit = require('express-rate-limit');

/**
 * Rate limiters. We deliberately scope these by purpose:
 *
 *  - webhookLimiter: Clerk can deliver bursts (retries) but is otherwise
 *    low-volume. 100 req / 5 min / IP is generous.
 *  - generalLimiter: every authenticated API call. 300 req / 5 min / IP
 *    is plenty for a single user clicking through the dashboard.
 *  - sensitiveLimiter: role-management endpoints (admin only) and
 *    sign-in-adjacent routes. 20 req / 5 min / IP to slow down brute
 *    force on the bootstrap path.
 *
 * Defaults can be overridden via env (RATE_LIMIT_GENERAL_WINDOW_MS,
 * RATE_LIMIT_GENERAL_MAX) if you ever need to tune for production load.
 */
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000;

const webhookLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_WEBHOOK_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many webhook deliveries, slow down' },
});

const generalLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_GENERAL_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, slow down' },
});

const sensitiveLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_SENSITIVE_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sensitive requests, slow down' },
});

module.exports = {
  webhookLimiter,
  generalLimiter,
  sensitiveLimiter,
};
