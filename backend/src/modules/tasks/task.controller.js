const Task = require('./task.model');
const AuditLog = require('../auditLogs/auditLog.model');

exports.list = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (req.user.role === 'bda') {
      filter.assignedTo = req.user._id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName')
      .sort('-createdAt');

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const task = await Task.create(req.body);

    await AuditLog.create({
      userId: req.user._id,
      action: 'task_created',
      entityType: 'Task',
      entityId: task._id,
      newValue: { title: task.title, status: task.status },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};
