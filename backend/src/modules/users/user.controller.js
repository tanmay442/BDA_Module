const User = require('./user.model');

const SAFE = '-clerkId -__v';

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
    const user = await User.findById(req.user._id).select(SAFE);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.onboard = async (req, res, next) => {
  try {
    const { name, role, company } = req.body;
    if (!role || !company) {
      return res.status(400).json({ message: 'Role and company are required' });
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

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
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
  } catch (error) {
    next(error);
  }
};
