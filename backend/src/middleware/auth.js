const { clerkMiddleware, getAuth } = require('@clerk/express');
const User = require('../modules/users/user.model');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const email =
    auth.sessionClaims?.email ||
    auth.sessionClaims?.email_address ||
    auth.emailAddress ||
    `${auth.userId}@clerk.local`;
  const name = auth.sessionClaims?.name || auth.sessionClaims?.full_name || auth.fullName || email;

  const user = await User.findOneAndUpdate(
    { clerkId: auth.userId },
    {
      $setOnInsert: {
        clerkId: auth.userId,
        email,
        name,
        role: 'bda',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  req.user = user;
  req.auth = auth;
  next();
});

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
