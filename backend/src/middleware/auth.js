const { clerkMiddleware, getAuth } = require('@clerk/express');
const User = require('../modules/users/user.model');
const { promoteIfBootstrapEmail } = require('../services/bootstrap');

const authenticate = async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const email = auth.sessionClaims?.email
      || auth.sessionClaims?.email_address
      || auth.emailAddress
      || `${auth.userId}@clerk.local`;
    const name = auth.sessionClaims?.name
      || auth.sessionClaims?.full_name
      || auth.fullName
      || email;
    const imageUrl = auth.sessionClaims?.image_url || auth.imageUrl || null;

    // Upsert pattern: race-safe against the webhook handler. The webhook
    // may have created the row moments before this middleware runs;
    // `findOneAndUpdate` with `upsert: true` and `$setOnInsert: { role }`
    // means a second writer can't downgrade an existing admin/manager
    // back to bda.
    const user = await User.findOneAndUpdate(
      { clerkId: auth.userId },
      {
        $set: { email: String(email).toLowerCase(), name, imageUrl },
        $setOnInsert: { clerkId: auth.userId, role: 'bda' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // First-admin bootstrap: also run from the auth path in case the
    // webhook is delayed or the user signs in before the webhook arrives.
    await promoteIfBootstrapEmail(user);

    req.user = user;
    req.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { clerkMiddleware, authenticate, authorize };
