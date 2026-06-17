const Activity = require('./activity.model');
const Lead = require('../leads/lead.model');
const { broadcast } = require('../../services/pusher');

exports.list = async (req, res, next) => {
  try {
    const { leadId, page, limit } = req.query;
    const filter = {};

    if (leadId) filter.leadId = leadId;

    // BDA scoping: only activities for leads the BDA owns.
    if (req.user.role === 'bda') {
      const ownedLeads = await Lead.find({ assignedTo: req.user._id }).select('_id');
      const ids = ownedLeads.map((l) => l._id);
      filter.leadId = { $in: ids };
    }

    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pg - 1) * lim;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('userId', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(lim),
      Activity.countDocuments(filter),
    ]);

    res.set('X-Total-Count', String(total));
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    // BDA can only log activity against leads they own.
    if (req.body.leadId) {
      const lead = await Lead.findById(req.body.leadId).select('assignedTo');
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      if (
        req.user.role === 'bda'
        && lead.assignedTo?.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: 'Not authorized for this lead' });
      }
    }

    const activity = await Activity.create({
      ...req.body,
      userId: req.user._id,
    });

    const populated = await activity.populate('userId', 'name email');

    broadcast('activities', 'activity:created', { id: activity._id, leadId: activity.leadId });
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};
