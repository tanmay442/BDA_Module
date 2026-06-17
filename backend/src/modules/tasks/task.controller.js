const Task = require('./task.model');
const Lead = require('../leads/lead.model');
const AuditLog = require('../auditLogs/auditLog.model');
const { broadcast } = require('../../services/pusher');

const TASK_UPDATE_FIELDS = [
  'title',
  'description',
  'leadId',
  'assignedTo',
  'dueDate',
  'priority',
  'status',
];

async function loadTaskForUser(req, taskId) {
  const task = await Task.findById(taskId);
  if (!task) return { error: 404 };
  if (
    req.user.role === 'bda'
    && task.assignedTo.toString() !== req.user._id.toString()
  ) {
    return { error: 404 };
  }
  return { task };
}

exports.list = async (req, res, next) => {
  try {
    const { status, priority, leadId, page, limit } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (leadId) filter.leadId = leadId;

    if (req.user.role === 'bda') {
      filter.assignedTo = req.user._id;
    }

    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pg - 1) * lim;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email')
        .populate('leadId', 'companyName')
        .sort('-createdAt')
        .skip(skip)
        .limit(lim),
      Task.countDocuments(filter),
    ]);

    res.set('X-Total-Count', String(total));
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { task, error } = await loadTaskForUser(req, req.params.id);
    if (error) return res.status(error).json({ message: 'Task not found' });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'companyName');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    // BDA can only create tasks against leads they own. Mirrors the
    // quotation/activity create check. Return 404 for the
    // not-found-or-not-mine case to avoid leaking which lead ids
    // exist.
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

    // Strip server-controlled / non-allowlisted fields.
    const body = { ...req.body };
    delete body.createdBy; // server sets this from req.user
    delete body.status; // default to 'pending'

    const task = await Task.create({
      ...body,
      createdBy: req.user._id,
      assignedTo: body.assignedTo || req.user._id,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'task_created',
      entityType: 'Task',
      entityId: task._id,
      newValue: { title: task.title, status: task.status },
    });

    broadcast('tasks', 'task:created', { id: task._id });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { task: existing, error } = await loadTaskForUser(req, req.params.id);
    if (error) return res.status(error).json({ message: 'Task not found' });

    const update = {};
    for (const field of TASK_UPDATE_FIELDS) {
      if (field in req.body) update[field] = req.body[field];
    }

    if (update.assignedTo && req.user.role === 'bda') {
      // BDA can mark their task done but can't reassign it.
      return res.status(403).json({ message: 'Only admins/managers can reassign tasks' });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, update, {
      returnDocument: 'after',
      runValidators: true,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'task_updated',
      entityType: 'Task',
      entityId: task._id,
      newValue: { fields: Object.keys(update) },
    });

    broadcast('tasks', 'task:updated', { id: task._id });
    res.json(task);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { task, error } = await loadTaskForUser(req, req.params.id);
    if (error) return res.status(error).json({ message: 'Task not found' });

    await Task.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      userId: req.user._id,
      action: 'task_deleted',
      entityType: 'Task',
      entityId: task._id,
      oldValue: { title: task.title, status: task.status },
    });

    broadcast('tasks', 'task:deleted', { id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};
