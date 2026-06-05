const Activity = require('./activity.model');
const { broadcast } = require('../../services/pusher');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildResponse, wantsPagination } = require('../../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const { leadId } = req.query;
  const filter = {};
  const paginated = wantsPagination(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  if (leadId) filter.leadId = leadId;

  const query = Activity.find(filter)
    .populate('userId', 'name email')
    .sort('-createdAt');

  if (paginated) {
    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Activity.countDocuments(filter),
    ]);
    return res.json(buildResponse(data, total, page, limit));
  }

  res.json(await query);
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
