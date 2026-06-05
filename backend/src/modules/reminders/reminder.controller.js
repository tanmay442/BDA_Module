const Task = require('../tasks/task.model');
const asyncHandler = require('../../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const threeDaysOut = new Date(startOfToday.getTime() + 3 * 86400000);

  const filter = { status: 'pending' };

  if (req.user.role === 'bda') {
    filter.assignedTo = req.user._id;
  }

  const [dueToday, overdue, upcoming] = await Promise.all([
    Task.find({ ...filter, dueDate: { $gte: startOfToday, $lt: endOfToday } })
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName')
      .sort('dueDate'),
    Task.find({ ...filter, dueDate: { $lt: startOfToday } })
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName')
      .sort('dueDate'),
    Task.find({ ...filter, dueDate: { $gte: endOfToday, $lt: threeDaysOut } })
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName')
      .sort('dueDate'),
  ]);

  res.json({ dueToday, overdue, upcoming });
});
