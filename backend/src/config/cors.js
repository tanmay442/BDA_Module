const cors = require('cors');

/**
 * Parse the CORS allowlist env. Accepts comma-separated origins and
 * tolerates trailing slashes so a typo of `http://localhost:3000/`
 * doesn't silently 403 a request from the un-slashed variant.
 */
function parseAllowlist(raw) {
  return (raw || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

const ALLOWLIST = parseAllowlist(process.env.CORS_ALLOWED_ORIGINS);

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;

module.exports = (req, res, next) => {
  if (isProd && ALLOWLIST.length === 0) {
    // Same-origin on Vercel; CORS not needed.
    return next();
  }
  return cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (ALLOWLIST.includes(normalized)) return cb(null, true);
      console.warn(`CORS: rejected origin ${origin}`);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })(req, res, next);
};
