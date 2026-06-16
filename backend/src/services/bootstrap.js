const User = require('../modules/users/user.model');
const AuditLog = require('../modules/auditLogs/auditLog.model');

/**
 * Returns the parsed list of bootstrap-admin emails (lowercased, trimmed,
 * deduped). Empty array means "bootstrap disabled".
 */
function getBootstrapEmails() {
  return (process.env.BOOTSTRAP_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Promote `user` to admin if and only if:
 *   1. BOOTSTRAP_ADMIN_EMAILS is set and contains the user's email.
 *   2. The database currently has ZERO admin rows.
 *
 * Both conditions must hold. After the first admin is created, this
 * function is a no-op forever (even if you add new emails to the env
 * var later). This guarantees the bootstrap path can't be used to
 * sneak in a second admin later.
 *
 * Returns true if the user was promoted, false otherwise.
 */
async function promoteIfBootstrapEmail(user) {
  if (!user || !user.email) return false;

  const allowed = getBootstrapEmails();
  if (allowed.length === 0) return false;

  if (!allowed.includes(user.email.toLowerCase())) return false;

  // Atomic check-and-promote: only promote if no admin exists AND the
  // user isn't already an admin. Avoids race conditions where two
  // users sign up at the same moment and both qualify.
  if (user.role === 'admin') return false;

  const result = await User.updateOne(
    { _id: user._id, role: { $ne: 'admin' } },
    { $set: { role: 'admin' } }
  );

  if (result.modifiedCount === 0) return false;

  // Audit the bootstrap action. No human actor, so we use a null
  // userId + system flag (see auditLog.model.js) -- but AuditLog
  // currently requires userId. Use a sentinel ObjectId of zeros
  // and a clear `action` so admins can grep for it.
  try {
    await AuditLog.create({
      userId: user._id,           // the user who was promoted
      action: 'system.bootstrap_admin',
      entityType: 'User',
      entityId: user._id,
      newValue: {
        reason: 'first-admin-bootstrap',
        email: user.email,
        via: 'BOOTSTRAP_ADMIN_EMAILS',
      },
    });
  } catch (err) {
    // Audit log failure must not break the webhook (which would
    // cause Svix to retry and possibly re-trigger this). Log and
    // move on.
    console.error('Failed to write bootstrap audit log:', err.message);
  }

  console.log(`[bootstrap] promoted ${user.email} to admin (first admin)`);
  return true;
}

/**
 * Run on server startup. Scans BOOTSTRAP_ADMIN_EMAILS and promotes any
 * matching user that already exists in the DB. Idempotent: does nothing
 * if an admin already exists. Safe to call on every cold start.
 *
 * Intended to be called from app.js right after the DB connection.
 */
async function ensureBootstrapAdmins() {
  const allowed = getBootstrapEmails();
  if (allowed.length === 0) {
    console.log('[bootstrap] BOOTSTRAP_ADMIN_EMAILS not set, skipping');
    return { promoted: 0 };
  }

  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount > 0) {
    console.log(`[bootstrap] ${adminCount} admin(s) exist, no action`);
    return { promoted: 0, existingAdmins: adminCount };
  }

  const candidates = await User.find({
    email: { $in: allowed },
    role: { $ne: 'admin' },
  });

  let promoted = 0;
  for (const user of candidates) {
    const ok = await promoteIfBootstrapEmail(user);
    if (ok) promoted += 1;
  }

  if (promoted > 0) {
    console.log(`[bootstrap] promoted ${promoted} user(s) to admin`);
  } else {
    console.log('[bootstrap] no matching users yet (they will be promoted on first sign-in)');
  }
  return { promoted };
}

module.exports = {
  getBootstrapEmails,
  promoteIfBootstrapEmail,
  ensureBootstrapAdmins,
};
