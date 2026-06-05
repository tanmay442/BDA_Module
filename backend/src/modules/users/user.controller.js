const User = require('./user.model');
const asyncHandler = require('../../utils/asyncHandler');

const SAFE = '-clerkId -__v';

const SELF_ONBOARD_ROLES = new Set(['bda', 'manager']);

exports.list = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'bda') {
    filter = {
      $or: [
        { _id: req.user._id },
        { role: { $in: ['manager', 'admin'] } },
      ],
    };
  }
  const users = await User.find(filter).select(SAFE).sort('name');
  res.json(users);
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(SAFE);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(SAFE);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

exports.onboard = asyncHandler(async (req, res) => {
  const { name, role, company } = req.body || {};
  if (!company) {
    return res.status(400).json({ message: 'Company is required' });
  }

  const updates = {};
  if (name) updates.name = name;
  if (company) updates.company = company;

  if (role) {
    if (!SELF_ONBOARD_ROLES.has(role)) {
      return res.status(400).json({
        message: 'Invalid role. Self-onboarding only accepts bda or manager. Use the admin role update endpoint for admin.',
      });
    }
    updates.role = role;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    returnDocument: 'after',
    runValidators: true,
  }).select(SAFE);

  res.json(user);
});

exports.updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }
  if (!['admin', 'manager', 'bda'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { returnDocument: 'after', runValidators: true }
  ).select(SAFE);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
});
