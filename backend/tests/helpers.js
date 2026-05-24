const mongoose = require('mongoose');

const connect = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI not set. globalSetup may not have run.');
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
};

const disconnect = async () => {
  await mongoose.disconnect();
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, disconnect, clearDatabase };
