const Client = require('./client.model');
const asyncHandler = require('../../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const clients = await Client.find()
    .populate('leadId', 'companyName currentStage')
    .populate('accountManager', 'name email')
    .sort('-createdAt');

  res.json(clients);
});

exports.getById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id)
    .populate('leadId', 'companyName currentStage')
    .populate('accountManager', 'name email');

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  res.json(client);
});

exports.create = asyncHandler(async (req, res) => {
  const client = await Client.create(req.body);
  res.status(201).json(client);
});
