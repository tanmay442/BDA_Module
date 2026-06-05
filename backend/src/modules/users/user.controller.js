const User = require('./user.model');
const Lead = require('../leads/lead.model');
const Task = require('../tasks/task.model');
const Quotation = require('../quotations/quotation.model');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildResponse, wantsPagination } = require('../../utils/pagination');

const SAFE = '-clerkId -__v';
const REPORT_RECENT_LIMIT = 10;
const REPORT_PIPELINE_STAGES = ['new', 'contacted', 'requirement_gathered', 'quotation_sent', 'negotiation', 'won'];

const SELF_ONBOARD_ROLES = new Set(['bda', 'manager']);

exports.list = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'bda') {
    filter = {
      $or: [
        { _id: req.user._id },
        { role: { $in: ['manager', 'admin'] } },
      ],
    };
  }
  const paginated = wantsPagination(req.query);
  const { page, limit, skip } = parsePagination(req.query);
  const query = User.find(filter).select(SAFE).sort('name');

  if (paginated) {
    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return res.json(buildResponse(data, total, page, limit));
  }

  res.json(await query);
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(SAFE);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(SAFE);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

exports.onboard = asyncHandler(async (req, res) => {
  const { name, role, company } = req.body || {};
  if (!company) {
    return res.status(400).json({ message: 'Company is required' });
  }

  const updates = {};
  if (name) updates.name = name;
  if (company) updates.company = company;

  if (role) {
    if (!SELF_ONBOARD_ROLES.has(role)) {
      return res.status(400).json({
        message: 'Invalid role. Self-onboarding only accepts bda or manager. Use the admin role update endpoint for admin.',
      });
    }
    updates.role = role;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    returnDocument: 'after',
    runValidators: true,
  }).select(SAFE);

  res.json(user);
});

exports.updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }
  if (!['admin', 'manager', 'bda'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { returnDocument: 'after', runValidators: true }
  ).select(SAFE);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
});

exports.report = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const user = await User.findById(id).select(SAFE);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const viewerIsManager = req.user.role === 'admin' || req.user.role === 'manager';
  const viewerIsSelf = String(req.user._id) === String(user._id);
  if (!viewerIsManager && !viewerIsSelf) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const [leadStats, taskCounts, quotationCount, recentLeads, recentTasks, recentQuotations] = await Promise.all([
    Lead.aggregate([
      { $match: { assignedTo: user._id } },
      {
        $facet: {
          byStage: [
            { $group: { _id: '$currentStage', count: { $sum: 1 } } },
          ],
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                value: { $sum: { $ifNull: ['$expectedDealValue', 0] } },
              },
            },
          ],
        },
      },
    ]),
    Task.aggregate([
      { $match: { assignedTo: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Quotation.countDocuments({ createdBy: user._id }),
    Lead.find({ assignedTo: user._id })
      .sort('-updatedAt')
      .limit(REPORT_RECENT_LIMIT)
      .populate('assignedTo', 'name')
      .lean(),
    Task.find({ assignedTo: user._id })
      .sort('-updatedAt')
      .limit(REPORT_RECENT_LIMIT)
      .lean(),
    Quotation.find({ createdBy: user._id })
      .sort('-updatedAt')
      .limit(REPORT_RECENT_LIMIT)
      .populate('leadId', 'companyName')
      .lean(),
  ]);

  const [leadFacet] = leadStats;
  const stageCounts = Object.fromEntries((leadFacet.byStage || []).map((s) => [s._id, s.count]));
  const pipeline = REPORT_PIPELINE_STAGES.map((stage) => ({
    stage,
    leads: stageCounts[stage] || 0,
  }));

  const won = stageCounts.won || 0;
  const totalLeads = (leadFacet.totals && leadFacet.totals[0]?.total) || 0;
  const pipelineValue = (leadFacet.totals && leadFacet.totals[0]?.value) || 0;
  const winRate = totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0;

  const tasksByStatus = Object.fromEntries(taskCounts.map((t) => [t._id, t.count]));

  res.json({
    user,
    totals: {
      leads: totalLeads,
      won,
      pipelineValue,
      winRate,
    },
    pipeline,
    tasks: {
      total: (tasksByStatus.completed || 0) + (tasksByStatus.pending || 0),
      completed: tasksByStatus.completed || 0,
      pending: tasksByStatus.pending || 0,
    },
    quotations: {
      total: quotationCount,
    },
    recent: {
      leads: recentLeads,
      tasks: recentTasks,
      quotations: recentQuotations,
    },
  });
});
