const express = require('express');
const { authenticate } = require('../../middleware/auth');
const User = require('../users/user.model');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();
const SAFE = '-clerkId -__v';

const ALLOWED_TARGET_ROLES = new Set(['bda', 'manager', 'admin']);

router.use(authenticate);

router.post(
  '/switch-role',
  asyncHandler(async (req, res) => {
    if (process.env.ALLOW_DEMO_ROLE_SWITCH !== 'true') {
      return res.status(403).json({ message: 'Demo role switching is disabled' });
    }

    const { targetRole } = req.body || {};
    if (!targetRole || !ALLOWED_TARGET_ROLES.has(targetRole)) {
      return res.status(400).json({ message: 'Invalid targetRole. Must be bda, manager, or admin.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role: targetRole },
      { returnDocument: 'after', runValidators: true }
    ).select(SAFE);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  })
);

module.exports = router;
