const User = require('./user.model');

const SAFE = '-clerkId -__v';

const ROLES = ['admin', 'manager', 'bda'];
// Self-onboarding can choose bda or manager; admin must come from
// the PATCH /:id/role endpoint, which itself requires an existing
// admin (the bootstrap path is the only way to create the first
// admin).
const ONBOARD_ROLES = ['manager', 'bda'];

exports.list = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(SAFE);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    // Trust the document the auth middleware already loaded into
    // req.user; avoid a redundant round trip to Mongo.
    res.json(req.user.toJSON({ versionKey: false, transform: true }));
  } catch (error) {
    next(error);
  }
};

exports.onboard = async (req, res, next) => {
  try {
    const { name, role, company } = req.body;
    if (!company) {
      return res.status(400).json({ message: 'company is required' });
    }
    if (!role || !ONBOARD_ROLES.includes(role)) {
      return res.status(400).json({
        message: `role must be one of: ${ONBOARD_ROLES.join(', ')}`,
      });
    }
    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (company) updates.company = company;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: 'after',
      runValidators: true,
    }).select(SAFE);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${ROLES.join(', ')}` });
    }

    // Prevent self-demotion past admin. An admin can demote another
    // admin, but the last remaining admin cannot demote themselves.
    const target = await User.findById(req.params.id).select('role');
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (
      target.role === 'admin'
      && role !== 'admin'
      && target._id.toString() === req.user._id.toString()
    ) {
      const otherAdmins = await User.countDocuments({
        role: 'admin',
        _id: { $ne: target._id },
      });
      if (otherAdmins === 0) {
        return res.status(400).json({
          message: 'Cannot demote the last remaining admin',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: 'after', runValidators: true }
    ).select(SAFE);

    res.json(user);
  } catch (error) {
    next(error);
  }
};
