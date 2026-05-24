const Lead = require('./lead.model');
const AuditLog = require('../auditLogs/auditLog.model');
const { broadcast } = require('../../services/pusher');

exports.list = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      createdBy: req.user._id,
      assignedTo: req.body.assignedTo || req.user._id,
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
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    broadcast('leads', 'lead:updated', { id: lead._id });
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    broadcast('leads', 'lead:deleted', { id: lead._id });
    res.json({ message: 'Lead deleted' });
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

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const oldStage = lead.currentStage;
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

    broadcast('leads', 'lead:stage_changed', { id: lead._id, stage, oldStage });
    res.json(lead);
  } catch (error) {
    next(error);
  }
};
