const Lead = require('../leads/lead.model');
const Task = require('../tasks/task.model');
const Quotation = require('../quotations/quotation.model');
const User = require('../users/user.model');
const asyncHandler = require('../../utils/asyncHandler');
const { PIPELINE_STAGES, STAGE_LABELS_SHORT } = require('../../constants/stages');

const STALLED_DAYS = 14;
const RECENT_WINS_LIMIT = 5;
const HOT_LEADS_LIMIT = 5;
const LEADERBOARD_LIMIT = 5;

exports.summary = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const stalledCutoff = new Date(now.getTime() - STALLED_DAYS * 86400000);

  const isManager = req.user.role === 'admin' || req.user.role === 'manager';

  const leadScope = req.user.role === 'bda' ? { assignedTo: req.user._id } : {};

  const [leadFacets, taskFacets, quotationFacets, usersCount, wonMtdAgg, leaderboardAgg, hotLeadsAgg, recentWinsAgg, stalledDealsAgg] = await Promise.all([
    Lead.aggregate([
      { $match: leadScope },
      { $facet: {
          byStage: [
            { $group: { _id: '$currentStage', count: { $sum: 1 } } },
          ],
          bySource: [
            { $group: { _id: { $ifNull: ['$source', 'Other'] }, count: { $sum: 1 } } },
          ],
          totals: [
            { $group: { _id: null, total: { $sum: 1 }, value: { $sum: { $ifNull: ['$expectedDealValue', 0] } } } },
          ],
        },
      },
    ]),
    Task.aggregate([
      { $match: { ...(req.user.role === 'bda' ? { assignedTo: req.user._id } : {}) } },
      { $facet: {
          pending: [{ $match: { status: 'pending' } }, { $count: 'count' }],
          byDay: [
            { $match: { status: 'pending', dueDate: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } },
          ],
        },
      },
    ]),
    Quotation.aggregate([
      { $match: req.user.role === 'bda' ? { createdBy: req.user._id } : {} },
      { $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          draftOrSent: [
            { $match: { status: { $in: ['draft', 'sent'] } } },
            { $count: 'count' },
          ],
        },
      },
    ]),
    User.countDocuments({ role: 'bda' }),
    Lead.aggregate([
      {
        $match: {
          ...leadScope,
          currentStage: 'won',
          createdAt: { $gte: monthStart, $lt: monthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$expectedDealValue', 0] } } } },
    ]),
    isManager
      ? Lead.aggregate([
          {
            $group: {
              _id: '$assignedTo',
              total: { $sum: 1 },
              won: { $sum: { $cond: [{ $eq: ['$currentStage', 'won'] }, 1, 0] } },
              value: { $sum: { $ifNull: ['$expectedDealValue', 0] } },
            },
          },
          { $sort: { value: -1 } },
          { $limit: LEADERBOARD_LIMIT },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          { $project: { _id: 0, userId: '$_id', name: { $ifNull: ['$user.name', 'Unassigned'] }, total: 1, won: 1, value: 1 } },
        ])
      : Promise.resolve([]),
    isManager
      ? Lead.find({ currentStage: 'negotiation' })
          .sort({ expectedDealValue: -1 })
          .limit(HOT_LEADS_LIMIT)
          .populate('assignedTo', 'name')
          .lean()
      : Promise.resolve([]),
    isManager
      ? Lead.find({ currentStage: 'won' })
          .sort({ updatedAt: -1 })
          .limit(RECENT_WINS_LIMIT)
          .populate('assignedTo', 'name')
          .lean()
      : Promise.resolve([]),
    isManager
      ? Lead.find({
          currentStage: { $nin: ['won', 'lost'] },
          updatedAt: { $lt: stalledCutoff },
        })
          .populate('assignedTo', 'name')
          .sort({ updatedAt: 1 })
          .lean()
      : Promise.resolve([]),
  ]);

  const [leadFacet] = leadFacets;
  const [taskFacet] = taskFacets;
  const [quotationFacet] = quotationFacets;

  const stageCounts = Object.fromEntries((leadFacet.byStage || []).map((s) => [s._id, s.count]));
  const pipeline = PIPELINE_STAGES.map((stage) => ({
    stage: STAGE_LABELS_SHORT[stage],
    leads: stageCounts[stage] || 0,
  }));

  const leadSources = (leadFacet.bySource || []).map((s) => ({ name: s._id, value: s.count }));

  const totalValue = (leadFacet.totals && leadFacet.totals[0]?.value) || 0;
  const totalLeads = (leadFacet.totals && leadFacet.totals[0]?.total) || 0;
  const wonCount = stageCounts.won || 0;
  const lostCount = stageCounts.lost || 0;
  const winLossRatio = wonCount + lostCount > 0
    ? Math.round((wonCount / (wonCount + lostCount)) * 100)
    : 0;
  const monthlyAchieved = (wonMtdAgg && wonMtdAgg[0]?.total) || 0;
  const bdaCount = usersCount || 1;
  const monthlyTarget = isManager ? 500_000 * bdaCount : 500_000;

  const pendingTaskCount = (taskFacet.pending && taskFacet.pending[0]?.count) || 0;

  const quotationByStatus = Object.fromEntries((quotationFacet.byStatus || []).map((s) => [s._id, s.count]));
  const pendingApprovals = (quotationFacet.draftOrSent && quotationFacet.draftOrSent[0]?.count) || 0;

  res.json({
    role: req.user.role,
    isManager,
    pipeline,
    leadSources,
    totals: {
      pipelineValue: totalValue,
      totalLeads,
      wonCount,
      lostCount,
      winLossRatio,
    },
    quotation: {
      byStatus: quotationByStatus,
      pendingApprovals,
    },
    tasks: {
      pending: pendingTaskCount,
    },
    monthly: {
      target: monthlyTarget,
      achieved: monthlyAchieved,
      bdaCount,
    },
    leaderboard: isManager ? leaderboardAgg : [],
    hotLeads: isManager ? hotLeadsAgg : [],
    recentWins: isManager ? recentWinsAgg : [],
    stalledDeals: isManager ? stalledDealsAgg : [],
  });
});
