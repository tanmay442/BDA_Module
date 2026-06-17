const Task = require('../tasks/task.model');

/**
 * Reminders panel. Buckets the user's pending tasks into
 * { overdue, dueToday, upcoming } in a single aggregation round trip
 * instead of three back-to-back finds. The { assignedTo, status, dueDate }
 * compound index on Task covers this read.
 */
exports.list = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);
    const endOfWeek = new Date(startOfToday.getTime() + 3 * 86400000);

    const baseMatch = { status: 'pending' };
    if (req.user.role === 'bda') {
      baseMatch.assignedTo = req.user._id;
    }

    const buckets = await Task.aggregate([
      { $match: baseMatch },
      {
        $addFields: {
          bucket: {
            $switch: {
              branches: [
                { case: { $lt: ['$dueDate', startOfToday] }, then: 'overdue' },
                { case: { $lt: ['$dueDate', endOfToday] }, then: 'dueToday' },
                { case: { $lt: ['$dueDate', endOfWeek] }, then: 'upcoming' },
              ],
              default: 'later',
            },
          },
        },
      },
      { $match: { bucket: { $in: ['overdue', 'dueToday', 'upcoming'] } } },
      { $sort: { dueDate: 1 } },
      {
        $group: {
          _id: '$bucket',
          tasks: { $push: '$$ROOT' },
        },
      },
    ]);

    const result = { dueToday: [], overdue: [], upcoming: [] };
    for (const b of buckets) {
      result[b._id] = b.tasks;
    }

    // Populate assignedTo / leadId after the aggregate. Aggregate
    // output is plain objects, so we do a targeted find for the IDs.
    const allIds = [...result.dueToday, ...result.overdue, ...result.upcoming].map((t) => t._id);
    if (allIds.length > 0) {
      const populated = await Task.find({ _id: { $in: allIds } })
        .populate('assignedTo', 'name email')
        .populate('leadId', 'companyName')
        .sort('dueDate');
      const byId = new Map(populated.map((t) => [String(t._id), t]));
      for (const key of ['overdue', 'dueToday', 'upcoming']) {
        result[key] = result[key]
          .map((t) => byId.get(String(t._id)))
          .filter(Boolean);
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
