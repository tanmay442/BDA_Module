const { clerkMiddleware, getAuth } = require('@clerk/express');
const User = require('../modules/users/user.model');

const authenticate = async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let user = await User.findOne({ clerkId: auth.userId });

    if (!user) {
      const email = auth.sessionClaims?.email || auth.sessionClaims?.email_address || auth.emailAddress || `${auth.userId}@clerk.local`;
      const name = auth.sessionClaims?.name || auth.sessionClaims?.full_name || auth.fullName || email;
      user = await User.create({
        clerkId: auth.userId,
        email,
        name,
        role: 'bda',
      });
    }

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
