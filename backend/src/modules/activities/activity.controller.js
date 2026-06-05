const Activity = require('./activity.model');
const { broadcast } = require('../../services/pusher');
const asyncHandler = require('../../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { leadId } = req.query;
  const filter = {};

  if (leadId) filter.leadId = leadId;

  const activities = await Activity.find(filter)
    .populate('userId', 'name email')
    .sort('-createdAt');

  res.json(activities);
});

exports.create = asyncHandler(async (req, res) => {
  const activity = await Activity.create({
    ...req.body,
    userId: req.user._id,
  });

  const populated = await activity.populate('userId', 'name email');

  broadcast('activities', 'activity:created', { id: activity._id, leadId: activity.leadId });
  res.status(201).json(populated);
});
