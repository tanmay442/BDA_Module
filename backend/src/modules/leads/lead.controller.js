const Lead = require('./lead.model');
const Quotation = require('../quotations/quotation.model');
const AuditLog = require('../auditLogs/auditLog.model');
const Client = require('../clients/client.model');
const { broadcast } = require('../../services/pusher');
const asyncHandler = require('../../utils/asyncHandler');
const { isElevated, ensureCanRead, ensureCanModify, pick } = require('../../utils/permissions');
const { STAGES } = require('../../constants/stages');

const LEAD_UPDATE_FIELDS = [
  'companyName',
  'contactPerson',
  'email',
  'phone',
  'industry',
  'source',
  'expectedDealValue',
  'notes',
  'assignedTo',
];

exports.list = asyncHandler(async (req, res) => {
  const { stage, assignedTo, search } = req.query;
  const filter = {};

  if (stage) filter.currentStage = stage;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.user.role === 'bda') {
    filter.assignedTo = req.user._id;
  }

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  res.json(leads);
});

exports.getById = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  ensureCanRead(req.user, lead, 'Lead');
  res.json(lead);
});

exports.create = asyncHandler(async (req, res) => {
  const safeBody = pick(req.body || {}, [
    'companyName',
    'contactPerson',
    'email',
    'phone',
    'industry',
    'source',
    'expectedDealValue',
    'notes',
    'assignedTo',
  ]);

  const lead = await Lead.create({
    ...safeBody,
    createdBy: req.user._id,
    assignedTo: safeBody.assignedTo || req.user._id,
  });

  await AuditLog.create({
    userId: req.user._id,
    action: 'lead_created',
    entityType: 'Lead',
    entityId: lead._id,
    newValue: { currentStage: lead.currentStage },
  });

  broadcast('leads', 'lead:created', { id: lead._id });
  res.status(201).json(lead);
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await Lead.findById(req.params.id);
  ensureCanModify(req.user, existing, 'Lead');

  const safeBody = pick(req.body || {}, LEAD_UPDATE_FIELDS);
  if (Object.keys(safeBody).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const lead = await Lead.findByIdAndUpdate(req.params.id, safeBody, {
    returnDocument: 'after',
    runValidators: true,
  });

  broadcast('leads', 'lead:updated', { id: lead._id });
  res.json(lead);
});

exports.remove = asyncHandler(async (req, res) => {
  if (!isElevated(req.user)) {
    return res.status(403).json({ message: 'Only admin/manager can delete leads' });
  }

  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  broadcast('leads', 'lead:deleted', { id: lead._id });
  res.json({ message: 'Lead deleted' });
});

exports.assign = asyncHandler(async (req, res) => {
  if (!isElevated(req.user)) {
    return res.status(403).json({ message: 'Only admin/manager can reassign leads' });
  }

  const { assignedTo } = req.body || {};
  if (!assignedTo) {
    return res.status(400).json({ message: 'assignedTo is required' });
  }

  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { assignedTo },
    { returnDocument: 'after', runValidators: true }
  ).populate('assignedTo', 'name email');

  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  broadcast('leads', 'lead:updated', { id: lead._id });
  res.json(lead);
});

exports.stageTransition = asyncHandler(async (req, res) => {
  const { stage } = req.body || {};

  if (!stage) {
    return res.status(400).json({ message: 'Stage is required' });
  }

  if (!STAGES.includes(stage)) {
    return res.status(400).json({ message: `Invalid stage. Must be one of: ${STAGES.join(', ')}` });
  }

  const lead = await Lead.findById(req.params.id);
  ensureCanModify(req.user, lead, 'Lead');

  const oldStage = lead.currentStage;
  const isFirstTransitionToStage = oldStage !== stage;

  lead.currentStage = stage;
  await lead.save();

  await AuditLog.create({
    userId: req.user._id,
    action: 'lead_stage_changed',
    entityType: 'Lead',
    entityId: lead._id,
    oldValue: { currentStage: oldStage },
    newValue: { currentStage: stage },
  });

  if (stage === 'quotation_sent' && isFirstTransitionToStage) {
    await Quotation.updateMany(
      { leadId: lead._id, status: 'draft' },
      { status: 'sent', $inc: { version: 1 } }
    );
  }

  if (stage === 'won' && isFirstTransitionToStage) {
    await Client.findOneAndUpdate(
      { leadId: lead._id },
      {
        leadId: lead._id,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        accountManager: lead.assignedTo,
      },
      { upsert: true }
    );
  }

  broadcast('leads', 'lead:stage_changed', { id: lead._id, stage, oldStage });
  res.json(lead);
});
