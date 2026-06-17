const mongoose = require('mongoose');
const Lead = require('./lead.model');
const Quotation = require('../quotations/quotation.model');
const AuditLog = require('../auditLogs/auditLog.model');
const Client = require('../clients/client.model');
const Activity = require('../activities/activity.model');
const Task = require('../tasks/task.model');
const { broadcast } = require('../../services/pusher');

/**
 * Forward-only stage transitions are allowed; 'lost' is reachable from
 * any non-terminal stage. The "step distance > 1" UX rule on the
 * frontend is a convenience — the server enforces forward-only.
 */
const NEXT_STAGES = {
  new: ['contacted', 'lost'],
  contacted: ['requirement_gathered', 'lost'],
  requirement_gathered: ['quotation_sent', 'lost'],
  quotation_sent: ['negotiation', 'won', 'lost'],
  negotiation: ['quotation_sent', 'won', 'lost'],
  won: [],
  lost: [],
};

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

async function ensureCanReadLead(req, leadId) {
  const lead = await Lead.findById(leadId)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
  if (!lead) return { error: 404 };
  if (req.user.role === 'bda'
    && lead.assignedTo?._id?.toString() !== req.user._id.toString()) {
    return { error: 404 }; // 404, not 403, to avoid leaking existence
  }
  return { lead };
}

exports.list = async (req, res, next) => {
  try {
    const { stage, assignedTo, search, page, limit } = req.query;
    const filter = {};

    if (stage) filter.currentStage = stage;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { companyName: { $regex: escaped, $options: 'i' } },
        { contactPerson: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (req.user.role === 'bda') {
      filter.assignedTo = req.user._id;
    }

    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pg - 1) * lim;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(lim),
      Lead.countDocuments(filter),
    ]);

    res.set('X-Total-Count', String(total));
    res.json(leads);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { lead, error } = await ensureCanReadLead(req, req.params.id);
    if (error) return res.status(error).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const body = { ...req.body };
    // createdBy/assignedTo are server-controlled.
    const assignedTo = body.assignedTo || req.user._id;
    delete body.assignedTo;
    delete body.createdBy;
    delete body.currentStage; // stage starts at 'new'

    const lead = await Lead.create({
      ...body,
      createdBy: req.user._id,
      assignedTo,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'lead_created',
      entityType: 'Lead',
      entityId: lead._id,
      newValue: { currentStage: lead.currentStage, assignedTo },
    });

    broadcast('leads', 'lead:created', { id: lead._id });
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { lead: existing, error } = await ensureCanReadLead(req, req.params.id);
    if (error) return res.status(error).json({ message: 'Lead not found' });

    // Build the allowlisted update document; ignore any field the
    // caller is not allowed to change.
    const update = {};
    for (const field of LEAD_UPDATE_FIELDS) {
      if (field in req.body) update[field] = req.body[field];
    }

    if (update.assignedTo && req.user.role === 'bda') {
      // BDA cannot self-reassign.
      return res.status(403).json({ message: 'Only admins/managers can reassign leads' });
    }

    if (update.assignedTo) {
      const User = require('../users/user.model');
      const target = await User.findById(update.assignedTo).select('role');
      if (!target || !['admin', 'manager', 'bda'].includes(target.role)) {
        return res.status(400).json({ message: 'assignedTo must reference an active user' });
      }
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, update, {
      returnDocument: 'after',
      runValidators: true,
    });

    // Audit: log assignment change distinctly so the report panel can
    // render a history.
    if (update.assignedTo
      && existing.assignedTo?._id?.toString() !== update.assignedTo) {
      await AuditLog.create({
        userId: req.user._id,
        action: 'lead_assigned',
        entityType: 'Lead',
        entityId: lead._id,
        oldValue: { assignedTo: existing.assignedTo?._id },
        newValue: { assignedTo: update.assignedTo },
      });
    } else {
      await AuditLog.create({
        userId: req.user._id,
        action: 'lead_updated',
        entityType: 'Lead',
        entityId: lead._id,
        newValue: { fields: Object.keys(update) },
      });
    }

    broadcast('leads', 'lead:updated', { id: lead._id });
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    // Only admin/manager can hard-delete; BDA gets a 404. This is a
    // safety guard so the cascade below never runs in an unowned path.
    if (req.user.role === 'bda') {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Cascade: remove dependents that reference this lead. We hard-
    // delete activities, tasks, quotations, and clients because they
    // are all read-time-joined by leadId and become orphans otherwise.
    // Audit logs are kept (entityId points at a now-gone lead) so
    // historical reports still resolve.
    await Promise.all([
      Activity.deleteMany({ leadId: lead._id }),
      Task.deleteMany({ leadId: lead._id }),
      Quotation.deleteMany({ leadId: lead._id }),
      Client.deleteOne({ leadId: lead._id }),
    ]);

    await Lead.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      userId: req.user._id,
      action: 'lead_deleted',
      entityType: 'Lead',
      entityId: lead._id,
      oldValue: { companyName: lead.companyName, currentStage: lead.currentStage },
    });

    broadcast('leads', 'lead:deleted', { id: lead._id });
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    next(error);
  }
};

exports.assign = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required' });

    // Only admin/manager can reassign.
    if (req.user.role === 'bda') {
      return res.status(403).json({ message: 'Only admins/managers can reassign leads' });
    }

    const User = require('../users/user.model');
    const target = await User.findById(assignedTo).select('role');
    if (!target || !['admin', 'manager', 'bda'].includes(target.role)) {
      return res.status(400).json({ message: 'assignedTo must reference an active user' });
    }

    const existing = await Lead.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Lead not found' });

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { returnDocument: 'after', runValidators: true }
    ).populate('assignedTo', 'name email');

    await AuditLog.create({
      userId: req.user._id,
      action: 'lead_assigned',
      entityType: 'Lead',
      entityId: lead._id,
      oldValue: { assignedTo: existing.assignedTo },
      newValue: { assignedTo },
    });

    broadcast('leads', 'lead:updated', { id: lead._id });
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

exports.stageTransition = async (req, res, next) => {
  try {
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ message: 'Stage is required' });
    }

    const { lead: existing, error } = await ensureCanReadLead(req, req.params.id);
    if (error) return res.status(error).json({ message: 'Lead not found' });

    if (!NEXT_STAGES[existing.currentStage]) {
      return res.status(400).json({ message: 'Unknown current stage' });
    }
    if (!NEXT_STAGES[existing.currentStage].includes(stage)) {
      return res.status(400).json({
        message: `Invalid transition: ${existing.currentStage} -> ${stage}`,
      });
    }

    const oldStage = existing.currentStage;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { currentStage: stage },
      { returnDocument: 'after' }
    );

    await AuditLog.create({
      userId: req.user._id,
      action: 'lead_stage_changed',
      entityType: 'Lead',
      entityId: lead._id,
      oldValue: { currentStage: oldStage },
      newValue: { currentStage: stage },
    });

    // Cascades for terminal stage transitions.
    if (stage === 'quotation_sent' && oldStage !== 'quotation_sent') {
      // Bump all draft quotations for this lead to 'sent' (with version).
      // We use $set/$inc in one round trip.
      await Quotation.updateMany(
        { leadId: lead._id, status: 'draft' },
        { $set: { status: 'sent' }, $inc: { version: 1 } }
      );
    }

    if (stage === 'won' && oldStage !== 'won') {
      // Create or update the client record for the won lead.
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
  } catch (error) {
    next(error);
  }
};
