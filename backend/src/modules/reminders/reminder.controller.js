const Task = require('../tasks/task.model');

exports.list = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);
    const endOfWeek = new Date(startOfToday.getTime() + 3 * 86400000);

    const filter = { status: 'pending' };

    if (req.user.role === 'bda') {
      filter.assignedTo = req.user._id;
    }

    const dueToday = await Task.find({ ...filter, dueDate: { $gte: startOfToday, $lt: endOfToday } })
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName')
      .sort('dueDate');

    const overdue = await Task.find({ ...filter, dueDate: { $lt: startOfToday } })
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName')
      .sort('dueDate');

    const upcoming = await Task.find({ ...filter, dueDate: { $gte: endOfToday, $lt: endOfWeek } })
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName')
      .sort('dueDate');

    res.json({ dueToday, overdue, upcoming });
  } catch (error) {
    next(error);
  }
};
