const cors = require('cors');

const ALLOWLIST = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;

/**
 * CORS middleware:
 *  - In production (Vercel): the API and frontend share an origin, so
 *    CORS is effectively a no-op. We still wire `cors()` with the
 *    allowlist as a safety net in case a stray cross-origin request
 *    slips through.
 *  - In development: only requests from the allowlisted origins succeed;
 *    everything else is rejected with a 403 + warning log.
 *  - The Clerk webhook route (/api/webhooks/clerk) is server-to-server
 *    and is NOT subject to CORS (it doesn't carry browser credentials
 *    and never runs in a browser context). It is mounted before this
 *    middleware in app.js.
 */
module.exports = (req, res, next) => {
  if (isProd && ALLOWLIST.length === 0) {
    // Same-origin on Vercel; CORS not needed.
    return next();
  }
  return cors({
    origin(origin, cb) {
      // Same-origin or no Origin header (curl, server-to-server) -> allow.
      if (!origin) return cb(null, true);
      if (ALLOWLIST.includes(origin)) return cb(null, true);
      console.warn(`CORS: rejected origin ${origin}`);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })(req, res, next);
};
