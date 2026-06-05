const Client = require('./client.model');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildResponse, wantsPagination } = require('../../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const paginated = wantsPagination(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  const query = Client.find()
    .populate('leadId', 'companyName currentStage')
    .populate('accountManager', 'name email')
    .sort('-createdAt');

  if (paginated) {
    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Client.countDocuments(),
    ]);
    return res.json(buildResponse(data, total, page, limit));
  }

  res.json(await query);
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
