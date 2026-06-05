const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { demoSwitchRole } = require('../../validators/dto');
const User = require('../users/user.model');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();
const SAFE = '-clerkId -__v';

router.use(authenticate);

router.post(
  '/switch-role',
  asyncHandler(async (req, res, next) => {
    if (process.env.ALLOW_DEMO_ROLE_SWITCH !== 'true') {
      return res.status(403).json({ message: 'Demo role switching is disabled' });
    }
    next();
  }),
  validate(demoSwitchRole),
  asyncHandler(async (req, res) => {
    const { targetRole } = req.body;

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
