const Client = require('./client.model');
const Lead = require('../leads/lead.model');

exports.list = async (req, res, next) => {
  try {
    let leadFilter = {};
    if (req.user.role === 'bda') {
      leadFilter.assignedTo = req.user._id;
    }
    // BDA scope: only see clients whose lead is assigned to them.
    const ownedLeads = await Lead.find(leadFilter).select('_id');
    const ids = ownedLeads.map((l) => l._id);
    const filter = ids.length ? { leadId: { $in: ids } } : { leadId: null };

    const clients = await Client.find(filter)
      .populate('leadId', 'companyName currentStage')
      .populate('accountManager', 'name email')
      .sort('-createdAt');

    res.json(clients);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('leadId', 'companyName currentStage')
      .populate('accountManager', 'name email');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify the caller can see the lead.
    if (req.user.role === 'bda') {
      const lead = await Lead.findById(client.leadId).select('assignedTo');
      if (!lead || lead.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Client not found' });
      }
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.body.leadId) {
      return res.status(400).json({ message: 'leadId is required' });
    }
    const lead = await Lead.findById(req.body.leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    if (
      req.user.role === 'bda'
      && lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized for this lead' });
    }

    // Don't let the caller override server-controlled fields.
    const body = { ...req.body };
    body.companyName = body.companyName || lead.companyName;
    body.contactPerson = body.contactPerson || lead.contactPerson;
    body.email = body.email || lead.email;
    body.phone = body.phone || lead.phone;
    body.accountManager = body.accountManager || lead.assignedTo;

    const client = await Client.create(body);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};
