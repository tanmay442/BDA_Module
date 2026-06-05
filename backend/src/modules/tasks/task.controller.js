const Task = require('./task.model');
const AuditLog = require('../auditLogs/auditLog.model');
const { broadcast } = require('../../services/pusher');
const asyncHandler = require('../../utils/asyncHandler');
const { isElevated, ensureCanRead, ensureCanModify, pick } = require('../../utils/permissions');
const { parsePagination, buildResponse, wantsPagination } = require('../../utils/pagination');

const TASK_UPDATE_FIELDS = [
  'title',
  'description',
  'leadId',
  'assignedTo',
  'dueDate',
  'priority',
  'status',
];

exports.list = asyncHandler(async (req, res) => {
  const { status, priority, leadId } = req.query;
  const filter = {};
  const paginated = wantsPagination(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (leadId) filter.leadId = leadId;

  if (req.user.role === 'bda') {
    filter.assignedTo = req.user._id;
  }

  const query = Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('leadId', 'companyName')
    .sort('-createdAt');

  if (paginated) {
    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);
    return res.json(buildResponse(data, total, page, limit));
  }

  res.json(await query);
});

exports.getById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('leadId', 'companyName');

  ensureCanRead(req.user, task, 'Task');
  res.json(task);
});

exports.create = asyncHandler(async (req, res) => {
  const safeBody = pick(req.body || {}, [
    'title',
    'description',
    'leadId',
    'assignedTo',
    'dueDate',
    'priority',
    'status',
  ]);

  const task = await Task.create({
    ...safeBody,
    createdBy: req.user._id,
    assignedTo: safeBody.assignedTo || req.user._id,
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
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await Task.findById(req.params.id);
  ensureCanModify(req.user, existing, 'Task');

  const safeBody = pick(req.body || {}, TASK_UPDATE_FIELDS);
  if (Object.keys(safeBody).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const task = await Task.findByIdAndUpdate(req.params.id, safeBody, {
    returnDocument: 'after',
    runValidators: true,
  });

  broadcast('tasks', 'task:updated', { id: task._id });
  res.json(task);
});

exports.remove = asyncHandler(async (req, res) => {
  if (!isElevated(req.user)) {
    return res.status(403).json({ message: 'Only admin/manager can delete tasks' });
  }

  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  broadcast('tasks', 'task:deleted', { id: task._id });
  res.json({ message: 'Task deleted' });
});
