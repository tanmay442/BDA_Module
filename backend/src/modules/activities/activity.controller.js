const Activity = require('./activity.model');

exports.list = async (req, res, next) => {
  try {
    const { leadId } = req.query;
    const filter = {};

    if (leadId) filter.leadId = leadId;

    const activities = await Activity.find(filter)
      .populate('userId', 'name email')
      .sort('-createdAt');

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const activity = await Activity.create({
      ...req.body,
      userId: req.user._id,
    });

    const populated = await activity.populate('userId', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};
