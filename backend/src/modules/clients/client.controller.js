const Client = require('./client.model');

exports.list = async (req, res, next) => {
  try {
    const clients = await Client.find()
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

    res.json(client);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};
